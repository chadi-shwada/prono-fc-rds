import { prisma } from "@/lib/prisma";
import { MATCH_STATUS, SCORING } from "@/lib/constants";

export type LeaderboardRow = {
  userId: string;
  name: string;
  points: number;
  predictions: number;
  exactScores: number;
};

/** Classement trié : points desc, puis scores exacts desc, puis pseudo. */
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const [users, predAgg, champs, exactPreds] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, foundEasterEgg: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      _sum: { points: true },
      _count: { _all: true },
    }),
    prisma.championPrediction.findMany({
      select: { userId: true, points: true },
    }),
    prisma.prediction.findMany({
      where: { match: { status: MATCH_STATUS.FINISHED } },
      select: {
        userId: true,
        homeScore: true,
        awayScore: true,
        match: { select: { homeScore: true, awayScore: true } },
      },
    }),
  ]);

  const aggByUser = new Map(predAgg.map((p) => [p.userId, p]));
  const champByUser = new Map(champs.map((c) => [c.userId, c.points ?? 0]));

  const exactByUser = new Map<string, number>();
  for (const p of exactPreds) {
    if (
      p.match.homeScore === p.homeScore &&
      p.match.awayScore === p.awayScore
    ) {
      exactByUser.set(p.userId, (exactByUser.get(p.userId) ?? 0) + 1);
    }
  }

  const rows: LeaderboardRow[] = users.map((u) => {
    const agg = aggByUser.get(u.id);
    return {
      userId: u.id,
      name: u.name,
      points:
        (agg?._sum.points ?? 0) +
        (champByUser.get(u.id) ?? 0) +
        (u.foundEasterEgg ? SCORING.EASTER_EGG : 0),
      predictions: agg?._count._all ?? 0,
      exactScores: exactByUser.get(u.id) ?? 0,
    };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.exactScores - a.exactScores ||
      a.name.localeCompare(b.name),
  );
  return rows;
}
