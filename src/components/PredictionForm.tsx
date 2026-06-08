"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import Flag from "@/components/Flag";
import ScoreInput from "@/components/ScoreInput";
import { playSuccess } from "@/lib/sound";
import { savePredictionAction, type PredState } from "@/app/actions/predictions";

type TeamInfo = { name: string; code: string | null };

type Props = {
  matchId: string;
  home: TeamInfo;
  away: TeamInfo;
  initialHome?: number;
  initialAway?: number;
};

export default function PredictionForm({
  matchId,
  home,
  away,
  initialHome,
  initialAway,
}: Props) {
  const [state, action, pending] = useActionState<PredState, FormData>(
    savePredictionAction,
    undefined,
  );

  // Valeurs courantes (remontées par les ScoreInput) pour comparer au prono
  // sauvegardé et refléter l'état « enregistré » / « modifier ».
  const savedHome = initialHome != null ? String(initialHome) : "";
  const savedAway = initialAway != null ? String(initialAway) : "";
  const hadPrediction = savedHome !== "" && savedAway !== "";
  const [curHome, setCurHome] = useState(savedHome);
  const [curAway, setCurAway] = useState(savedAway);
  const isSaved =
    hadPrediction && curHome === savedHome && curAway === savedAway;

  useEffect(() => {
    if (state?.ok) {
      playSuccess();
      confetti({
        particleCount: 45,
        spread: 50,
        startVelocity: 28,
        scalar: 0.8,
        origin: { y: 0.7 },
        colors: ["#34d399", "#38bdf8", "#a78bfa"],
      });
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex items-center gap-1.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right sm:gap-2">
          <span className="truncate text-sm font-semibold">{home.name}</span>
          <Flag code={home.code} size={34} className="shrink-0" />
        </div>

        <ScoreInput
          name="homeScore"
          defaultValue={initialHome}
          ariaLabel={`Score ${home.name}`}
          onValueChange={setCurHome}
        />
        <span className="text-slate-500">·</span>
        <ScoreInput
          name="awayScore"
          defaultValue={initialAway}
          ariaLabel={`Score ${away.name}`}
          onValueChange={setCurAway}
        />

        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <Flag code={away.code} size={34} className="shrink-0" />
          <span className="truncate text-sm font-semibold">{away.name}</span>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={pending || isSaved}
        whileTap={{ scale: 0.96 }}
        className={`self-center rounded-full px-5 py-1.5 text-sm font-semibold transition ${
          isSaved
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        }`}
      >
        {pending
          ? "…"
          : isSaved
            ? "✓ Enregistré"
            : hadPrediction
              ? "Modifier mon prono"
              : "Valider mon prono"}
      </motion.button>
    </form>
  );
}
