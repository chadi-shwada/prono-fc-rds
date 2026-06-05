"use client";

import { useState, useTransition } from "react";
import { triggerSyncAction, type SyncState } from "@/app/actions/admin";

export default function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SyncState>();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => setState(await triggerSyncAction()))
        }
        className="self-start rounded-lg bg-sky-500 px-4 py-2 font-semibold text-sky-950 hover:bg-sky-400 disabled:opacity-50"
      >
        {pending ? "Synchronisation…" : "🔄 Synchroniser via l'API"}
      </button>
      {state?.message && (
        <p className="text-sm text-emerald-400">{state.message}</p>
      )}
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
    </div>
  );
}
