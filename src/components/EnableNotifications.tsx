"use client";

import { useEffect, useState } from "react";
import {
  savePushSubscriptionAction,
  deletePushSubscriptionAction,
} from "@/app/actions/push";

type State = "loading" | "unsupported" | "blocked" | "off" | "on" | "busy";

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Bouton d'activation des notifications push. La clé publique VAPID est passée
// par le serveur (pas de NEXT_PUBLIC_* → pas de dépendance au build).
export default function EnableNotifications({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let alive = true;
    const resolve = async (): Promise<State> => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return "unsupported";
      }
      if (Notification.permission === "denied") return "blocked";
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        return sub ? "on" : "off";
      } catch {
        return "off";
      }
    };
    resolve().then((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "blocked" : "off");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey) as BufferSource,
      });
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      await savePushSubscriptionAction({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
      });
      setState("on");
    } catch {
      setState("off");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
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
          disabled={state !== "on"}
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
