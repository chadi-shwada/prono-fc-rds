/**
 * Avatar coloré déterministe : initiale du pseudo sur un dégradé choisi à partir
 * du nom (toujours le même pour un pseudo donné). Donne une identité visuelle à
 * chaque joueur, sans stockage ni configuration.
 */

// Paires de dégradés (vives, lisibles sur fond sombre).
const GRADIENTS: [string, string][] = [
  ["#34d399", "#0ea5e9"], // émeraude → ciel
  ["#f59e0b", "#ef4444"], // ambre → rouge
  ["#a78bfa", "#ec4899"], // violet → rose
  ["#22d3ee", "#3b82f6"], // cyan → bleu
  ["#fb7185", "#f43f5e"], // rose → rouge
  ["#4ade80", "#16a34a"], // vert
  ["#facc15", "#f97316"], // jaune → orange
  ["#818cf8", "#6366f1"], // indigo
  ["#2dd4bf", "#14b8a6"], // teal
  ["#f472b6", "#a855f7"], // rose → violet
];

/** Hash stable d'une chaîne (djb2). */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

export default function Avatar({
  name,
  size = 32,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const clean = (name ?? "").trim();
  const initial = clean ? clean.charAt(0).toUpperCase() : "?";
  const [from, to] = GRADIENTS[hashString(clean.toLowerCase()) % GRADIENTS.length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-white shadow-sm ring-1 ring-white/15 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.45),
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initial}
    </span>
  );
}
