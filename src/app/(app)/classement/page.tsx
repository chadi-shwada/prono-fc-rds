import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";
import { playerOfTheDayFrom } from "@/lib/dailyAward";
import { dayKey } from "@/lib/format";
import { MATCH_STATUS } from "@/lib/constants";
import ClassementView from "@/components/ClassementView";
import LiveRefresher from "@/components/LiveRefresher";
import RankCelebration from "@/components/RankCelebration";

export const dynamic = "force-dynamic";

const chipFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

type FinishedMatch = {
  kickoff: Date;
  homeScore: number | null;
  awayScore: number | null;
  predictions: {
    userId: string;
    points: number | null;
    homeScore: number;
    awayScore: number;
    user: { name: string };
  }[];
};

/** Classement par journée (jour → lignes triées), calculé en une passe. */
function leaderboardByDay(
  finished: FinishedMatch[],
): Record<string, LeaderboardRow[]> {
  const maps = new Map<string, Map<string, LeaderboardRow>>();
  for (const m of finished) {
    const k = dayKey(m.kickoff);
    const map = maps.get(k) ?? new Map<string, LeaderboardRow>();
    maps.set(k, map);
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

  const out: Record<string, LeaderboardRow[]> = {};
  for (const [k, map] of maps) {
    out[k] = [...map.values()].sort(
      (a, b) =>
        b.points - a.points ||
        b.exactScores - a.exactScores ||
        a.name.localeCompare(b.name),
    );
  }
  return out;
}

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
  const [hasLive, general] = await Promise.all([
    prisma.match
      .count({ where: { status: MATCH_STATUS.LIVE } })
      .then((n) => n > 0),
    getLeaderboard(),
  ]);

  // Toutes les journées calculées d'avance → le filtre est instantané côté client.
  const byDay = leaderboardByDay(finished);
  const dayLabels = Object.fromEntries(
    days.map((d) => [d, chipFmt.format(new Date(d))]),
  );

  const isLeader =
    !activeDay && general[0]?.userId === user.id && (general[0]?.points ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      {hasLive && <LiveRefresher />}
      {isLeader && <RankCelebration />}
      <ClassementView
        general={general}
        byDay={byDay}
        days={days}
        dayLabels={dayLabels}
        initialDay={activeDay}
        meId={user.id}
        playerOfDay={playerOfDay}
      />
    </div>
  );
}
