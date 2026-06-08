import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCORING } from "@/lib/constants";
import Countdown from "@/components/Countdown";
import FlagsMarquee from "@/components/FlagsMarquee";
import Particles from "@/components/Particles";
import Logo from "@/components/Logo";
import LandingHero from "@/components/landing/LandingHero";
import FeatureCard from "@/components/landing/FeatureCard";
import LandingPreview from "@/components/landing/LandingPreview";
import LandingConfetti from "@/components/landing/LandingConfetti";
import WorkPcNotice from "@/components/landing/WorkPcNotice";
import { appName, appTagline, prize } from "@/lib/features";
import { isDiscordEnabled } from "@/lib/discord";

export const dynamic = "force-dynamic";

// Landing publique (visiteurs non connectés). Les connectés filent au tableau de bord.
// Volontairement rendue serveur + CSS (sans dépendre du JS) : elle reste lisible
// même si le réseau bloque /_next/static (cas du réseau d'entreprise).
export default async function Landing() {
  if (await getCurrentUser()) redirect("/dashboard");

  const [firstMatch, teams] = await Promise.all([
    prisma.match.findFirst({ orderBy: { kickoff: "asc" } }),
    prisma.team.findMany({ select: { code: true }, orderBy: { name: "asc" } }),
  ]);
  const codes = teams.map((t) => t.code);
  const discordLogin = isDiscordEnabled();
  const thePrize = prize();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambiance : ballons/coupes qui flottent (l'aurore est dans le layout racine) */}
      <Particles />
      {/* Petit clin d'œil festif à l'arrivée */}
      <LandingConfetti />

      {/* Barre publique */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-display font-extrabold text-white">
            <Logo size={28} />
            <span>{appName()}</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        {/* Affiché uniquement si le JS est bloqué (réseau entreprise) — pas sur Discord */}
        {!discordLogin && (
          <div className="pt-4">
            <WorkPcNotice appName={appName()} />
          </div>
        )}

        {/* Hero (serveur + CSS) */}
        <LandingHero />

        {/* Lot du grand gagnant (si défini) */}
        {thePrize && (
          <div className="rise-in mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-[#5865F2]/40 bg-gradient-to-br from-[#5865F2]/20 via-[#9b59f6]/10 to-[#ff73fa]/15 p-5 text-center">
            <svg
              className="mx-auto h-9 w-9 text-[#c4b5fd]"
              viewBox="0 0 127.14 96.36"
              fill="currentColor"
              aria-hidden
            >
              <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
            </svg>
            <p className="mt-2 font-display text-lg font-bold">
              🎁 Le grand gagnant remporte{" "}
              <span className="bg-gradient-to-r from-[#a78bfa] to-[#ff73fa] bg-clip-text text-transparent">
                {thePrize}
              </span>{" "}
              !
            </p>
          </div>
        )}

        {/* Compte à rebours */}
        {firstMatch && (
          <div className="rise-in mx-auto mt-10 max-w-md" style={{ animationDelay: "0.1s" }}>
            <Countdown target={firstMatch.kickoff.toISOString()} />
          </div>
        )}

        {/* Comment ça marche */}
        <section className="mt-16">
          <h2 className="rise-in text-center font-display text-3xl font-extrabold">
            Comment ça marche
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <FeatureCard
              delay={0.05}
              icon="⚽"
              title="Pronostique chaque match"
              text="Un score à deviner avant chaque coup d'envoi. Plus tu es précis, plus tu marques de points."
            />
            <FeatureCard
              delay={0.12}
              icon="📈"
              title="Grimpe au classement"
              text="Points en temps réel, classement par journée, badges et joueur du jour."
            />
            <FeatureCard
              delay={0.19}
              icon="🏆"
              title="Le bonus champion"
              text="Désigne le vainqueur de la Coupe avant le 1er match : +10 pts si tu vises juste."
            />
          </div>
        </section>

        {/* Aperçu de l'app */}
        <section className="mt-16">
          <div className="rise-in">
            <h2 className="text-center font-display text-3xl font-extrabold">
              Un avant-goût
            </h2>
            <p className="mt-1 text-center text-slate-400">
              Pronos, scores en direct et classement qui bouge.
            </p>
          </div>
          <div className="mt-7">
            <LandingPreview />
          </div>
        </section>

        {/* Barème */}
        <section className="mt-16">
          <h2 className="rise-in text-center font-display text-3xl font-extrabold">
            Le barème, en un clin d&apos;œil
          </h2>
          <div className="rise-in mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreCard points={SCORING.EXACT} label="Score exact" />
            <ScoreCard points={SCORING.DIFF} label="Bon résultat + écart" />
            <ScoreCard points={SCORING.RESULT} label="Bon résultat" />
            <ScoreCard points={`+${SCORING.CHAMPION_BONUS}`} label="Bonus champion" gold />
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">
            Les phases finales comptent <strong>double</strong>{" "}
            (×{SCORING.KNOCKOUT_MULTIPLIER}) — chaque prono devient décisif.
          </p>
        </section>

        {/* Bandeau drapeaux */}
        {codes.length > 0 && (
          <div className="rise-in mt-14">
            <FlagsMarquee codes={codes} />
          </div>
        )}

        {/* CTA final */}
        <section className="mt-16">
          <div className="glass rise-in relative overflow-hidden rounded-3xl p-8 text-center sm:p-10">
            <div className="float pointer-events-none absolute -right-6 -top-6 text-7xl opacity-10">
              🏆
            </div>
            <h2 className="font-display text-3xl font-extrabold">
              Prêt à entrer sur le terrain ?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-300">
              {discordLogin
                ? "Connecte-toi en un clic avec ton compte Discord — c'est parti !"
                : "Connecte-toi avec ton pseudo et le code d'invitation partagé par l'organisateur. Ton compte se crée tout seul."}
            </p>
            <Link
              href="/login"
              className="pulse-glow mt-6 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-3.5 font-display text-lg font-bold text-emerald-950 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
            >
              Faire mes pronos ⚽
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">
        {appName()} · Coupe du Monde 2026 · {appTagline()}
      </footer>
    </div>
  );
}

function ScoreCard({
  points,
  label,
  gold = false,
}: {
  points: number | string;
  label: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-4 text-center transition-transform duration-200 hover:scale-105 ${
        gold ? "border-amber-300/30" : ""
      }`}
    >
      <div
        className={`scoreboard font-display text-3xl font-extrabold ${
          gold ? "text-amber-300" : "text-emerald-400"
        }`}
      >
        {points}
      </div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
