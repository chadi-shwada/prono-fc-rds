"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { resetMatchPredictionsAction } from "@/app/actions/admin";

/** Bouton admin : réinitialise les pronos d'un match (modale de confirmation maison). */
export default function ResetPronosButton({
  matchId,
  count,
}: {
  matchId: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <form action={resetMatchPredictionsAction}>
      <input type="hidden" name="matchId" value={matchId} />

      <button
        type="button"
        disabled={count === 0}
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-500/35 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Réinitialiser les pronos{count > 0 ? ` (${count})` : ""}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-2xl">
                🗑️
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                Réinitialiser les pronos ?
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {count} prono{count > 1 ? "s" : ""} {count > 1 ? "seront" : "sera"}{" "}
                définitivement supprimé{count > 1 ? "s" : ""} pour ce match. Cette
                action est irréversible.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
