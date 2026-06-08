import Link from "next/link";
import Logo from "@/components/Logo";
import { appName, appTagline } from "@/lib/features";

// Rendu serveur + animations CSS : reste visible même si le JavaScript est
// bloqué par le réseau (les anims jouent en CSS, sans dépendre du JS).
export default function LandingHero() {
  return (
    <section className="flex flex-col items-center gap-5 pt-12 text-center sm:pt-16">
      <span
        className="rise-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300"
        style={{ animationDelay: "0.02s" }}
      >
        ⚽ Coupe du Monde 2026 · {appTagline()}
      </span>

      <div className="rise-in" style={{ animationDelay: "0.08s" }}>
        <div className="float drop-shadow-[0_0_34px_rgba(16,185,129,0.5)]">
          <Logo size={94} className="rounded-[22px]" />
        </div>
      </div>

      <h1
        className="rise-in font-display text-5xl font-extrabold leading-[1.05] sm:text-7xl"
        style={{ animationDelay: "0.16s" }}
      >
        <span className="text-gradient">{appName()}</span>
      </h1>

      <p
        className="rise-in max-w-xl text-balance text-lg text-slate-300"
        style={{ animationDelay: "0.24s" }}
      >
        Le pronostic maison de la Coupe du Monde 2026. Devine les scores, grimpe
        au classement et chambre tes collègues — du match d&apos;ouverture à la
        finale.
      </p>

      <div
        className="rise-in flex justify-center"
        style={{ animationDelay: "0.32s" }}
      >
        <Link
          href="/login"
          className="pulse-glow shimmer rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-3.5 font-display text-lg font-bold text-emerald-950 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
        >
          Entrer dans le jeu ⚽
        </Link>
      </div>

      <div
        className="rise-in mt-2 flex items-center gap-3 text-sm text-slate-400 sm:gap-5"
        style={{ animationDelay: "0.4s" }}
      >
        <Stat n="48" label="équipes" />
        <span className="text-slate-700">•</span>
        <Stat n="104" label="matchs" />
        <span className="text-slate-700">•</span>
        <Stat n="1" label="champion" />
      </div>

      <div className="rise-in mt-2" style={{ animationDelay: "0.5s" }} aria-hidden>
        <span className="scroll-cue inline-block text-2xl text-slate-500">⌄</span>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="scoreboard font-display text-xl font-extrabold text-emerald-400">
        {n}
      </span>
      {label}
    </span>
  );
}
