import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCORING } from "@/lib/constants";
import Countdown from "@/components/Countdown";
import FlagsMarquee from "@/components/FlagsMarquee";
import Particles from "@/components/Particles";
import Reveal from "@/components/Reveal";
import Logo from "@/components/Logo";
import LandingHero from "@/components/landing/LandingHero";
import FeatureCard from "@/components/landing/FeatureCard";
import LandingPreview from "@/components/landing/LandingPreview";
import LandingConfetti from "@/components/landing/LandingConfetti";

export const dynamic = "force-dynamic";

// Landing publique (visiteurs non connectés). Les connectés filent au tableau de bord.
export default async function Landing() {
  if (await getCurrentUser()) redirect("/dashboard");

  const [firstMatch, teams] = await Promise.all([
    prisma.match.findFirst({ orderBy: { kickoff: "asc" } }),
    prisma.team.findMany({ select: { code: true }, orderBy: { name: "asc" } }),
  ]);
  const codes = teams.map((t) => t.code);

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
            <span>Prono FC RDS</span>
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
        {/* Hero animé */}
        <LandingHero />

        {/* Compte à rebours */}
        {firstMatch && (
          <Reveal delay={0.1}>
            <div className="mx-auto mt-10 max-w-md">
              <Countdown target={firstMatch.kickoff.toISOString()} />
            </div>
          </Reveal>
        )}

        {/* Comment ça marche */}
        <section className="mt-16">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-extrabold">
              Comment ça marche
            </h2>
          </Reveal>
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
          <Reveal>
            <h2 className="text-center font-display text-3xl font-extrabold">
              Un avant-goût
            </h2>
            <p className="mt-1 text-center text-slate-400">
              Pronos, scores en direct et classement qui bouge.
            </p>
          </Reveal>
          <div className="mt-7">
            <LandingPreview />
          </div>
        </section>

        {/* Barème */}
        <section className="mt-16">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-extrabold">
              Le barème, en un clin d&apos;œil
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreCard points={SCORING.EXACT} label="Score exact" />
              <ScoreCard points={SCORING.DIFF} label="Bon résultat + écart" />
              <ScoreCard points={SCORING.RESULT} label="Bon résultat" />
              <ScoreCard points={`+${SCORING.CHAMPION_BONUS}`} label="Bonus champion" gold />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-center text-sm text-slate-400">
              Les phases finales comptent <strong>double</strong>{" "}
              (×{SCORING.KNOCKOUT_MULTIPLIER}) — chaque prono devient décisif.
            </p>
          </Reveal>
        </section>

        {/* Bandeau drapeaux */}
        {codes.length > 0 && (
          <Reveal delay={0.1}>
            <div className="mt-14">
              <FlagsMarquee codes={codes} />
            </div>
          </Reveal>
        )}

        {/* CTA final */}
        <section className="mt-16">
          <Reveal>
            <div className="glass relative overflow-hidden rounded-3xl p-8 text-center sm:p-10">
              <div className="float pointer-events-none absolute -right-6 -top-6 text-7xl opacity-10">
                🏆
              </div>
              <h2 className="font-display text-3xl font-extrabold">
                Prêt à entrer sur le terrain ?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-slate-300">
                Connecte-toi avec ton pseudo et le code d&apos;invitation partagé par
                l&apos;organisateur. Ton compte se crée tout seul.
              </p>
              <Link
                href="/login"
                className="pulse-glow mt-6 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-3.5 font-display text-lg font-bold text-emerald-950 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
              >
                Faire mes pronos ⚽
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-400">
        Prono FC RDS · Coupe du Monde 2026 · entre collègues RATP
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
