"use client";

import Link from "next/link";
import { useEffect } from "react";

// Frontière d'erreur pour les pages connectées : remplace l'écran d'erreur
// Next par défaut (anglais/technique) par un message au design de l'app.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="float text-6xl">😵‍💫</div>
      <div>
        <h1 className="font-display text-3xl font-extrabold">Oups, un pépin</h1>
        <p className="mt-2 max-w-md text-slate-400">
          Une erreur est survenue de notre côté. Réessaie dans un instant — si ça
          persiste, préviens l&apos;organisateur.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 font-display font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
