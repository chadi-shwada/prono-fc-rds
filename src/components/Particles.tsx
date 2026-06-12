"use client";

import type { CSSProperties } from "react";

// Ballons / coupes décoratifs, à des positions FIXES (coins/bords, derrière le
// contenu). Ils flottent sur place (léger va-et-vient) → ni pluie, ni bulles.

type Pos = {
  e: string;
  size: number;
  op: number;
  dur: number; // durée du flottement (s)
  delay: number;
  style: CSSProperties; // positionnement (top/left/right/bottom)
};

const ITEMS: Pos[] = [
  { e: "⚽", size: 50, op: 0.14, dur: 7, delay: 0, style: { top: "14%", left: "4%" } },
  { e: "🏆", size: 38, op: 0.13, dur: 9, delay: 1.5, style: { top: "24%", right: "5%" } },
  { e: "⚽", size: 30, op: 0.1, dur: 8, delay: 0.8, style: { top: "52%", left: "3%" } },
  { e: "🥇", size: 40, op: 0.13, dur: 10, delay: 2.2, style: { top: "60%", right: "4%" } },
  { e: "⚽", size: 34, op: 0.12, dur: 7.5, delay: 1, style: { bottom: "9%", left: "9%" } },
  { e: "🏆", size: 44, op: 0.14, dur: 8.5, delay: 3, style: { bottom: "13%", right: "8%" } },
];

// Ballon qui ROULE à travers l'écran de temps en temps (traînée + rotation liée
// au déplacement). Hors-champ la majeure partie du cycle → clin d'œil occasionnel,
// pas un défilement continu. Hauteurs/cadences décalées pour ne pas les voir
// passer ensemble.
type Roller = { size: number; dur: number; delay: number; style: CSSProperties };
const ROLLERS: Roller[] = [
  { size: 34, dur: 23, delay: 4, style: { bottom: "16%" } },
  { size: 26, dur: 29, delay: 15, style: { top: "33%" } },
];

export default function Particles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden motion-reduce:hidden"
    >
      {ITEMS.map((it, i) => (
        <span key={i} className="absolute" style={it.style}>
          <span
            className="particle-float select-none"
            style={{
              fontSize: it.size,
              opacity: it.op,
              animationDuration: `${it.dur}s`,
              animationDelay: `${it.delay}s`,
            }}
          >
            {it.e}
          </span>
        </span>
      ))}

      {ROLLERS.map((r, i) => (
        <span
          key={`roll-${i}`}
          className="rolling-ball absolute"
          style={{
            ...r.style,
            animationDuration: `${r.dur}s`,
            animationDelay: `${r.delay}s`,
          }}
        >
          <span
            className="rolling-ball-emoji select-none"
            style={{
              fontSize: r.size,
              animationDuration: `${r.dur}s`,
              animationDelay: `${r.delay}s`,
            }}
          >
            ⚽
          </span>
        </span>
      ))}
    </div>
  );
}
