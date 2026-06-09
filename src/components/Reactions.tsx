"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { toggleReactionAction } from "@/app/actions/reactions";
import { REACTION_EMOJIS } from "@/lib/reactions";

// Barre de réactions emoji (chambrage). Mise à jour optimiste, puis confirmée
// par la revalidation côté serveur.
export default function Reactions({
  matchId,
  initialCounts,
  initialMine,
}: {
  matchId: string;
  initialCounts: Record<string, number>;
  initialMine: string[];
}) {
  const [counts, setCounts] = useState(initialCounts);
  const [mine, setMine] = useState<string[]>(initialMine);
  const [, startTransition] = useTransition();

  const toggle = (emoji: string) => {
    const has = mine.includes(emoji);
    setMine(has ? mine.filter((e) => e !== emoji) : [...mine, emoji]);
    setCounts({ ...counts, [emoji]: Math.max(0, (counts[emoji] ?? 0) + (has ? -1 : 1)) });
    startTransition(() => toggleReactionAction(matchId, emoji));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_EMOJIS.map((emoji) => {
        const n = counts[emoji] ?? 0;
        const active = mine.includes(emoji);
        return (
          <motion.button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            whileTap={{ scale: 0.85 }}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-emerald-400/50 bg-emerald-400/15 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span className="text-base leading-none">{emoji}</span>
            {n > 0 && <span className="font-semibold tabular-nums">{n}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
