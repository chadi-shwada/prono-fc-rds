"use client";

import { useEffect, useState } from "react";
import {
  getPushState,
  subscribeToPush,
  unsubscribeFromPush,
  type PushState,
} from "@/lib/pushClient";

type State = PushState | "loading" | "busy";

// Bouton d'activation des notifications push. La clé publique VAPID est passée
// par le serveur (pas de NEXT_PUBLIC_* → pas de dépendance au build).
export default function EnableNotifications({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let alive = true;
    getPushState().then((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const enable = async () => {
    setState("busy");
    setState(await subscribeToPush(publicKey));
  };

  const disable = async () => {
    setState("busy");
    await unsubscribeFromPush();
    setState("off");
  };

  if (state === "unsupported") {
    return (
      <p className="text-sm text-slate-400">
        Les notifications ne sont pas supportées par ce navigateur. Sur iPhone,
        ajoute d&apos;abord le site à l&apos;écran d&apos;accueil.
      </p>
    );
  }
  if (state === "blocked") {
    return (
      <p className="text-sm text-amber-300">
        Notifications bloquées dans les réglages du navigateur. Réautorise-les
        pour ce site, puis recharge la page.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm">
        <p className="font-medium">Rappels & résultats</p>
        <p className="text-slate-400">
          Reçois un rappel avant les matchs et tes points dès le coup de sifflet.
        </p>
      </div>
      {state === "on" ? (
        <button
          onClick={disable}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
        >
          Désactiver
        </button>
      ) : (
        <button
          onClick={enable}
          disabled={state === "busy" || state === "loading"}
          className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {state === "busy" ? "…" : "Activer 🔔"}
        </button>
      )}
    </div>
  );
}
