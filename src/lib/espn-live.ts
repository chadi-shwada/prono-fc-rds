import type { PrismaClient } from "@prisma/client";
import { MATCH_STATUS } from "@/lib/constants";

// Source live non-officielle (ESPN). football-data, en plan gratuit, NE fournit
// PAS le score en direct : pendant un match il reste en « TIMED » à 0-0. On enrichit
// donc uniquement l'AFFICHAGE live (score + minute) des matchs en cours avec le flux
// public d'ESPN, qui lui est en temps réel.
//
// Garanties de sûreté (best-effort) :
//  - toute erreur réseau/format est avalée → l'app retombe sur football-data ;
//  - on n'altère jamais un match déjà « terminé » ;
//  - on ne fait jamais reculer le score (réponses périmées) ;
//  - le score DÉFINITIF et le calcul des points restent pilotés par football-data
//    (passage en « terminé »), jamais par ESPN.

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

type EspnCompetitor = {
  team?: { abbreviation?: string };
  score?: string;
};
type EspnEvent = {
  status?: { type?: { state?: string }; displayClock?: string };
  competitions?: { competitors?: EspnCompetitor[] }[];
};

/** Minute de jeu depuis "45'" / "90+2'" → entier borné, sinon null. */
function parseClock(clock: string | undefined): number | null {
  if (!clock) return null;
  const m = clock.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 0 && n <= 130 ? n : null;
}

type LiveScore = {
  /** Score en cours indexé par code FIFA (ex: { MEX: 1, RSA: 0 }). */
  byCode: Map<string, number>;
  minute: number | null;
};

/** Récupère les matchs ESPN actuellement EN COURS (state "in"). */
async function fetchEspnLive(): Promise<LiveScore[]> {
  const res = await fetch(ESPN_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  const data = (await res.json()) as { events?: EspnEvent[] };

  const out: LiveScore[] = [];
  for (const e of data.events ?? []) {
    // ESPN : status.type.state ∈ { "pre", "in", "post" } → on ne garde que "in".
    if (e.status?.type?.state !== "in") continue;
    const comps = e.competitions?.[0]?.competitors ?? [];
    const byCode = new Map<string, number>();
    for (const c of comps) {
      const code = c.team?.abbreviation?.toUpperCase();
      const score = Number(c.score);
      if (code && Number.isFinite(score)) byCode.set(code, score);
    }
    if (byCode.size !== 2) continue;
    out.push({ byCode, minute: parseClock(e.status?.displayClock) });
  }
  return out;
}

/**
 * Superpose les scores live d'ESPN sur les matchs en cours (best-effort).
 * Renvoie le nombre de matchs mis à jour. N'altère jamais un match terminé ni
 * ne fait reculer le score. Identifie le match par la paire de codes d'équipe.
 */
export async function overlayEspnLiveScores(
  prisma: PrismaClient,
): Promise<number> {
  let live: LiveScore[];
  try {
    live = await fetchEspnLive();
  } catch {
    return 0; // ESPN indisponible : on garde le comportement football-data.
  }
  if (live.length === 0) return 0;

  // Matchs candidats : non terminés, avec deux équipes connues.
  const candidates = await prisma.match.findMany({
    where: {
      status: { not: MATCH_STATUS.FINISHED },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    include: { homeTeam: true, awayTeam: true },
  });

  const now = Date.now();
  let updated = 0;

  for (const ls of live) {
    const liveKey = [...ls.byCode.keys()].sort().join("|");
    const match = candidates.find((mt) => {
      const hc = mt.homeTeam?.code?.toUpperCase();
      const ac = mt.awayTeam?.code?.toUpperCase();
      if (!hc || !ac) return false;
      return [hc, ac].sort().join("|") === liveKey;
    });
    if (!match || !match.homeTeam || !match.awayTeam) continue;

    // Fenêtre de sécurité : coup d'envoi entre -30 min et +4 h (évite d'enrichir
    // un match sans rapport si jamais une paire de codes coïncidait).
    const elapsed = now - match.kickoff.getTime();
    if (elapsed < -30 * 60 * 1000 || elapsed > 4 * 60 * 60 * 1000) continue;

    const home = ls.byCode.get(match.homeTeam.code.toUpperCase());
    const away = ls.byCode.get(match.awayTeam.code.toUpperCase());
    if (home == null || away == null) continue;

    // Anti-régression : ne jamais faire baisser le score total déjà enregistré.
    const newTotal = home + away;
    const oldTotal = (match.homeScore ?? 0) + (match.awayScore ?? 0);
    if (newTotal < oldTotal) continue;

    // Rien à écrire si tout est déjà identique (évite des écritures inutiles).
    if (
      match.homeScore === home &&
      match.awayScore === away &&
      match.status === MATCH_STATUS.LIVE &&
      match.liveMinute === ls.minute
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
      },
    });
    updated++;
  }

  return updated;
}
