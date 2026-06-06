"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

// Petit burst de confettis à l'arrivée sur la landing (une fois), aux couleurs
// du site. Discret et désactivé si l'utilisateur préfère moins d'animations.
export default function LandingConfetti() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      confetti({
        particleCount: 55,
        spread: 75,
        startVelocity: 32,
        scalar: 0.9,
        gravity: 1.1,
        ticks: 160,
        origin: { y: 0.2 },
        colors: ["#34d399", "#2dd4bf", "#38bdf8", "#fde68a"],
      });
    }, 350);
    return () => clearTimeout(t);
  }, []);

  return null;
}
