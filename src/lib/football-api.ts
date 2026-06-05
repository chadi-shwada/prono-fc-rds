import { prisma } from "@/lib/prisma";
import { recomputeMatchPoints } from "@/lib/scoring";
import { teamNameFr } from "@/lib/teamNames";
import { importVenues } from "@/lib/venues";
import { STAGES, MATCH_STATUS } from "@/lib/constants";

// Intégration football-data.org (v4) — compétition "WC" (Coupe du Monde).
// Offre gratuite : créer une clé sur https://www.football-data.org/ et la mettre
// dans .env (FOOTBALL_API_KEY). Limite ~10 requêtes/min sur le plan gratuit.

const BASE = "https://api.football-data.org/v4";

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
type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: { fullTime: { home: number | null; away: number | null } };
};

export type SyncResult = {
  teams: number;
  matches: number;
  finishedRecomputed: number;
};

/**
 * Upsert une équipe depuis l'API et renvoie son id local.
 * Anti-collision : si une équipe existe déjà avec le même code (ex: équipe de
 * démo), on lui rattache l'externalId au lieu de créer un doublon.
 */
async function upsertTeam(t: ApiTeam): Promise<string | null> {
  // Équipe « à déterminer » (matchs à élimination) = objet aux champs null.
  if (!t || t.id == null || !t.name) return null;
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

/**
 * Synchronise équipes + calendrier + résultats depuis football-data.org.
 * Recalcule les points des matchs passés à "terminé".
 */
export async function syncFromFootballData(): Promise<SyncResult> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error(
      "Clé API absente (FOOTBALL_API_KEY). Ajoute-la dans .env pour activer la synchro.",
    );
  }

  const res = await fetch(`${BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API football-data : ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { matches: ApiMatch[] };
  const matches = data.matches ?? [];

  const seenTeams = new Set<string>();
  let recomputed = 0;

  for (const m of matches) {
    const [homeId, awayId] = await Promise.all([
      upsertTeam(m.homeTeam),
      upsertTeam(m.awayTeam),
    ]);
    if (m.homeTeam) seenTeams.add(String(m.homeTeam.id));
    if (m.awayTeam) seenTeams.add(String(m.awayTeam.id));

    const status = mapStatus(m.status);
    const saved = await prisma.match.upsert({
      where: { externalId: String(m.id) },
      update: {
        stage: STAGE_MAP[m.stage] ?? STAGES.GROUP,
        groupName: parseGroup(m.group),
        kickoff: new Date(m.utcDate),
        status,
        homeTeamId: homeId,
        awayTeamId: awayId,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
      },
      create: {
        externalId: String(m.id),
        stage: STAGE_MAP[m.stage] ?? STAGES.GROUP,
        groupName: parseGroup(m.group),
        kickoff: new Date(m.utcDate),
        status,
        homeTeamId: homeId,
        awayTeamId: awayId,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
      },
    });

    if (status === MATCH_STATUS.FINISHED) {
      await recomputeMatchPoints(saved.id);
      recomputed++;
    }
  }

  // Rattache automatiquement chaque match à sa ville hôte (calendrier officiel).
  await importVenues(prisma);

  return {
    teams: seenTeams.size,
    matches: matches.length,
    finishedRecomputed: recomputed,
  };
}
