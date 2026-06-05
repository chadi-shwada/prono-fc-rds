"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { LeaderboardRow } from "@/lib/leaderboard";
import Avatar from "@/components/Avatar";
import AnimatedBar from "@/components/AnimatedBar";
import Tooltip from "@/components/Tooltip";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Classement animé : les lignes se réordonnent en douceur (motion `layout`)
 * quand les positions changent (ex. après qu'un match s'est terminé et que les
 * points ont été recalculés). Des flèches ▲▼ indiquent le mouvement depuis le
 * dernier rafraîchissement.
 */
export default function LiveLeaderboard({
  rows,
  meId,
  showDelta = true,
}: {
  rows: LeaderboardRow[];
  meId: string;
  showDelta?: boolean;
}) {
  const prevRanks = useRef<Map<string, number>>(new Map());
  const topScore = rows[0]?.points || 1;

  // Delta de position depuis le rendu précédent (positif = remontée).
  const deltas = new Map<string, number>();
  rows.forEach((r, i) => {
    const prev = prevRanks.current.get(r.userId);
    if (showDelta && prev !== undefined && prev !== i) {
      deltas.set(r.userId, prev - i);
    }
  });

  // Mémorise l'ordre courant pour le prochain rendu.
  useEffect(() => {
    const next = new Map<string, number>();
    rows.forEach((r, i) => next.set(r.userId, i));
    prevRanks.current = next;
  });

  return (
    <ol className="flex flex-col gap-2.5">
      {rows.map((r, i) => {
        const me = r.userId === meId;
        const isTop3 = i < 3;
        const width = Math.max(8, Math.round((r.points / topScore) * 100));
        const delta = deltas.get(r.userId) ?? 0;
        return (
          <motion.li
            key={r.userId}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 500, damping: 40 },
              duration: 0.4,
            }}
          >
            <div
              className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 ${
                i === 0
                  ? "glow-gold border-amber-300/40 bg-amber-300/[0.07]"
                  : me
                    ? "border-emerald-400/50 bg-emerald-400/10"
                    : isTop3
                      ? "border-amber-300/25 bg-amber-300/[0.04]"
                      : "border-white/10 bg-white/5"
              }`}
            >
              <AnimatedBar width={width} delay={Math.min(i * 0.05, 0.5)} />
              <div className="relative flex items-center gap-3">
                <span
                  className={`w-9 text-center font-display text-xl font-extrabold ${
                    i === 0 ? "float inline-block" : ""
                  }`}
                >
                  {MEDALS[i] ?? i + 1}
                </span>
                {delta !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-[10px] font-bold tabular-nums ${
                      delta > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {delta > 0 ? `▲${delta}` : `▼${-delta}`}
                  </motion.span>
                )}
                <span className="flex min-w-0 flex-1 items-center gap-2.5 font-semibold">
                  <Avatar name={r.name} size={30} />
                  <span className="truncate capitalize">
                    {r.name}
                    {me && (
                      <span className="ml-2 text-xs font-medium text-emerald-400">
                        (toi)
                      </span>
                    )}
                  </span>
                </span>
                <span className="hidden text-xs text-slate-400 sm:flex sm:items-center sm:gap-2">
                  {r.exactScores > 0 && (
                    <Tooltip label="Scores exacts trouvés">
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-medium text-amber-300">
                        🎯 {r.exactScores}
                      </span>
                    </Tooltip>
                  )}
                  <span>
                    {r.predictions} prono{r.predictions > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="w-16 text-right font-display text-xl font-extrabold text-emerald-400">
                  {r.points}
                </span>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
