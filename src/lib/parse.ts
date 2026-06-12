/** Score (0–99) ou null si vide/invalide. */
export function parseScore(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : null;
}

/** Minute de jeu (0–130) ou null si vide/invalide. */
export function parseMinute(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 130 ? n : null;
}
