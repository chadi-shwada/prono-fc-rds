import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/leaderboard";
import { getEngagement } from "@/lib/engagement";
import { getVapidPublicKey } from "@/lib/push";
import { formatKickoff } from "@/lib/format";
import NotifNudge from "@/components/NotifNudge";
import Reveal from "@/components/Reveal";
import AnimatedNumber from "@/components/AnimatedNumber";
import Countdown from "@/components/Countdown";
import Flag from "@/components/Flag";
import Avatar from "@/components/Avatar";
import LiveBadge from "@/components/LiveBadge";
import LiveScore from "@/components/LiveScore";
import LiveRefresher from "@/components/LiveRefresher";
import { MATCH_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // le layout (app)/layout.tsx redirige déjà vers /login

  const [leaderboard, predictionCount, upcoming, firstMatch, liveMatches, engagement] =
    await Promise.all([
      getLeaderboard(),
      prisma.prediction.count({ where: { userId: user.id } }),
      prisma.match.findMany({
        where: { kickoff: { gt: new Date() } },
        orderBy: { kickoff: "asc" },
        take: 4,
        include: { homeTeam: true, awayTeam: true },
      }),
      prisma.match.findFirst({ orderBy: { kickoff: "asc" } }),
      prisma.match.findMany({
        where: { status: MATCH_STATUS.LIVE },
        orderBy: { kickoff: "asc" },
        include: { homeTeam: true, awayTeam: true },
      }),
      getEngagement(user.id),
    ]);

  const meIndex = leaderboard.findIndex((r) => r.userId === user.id);
  const rank = meIndex + 1;
  // Points du joueur dérivés du classement (déjà calculé) — évite une requête.
  const points = leaderboard.find((r) => r.userId === user.id)?.points ?? 0;
  // Le classement n'a de sens que quand au moins un joueur a marqué des points.
  const ranked = (leaderboard[0]?.points ?? 0) > 0;

  // Duels : voisins directs au classement (à rattraper / à distancer).
  const rival = meIndex > 0 ? leaderboard[meIndex - 1] : null;
  const chaser = meIndex >= 0 ? leaderboard[meIndex + 1] ?? null : null;
  const showDuels = ranked && (rival !== null || chaser !== null);

  const vapidKey = getVapidPublicKey();

  return (
    <div className="flex flex-col gap-6">
      {liveMatches.length > 0 && <LiveRefresher />}
      <Reveal>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size={56} />
          <div>
            <p className="text-sm font-medium text-emerald-400">Bienvenue 👋</p>
            <h1 className="font-display text-4xl font-extrabold">
              Salut <span className="text-gradient capitalize">{user.name}</span>
            </h1>
          </div>
        </div>
        <p className="mt-2 text-slate-400">
          Prêt à pronostiquer la Coupe du Monde 2026 ?
        </p>
        <div className="mt-3 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs">
          <span className="font-display font-bold text-amber-300">
            Coupe du Monde 2026
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span className="flex items-center gap-1">
            <Flag code="USA" size={18} className="shrink-0" />
            <Flag code="CAN" size={18} className="shrink-0" />
            <Flag code="MEX" size={18} className="shrink-0" />
          </span>
        </div>
      </Reveal>

      {vapidKey && <NotifNudge publicKey={vapidKey} />}

      {(engagement.todayTotal > 0 || engagement.streak > 0) && (
        <Reveal delay={0.03}>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.12] to-transparent p-4">
            <div className="flex items-center gap-3">
              {engagement.streak > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-sm font-bold text-amber-300">
                  🔥 {engagement.streak} jour{engagement.streak > 1 ? "s" : ""}
                </span>
              )}
              <div>
                {engagement.todayTotal > 0 ? (
                  engagement.todayToPredict > 0 ? (
                    <p className="font-display text-lg font-bold">
                      ⚽ {engagement.todayToPredict} prono
                      {engagement.todayToPredict > 1 ? "s" : ""} à faire aujourd&apos;hui
                    </p>
                  ) : (
                    <p className="font-display text-lg font-bold text-emerald-300">
                      ✅ Tous tes pronos du jour sont faits !
                    </p>
                  )
                ) : (
                  <p className="font-display text-lg font-bold">
                    🔥 Garde ta série en vie !
                  </p>
                )}
                {engagement.nextKickoff && (
                  <p className="text-xs text-slate-400">
                    Prochain coup d&apos;envoi : {formatKickoff(engagement.nextKickoff)}
                  </p>
                )}
              </div>
            </div>
            {engagement.todayToPredict > 0 && (
              <Link
                href="/matchs"
                className="shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Pronostiquer →
              </Link>
            )}
          </section>
        </Reveal>
      )}

      {liveMatches.length > 0 && (
        <Reveal delay={0.04}>
          <section className="rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-500/[0.12] to-transparent p-4">
            <div className="mb-3 flex items-center gap-2">
              <LiveBadge />
              <h2 className="font-display text-lg font-bold">Ça joue en ce moment ⚽</h2>
            </div>
            <ul className="flex flex-col gap-2">
              {liveMatches.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/matchs/${m.id}`}
                    className="card-hover glass flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:gap-3"
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
                      <span className="truncate font-semibold">
                        {m.homeTeam?.name ?? "?"}
                      </span>
                      <Flag code={m.homeTeam?.code} size={28} className="shrink-0" />
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <LiveScore
                        home={m.homeScore}
                        away={m.awayScore}
                        className="text-sm"
                      />
                      {m.liveMinute != null && (
                        <span className="font-display text-xs tabular-nums text-red-300">
                          {m.liveMinute}&apos;
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <Flag code={m.awayTeam?.code} size={28} className="shrink-0" />
                      <span className="truncate font-semibold">
                        {m.awayTeam?.name ?? "?"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      {firstMatch && (
        <Reveal delay={0.05}>
          <Countdown target={firstMatch.kickoff.toISOString()} />
        </Reveal>
      )}

      <Reveal delay={0.08}>
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Mes points" value={<AnimatedNumber value={points} />} />
          <Stat
            label="Classement"
            value={ranked && rank > 0 ? `${rank}${rank === 1 ? "er" : "e"}` : "—"}
          />
          <Stat
            label="Pronos faits"
            value={<AnimatedNumber value={predictionCount} />}
          />
        </section>
      </Reveal>

      {showDuels && (
        <Reveal delay={0.12}>
          <section className="glass rounded-2xl p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Tes duels 🥊</h2>
            <div className="flex flex-col gap-2.5">
              {rival ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-lg">🔼</span>
                  <Avatar name={rival.name} size={32} />
                  <span className="min-w-0 flex-1 truncate font-semibold capitalize">
                    {rival.name}
                  </span>
                  <span className="shrink-0 text-sm text-slate-400">
                    <span className="font-display font-bold text-amber-300">
                      {rival.points - points}
                    </span>{" "}
                    pts devant
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.07] px-3 py-2.5">
                  <span className="text-lg">👑</span>
                  <span className="font-semibold">Tu es en tête du classement !</span>
                </div>
              )}
              {chaser && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-lg">🔽</span>
                  <Avatar name={chaser.name} size={32} />
                  <span className="min-w-0 flex-1 truncate font-semibold capitalize">
                    {chaser.name}
                  </span>
                  <span className="shrink-0 text-sm text-slate-400">
                    <span className="font-display font-bold text-emerald-400">
                      {points - chaser.points}
                    </span>{" "}
                    pts derrière
                  </span>
                </div>
              )}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.16}>
        <section className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Prochains matchs</h2>
            <Link href="/matchs" className="text-sm text-emerald-400 hover:underline">
              Tout voir →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun match à venir pour le moment.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/5">
              {upcoming.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Flag code={m.homeTeam?.code} size={28} />
                    <span className="sm:hidden">{m.homeTeam?.code ?? "?"}</span>
                    <span className="hidden sm:inline">{m.homeTeam?.name ?? "?"}</span>
                    <span className="text-slate-400">vs</span>
                    <span className="hidden sm:inline">{m.awayTeam?.name ?? "?"}</span>
                    <span className="sm:hidden">{m.awayTeam?.code ?? "?"}</span>
                    <Flag code={m.awayTeam?.code} size={28} />
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatKickoff(m.kickoff)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.24}>
        <Link
          href="/matchs"
          className="shimmer block rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3.5 text-center font-display font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40"
        >
          Faire mes pronos ⚽
        </Link>
      </Reveal>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="scoreboard font-display text-3xl font-extrabold text-emerald-400">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
