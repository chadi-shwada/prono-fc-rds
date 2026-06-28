import type { PrismaClient } from "@prisma/client";
import scheduleJson from "../data/wc2026-schedule.json";
// Imports relatifs (pas d'alias @/) pour rester testable via tsx, comme scoring-core.
import { STAGES, MATCH_STATUS } from "./constants";
import { EN_TO_CODE, GROUND_TO_CITY, toUTC } from "./venues";

// Calendrier complet de la CDM 2026 (104 matchs) issu de l'open data
// (src/data/wc2026-schedule.json). On s'en sert comme SOURCE DE VÉRITÉ de la
// LISTE des matchs : l'API gratuite football-data ne renvoie pas (ou de façon
// incomplète) les matchs à élimination directe tant que le tableau n'est pas
// figé, ce qui laissait le calendrier vide après la phase de groupes. On seede
// donc tous les matchs (les phases finales en « à déterminer ») et l'API ne fait
// plus que les ENRICHIR (équipes réelles, scores, statut).

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

// Round openfootball -> phase (STAGES). Les "Matchday N" sont la phase de groupes.
const ROUND_TO_STAGE: Record<string, string> = {
  "Round of 32": STAGES.R32,
  "Round of 16": STAGES.R16,
  "Quarter-final": STAGES.QF,
  "Semi-final": STAGES.SF,
  "Match for third place": STAGES.THIRD,
  Final: STAGES.FINAL,
};

export type ScheduleEntry = {
  /** Numéro officiel du match (1..104), ancre stable de seed/adoption. */
  num: number;
  stage: string;
  groupName: string | null;
  kickoff: Date;
  /** Noms anglais (open data) — placeholders type "2A"/"W95" pour les phases finales. */
  team1En: string;
  team2En: string;
  isGroup: boolean;
  /** id de HOST_CITIES (ville hôte), ou null si inconnu. */
  cityId: string | null;
};

type RawMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
};

/** Calendrier officiel parsé, indexé par numéro de match (ordre du fichier). */
export const SCHEDULE: ScheduleEntry[] = (
  (scheduleJson as { matches: RawMatch[] }).matches
)
  .map((s, i): ScheduleEntry | null => {
    const iso = toUTC(s.date, s.time);
    if (!iso) return null;
    const isGroup = !!s.group;
    const stage = isGroup
      ? STAGES.GROUP
      : (ROUND_TO_STAGE[s.round] ?? STAGES.GROUP);
    const groupName = isGroup
      ? (s.group!.replace(/^Group[_ ]/i, "").trim() || null)
      : null;
    return {
      num: i + 1,
      stage,
      groupName,
      kickoff: new Date(iso),
      team1En: s.team1,
      team2En: s.team2,
      isGroup,
      cityId: GROUND_TO_CITY[s.ground] ?? null,
    };
  })
  .filter((e): e is ScheduleEntry => e !== null);

/**
 * Numéro de calendrier correspondant à un match d'API à élimination directe,
 * par phase + coup d'envoi le plus proche (les créneaux KO sont uniques). Tolère
 * un décalage d'horaire (report) jusqu'à 2 jours. null si rien de plausible.
 */
export function findKoScheduleNum(stage: string, kickoff: Date): number | null {
  if (stage === STAGES.GROUP) return null;
  let best: ScheduleEntry | null = null;
  let bestDiff = Infinity;
  for (const e of SCHEDULE) {
    if (e.isGroup || e.stage !== stage) continue;
    const diff = Math.abs(e.kickoff.getTime() - kickoff.getTime());
    if (diff < bestDiff) {
      best = e;
      bestDiff = diff;
    }
  }
  return best && bestDiff <= TWO_DAYS_MS ? best.num : null;
}

/**
 * Garantit que les 104 matchs du calendrier officiel existent en base.
 * Idempotent (ancré sur scheduleNum) :
 *  - rattache (scheduleNum + ville) les matchs déjà créés par l'API,
 *  - crée les matchs manquants (typiquement les phases finales) en
 *    « à déterminer » (équipes nulles), prêts à être enrichis par la synchro.
 * Ne fabrique JAMAIS un match de groupe (ils proviennent de l'API) pour éviter
 * tout doublon/incohérence d'équipes.
 */
export async function seedSchedule(
  db: PrismaClient,
): Promise<{ created: number; linked: number }> {
  const existing = await db.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });
  const usedNums = new Set<number>(
    existing.flatMap((m) => (m.scheduleNum != null ? [m.scheduleNum] : [])),
  );

  // Index des matchs existants par créneau (ms) pour le rattachement des groupes.
  const byKickoff = new Map<number, typeof existing>();
  for (const m of existing) {
    const k = m.kickoff.getTime();
    const list = byKickoff.get(k);
    if (list) list.push(m);
    else byKickoff.set(k, [m]);
  }

  let created = 0;
  let linked = 0;

  for (const e of SCHEDULE) {
    if (usedNums.has(e.num)) continue; // déjà rattaché

    const k = e.kickoff.getTime();
    let link: (typeof existing)[number] | null = null;

    if (e.isGroup) {
      // Groupe : rattacher un match existant au même créneau (sans scheduleNum).
      // Si deux matchs partagent le créneau (dernière journée), on lève
      // l'ambiguïté par code d'équipe ; sinon on s'abstient (rattachement non
      // essentiel pour un groupe).
      const cands = (byKickoff.get(k) ?? []).filter(
        (m) => m.scheduleNum == null && m.stage === STAGES.GROUP,
      );
      if (cands.length === 1) {
        link = cands[0];
      } else if (cands.length > 1) {
        const c1 = EN_TO_CODE[e.team1En];
        const c2 = EN_TO_CODE[e.team2En];
        link =
          cands.find((m) => {
            const codes = [m.homeTeam?.code, m.awayTeam?.code];
            return (!!c1 && codes.includes(c1)) || (!!c2 && codes.includes(c2));
          }) ?? null;
      }
    } else {
      // Phase finale : rattacher un match KO de la même phase au créneau le plus
      // proche (tolérance 2 j) s'il en existe déjà un sans scheduleNum.
      let bestDiff = Infinity;
      for (const m of existing) {
        if (m.scheduleNum != null || m.stage !== e.stage) continue;
        const diff = Math.abs(m.kickoff.getTime() - k);
        if (diff < bestDiff) {
          bestDiff = diff;
          link = m;
        }
      }
      if (bestDiff > TWO_DAYS_MS) link = null;
    }

    if (link) {
      await db.match.update({
        where: { id: link.id },
        data: {
          scheduleNum: e.num,
          ...(link.venueCity ? {} : { venueCity: e.cityId ?? undefined }),
        },
      });
      link.scheduleNum = e.num; // marque comme utilisé pour les itérations suivantes
      usedNums.add(e.num);
      linked++;
      continue;
    }

    // Aucun match existant : on crée uniquement les phases finales manquantes.
    if (!e.isGroup) {
      await db.match.create({
        data: {
          scheduleNum: e.num,
          stage: e.stage,
          groupName: null,
          kickoff: e.kickoff,
          status: MATCH_STATUS.SCHEDULED,
          venueCity: e.cityId ?? undefined,
        },
      });
      usedNums.add(e.num);
      created++;
    }
  }

  return { created, linked };
}
