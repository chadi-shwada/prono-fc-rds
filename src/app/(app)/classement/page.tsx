import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";
import { playerOfTheDayFrom } from "@/lib/dailyAward";
import { dayKey, formatDayLabel } from "@/lib/format";
import { MATCH_STATUS } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import Avatar from "@/components/Avatar";
import LiveLeaderboard from "@/components/LiveLeaderboard";
import LiveRefresher from "@/components/LiveRefresher";
import RankCelebration from "@/components/RankCelebration";

export const dynamic = "force-dynamic";

const chipFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const jour = (await searchParams).jour;

  // Matchs terminés (pour les options de journée + calcul par jour)
  const finished = await prisma.match.findMany({
    where: { status: MATCH_STATUS.FINISHED },
    orderBy: { kickoff: "asc" },
    select: {
      kickoff: true,
      homeScore: true,
      awayScore: true,
      predictions: {
        select: {
          userId: true,
          points: true,
          homeScore: true,
          awayScore: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  const days = [...new Set(finished.map((m) => dayKey(m.kickoff)))];
  const activeDay = jour && days.includes(jour) ? jour : null;
  // Réutilise les matchs déjà chargés (au lieu d'une 2e requête identique).
  const playerOfDay = playerOfTheDayFrom(finished);
  const hasLive =
    (await prisma.match.count({ where: { status: MATCH_STATUS.LIVE } })) > 0;

  let rows: LeaderboardRow[];
  let subtitle: string;

  if (activeDay) {
    const map = new Map<string, LeaderboardRow>();
    for (const m of finished) {
      if (dayKey(m.kickoff) !== activeDay) continue;
      for (const p of m.predictions) {
        const e =
          map.get(p.userId) ??
          {
            userId: p.userId,
            name: p.user.name,
            points: 0,
            predictions: 0,
            exactScores: 0,
          };
        e.points += p.points ?? 0;
        e.predictions += 1;
        if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) {
          e.exactScores += 1;
        }
        map.set(p.userId, e);
      }
    }
    rows = [...map.values()].sort(
      (a, b) =>
        b.points - a.points ||
        b.exactScores - a.exactScores ||
        a.name.localeCompare(b.name),
    );
    subtitle = `Points gagnés le ${formatDayLabel(new Date(activeDay)).toLowerCase()}`;
  } else {
    rows = await getLeaderboard();
    subtitle = "Qui sera le meilleur pronostiqueur ? 🏆";
  }

  const isLeader =
    !activeDay &&
    rows[0]?.userId === user.id &&
    (rows[0]?.points ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      {hasLive && <LiveRefresher />}
      {isLeader && <RankCelebration />}
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Classement</h1>
        <p className="text-slate-400">{subtitle}</p>
      </Reveal>

      {playerOfDay && (
        <Reveal delay={0.03}>
          <section className="glow-gold flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-300/10 to-transparent p-4">
            <span className="float text-3xl leading-none">👑</span>
            <Avatar name={playerOfDay.name} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Joueur du jour
              </div>
              <div className="truncate font-display text-lg font-extrabold capitalize">
                {playerOfDay.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-extrabold text-amber-300">
                +{playerOfDay.points}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">
                {playerOfDay.dayLabel}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {days.length > 0 && (
        <Reveal delay={0.04}>
          <div className="flex flex-wrap gap-2">
            <Chip href="/classement" active={!activeDay} label="Général" />
            {days.map((d) => (
              <Chip
                key={d}
                href={`/classement?jour=${d}`}
                active={activeDay === d}
                label={chipFmt.format(new Date(d))}
              />
            ))}
          </div>
        </Reveal>
      )}

      {rows.length === 0 ? (
        <p className="py-6 text-center text-slate-400">
          Aucun point sur cette journée pour l&apos;instant.
        </p>
      ) : (
        <LiveLeaderboard
          key={activeDay ?? "general"}
          rows={rows}
          meId={user.id}
          showDelta={!activeDay}
        />
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-emerald-500 text-emerald-950" : "glass text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
