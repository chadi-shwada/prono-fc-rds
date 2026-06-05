import { prisma } from "@/lib/prisma";
import Reveal from "@/components/Reveal";
import Countdown from "@/components/Countdown";
import FlagsMarquee from "@/components/FlagsMarquee";
import Logo from "@/components/Logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firstMatch, teams] = await Promise.all([
    prisma.match.findFirst({ orderBy: { kickoff: "asc" } }),
    prisma.team.findMany({ select: { code: true }, orderBy: { name: "asc" } }),
  ]);
  const codes = teams.map((t) => t.code);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="w-full max-w-sm">
        <Reveal>
          <div className="mb-7 text-center">
            <div className="float mx-auto w-fit drop-shadow-[0_0_25px_rgba(16,185,129,0.45)]">
              <Logo size={76} className="rounded-[18px]" />
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white">
              Prono FC <span className="text-gradient">RDS</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Pronos de la Coupe du Monde 2026 · entre collègues RATP ⚽
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/40">
            {children}
          </div>
        </Reveal>

        {firstMatch && (
          <Reveal delay={0.2}>
            <div className="mt-6">
              <Countdown target={firstMatch.kickoff.toISOString()} />
            </div>
          </Reveal>
        )}
      </div>

      {codes.length > 0 && (
        <Reveal delay={0.3}>
          <div className="w-screen max-w-3xl">
            <FlagsMarquee codes={codes} />
          </div>
        </Reveal>
      )}
    </div>
  );
}
