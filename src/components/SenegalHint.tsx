"use client";

import { useRef } from "react";

const NEED = 3; // tapotements pour réveiller le lion
const WINDOW_MS = 2000; // dans cet intervalle

// Indice de l'easter egg, version mobile : tapoter le lion 🦁 plusieurs fois
// le réveille (émet l'évènement écouté par SenegalEasterEgg).
export default function SenegalHint() {
  const taps = useRef<number[]>([]);

  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < WINDOW_MS), now];
    if (taps.current.length >= NEED) {
      taps.current = [];
      window.dispatchEvent(new Event("prono:senegal"));
    }
  };

  return (
    <p className="select-none text-center text-xs italic leading-relaxed text-slate-500">
      <button
        type="button"
        onClick={onTap}
        aria-label="Réveiller le lion"
        className="align-middle text-base transition active:scale-90"
      >
        🦁
      </button>{" "}
      Un lion sommeille quelque part dans ces pages…
      <br />
      pour le réveiller, <strong>tapote-le</strong> (ou, sur ordinateur, tape son
      royaume au clavier).
    </p>
  );
}
