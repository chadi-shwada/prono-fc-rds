"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import FlagsMarquee from "@/components/FlagsMarquee";

// Repli si la base n'a pas encore d'équipes synchronisées : un échantillon de
// nations pour que le bandeau ne soit jamais vide à l'ouverture.
const FALLBACK_CODES = [
  "FRA", "BRA", "ARG", "GER", "ESP", "POR", "ENG", "NED", "ITA", "BEL",
  "USA", "MEX", "CAN", "CRO", "MAR", "JPN", "SEN", "URU",
];

// Intro « coup d'envoi » de la landing : ambiance Coupe du Monde — pelouse +
// projecteurs de stade, ballon qui arrive en tournant,
// titre « Coupe du Monde 2026 » en or (couleur du trophée FIFA) + trophées, puis
// fondu avec un double burst de confettis. Rejoué à chaque chargement de la
// landing, désactivé si l'utilisateur préfère moins d'animations.
export default function LandingOpening({
  name,
  codes,
}: {
  name: string;
  codes: string[];
}) {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");
  const flagCodes = codes.length >= 6 ? codes : FALLBACK_CODES;

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Affiche l'intro à la frame suivante : laisse la transition CSS d'entrée
    // démarrer et évite un setState synchrone dans le corps de l'effet.
    const raf = requestAnimationFrame(() => setPhase("in"));
    const tOut = setTimeout(() => {
      setPhase("out");
      // Coup d'envoi : double tir de confettis or/vert depuis les deux côtés.
      const base = {
        particleCount: 70,
        startVelocity: 46,
        ticks: 220,
        gravity: 1.1,
        scalar: 1,
        colors: ["#fbbf24", "#fde68a", "#34d399", "#2dd4bf", "#ffffff"],
      };
      confetti({ ...base, angle: 60, spread: 72, origin: { x: 0, y: 0.65 } });
      confetti({ ...base, angle: 120, spread: 72, origin: { x: 1, y: 0.65 } });
    }, 1700);
    const tDone = setTimeout(() => setPhase("hidden"), 2500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 overflow-hidden px-6 transition-opacity duration-700 ${
        phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, #064e3b 0%, #052e2b 45%, #020617 100%)",
      }}
      aria-hidden
    >
      {/* Projecteurs de stade qui balayent depuis le haut */}
      <div
        className="opening-beam pointer-events-none absolute inset-0"
        style={{
          background:
            "conic-gradient(from 90deg at 50% -12%, transparent 0deg, rgba(255,255,255,0.12) 26deg, transparent 52deg, transparent 128deg, rgba(255,255,255,0.12) 154deg, transparent 180deg)",
        }}
      />
      {/* Ballon qui arrive en tournant */}
      <div className="opening-ball relative z-10 text-7xl drop-shadow-[0_0_34px_rgba(255,255,255,0.45)] sm:text-8xl">
        ⚽
      </div>

      <div className="opening-rise relative z-10 text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300 sm:text-sm">
          Coup d&apos;envoi
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-6xl">
          Coupe du Monde
          <br />
          <span className="inline-flex items-center gap-3">
            <span className="text-3xl sm:text-5xl">🏆</span>
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(251,191,36,0.45)]">
              2026
            </span>
            <span className="text-3xl sm:text-5xl">🏆</span>
          </span>
        </h2>
        <p className="mt-3 text-sm text-slate-300">{name}</p>
      </div>

      {/* Bandeau de drapeaux en zig-zag, en bas */}
      <div className="opening-rise absolute inset-x-0 bottom-6 z-10">
        <FlagsMarquee codes={flagCodes} zigzag />
      </div>
    </div>
  );
}
