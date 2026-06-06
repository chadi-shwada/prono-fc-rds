"use client";

import { useSyncExternalStore } from "react";

type Parts = { d: number; h: number; m: number; s: number };

function diffParts(target: number, now: number): Parts {
  const ms = Math.max(0, target - now);
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

// Horloge à la seconde, partagée par useSyncExternalStore : le snapshot ne
// change qu'une fois par seconde (valeur stable entre deux ticks → pas de
// boucle de rendu), et il vaut null côté serveur (évite tout mismatch SSR).
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 250);
  return () => clearInterval(id);
}
const nowSecond = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => null;

/** Compte à rebours en direct jusqu'à `target` (ISO). */
export default function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const second = useSyncExternalStore(subscribe, nowSecond, serverSnapshot);

  const parts = second === null ? null : diffParts(targetMs, second * 1000);
  const started = second !== null && second * 1000 >= targetMs;

  if (started) {
    return (
      <div className="glass rounded-2xl p-5 text-center">
        <div className="font-display text-lg font-extrabold text-emerald-400">
          ⚽ Le tournoi a commencé ! Bonne chance 🍀
        </div>
      </div>
    );
  }

  const items: [string, number][] = [
    ["Jours", parts?.d ?? 0],
    ["Heures", parts?.h ?? 0],
    ["Min", parts?.m ?? 0],
    ["Sec", parts?.s ?? 0],
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        Coup d&apos;envoi de la Coupe du Monde dans
      </div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex min-w-[58px] flex-col items-center rounded-xl border border-white/10 bg-white/5 px-2 py-2.5"
          >
            <span className="scoreboard font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
