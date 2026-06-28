import type { PrismaClient } from "@prisma/client";
// Imports relatifs (pas d'alias @/) pour rester testable via tsx.
import { MATCH_STATUS, STAGES } from "./constants";
import { computeGroupStandings } from "./standings";
import { SCHEDULE } from "./schedule";

// Résolution LOCALE des affiches à élimination directe : on remplit les vraies
// équipes des matchs KO à partir de NOS résultats (sans dépendre de l'API, qui en
// plan gratuit ne les fournit pas). Les places du calendrier officiel encodent
// toute la structure :
//   - "1A"/"2B" → 1er/2e du groupe (classement, quand le groupe est terminé) ;
//   - "W74"     → vainqueur du match n°74 ;
//   - "L101"    → perdant du match n°101 (petite finale) ;
//   - "3A/B/C/D/F" → un des meilleurs 3es → NON résolu ici (table d'attribution
//     officielle FIFA non codée) : ces cases restent « à déterminer » en attendant
//     l'API ou la saisie admin.
// On ne résout QUE du définitif (groupe terminé / match terminé) : jamais de
// provisoire, pour ne pas afficher une affiche fausse ni verrouiller un mauvais prono.

const POS = /^([12])([A-L])$/; // "1E", "2A"…
const WIN = /^W(\d+)$/; // vainqueur du match n
const LOSE = /^L(\d+)$/; // perdant du match n
const THIRD = /^3[A-L/]+$/; // "3A/B/C/D/F" → meilleur 3e (différé)

type TeamLite = { id: string; name: string; code: string | null };

export type ResolvableMatch = {
  scheduleNum: number | null;
  stage: string;
  groupName: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
};

/** id du perdant d'un match terminé (l'équipe qui n'est pas le vainqueur). */
function loserId(m: {
  winnerTeamId: string | null;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
}): string | null {
  if (!m.winnerTeamId || !m.homeTeam || !m.awayTeam) return null;
  if (m.winnerTeamId === m.homeTeam.id) return m.awayTeam.id;
  if (m.winnerTeamId === m.awayTeam.id) return m.homeTeam.id;
  return null;
}

/**
 * Calcule, pour chaque match à élimination directe (par numéro de calendrier),
 * les ids d'équipe résolus de façon DÉFINITIVE (null si pas encore déterminable).
 */
export function resolveKnockoutTeamIds(
  matches: ResolvableMatch[],
): Map<number, { homeId: string | null; awayId: string | null }> {
  // 1) Classements de groupes (depuis nos matchs) → place "1A"/"2A" → id équipe,
  //    UNIQUEMENT pour les groupes terminés (positions définitives).
  const groupMatches = matches.filter((m) => m.stage === STAGES.GROUP);
  const standings = computeGroupStandings(groupMatches);

  const tally = new Map<string, { total: number; finished: number }>();
  for (const m of groupMatches) {
    if (!m.groupName) continue;
    const t = tally.get(m.groupName) ?? { total: 0, finished: 0 };
    t.total++;
    if (m.status === MATCH_STATUS.FINISHED) t.finished++;
    tally.set(m.groupName, t);
  }
  const placeToTeamId = new Map<string, string>();
  for (const g of standings) {
    const t = tally.get(g.group);
    const complete = !!t && t.total > 0 && t.finished === t.total;
    if (!complete) continue;
    g.rows.slice(0, 2).forEach((row, i) => {
      placeToTeamId.set(`${i + 1}${g.group}`, row.teamId);
    });
  }

  // 2) Matchs KO indexés par numéro de calendrier (pour résoudre "W74"/"L101").
  const koByNum = new Map<number, ResolvableMatch>();
  for (const m of matches) {
    if (m.stage !== STAGES.GROUP && m.scheduleNum != null) {
      koByNum.set(m.scheduleNum, m);
    }
  }

  const isFinished = (m: ResolvableMatch | undefined) =>
    !!m && m.status === MATCH_STATUS.FINISHED && !!m.winnerTeamId;

  const resolve = (token: string): string | null => {
    const pos = POS.exec(token);
    if (pos) return placeToTeamId.get(token) ?? null;
    const w = WIN.exec(token);
    if (w) {
      const m = koByNum.get(Number(w[1]));
      return isFinished(m) ? m!.winnerTeamId : null;
    }
    const l = LOSE.exec(token);
    if (l) {
      const m = koByNum.get(Number(l[1]));
      return isFinished(m) ? loserId(m!) : null;
    }
    if (THIRD.test(token)) return null; // meilleur 3e : différé
    return null;
  };

  const out = new Map<number, { homeId: string | null; awayId: string | null }>();
  for (const e of SCHEDULE) {
    if (e.isGroup) continue;
    out.set(e.num, { homeId: resolve(e.team1En), awayId: resolve(e.team2En) });
  }
  return out;
}

/**
 * Écrit en base les équipes KO résolues localement. Idempotent et prudent :
 *  - ne remplit qu'un côté ENCORE vide (null) → ne touche jamais une équipe déjà
 *    posée par l'API ou l'admin ;
 *  - n'écrit que du définitif (cf. resolveKnockoutTeamIds) ;
 *  - évite de mettre deux fois la même équipe dans une affiche.
 */
export async function resolveKnockoutTeams(
  db: PrismaClient,
): Promise<{ resolved: number }> {
  const matches = await db.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });
  const byNum = new Map<number, (typeof matches)[number]>();
  for (const m of matches) if (m.scheduleNum != null) byNum.set(m.scheduleNum, m);

  const resolutions = resolveKnockoutTeamIds(matches);
  let resolved = 0;

  for (const [num, r] of resolutions) {
    const m = byNum.get(num);
    if (!m) continue;
    const data: { homeTeamId?: string; awayTeamId?: string } = {};
    if (m.homeTeamId == null && r.homeId && r.homeId !== m.awayTeamId) {
      data.homeTeamId = r.homeId;
    }
    if (
      m.awayTeamId == null &&
      r.awayId &&
      r.awayId !== (data.homeTeamId ?? m.homeTeamId)
    ) {
      data.awayTeamId = r.awayId;
    }
    if (data.homeTeamId || data.awayTeamId) {
      await db.match.update({ where: { id: m.id }, data });
      resolved++;
    }
  }
  return { resolved };
}
