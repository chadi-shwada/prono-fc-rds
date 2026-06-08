import { prisma } from "@/lib/prisma";
import { SCORING, MATCH_STATUS, STAGES } from "@/lib/constants";
import { computePoints } from "@/lib/scoring-core";

export { basePoints, computePoints, type Score } from "@/lib/scoring-core";

/**
 * Recalcule et persiste les points de tous les pronostics d'un match terminé.
 * Si le match n'est pas terminé / sans score, les points repassent à null.
 */
export async function recomputeMatchPoints(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true },
  });
  if (!match) return;

  const finished =
    match.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null;

  await prisma.$transaction(
    match.predictions.map((p) => {
      const points = finished
        ? computePoints(
            { homeScore: p.homeScore, awayScore: p.awayScore },
            { homeScore: match.homeScore!, awayScore: match.awayScore! },
            match.stage,
          )
        : null;
      return prisma.prediction.update({
        where: { id: p.id },
        data: { points },
      });
    }),
  );

  // La finale terminée → on crédite le bonus vainqueur.
  if (match.stage === STAGES.FINAL && finished) {
    await recomputeChampionBonus();
  }
}

/** Détermine le champion (gagnant de la finale terminée) ou null. */
export async function getChampionTeamId(): Promise<string | null> {
  const final = await prisma.match.findFirst({
    where: { stage: STAGES.FINAL, status: MATCH_STATUS.FINISHED },
    orderBy: { kickoff: "desc" },
  });
  if (!final) return null;
  // Vainqueur explicite (API score.winner ou choix admin) — gère les T.A.B.
  // où le score reste nul après prolongation (ex : France-Argentine 2022).
  if (final.winnerTeamId) return final.winnerTeamId;
  if (final.homeScore === null || final.awayScore === null) return null;
  if (final.homeScore === final.awayScore) return null; // égalité sans vainqueur renseigné → l'admin doit choisir
  return final.homeScore > final.awayScore
    ? final.homeTeamId
    : final.awayTeamId;
}

/** Crédite (ou réinitialise) le bonus vainqueur pour tous les pronos champion. */
export async function recomputeChampionBonus(): Promise<void> {
  const championId = await getChampionTeamId();
  const predictions = await prisma.championPrediction.findMany();
  await prisma.$transaction(
    predictions.map((cp) =>
      prisma.championPrediction.update({
        where: { id: cp.id },
        data: {
          points:
            championId && cp.teamId === championId ? SCORING.CHAMPION_BONUS : null,
        },
      }),
    ),
  );
}

/** Total des points d'un utilisateur (matchs + bonus vainqueur). */
export async function userTotalPoints(userId: string): Promise<number> {
  const [matchAgg, champ, user] = await Promise.all([
    prisma.prediction.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    prisma.championPrediction.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { foundEasterEgg: true },
    }),
  ]);
  return (
    (matchAgg._sum.points ?? 0) +
    (champ?.points ?? 0) +
    (user?.foundEasterEgg ? SCORING.EASTER_EGG : 0)
  );
}
