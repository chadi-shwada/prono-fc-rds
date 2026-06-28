import { prisma } from "@/lib/prisma";
import { recomputeMatchPoints } from "@/lib/scoring";
import { teamNameFr } from "@/lib/teamNames";
import { importVenues } from "@/lib/venues";
import { overlayEspnLiveScores } from "@/lib/espn-live";
import { seedSchedule, findKoScheduleNum } from "@/lib/schedule";
import { STAGES, MATCH_STATUS } from "@/lib/constants";

// Intégration football-data.org (v4) — compétition "WC" (Coupe du Monde).
// Offre gratuite : créer une clé sur https://www.football-data.org/ et la mettre
// dans .env (FOOTBALL_API_KEY). Limite ~10 requêtes/min sur le plan gratuit.

const BASE = "https://api.football-data.org/v4";

// Anti-flapping de l'API gratuite : pendant un match, football-data (plan gratuit)
// renvoie par à-coups un statut « programmé » alors que le match est en cours, ce
// qui faisait disparaître/réapparaître le badge « En direct ». Tant que le coup
// d'envoi est passé et que l'API n'a pas (encore) marqué le match « terminé », on
// le considère en direct, dans une fenêtre généreuse couvrant prolongation + T.A.B.
const LIVE_WINDOW_MS = 180 * 60 * 1000; // 3 h après le coup d'envoi

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: STAGES.GROUP,
  LAST_32: STAGES.R32,
  LAST_16: STAGES.R16,
  QUARTER_FINALS: STAGES.QF,
  SEMI_FINALS: STAGES.SF,
  THIRD_PLACE: STAGES.THIRD,
  FINAL: STAGES.FINAL,
};

function mapStatus(s: string): string {
  if (s === "FINISHED") return MATCH_STATUS.FINISHED;
  if (s === "IN_PLAY" || s === "PAUSED") return MATCH_STATUS.LIVE;
  return MATCH_STATUS.SCHEDULED;
}

/** "GROUP_A" / "Group A" → "A" ; null pour les phases finales. */
function parseGroup(g: string | null): string | null {
  if (!g) return null;
  return g.replace(/^GROUP[_ ]/i, "").trim() || null;
}

type ApiTeam = {
  id: number | null;
  name: string | null;
  tla: string | null;
} | null;
// Équipe réellement connue (matchs à élimination = équipes « à déterminer » null).
type ValidApiTeam = { id: number; name: string; tla: string | null };

function isValidTeam(t: ApiTeam): t is ValidApiTeam {
  return !!t && t.id != null && !!t.name;
}
type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  minute: number | string | null; // minute de jeu (matchs en cours)
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: {
    // winner: vainqueur du match (T.A.B. inclus) — HOME_TEAM / AWAY_TEAM / DRAW / null
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
};

/** Minute de jeu en cours, ou null (hors match en direct / absente de l'API). */
function parseMinute(m: ApiMatch, status: string): number | null {
  if (status !== MATCH_STATUS.LIVE) return null;
  const n = Number(m.minute);
  return Number.isFinite(n) && n >= 0 && n <= 130 ? Math.floor(n) : null;
}

export type SyncResult = {
  teams: number;
  matches: number;
  finishedRecomputed: number;
  /** Nombre de matchs dont le score live a été enrichi via ESPN. */
  espnLive: number;
};

/**
 * Upsert une équipe depuis l'API et renvoie son id local.
 * Anti-collision : si une équipe existe déjà avec le même code (ex: équipe de
 * démo), on lui rattache l'externalId au lieu de créer un doublon.
 */
async function upsertTeam(t: ValidApiTeam): Promise<string> {
  const externalId = String(t.id);
  const code = (t.tla ?? t.name.slice(0, 3)).toUpperCase();
  const name = teamNameFr(code, t.name); // nom FR si dispo, sinon nom API

  const byExternal = await prisma.team.findUnique({ where: { externalId } });
  if (byExternal) {
    await prisma.team.update({
      where: { id: byExternal.id },
      data: { name, code },
    });
    return byExternal.id;
  }

  const byCode = await prisma.team.findUnique({ where: { code } });
  if (byCode) {
    await prisma.team.update({
      where: { id: byCode.id },
      data: { externalId, name },
    });
    return byCode.id;
  }

  const created = await prisma.team.create({
    data: { externalId, name, code },
  });
  return created.id;
}

// Garde-fou anti-concurrence : si une synchro est déjà en cours dans ce process
// (ex. clic admin pendant que le cron tourne), on réutilise la même promesse au
// lieu de lancer des écritures SQLite concurrentes.
let syncInFlight: Promise<SyncResult> | null = null;

/**
 * Synchronise équipes + calendrier + résultats depuis football-data.org.
 * Recalcule les points des matchs passés à "terminé".
 */
export function syncFromFootballData(): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = runSync().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

async function runSync(): Promise<SyncResult> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error(
      "Clé API absente (FOOTBALL_API_KEY). Ajoute-la dans .env pour activer la synchro.",
    );
  }

  // Garantit le calendrier complet (104 matchs) avant tout : même si l'API est
  // incomplète (phases finales absentes du plan gratuit), le calendrier reste
  // affiché ; la synchro ne fait ensuite qu'enrichir ces matchs.
  await seedSchedule(prisma);

  const res = await fetch(`${BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API football-data : ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { matches: ApiMatch[] };
  const matches = data.matches ?? [];

  // 1) Upsert chaque équipe UNE seule fois (dédoublonnage par id API).
  // Évite ~200 upserts redondants (une équipe joue plusieurs matchs) et donc
  // de longues séquences d'écritures — important sous SQLite (mono-writer) et
  // pour rester sous la limite de durée du cron.
  const uniqueTeams = new Map<number, ValidApiTeam>();
  for (const m of matches) {
    if (isValidTeam(m.homeTeam)) uniqueTeams.set(m.homeTeam.id, m.homeTeam);
    if (isValidTeam(m.awayTeam)) uniqueTeams.set(m.awayTeam.id, m.awayTeam);
  }
  const teamIdByExternal = new Map<number, string>();
  for (const t of uniqueTeams.values()) {
    teamIdByExternal.set(t.id, await upsertTeam(t));
  }
  const localId = (t: ApiTeam): string | null =>
    isValidTeam(t) ? teamIdByExternal.get(t.id) ?? null : null;

  // 2) Upsert les matchs et recalcule les résultats terminés.
  let recomputed = 0;
  for (const m of matches) {
    const homeId = localId(m.homeTeam);
    const awayId = localId(m.awayTeam);

    const kickoff = new Date(m.utcDate);
    const stage = STAGE_MAP[m.stage] ?? STAGES.GROUP;
    let status = mapStatus(m.status);
    // Si le match a commencé et que l'API ne le dit pas (encore) terminé, on force
    // « En direct » pour stabiliser le badge malgré le flapping de l'API gratuite.
    if (status === MATCH_STATUS.SCHEDULED) {
      const elapsed = Date.now() - kickoff.getTime();
      if (elapsed >= 0 && elapsed < LIVE_WINDOW_MS) {
        status = MATCH_STATUS.LIVE;
      }
    }
    // football-data marque la mi-temps par le statut "PAUSED".
    const halftime = m.status === "PAUSED";
    const liveMinute = halftime ? null : parseMinute(m, status);
    // Vainqueur du match (T.A.B. inclus) d'après l'API.
    let winnerTeamId =
      m.score.winner === "HOME_TEAM"
        ? homeId
        : m.score.winner === "AWAY_TEAM"
          ? awayId
          : null;
    let homeScore = m.score.fullTime.home;
    let awayScore = m.score.fullTime.away;

    // Recherche du match en base. Voie rapide : par externalId (matchs déjà
    // synchronisés). Sinon ADOPTION : un match à élimination directe revenu de
    // l'API est rattaché au match seedé « à déterminer » du même créneau (via son
    // numéro de calendrier), pour le remplir au lieu de créer un doublon.
    let existing = await prisma.match.findUnique({
      where: { externalId: String(m.id) },
    });
    if (!existing) {
      const num = findKoScheduleNum(stage, kickoff);
      if (num != null) {
        existing = await prisma.match.findFirst({
          where: { scheduleNum: num, externalId: null },
        });
      }
    }

    // Anti-régression du score en direct : l'API gratuite renvoie par moments une
    // réponse périmée (ex. 0-0 alors qu'un but a déjà été marqué), ce qui faisait
    // « reculer » le score affiché. Tant que le match est en direct, on ne laisse
    // jamais le score total diminuer : on conserve la version la plus avancée déjà
    // enregistrée. Le score définitif (statut « terminé ») reste pris tel quel.
    if (status === MATCH_STATUS.LIVE && existing) {
      const newTotal = (homeScore ?? 0) + (awayScore ?? 0);
      const oldTotal = (existing.homeScore ?? 0) + (existing.awayScore ?? 0);
      if (newTotal < oldTotal) {
        homeScore = existing.homeScore;
        awayScore = existing.awayScore;
        winnerTeamId = existing.winnerTeamId;
      }
    }

    // Ne jamais « dé-finaliser » un match déjà terminé (finalisé par ESPN ou par
    // l'admin) tant que football-data n'est pas lui-même passé en « terminé » :
    // football-data gratuit, lent et parfois faux, ne doit pas le ramener « en
    // direct » ni écraser le score final correct.
    if (
      existing?.status === MATCH_STATUS.FINISHED &&
      status !== MATCH_STATUS.FINISHED
    ) {
      status = MATCH_STATUS.FINISHED;
      homeScore = existing.homeScore;
      awayScore = existing.awayScore;
      winnerTeamId = existing.winnerTeamId;
    }

    const fields = {
      stage,
      groupName: parseGroup(m.group),
      kickoff,
      status,
      liveMinute,
      // football-data ne fournit pas le temps additionnel : on met la minute
      // entière (l'overlay ESPN, exécuté juste après, l'enrichit en "90+4").
      // À la mi-temps (PAUSED), on affiche « Mi-temps » plutôt qu'un temps figé.
      liveClock: halftime
        ? "Mi-temps"
        : liveMinute != null
          ? String(liveMinute)
          : null,
      homeTeamId: homeId,
      awayTeamId: awayId,
      homeScore,
      awayScore,
      winnerTeamId,
    };
    // Update par id (en adoptant l'externalId si le match était seedé « à
    // déterminer ») ou création si vraiment inconnu. On ne touche pas à
    // scheduleNum ni venueCity (posés au seed).
    const saved = existing
      ? await prisma.match.update({
          where: { id: existing.id },
          data: { ...fields, externalId: String(m.id) },
        })
      : await prisma.match.create({
          data: { externalId: String(m.id), ...fields },
        });

    if (status === MATCH_STATUS.FINISHED) {
      await recomputeMatchPoints(saved.id);
      recomputed++;
    }
  }

  // Rattache automatiquement chaque match à sa ville hôte (calendrier officiel).
  await importVenues(prisma);

  // Enrichit le score live depuis ESPN (football-data gratuit ne le fournit pas).
  // Best-effort : en cas d'échec, on garde les données football-data.
  const espnLive = await overlayEspnLiveScores(prisma);

  return {
    teams: uniqueTeams.size,
    matches: matches.length,
    finishedRecomputed: recomputed,
    espnLive,
  };
}
