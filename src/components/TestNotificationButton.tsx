"use client";

import { useState, useTransition } from "react";
import { sendTestNotificationAction } from "@/app/actions/push";

export default function TestNotificationButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await sendTestNotificationAction();
      setOk(r.ok);
      setMsg(
        r.ok ? `Envoyée sur ${r.sent} appareil${r.sent > 1 ? "s" : ""} ✅` : r.error ?? "Erreur",
      );
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={run}
        disabled={pending}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {pending ? "…" : "M'envoyer une notif de test"}
      </button>
      {msg && (
        <span className={`text-sm ${ok ? "text-emerald-300" : "text-amber-300"}`}>
          {msg}
        </span>
      )}
    </div>
  );
}
