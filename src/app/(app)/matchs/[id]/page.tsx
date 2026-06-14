import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKickoff } from "@/lib/format";
import { teamColor } from "@/lib/teamColor";
import { STAGE_LABELS, MATCH_STATUS, type Stage } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import Flag from "@/components/Flag";
import LiveBadge from "@/components/LiveBadge";
import LiveScore from "@/components/LiveScore";
import LiveRefresher from "@/components/LiveRefresher";
import EspnMatchInsights from "@/components/EspnMatchInsights";
import EspnLiveScore from "@/components/EspnLiveScore";
import EspnInsightsSkeleton from "@/components/EspnInsightsSkeleton";
import Avatar from "@/components/Avatar";
import Reactions from "@/components/Reactions";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: { include: { user: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
  });
  if (!match) notFound();

  // Réactions : comptage par emoji + celles de l'utilisateur courant.
  const reactionCounts: Record<string, number> = {};
  const myReactions: string[] = [];
  for (const r of match.reactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
    if (r.userId === user.id) myReactions.push(r.emoji);
  }

  const now = new Date();
  const locked = match.kickoff <= now;
  const live = match.status === MATCH_STATUS.LIVE;
  const finished =
    match.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null;

  // Détails ESPN : pronostic des cotes AVANT le match, puis fil du match / stats
  // / T.A.B. en cours et après. Affiché dès que les deux équipes sont connues ;
  // auto-masqué si ESPN n'a pas le match. Récupéré par date du coup d'envoi.
  const showInsights = !!match.homeTeam && !!match.awayTeam;

  const isExact = (p: { homeScore: number; awayScore: number }) =>
    finished &&
    p.homeScore === match.homeScore &&
    p.awayScore === match.awayScore;

  const preds = [...match.predictions].sort(
    (a, b) =>
      (b.points ?? -1) - (a.points ?? -1) || a.user.name.localeCompare(b.user.name),
  );

  // Tendance des pronos : victoire domicile / nul / victoire extérieur
  const total = preds.length;
  const homeWin = preds.filter((p) => p.homeScore > p.awayScore).length;
  const drawCount = preds.filter((p) => p.homeScore === p.awayScore).length;
  const awayWin = total - homeWin - drawCount;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {live && <LiveRefresher />}
      <Reveal>
        <Link
          href="/matchs"
          className="text-sm text-emerald-400 hover:underline"
        >
          ← Retour aux matchs
        </Link>
      </Reveal>

      {/* En-tête du match */}
      <Reveal delay={0.05}>
        <div className="glass relative overflow-hidden rounded-2xl p-6">
          {match.homeTeam && match.awayTeam && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                  background: `linear-gradient(105deg, ${teamColor(match.homeTeam.code)}, transparent 42%, transparent 58%, ${teamColor(match.awayTeam.code)})`,
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${teamColor(match.homeTeam.code)}, ${teamColor(match.awayTeam.code)})`,
                }}
              />
            </>
          )}
          <div className="relative">
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-slate-400">
            <span className="min-w-0 max-w-full justify-self-start truncate rounded-full bg-white/10 px-2.5 py-0.5 font-medium">
              {STAGE_LABELS[match.stage as Stage] ?? match.stage}
              {match.groupName ? ` · Groupe ${match.groupName}` : ""}
            </span>
            <span className="justify-self-center">
              {live && <LiveBadge minute={match.liveMinute} clock={match.liveClock} />}
            </span>
            <span className="min-w-0 justify-self-end truncate whitespace-nowrap">
              {formatKickoff(match.kickoff)}
            </span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <span className="flex flex-1 flex-col items-center gap-2 text-center">
              <Flag code={match.homeTeam?.code} size={48} />
              <span className="font-semibold">
                {match.homeTeam?.name ?? "À déterminer"}
              </span>
            </span>
            {live ? (
              match.homeTeam && match.awayTeam ? (
                <Suspense
                  fallback={
                    <LiveScore
                      home={match.homeScore}
                      away={match.awayScore}
                      className="px-4 py-2 text-2xl"
                    />
                  }
                >
                  <EspnLiveScore
                    homeCode={match.homeTeam.code}
                    awayCode={match.awayTeam.code}
                    kickoff={match.kickoff}
                    fallbackHome={match.homeScore}
                    fallbackAway={match.awayScore}
                    className="px-4 py-2 text-2xl"
                  />
                </Suspense>
              ) : (
                <LiveScore
                  home={match.homeScore}
                  away={match.awayScore}
                  className="px-4 py-2 text-2xl"
                />
              )
            ) : (
              <span className="rounded-xl bg-white/10 px-4 py-2 font-display text-2xl font-extrabold">
                {finished ? `${match.homeScore} - ${match.awayScore}` : "VS"}
              </span>
            )}
            <span className="flex flex-1 flex-col items-center gap-2 text-center">
              <Flag code={match.awayTeam?.code} size={48} />
              <span className="font-semibold">
                {match.awayTeam?.name ?? "À déterminer"}
              </span>
            </span>
          </div>
          </div>
        </div>
      </Reveal>

      {/* Détails du match via ESPN (buteurs, stats, T.A.B.) — streamés, auto-masqués */}
      {showInsights && match.homeTeam && match.awayTeam && (
        <Reveal delay={0.06}>
          <Suspense fallback={<EspnInsightsSkeleton />}>
            <EspnMatchInsights
              homeCode={match.homeTeam.code}
              awayCode={match.awayTeam.code}
              kickoff={match.kickoff}
            />
          </Suspense>
        </Reveal>
      )}

      {/* Réactions (chambrage) */}
      <Reveal delay={0.07}>
        <div className="glass rounded-2xl p-4">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ambiance 🍿
          </div>
          <Reactions
            matchId={match.id}
            initialCounts={reactionCounts}
            initialMine={myReactions}
          />
        </div>
      </Reveal>

      {/* Tendance des pronos */}
      {locked && total > 0 && match.homeTeam && match.awayTeam && (
        <Reveal delay={0.08}>
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tendance des pronos
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
              {homeWin > 0 && (
                <div
                  style={{
                    width: `${(homeWin / total) * 100}%`,
                    background: teamColor(match.homeTeam.code),
                  }}
                />
              )}
              {drawCount > 0 && (
                <div
                  className="bg-slate-500"
                  style={{ width: `${(drawCount / total) * 100}%` }}
                />
              )}
              {awayWin > 0 && (
                <div
                  style={{
                    width: `${(awayWin / total) * 100}%`,
                    background: teamColor(match.awayTeam.code),
                  }}
                />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: teamColor(match.homeTeam.code) }}
                />
                <span className="truncate font-medium">{match.homeTeam.name}</span>
                <span className="font-bold text-white">{pct(homeWin)}%</span>
              </span>
              {drawCount > 0 && (
                <span className="shrink-0 text-slate-400">Nul {pct(drawCount)}%</span>
              )}
              <span className="flex min-w-0 items-center justify-end gap-1.5">
                <span className="font-bold text-white">{pct(awayWin)}%</span>
                <span className="truncate font-medium">{match.awayTeam.name}</span>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: teamColor(match.awayTeam.code) }}
                />
              </span>
            </div>
          </div>
        </Reveal>
      )}

      {/* Pronos des participants */}
      <Reveal delay={0.1}>
        <div>
          <h2 className="mb-3 font-display text-lg font-bold">
            Les pronos des participants
          </h2>

          {!locked ? (
            <div className="glass rounded-2xl p-6 text-center text-slate-400">
              🔒 Les pronos des autres seront visibles au coup d&apos;envoi.
              <br />
              <span className="text-sm">Pas de triche, chacun parie en aveugle !</span>
            </div>
          ) : preds.length === 0 ? (
            <p className="text-slate-400">Personne n&apos;a pronostiqué ce match.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {preds.map((p) => {
                const me = p.userId === user.id;
                const exact = isExact(p);
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                      me
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5 font-medium">
                      <Avatar name={p.user.name} size={28} />
                      <span className="truncate capitalize">
                        {p.user.name}
                        {me && (
                          <span className="ml-2 text-xs text-emerald-400">(toi)</span>
                        )}
                      </span>
                    </span>
                    <span className="font-display text-lg font-bold tabular-nums">
                      {p.homeScore} - {p.awayScore}
                    </span>
                    {exact && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        🎯 exact
                      </span>
                    )}
                    {finished && (
                      <span
                        className={`w-14 text-right text-sm font-semibold ${
                          (p.points ?? 0) > 0 ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {(p.points ?? 0) > 0 ? `+${p.points}` : "0"} pt
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
