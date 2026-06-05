"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";

/**
 * Score en direct d'un match en cours (rouge). Quand le score change (un but
 * vient d'être marqué, détecté entre deux rafraîchissements), la pastille
 * flashe + un « ⚽ BUT ! » surgit + confettis.
 */
export default function LiveScore({
  home,
  away,
  className = "",
}: {
  home: number | null;
  away: number | null;
  className?: string;
}) {
  const h = home ?? 0;
  const a = away ?? 0;
  const total = h + a;
  const prevTotal = useRef<number | null>(null);
  const [goal, setGoal] = useState(false);

  useEffect(() => {
    const prev = prevTotal.current;
    prevTotal.current = total;
    if (prev !== null && total > prev) {
      setGoal(true);
      confetti({
        particleCount: 50,
        spread: 60,
        startVelocity: 32,
        scalar: 0.85,
        origin: { y: 0.55 },
        colors: ["#34d399", "#f59e0b", "#ef4444", "#38bdf8"],
      });
      const t = setTimeout(() => setGoal(false), 1900);
      return () => clearTimeout(t);
    }
  }, [total]);

  return (
    <span className="relative inline-flex">
      <motion.span
        animate={goal ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-display font-bold tabular-nums transition-colors ${
          goal ? "bg-red-500/40 text-white" : "bg-red-500/15 text-red-200"
        } ${className}`}
      >
        {h}
        <span className="text-red-400/60">-</span>
        {a}
      </motion.span>

      <AnimatePresence>
        {goal && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.6 }}
            animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-red-500/40"
          >
            ⚽ But !
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
