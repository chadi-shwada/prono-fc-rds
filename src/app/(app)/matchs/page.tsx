import { type CSSProperties } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKickoff } from "@/lib/format";
import { teamColor } from "@/lib/teamColor";
import { STAGE_LABELS, MATCH_STATUS, type Stage } from "@/lib/constants";
import PredictionForm from "@/components/PredictionForm";
import ChampionForm from "@/components/ChampionForm";
import Reveal from "@/components/Reveal";
import Flag from "@/components/Flag";
import ScoreReveal from "@/components/ScoreReveal";
import LiveBadge from "@/components/LiveBadge";
import LiveScore from "@/components/LiveScore";
import LiveRefresher from "@/components/LiveRefresher";

export const dynamic = "force-dynamic";

type TeamInfo = { name: string; code: string | null };

const TABS = [
  { key: "avenir", label: "À venir" },
  { key: "mes-pronos", label: "Mes pronos" },
  { key: "tous", label: "Tous" },
] as const;

export default async function MatchsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const now = new Date();
  const filter = (await searchParams).filter ?? "avenir";

  const [matches, myPreds, teams, myChampion, firstMatch] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.prediction.findMany({ where: { userId: user.id } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.championPrediction.findUnique({
      where: { userId: user.id },
      include: { team: true },
    }),
    prisma.match.findFirst({ orderBy: { kickoff: "asc" } }),
  ]);

  const predByMatch = new Map(myPreds.map((p) => [p.matchId, p]));
  const tournamentStarted = !!firstMatch && firstMatch.kickoff <= now;
  const hasLive = matches.some((m) => m.status === MATCH_STATUS.LIVE);

  // Progression : pronos faits / matchs pronostiquables (équipes connues, à venir)
  const predictable = matches.filter(
    (m) => m.homeTeam && m.awayTeam && m.kickoff > now,
  );
  const doneCount = predictable.filter((m) => predByMatch.has(m.id)).length;
  const progress = predictable.length
    ? Math.round((doneCount / predictable.length) * 100)
    : 0;

  const filtered = matches.filter((m) => {
    if (filter === "mes-pronos") return predByMatch.has(m.id);
    if (filter === "tous") return true;
    // à venir : matchs jouables (équipes connues, pas encore commencés)
    return m.kickoff > now && !!m.homeTeam && !!m.awayTeam;
  });

  return (
    <div className="flex flex-col gap-6">
      {hasLive && <LiveRefresher />}
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Les matchs</h1>
        <p className="text-slate-400">Place tes pronos avant le coup d&apos;envoi ⚽</p>
      </Reveal>

      {/* Progression */}
      <Reveal delay={0.04}>
        <div className="glass rounded-2xl p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">Ta progression</span>
            <span className="text-slate-400">
              {doneCount} / {predictable.length} pronos
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Reveal>

      {/* Prono vainqueur */}
      <div id="champion" className="scroll-mt-24">
        <section className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-transparent p-5">
          <h2 className="mb-1 font-display text-lg font-bold text-amber-300">
            🏆 Ton champion
          </h2>
          <p className="mb-3 text-sm text-slate-400">
            Prédis le vainqueur de la Coupe du Monde (+10 pts bonus). Verrouillé au
            coup d&apos;envoi du tournoi.
          </p>
          {tournamentStarted ? (
            <p className="flex items-center gap-2 text-sm">
              {myChampion ? (
                <>
                  <Flag code={myChampion.team.code} size={28} />
                  <span className="font-semibold">{myChampion.team.name}</span>
                </>
              ) : (
                <span className="text-slate-500">Aucun prono enregistré.</span>
              )}
            </p>
          ) : (
            <ChampionForm teams={teams} initialTeamId={myChampion?.teamId} />
          )}
        </section>
      </div>

      {/* Onglets de filtre */}
      <div className="flex gap-2">
        {TABS.map((t) => {
          const active = filter === t.key;
          return (
            <Link
              key={t.key}
              href={`/matchs?filter=${t.key}`}
              scroll={false}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-500 text-emerald-950"
                  : "glass text-slate-300 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-slate-400">
          {filter === "mes-pronos"
            ? "Tu n'as encore fait aucun prono. C'est le moment ! ⚽"
            : "Aucun match dans cette catégorie."}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((m, i) => {
            const pred = predByMatch.get(m.id);
            const locked = m.kickoff <= now;
            const bothTeams = !!m.homeTeam && !!m.awayTeam;
            const finished =
              m.status === MATCH_STATUS.FINISHED &&
              m.homeScore !== null &&
              m.awayScore !== null;
            const home: TeamInfo = {
              name: m.homeTeam?.name ?? "À déterminer",
              code: m.homeTeam?.code ?? null,
            };
            const away: TeamInfo = {
              name: m.awayTeam?.name ?? "À déterminer",
              code: m.awayTeam?.code ?? null,
            };

            return (
              <li key={m.id} className="min-w-0">
                <Reveal delay={Math.min(i * 0.03, 0.3)}>
                  <div
                    className="card-accent glass relative overflow-hidden rounded-2xl p-4"
                    style={
                      bothTeams
                        ? ({ "--accent": teamColor(home.code) } as CSSProperties)
                        : undefined
                    }
                  >
                    {bothTeams && (
                      <>
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-[0.16]"
                          style={{
                            background: `linear-gradient(105deg, ${teamColor(home.code)}, transparent 42%, transparent 58%, ${teamColor(away.code)})`,
                          }}
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                          style={{
                            background: `linear-gradient(90deg, ${teamColor(home.code)}, ${teamColor(away.code)})`,
                          }}
                        />
                      </>
                    )}
                    <div className="relative">
                    <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-slate-400">
                      <span className="justify-self-start truncate rounded-full bg-white/10 px-2.5 py-0.5 font-medium">
                        {STAGE_LABELS[m.stage as Stage] ?? m.stage}
                        {m.groupName ? ` · Groupe ${m.groupName}` : ""}
                      </span>
                      <span className="justify-self-center">
                        {m.status === MATCH_STATUS.LIVE && (
                          <LiveBadge minute={m.liveMinute} />
                        )}
                      </span>
                      <span className="justify-self-end whitespace-nowrap">
                        {formatKickoff(m.kickoff)}
                      </span>
                    </div>

                    {!locked && bothTeams ? (
                      <PredictionForm
                        matchId={m.id}
                        home={home}
                        away={away}
                        initialHome={pred?.homeScore}
                        initialAway={pred?.awayScore}
                      />
                    ) : !bothTeams ? (
                      <TbdMatch />
                    ) : (
                      <LockedMatch
                        home={home}
                        away={away}
                        finished={finished}
                        live={m.status === MATCH_STATUS.LIVE}
                        homeScore={m.homeScore}
                        awayScore={m.awayScore}
                        pred={pred ?? null}
                      />
                    )}

                    <div className="mt-3 border-t border-white/5 pt-2 text-right">
                      <Link
                        href={`/matchs/${m.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/15 hover:text-emerald-200"
                      >
                        👀 Pronos des autres →
                      </Link>
                    </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TbdMatch() {
  return (
    <div className="flex items-center justify-center gap-3 py-1 text-sm text-slate-500">
      <Flag code={null} size={26} />
      <span>Équipes à déterminer</span>
      <Flag code={null} size={26} />
    </div>
  );
}

function LockedMatch({
  home,
  away,
  finished,
  live,
  homeScore,
  awayScore,
  pred,
}: {
  home: TeamInfo;
  away: TeamInfo;
  finished: boolean;
  live: boolean;
  homeScore: number | null;
  awayScore: number | null;
  pred: { homeScore: number; awayScore: number; points: number | null } | null;
}) {
  const gained = pred?.points ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2 text-sm font-semibold sm:gap-3">
        <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span className="truncate">{home.name}</span>
          <Flag code={home.code} size={34} className="shrink-0" />
        </span>
        {live ? (
          <LiveScore
            home={homeScore}
            away={awayScore}
            className="shrink-0 text-base"
          />
        ) : (
          <span className="shrink-0 rounded-lg bg-white/10 px-3 py-1 font-display text-base font-bold">
            {finished ? (
              <ScoreReveal>{`${homeScore} - ${awayScore}`}</ScoreReveal>
            ) : (
              "🔒"
            )}
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Flag code={away.code} size={34} className="shrink-0" />
          <span className="truncate">{away.name}</span>
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {pred
            ? `Ton prono : ${pred.homeScore} - ${pred.awayScore}`
            : "Pas de prono"}
        </span>
        {finished && pred && (
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              gained > 0
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-white/5 text-slate-500"
            }`}
          >
            {gained > 0 ? `+${gained} pts` : "0 pt"}
          </span>
        )}
      </div>
    </div>
  );
}
