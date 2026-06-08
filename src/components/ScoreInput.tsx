"use client";

import { useEffect, useState } from "react";

/** Saisie d'un score avec flèches ▲▼ stylées (remplace les spinners natifs). */
export default function ScoreInput({
  name,
  defaultValue,
  ariaLabel,
  onValueChange,
}: {
  name: string;
  defaultValue?: number | null;
  ariaLabel?: string;
  onValueChange?: (value: string) => void;
}) {
  const [v, setV] = useState(
    defaultValue === undefined || defaultValue === null
      ? ""
      : String(defaultValue),
  );
  const adjust = (delta: number) =>
    setV((prev) => {
      const n = prev === "" ? 0 : parseInt(prev, 10);
      return String(Math.max(0, Math.min(99, n + delta)));
    });

  // Notifie le parent de la valeur courante (pour refléter l'état « enregistré »).
  useEffect(() => {
    onValueChange?.(v);
  }, [v, onValueChange]);

  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-white/10 bg-white/5 transition focus-within:border-emerald-400 focus-within:bg-white/10">
      <input
        name={name}
        value={v}
        onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
        inputMode="numeric"
        aria-label={ariaLabel}
        placeholder="–"
        className="w-9 bg-transparent py-1.5 text-center text-lg font-bold text-white outline-none placeholder:text-slate-600"
      />
      <div className="flex w-6 flex-col border-l border-white/10">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Augmenter"
          onClick={() => adjust(1)}
          className="flex h-1/2 items-center justify-center text-[9px] leading-none text-slate-400 transition hover:bg-emerald-500/20 hover:text-emerald-300"
        >
          ▲
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Diminuer"
          onClick={() => adjust(-1)}
          className="flex h-1/2 items-center justify-center border-t border-white/10 text-[9px] leading-none text-slate-400 transition hover:bg-emerald-500/20 hover:text-emerald-300"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
