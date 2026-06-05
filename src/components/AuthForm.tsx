"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { authAction, type ActionState } from "@/app/actions/auth";

export default function AuthForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    authAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-200">Pseudo</span>
        <input
          name="name"
          autoComplete="username"
          required
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none transition focus:border-emerald-400 focus:bg-white/10"
          placeholder="Ton pseudo"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-200">Code d&apos;invitation</span>
        <input
          name="code"
          required
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none transition focus:border-emerald-400 focus:bg-white/10"
          placeholder="Code partagé par l'organisateur"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={pending}
        whileTap={{ scale: 0.97 }}
        className="mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2.5 font-display font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:opacity-50"
      >
        {pending ? "..." : "Entrer dans le jeu ⚽"}
      </motion.button>

      <p className="text-center text-xs text-slate-500">
        Nouveau ? Ton compte est créé automatiquement avec ton pseudo.
      </p>
    </form>
  );
}
