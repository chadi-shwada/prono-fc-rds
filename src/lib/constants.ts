// Constantes partagées (remplacent les enums, non supportés par SQLite).

export const STAGES = {
  GROUP: "GROUP",
  R32: "R32", // 16es de finale (format à 48 équipes)
  R16: "R16", // 8es de finale
  QF: "QF", // quarts
  SF: "SF", // demies
  THIRD: "THIRD", // petite finale
  FINAL: "FINAL",
} as const;

export type Stage = (typeof STAGES)[keyof typeof STAGES];

/** Libellés FR des phases. */
export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: "Phase de groupes",
  R32: "16es de finale",
  R16: "8es de finale",
  QF: "Quarts de finale",
  SF: "Demi-finales",
  THIRD: "Petite finale",
  FINAL: "Finale",
};

/** Une phase à élimination directe (points ×2). */
export function isKnockout(stage: string): boolean {
  return stage !== STAGES.GROUP;
}

export const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  FINISHED: "FINISHED",
} as const;

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

// --- Barème de points (validé avec Chadi) ---
export const SCORING = {
  EXACT: 3, // score exact
  DIFF: 2, // bon résultat + bon écart de buts
  RESULT: 1, // bon résultat seul (vainqueur/nul)
  KNOCKOUT_MULTIPLIER: 2, // phases finales : points ×2
  CHAMPION_BONUS: 10, // bonus si on a prédit le vainqueur final
  EASTER_EGG: 5, // bonus secret : avoir réveillé le lion 🦁
} as const;
