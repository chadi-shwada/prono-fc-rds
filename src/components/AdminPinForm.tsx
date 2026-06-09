"use client";

import { useActionState } from "react";
import { setAdminPinAction, type PinState } from "@/app/actions/auth";

const inputCls =
  "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:bg-white/10";

/** Définir / changer le PIN qui protège le login pseudo+code du compte admin. */
export default function AdminPinForm({ hasPin }: { hasPin: boolean }) {
  const [state, formAction, pending] = useActionState<PinState, FormData>(
    setAdminPinAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">
        Le code d&apos;invitation est partagé : sans PIN, n&apos;importe qui
        connaissant ton pseudo pourrait se connecter en admin.
      </p>
      {hasPin && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-200">PIN actuel</span>
          <input
            name="current"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            required
            className={inputCls}
          />
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-200">
            {hasPin ? "Nouveau PIN" : "PIN"} (4-8 chiffres)
          </span>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            required
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-200">Confirmation</span>
          <input
            name="confirm"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            required
            className={inputCls}
          />
        </label>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          ✓ PIN enregistré — il sera demandé à ta prochaine connexion.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
      >
        {pending ? "..." : hasPin ? "Changer le PIN" : "Définir le PIN"}
      </button>
    </form>
  );
}
