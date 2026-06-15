"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import ChampionSelect, { type TeamOption } from "@/components/ChampionSelect";
import { playChampion } from "@/lib/sound";
import { saveChampionAction, type PredState } from "@/app/actions/predictions";

export default function ChampionForm({
  teams,
  initialTeamId,
}: {
  teams: TeamOption[];
  initialTeamId?: string;
}) {
  const [state, action, pending] = useActionState<PredState, FormData>(
    saveChampionAction,
    undefined,
  );
  const [selected, setSelected] = useState(initialTeamId ?? "");
  // Source de vérité : l'équipe renvoyée par l'action (prioritaire), sinon le
  // champion déjà enregistré. Évite de dépendre de la revalidation du cache routeur.
  const savedTeamId = state?.ok && state.teamId ? state.teamId : initialTeamId;
  const isSaved = selected !== "" && selected === savedTeamId;
  const everSaved = !!initialTeamId || !!state?.ok;

  useEffect(() => {
    if (!state?.ok) return;
    playChampion();
    const gold = ["#fbbf24", "#f59e0b", "#fcd34d", "#fff"];
    const fire = (ratio: number, opts: confetti.Options) =>
      confetti({
        particleCount: Math.floor(160 * ratio),
        spread: 70,
        origin: { y: 0.6 },
        colors: gold,
        ...opts,
      });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.35, { spread: 60 });
    fire(0.2, { spread: 100, decay: 0.91, scalar: 0.9 });
    fire(0.2, { spread: 120, startVelocity: 45 });
  }, [state]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="teamId" value={selected} />
      <ChampionSelect teams={teams} value={selected} onChange={setSelected} />
      <motion.button
        type="submit"
        disabled={pending || !selected || isSaved}
        whileTap={{ scale: 0.96 }}
        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
          isSaved
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-amber-400 text-amber-950 hover:bg-amber-300 disabled:opacity-50"
        }`}
      >
        {pending
          ? "…"
          : isSaved
            ? "✓ Champion enregistré"
            : everSaved
              ? "Modifier"
              : "Valider"}
      </motion.button>
      {state?.error && <p className="w-full text-sm text-red-300">{state.error}</p>}
    </form>
  );
}
