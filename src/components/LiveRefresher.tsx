"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraîchit les Server Components à intervalle régulier tant qu'un match est
 * en direct, pour afficher le score quasi en temps réel (les pages sont en
 * `force-dynamic`, donc chaque refresh re-fetche les scores synchronisés).
 *
 * Le polling est suspendu quand l'onglet est en arrière-plan (économise des
 * requêtes) et un refresh immédiat est déclenché au retour au premier plan.
 * Ne rend rien.
 */
export default function LiveRefresher({
  intervalMs = 20000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer === undefined) {
        timer = setInterval(() => router.refresh(), intervalMs);
      }
    };
    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        router.refresh(); // rattrape le score manqué pendant l'absence
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
