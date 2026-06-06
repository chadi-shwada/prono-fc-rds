import Link from "next/link";

// 404 globale (URL inconnue). Rendue dans le layout racine (fond aurore).
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center text-slate-100">
      <div className="font-display text-7xl font-extrabold text-gradient">404</div>
      <div>
        <h1 className="font-display text-2xl font-extrabold">Page introuvable</h1>
        <p className="mt-2 max-w-md text-slate-400">
          Hors-jeu ⚽ Cette page n&apos;existe pas (ou plus).
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 font-display font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
