"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getPushState, subscribeToPush } from "@/lib/pushClient";

const DISMISS_KEY = "notif-nudge-dismissed";

// Bandeau discret sur le dashboard : invite à activer les notifications.
// Ne s'affiche que si non abonné, non bloqué, supporté, et non rejeté.
export default function NotifNudge({ publicKey }: { publicKey: string }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (localStorage.getItem(DISMISS_KEY)) return;
    getPushState().then((s) => {
      if (alive && s === "off") setShow(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    const s = await subscribeToPush(publicKey);
    setBusy(false);
    if (s !== "off") setShow(false); // abonné, bloqué ou non supporté → on retire
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-300/10 to-transparent p-4"
        >
          <span className="text-2xl">🔔</span>
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">Active les notifications</span> pour ne
            rater aucun match et voir tes points en direct.
          </p>
          <button
            onClick={enable}
            disabled={busy}
            className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {busy ? "…" : "Activer"}
          </button>
          <button
            onClick={dismiss}
            aria-label="Ignorer"
            className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
