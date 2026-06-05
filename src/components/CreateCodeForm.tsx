"use client";

import { useActionState } from "react";
import { createCodeAction, type AdminState } from "@/app/actions/admin";

export default function CreateCodeForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createCodeAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <input
        name="code"
        required
        placeholder="Nouveau code"
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />
      <input
        name="label"
        placeholder="Libellé (optionnel)"
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />
      <input
        name="maxUses"
        type="number"
        min={1}
        placeholder="Limite"
        className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {pending ? "…" : "Créer"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-300">{state.error}</p>
      )}
      {state?.ok && (
        <p className="w-full text-sm text-emerald-400">Code créé ✓</p>
      )}
    </form>
  );
}
