import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKickoff } from "@/lib/format";
import { STAGE_LABELS, MATCH_STATUS, STAGES, type Stage } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import Flag from "@/components/Flag";
import LiveBadge from "@/components/LiveBadge";
import LiveScore from "@/components/LiveScore";
import LiveRefresher from "@/components/LiveRefresher";
import Avatar from "@/components/Avatar";

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
    },
  });
  if (!match) notFound();

  const now = new Date();
  const locked = match.kickoff <= now;
  const live = match.status === MATCH_STATUS.LIVE;
  const finished =
    match.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null;

  const isExact = (p: { homeScore: number; awayScore: number }) =>
    finished &&
    p.homeScore === match.homeScore &&
    p.awayScore === match.awayScore;

  const preds = [...match.predictions].sort(
    (a, b) =>
      (b.points ?? -1) - (a.points ?? -1) || a.user.name.localeCompare(b.user.name),
  );

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
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-slate-400">
            <span className="justify-self-start truncate rounded-full bg-white/10 px-2.5 py-0.5 font-medium">
              {STAGE_LABELS[match.stage as Stage] ?? match.stage}
              {match.groupName ? ` · Groupe ${match.groupName}` : ""}
            </span>
            <span className="justify-self-center">
              {live && <LiveBadge minute={match.liveMinute} />}
            </span>
            <span className="justify-self-end whitespace-nowrap">
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
              <LiveScore
                home={match.homeScore}
                away={match.awayScore}
                className="px-4 py-2 text-2xl"
              />
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
      </Reveal>

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
