import { prisma } from "@/lib/prisma";
import { SCORING, isKnockout, MATCH_STATUS, STAGES } from "@/lib/constants";

export type Score = { homeScore: number; awayScore: number };

/** -1 si l'équipe à l'extérieur gagne, 0 nul, 1 si domicile gagne. */
function outcome(s: Score): number {
  return Math.sign(s.homeScore - s.awayScore);
}

/**
 * Points d'un pronostic comparé au résultat réel (avant multiplicateur de phase).
 * - score exact            → 3
 * - bon résultat + écart   → 2
 * - bon résultat seulement → 1
 * - sinon                  → 0
 */
export function basePoints(prediction: Score, actual: Score): number {
  if (
    prediction.homeScore === actual.homeScore &&
    prediction.awayScore === actual.awayScore
  ) {
    return SCORING.EXACT;
  }
  if (outcome(prediction) !== outcome(actual)) {
    return 0; // mauvais résultat
  }
  // bon résultat à partir d'ici
  const sameDiff =
    prediction.homeScore - prediction.awayScore ===
    actual.homeScore - actual.awayScore;
  return sameDiff ? SCORING.DIFF : SCORING.RESULT;
}

/** Points finaux d'un pronostic, multiplicateur de phase appliqué. */
export function computePoints(
  prediction: Score,
  actual: Score,
  stage: string,
): number {
  const pts = basePoints(prediction, actual);
  return isKnockout(stage) ? pts * SCORING.KNOCKOUT_MULTIPLIER : pts;
}

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
  if (!final || final.homeScore === null || final.awayScore === null) return null;
  if (final.homeScore === final.awayScore) return null; // nul impossible en finale (TAB) — à gérer à l'admin
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
  const [matchAgg, champ] = await Promise.all([
    prisma.prediction.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    prisma.championPrediction.findUnique({ where: { userId } }),
  ]);
  return (matchAgg._sum.points ?? 0) + (champ?.points ?? 0);
}
