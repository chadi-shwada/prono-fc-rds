import { prisma } from "@/lib/prisma";
import { MATCH_STATUS } from "@/lib/constants";
import { dayKey, formatDayLabel } from "@/lib/format";

export type DailyAward = {
  userId: string;
  name: string;
  points: number;
  dayLabel: string;
};

type MatchForAward = {
  kickoff: Date;
  predictions: {
    userId: string;
    points: number | null;
    user: { name: string };
  }[];
};

/**
 * « Joueur du jour » : le meilleur scoreur de la dernière journée terminée
 * (somme des points des pronos sur les matchs finis de ce jour). null s'il
 * n'y a encore aucun match terminé avec des points.
 */
export async function getPlayerOfTheDay(): Promise<DailyAward | null> {
  const matches = await prisma.match.findMany({
    where: { status: MATCH_STATUS.FINISHED },
    select: {
      kickoff: true,
      predictions: {
        select: {
          userId: true,
          points: true,
          user: { select: { name: true } },
        },
      },
    },
  });
  return playerOfTheDayFrom(matches);
}

/**
 * Version pure : calcule le joueur du jour à partir de matchs terminés déjà
 * chargés (évite une 2e requête identique quand l'appelant a déjà les données).
 */
export function playerOfTheDayFrom(matches: MatchForAward[]): DailyAward | null {
  if (matches.length === 0) return null;

  // Dernière journée terminée (clé jour la plus récente).
  const lastDay = matches
    .map((m) => dayKey(m.kickoff))
    .sort()
    .at(-1)!;

  const totals = new Map<string, { name: string; points: number }>();
  for (const m of matches) {
    if (dayKey(m.kickoff) !== lastDay) continue;
    for (const p of m.predictions) {
      const cur = totals.get(p.userId) ?? { name: p.user.name, points: 0 };
      cur.points += p.points ?? 0;
      totals.set(p.userId, cur);
    }
  }

  let best: DailyAward | null = null;
  for (const [userId, v] of totals) {
    if (!best || v.points > best.points) {
      best = {
        userId,
        name: v.name,
        points: v.points,
        dayLabel: formatDayLabel(new Date(lastDay + "T00:00:00")),
      };
    }
  }

  return best && best.points > 0 ? best : null;
}
