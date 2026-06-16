import type { PrismaClient } from "@prisma/client";
import { MATCH_STATUS } from "@/lib/constants";
import { recomputeMatchPoints } from "@/lib/scoring";

// Source live + finalisation via ESPN (non-officiel). football-data en plan gratuit
// ne fournit pas le score en direct (matchs bloqués en « TIMED » à 0-0) et peut même
// finaliser un match avec un score FAUX. ESPN, lui, a la donnée temps réel correcte.
// On l'utilise donc pour :
//   - le SCORE EN DIRECT des matchs en cours (state "in"),
//   - la FINALISATION (score final + points) dès qu'ESPN affiche « Full Time »
//     (state "post"), sans attendre football-data.
//
// 100 % best-effort : toute erreur est avalée → on garde le comportement
// football-data. Identification du match par la paire de codes FIFA des équipes.
// Appelé en fin de synchro (après football-data), donc ESPN a le dernier mot sur
// les matchs qu'il connaît (la journée en cours) et corrige une donnée erronée.

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

type EspnCompetitor = {
  team?: { abbreviation?: string };
  score?: string;
  winner?: boolean;
};
type EspnStatusType = {
  state?: string;
  name?: string;
  description?: string;
  detail?: string;
  shortDetail?: string;
};
type EspnEvent = {
  status?: { type?: EspnStatusType; displayClock?: string };
  competitions?: { competitors?: EspnCompetitor[] }[];
};

/** Mi-temps (ou autre pause de jeu) d'après le statut ESPN. */
function isHalftime(t: EspnStatusType | undefined): boolean {
  if (!t) return false;
  if (t.name === "STATUS_HALFTIME") return true;
  return /half-?time|mi-temps|\bHT\b/i.test(
    `${t.description ?? ""} ${t.detail ?? ""} ${t.shortDetail ?? ""}`,
  );
}

/** Minute de jeu depuis "45'" / "90+2'" → entier borné, sinon null. */
function parseClock(clock: string | undefined): number | null {
  if (!clock) return null;
  const m = clock.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 0 && n <= 130 ? n : null;
}

/** Horloge propre, temps additionnel inclus : "90'+4'" → "90+4", sinon null. */
function parseClockText(clock: string | undefined): string | null {
  if (!clock) return null;
  const baseMatch = clock.match(/(\d+)/);
  if (!baseMatch) return null;
  const base = Number(baseMatch[1]);
  if (!Number.isFinite(base) || base < 0 || base > 130) return null;
  // Temps additionnel : nombre situé après un "+" (ESPN insère souvent une
  // apostrophe avant le +, ex. "45'+2'", d'où une extraction séparée et tolérante).
  const plusMatch = clock.match(/\+\s*(\d+)/);
  if (plusMatch) {
    const add = Number(plusMatch[1]);
    if (Number.isFinite(add) && add > 0) return `${base}+${add}`;
  }
  return `${base}`;
}

type LiveScore = {
  byCode: Map<string, number>;
  minute: number | null;
  clock: string | null;
};
type FinalScore = { byCode: Map<string, number>; winnerCode: string | null };

/** Construit la map code→score pour un événement, ou null si invalide. */
function scoresByCode(comps: EspnCompetitor[]): Map<string, number> | null {
  const byCode = new Map<string, number>();
  for (const c of comps) {
    const code = c.team?.abbreviation?.toUpperCase();
    const score = Number(c.score);
    if (code && Number.isFinite(score)) byCode.set(code, score);
  }
  return byCode.size === 2 ? byCode : null;
}

/** Sépare les matchs ESPN en cours (state "in") et terminés (state "post"). */
async function fetchEspnEvents(): Promise<{
  live: LiveScore[];
  finished: FinalScore[];
}> {
  const res = await fetch(ESPN_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  const data = (await res.json()) as { events?: EspnEvent[] };

  const live: LiveScore[] = [];
  const finished: FinalScore[] = [];
  for (const e of data.events ?? []) {
    const state = e.status?.type?.state; // "pre" | "in" | "post"
    const comps = e.competitions?.[0]?.competitors ?? [];
    const byCode = scoresByCode(comps);
    if (!byCode) continue;
    if (state === "in") {
      // À la mi-temps, l'horloge est figée à 45' : on affiche « Mi-temps ».
      const ht = isHalftime(e.status?.type);
      live.push({
        byCode,
        minute: ht ? null : parseClock(e.status?.displayClock),
        clock: ht ? "Mi-temps" : parseClockText(e.status?.displayClock),
      });
    } else if (state === "post") {
      const winnerCode =
        comps.find((c) => c.winner === true)?.team?.abbreviation?.toUpperCase() ??
        null;
      finished.push({ byCode, winnerCode });
    }
  }
  return { live, finished };
}

/**
 * Superpose les données ESPN (score live + finalisation) sur les matchs.
 * Renvoie le nombre de matchs mis à jour. Best-effort, idempotent.
 */
export async function overlayEspnLiveScores(
  prisma: PrismaClient,
): Promise<number> {
  let events: { live: LiveScore[]; finished: FinalScore[] };
  try {
    events = await fetchEspnEvents();
  } catch {
    return 0; // ESPN indisponible : on garde le comportement football-data.
  }
  if (events.live.length === 0 && events.finished.length === 0) return 0;

  // Matchs candidats : deux équipes connues (terminés inclus, pour la finalisation).
  const candidates = await prisma.match.findMany({
    where: { homeTeamId: { not: null }, awayTeamId: { not: null } },
    include: { homeTeam: true, awayTeam: true },
  });

  const now = Date.now();
  // Fenêtre de sécurité : coup d'envoi entre -6 h et +30 min.
  const inWindow = (kickoff: Date) => {
    const e = now - kickoff.getTime();
    return e >= -30 * 60 * 1000 && e <= 6 * 60 * 60 * 1000;
  };
  const findMatch = (byCode: Map<string, number>) => {
    const key = [...byCode.keys()].sort().join("|");
    return candidates.find((mt) => {
      const hc = mt.homeTeam?.code?.toUpperCase();
      const ac = mt.awayTeam?.code?.toUpperCase();
      if (!hc || !ac) return false;
      return [hc, ac].sort().join("|") === key && inWindow(mt.kickoff);
    });
  };

  let updated = 0;

  // 1) FINALISATIONS (prioritaires) : ESPN dit « Full Time » → score final + points.
  for (const f of events.finished) {
    const match = findMatch(f.byCode);
    if (!match || !match.homeTeam || !match.awayTeam) continue;
    const hc = match.homeTeam.code.toUpperCase();
    const ac = match.awayTeam.code.toUpperCase();
    const home = f.byCode.get(hc);
    const away = f.byCode.get(ac);
    if (home == null || away == null) continue;
    const winnerTeamId =
      f.winnerCode === hc
        ? match.homeTeamId
        : f.winnerCode === ac
          ? match.awayTeamId
          : null;

    // Déjà finalisé avec le même score → rien à faire (évite un recalcul inutile).
    if (
      match.status === MATCH_STATUS.FINISHED &&
      match.homeScore === home &&
      match.awayScore === away
    ) {
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: MATCH_STATUS.FINISHED,
        homeScore: home,
        awayScore: away,
        liveMinute: null,
        liveClock: null,
        winnerTeamId,
      },
    });
    await recomputeMatchPoints(match.id);
    updated++;
  }

  // 2) SCORE EN DIRECT des matchs en cours (non encore finalisés).
  for (const ls of events.live) {
    const match = findMatch(ls.byCode);
    if (!match || !match.homeTeam || !match.awayTeam) continue;
    if (match.status === MATCH_STATUS.FINISHED) continue; // déjà terminé

    const hc = match.homeTeam.code.toUpperCase();
    const ac = match.awayTeam.code.toUpperCase();
    const home = ls.byCode.get(hc);
    const away = ls.byCode.get(ac);
    if (home == null || away == null) continue;

    // Anti-régression : ne jamais faire baisser le score total déjà enregistré.
    const newTotal = home + away;
    const oldTotal = (match.homeScore ?? 0) + (match.awayScore ?? 0);
    if (newTotal < oldTotal) continue;

    // Rien à écrire si tout est déjà identique.
    if (
      match.homeScore === home &&
      match.awayScore === away &&
      match.status === MATCH_STATUS.LIVE &&
      match.liveMinute === ls.minute &&
      match.liveClock === ls.clock
    ) {
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore: home,
        awayScore: away,
        status: MATCH_STATUS.LIVE,
        liveMinute: ls.minute,
        liveClock: ls.clock,
      },
    });
    updated++;
  }

  return updated;
}
