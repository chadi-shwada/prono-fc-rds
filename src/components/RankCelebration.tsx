"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * Petite salve de confettis quand l'utilisateur arrive sur le classement et
 * qu'il est 1er. Limité à une fois par session (sessionStorage) pour ne pas
 * lasser.
 */
export default function RankCelebration() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("rankCelebrated")) return;
      sessionStorage.setItem("rankCelebrated", "1");
    } catch {
      // sessionStorage indisponible → on célèbre quand même
    }
    const colors = ["#facc15", "#f59e0b", "#34d399", "#38bdf8"];
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.3 },
      colors,
      scalar: 0.9,
    });
    const t = setTimeout(
      () =>
        confetti({
          particleCount: 50,
          spread: 110,
          startVelocity: 25,
          origin: { y: 0.35 },
          colors,
          scalar: 0.8,
        }),
      250,
    );
    return () => clearTimeout(t);
  }, []);
  return null;
}
