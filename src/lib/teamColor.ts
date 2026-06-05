// Couleur d'accent déterministe par équipe (à partir de son code), pour teinter
// subtilement les cartes de match. Ce n'est pas la « vraie » couleur du pays,
// juste un accent stable et discret qui donne du caractère à chaque affiche.

const PALETTE = [
  "#34d399", // émeraude
  "#0ea5e9", // ciel
  "#a78bfa", // violet
  "#f59e0b", // ambre
  "#ef4444", // rouge
  "#22d3ee", // cyan
  "#fb7185", // rose
  "#4ade80", // vert
  "#facc15", // jaune
  "#818cf8", // indigo
  "#2dd4bf", // teal
  "#f472b6", // rose vif
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h);
}

/** Couleur d'accent (hex) d'une équipe d'après son code FIFA. */
export function teamColor(code: string | null | undefined): string {
  const k = (code ?? "").toUpperCase();
  if (!k) return "#64748b"; // slate (équipe inconnue)
  return PALETTE[hash(k) % PALETTE.length];
}
