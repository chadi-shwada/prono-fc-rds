"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Petite salve de confettis quand l'utilisateur arrive sur le classement et
 * qu'il est 1er. Limité à une fois par session (sessionStorage) pour ne pas
 * lasser.
 */
export default function RankCelebration() {
  // Élément invisible qu'on anime pendant la salve : sur WebKit/iOS (et certains
  // Chrome mobiles), le compositeur ne rafraîchit l'écran qu'au scroll quand rien
  // d'autre ne bouge → le canvas de confettis reste figé. En l'animant chaque
  // frame, on garde le compositeur actif et les confettis s'affichent vraiment.
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("rankCelebrated")) return;
      sessionStorage.setItem("rankCelebrated", "1");
    } catch {
      // sessionStorage indisponible → on célèbre quand même
    }

    // Respecte « Réduire les animations » de l'OS : pas de confettis si désactivé.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

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

    // Keepalive du compositeur le temps de la salve (~3,5 s à 60 fps), puis stop.
    let raf = 0;
    let frames = 0;
    const tick = () => {
      const el = pulseRef.current;
      // micro-translation alternée (invisible) → force une recomposition par frame
      if (el)
        el.style.transform = `translateZ(0) translateX(${(frames % 2) * 0.02}px)`;
      if (++frames < 210) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={pulseRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
    />
  );
}
