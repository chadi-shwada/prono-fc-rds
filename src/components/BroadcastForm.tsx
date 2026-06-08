"use client";

import { useState, useTransition } from "react";
import { broadcastNotificationAction } from "@/app/actions/push";

const MAX = 180;

export default function BroadcastForm() {
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    if (!window.confirm("Envoyer cette notification à TOUT le monde ?")) return;
    setResult(null);
    startTransition(async () => {
      const r = await broadcastNotificationAction(text);
      if (r.ok) {
        setResult({ ok: true, text: `Envoyée à ${r.devices} appareil${r.devices > 1 ? "s" : ""} 📣` });
        setMsg("");
      } else {
        setResult({ ok: false, text: r.error ?? "Erreur" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value.slice(0, MAX))}
        rows={2}
        placeholder="Ex : Ça commence ce soir, faites vos pronos ! 🏆"
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400 focus:bg-white/10"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={send}
          disabled={pending || !msg.trim()}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:opacity-50"
        >
          {pending ? "…" : "Envoyer à tous"}
        </button>
        <span className="text-xs text-slate-500">{msg.length}/{MAX}</span>
        {result && (
          <span className={`text-sm ${result.ok ? "text-emerald-300" : "text-amber-300"}`}>
            {result.text}
          </span>
        )}
      </div>
    </div>
  );
}
