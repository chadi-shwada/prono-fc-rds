import { type CSSProperties } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dayKey, formatDayLabel, formatTime } from "@/lib/format";
import { teamColor } from "@/lib/teamColor";
import { STAGE_LABELS, MATCH_STATUS, STAGES, type Stage } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import Flag from "@/components/Flag";
import LiveBadge from "@/components/LiveBadge";
import LiveScore from "@/components/LiveScore";
import LiveRefresher from "@/components/LiveRefresher";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });
  const hasLive = matches.some((m) => m.status === MATCH_STATUS.LIVE);

  // Regroupement par jour (en conservant l'ordre chronologique).
  const groups: { key: string; date: Date; matches: typeof matches }[] = [];
  for (const m of matches) {
    const key = dayKey(m.kickoff);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.matches.push(m);
    else groups.push({ key, date: m.kickoff, matches: [m] });
  }

  return (
    <div className="flex flex-col gap-6">
      {hasLive && <LiveRefresher />}
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Calendrier</h1>
        <p className="text-slate-400">
          Les 104 matchs de la Coupe du Monde 2026 📅
        </p>
      </Reveal>

      {groups.length === 0 ? (
        <p className="text-slate-400">Calendrier vide pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g, gi) => (
            <Reveal key={g.key} delay={Math.min(gi * 0.03, 0.3)} y={12}>
              <section>
                <h2 className="sticky top-16 z-[1] mb-2 inline-block rounded-full bg-slate-900/90 px-3 py-1 font-display text-sm font-bold text-emerald-300 backdrop-blur">
                  {formatDayLabel(g.date)}
                </h2>
                <ul className="grid gap-2 lg:grid-cols-2">
                  {g.matches.map((m) => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

type MatchWithTeams = {
  id: string;
  stage: string;
  groupName: string | null;
  kickoff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  liveMinute: number | null;
  liveClock: string | null;
  homeTeam: { name: string; code: string | null } | null;
  awayTeam: { name: string; code: string | null } | null;
};

function MatchRow({ match: m }: { match: MatchWithTeams }) {
  const live = m.status === MATCH_STATUS.LIVE;
  const finished =
    m.status === MATCH_STATUS.FINISHED &&
    m.homeScore !== null &&
    m.awayScore !== null;
  const stageBadge =
    m.stage === STAGES.GROUP
      ? `Groupe ${m.groupName ?? ""}`.trim()
      : (STAGE_LABELS[m.stage as Stage] ?? m.stage);

  const bothTeams = !!m.homeTeam && !!m.awayTeam;
  return (
    <li className="min-w-0">
      <Link
        href={`/matchs/${m.id}`}
        className="card-accent glass relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm"
        style={
          bothTeams
            ? ({ "--accent": teamColor(m.homeTeam!.code) } as CSSProperties)
            : undefined
        }
      >
        {bothTeams && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, ${teamColor(m.homeTeam!.code)}, ${teamColor(m.awayTeam!.code)})`,
            }}
          />
        )}
        <span className="w-12 shrink-0 font-mono text-xs text-slate-400">
          {formatTime(m.kickoff)}
        </span>

      <span className="flex flex-1 items-center justify-end gap-2 text-right">
        <span className="truncate font-semibold">
          {m.homeTeam?.name ?? "À déterminer"}
        </span>
        <Flag code={m.homeTeam?.code} size={24} />
      </span>

      {live ? (
        <LiveScore
          home={m.homeScore}
          away={m.awayScore}
          className="shrink-0 px-2 py-0.5 text-sm"
        />
      ) : (
        <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-center font-display text-sm font-bold">
          {finished ? `${m.homeScore} - ${m.awayScore}` : "vs"}
        </span>
      )}

      <span className="flex flex-1 items-center gap-2">
        <Flag code={m.awayTeam?.code} size={24} />
        <span className="truncate font-semibold">
          {m.awayTeam?.name ?? "À déterminer"}
        </span>
      </span>

        <span className="hidden w-28 shrink-0 justify-end text-right text-[11px] text-slate-500 sm:flex">
          {live ? <LiveBadge minute={m.liveMinute} clock={m.liveClock} /> : stageBadge}
        </span>
      </Link>
    </li>
  );
}
