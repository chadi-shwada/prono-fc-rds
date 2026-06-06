// Cœur du barème — fonctions pures, sans accès base de données.
// Isolé de scoring.ts pour être testable sans instancier Prisma.
import { SCORING, isKnockout } from "./constants";

export type Score = { homeScore: number; awayScore: number };

/** -1 si l'équipe à l'extérieur gagne, 0 nul, 1 si domicile gagne. */
export function outcome(s: Score): number {
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
