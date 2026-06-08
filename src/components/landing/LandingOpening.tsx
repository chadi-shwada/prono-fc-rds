"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import Logo from "@/components/Logo";
import { appName } from "@/lib/features";

// Intro « coup d'envoi » de la landing : un splash plein écran (logo + « Coupe
// du Monde 2026 ») qui apparait, puis s'efface en fondu avec un burst de
// confettis. Joué UNE fois par session, et désactivé si l'utilisateur préfère
// moins d'animations.
//
// Rendu uniquement APRÈS hydratation (côté client) : si le JS est bloqué
// (réseau d'entreprise qui filtre /_next/static), aucun overlay n'est posé et
// la landing reste entièrement visible — on ne casse pas le rendu serveur+CSS.
export default function LandingOpening({ name }: { name: string }) {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem("seenOpening")) return;
    sessionStorage.setItem("seenOpening", "1");

    setPhase("in");
    const tOut = setTimeout(() => {
      setPhase("out");
      // Coup d'envoi : burst de confettis quand le splash s'efface.
      confetti({
        particleCount: 90,
        spread: 105,
        startVelocity: 42,
        scalar: 1,
        gravity: 1.1,
        ticks: 200,
        origin: { y: 0.4 },
        colors: ["#34d399", "#2dd4bf", "#38bdf8", "#fde68a", "#a78bfa"],
      });
    }, 1500);
    const tDone = setTimeout(() => setPhase("hidden"), 2300);
    return () => {
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-slate-950 px-6 transition-opacity duration-700 ${
        phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <div className="opening-pop drop-shadow-[0_0_44px_rgba(16,185,129,0.55)]">
        <Logo size={120} className="rounded-[26px]" />
      </div>
      <div className="opening-rise text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-emerald-400 sm:text-sm">
          ⚽ Coup d&apos;envoi
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-6xl">
          Coupe du Monde <span className="text-gradient">2026</span>
        </h2>
        <p className="mt-3 text-sm text-slate-400">{name}</p>
      </div>
    </div>
  );
}
