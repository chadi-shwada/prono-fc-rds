import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userTotalPoints } from "@/lib/scoring";
import { getLeaderboard } from "@/lib/leaderboard";
import { getPlayerOfTheDay } from "@/lib/dailyAward";
import { computeBadges, bestStreak } from "@/lib/badges";
import { MATCH_STATUS } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import AnimatedNumber from "@/components/AnimatedNumber";
import Flag from "@/components/Flag";
import Avatar from "@/components/Avatar";
import Badges from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = (await getCurrentUser())!;

  const [points, leaderboard, predictions, champion, playerOfDay] =
    await Promise.all([
      userTotalPoints(user.id),
      getLeaderboard(),
      prisma.prediction.findMany({
        where: { userId: user.id },
        include: { match: { include: { homeTeam: true, awayTeam: true } } },
      }),
      prisma.championPrediction.findUnique({
        where: { userId: user.id },
        include: { team: true },
      }),
      getPlayerOfTheDay(),
    ]);

  const rank = leaderboard.findIndex((r) => r.userId === user.id) + 1;
  const total = leaderboard.length;

  const finished = predictions.filter(
    (p) =>
      p.match.status === MATCH_STATUS.FINISHED &&
      p.match.homeScore !== null &&
      p.match.awayScore !== null,
  );
  const exact = finished.filter(
    (p) =>
      p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore,
  ).length;
  const correct = finished.filter(
    (p) =>
      Math.sign(p.homeScore - p.awayScore) ===
      Math.sign(p.match.homeScore! - p.match.awayScore!),
  ).length;
  const accuracy = finished.length
    ? Math.round((correct / finished.length) * 100)
    : 0;

  // Répartition : exacts / bons résultats (sans exact) / ratés
  const goodOnly = correct - exact;
  const missed = finished.length - correct;

  // Meilleur prono : le pronostic terminé qui a rapporté le plus de points
  const best = finished
    .filter((p) => (p.points ?? 0) > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0];

  // Badges (hauts faits)
  const orderedCorrect = [...finished]
    .sort((a, b) => a.match.kickoff.getTime() - b.match.kickoff.getTime())
    .map((pr) => ({
      correct:
        Math.sign(pr.homeScore - pr.awayScore) ===
        Math.sign(pr.match.homeScore! - pr.match.awayScore!),
    }));
  const badges = computeBadges({
    points,
    exact,
    correct,
    finished: finished.length,
    bestStreak: bestStreak(orderedCorrect),
    rank,
    isPlayerOfDay: playerOfDay?.userId === user.id,
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Reveal>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size={64} className="text-2xl" />
          <div>
            <h1 className="font-display text-3xl font-extrabold capitalize">
              {user.name}
            </h1>
            <p className="text-slate-400">
              {rank > 0 ? `${rank}ᵉ sur ${total}` : "—"} au classement
            </p>
          </div>
        </div>
      </Reveal>

      {badges.length > 0 && (
        <Reveal delay={0.04}>
          <section>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
              🏅 Mes badges
            </h2>
            <Badges badges={badges} />
          </section>
        </Reveal>
      )}

      <Reveal delay={0.06}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Points" value={<AnimatedNumber value={points} />} />
          <Stat label="Pronos" value={<AnimatedNumber value={predictions.length} />} />
          <Stat label="Scores exacts" value={<AnimatedNumber value={exact} />} />
          <Stat label="Réussite" value={`${accuracy}%`} />
        </div>
      </Reveal>

      {/* Répartition visuelle des pronos terminés */}
      {finished.length > 0 && (
        <Reveal delay={0.1}>
          <section className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Répartition</h2>
              <span className="text-xs text-slate-400">
                {finished.length} match{finished.length > 1 ? "s" : ""} joué
                {finished.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
              <Seg count={exact} total={finished.length} className="bg-emerald-400" />
              <Seg count={goodOnly} total={finished.length} className="bg-teal-500" />
              <Seg count={missed} total={finished.length} className="bg-slate-600" />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              <Legend color="bg-emerald-400" label="Score exact" value={exact} />
              <Legend color="bg-teal-500" label="Bon résultat" value={goodOnly} />
              <Legend color="bg-slate-600" label="Raté" value={missed} />
            </div>
          </section>
        </Reveal>
      )}

      {/* Meilleur prono */}
      {best && (
        <Reveal delay={0.14}>
          <section className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-transparent p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-amber-300">
              🌟 Ton meilleur prono
            </h2>
            <div className="flex items-center justify-center gap-3 text-sm font-semibold">
              <span className="flex flex-1 items-center justify-end gap-2 text-right">
                <span className="truncate">{best.match.homeTeam?.name}</span>
                <Flag code={best.match.homeTeam?.code} size={26} className="shrink-0" />
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1 font-display font-bold">
                {best.match.homeScore} - {best.match.awayScore}
              </span>
              <span className="flex flex-1 items-center gap-2">
                <Flag code={best.match.awayTeam?.code} size={26} className="shrink-0" />
                <span className="truncate">{best.match.awayTeam?.name}</span>
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>
                Ton prono : {best.homeScore} - {best.awayScore}
              </span>
              <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 font-semibold text-amber-300">
                +{best.points} pts
              </span>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.18}>
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Détails</h2>
          <dl className="flex flex-col divide-y divide-white/5 text-sm">
            <Line label="Bons résultats" value={`${correct} / ${finished.length}`} />
            <Line label="Scores exacts trouvés" value={`${exact}`} />
            <Line label="Matchs pronostiqués" value={`${predictions.length}`} />
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-400">Mon champion</dt>
              <dd className="flex items-center gap-2 font-medium">
                {champion ? (
                  <>
                    <Flag code={champion.team.code} size={22} />
                    {champion.team.name}
                  </>
                ) : (
                  <span className="text-slate-500">Non choisi</span>
                )}
              </dd>
            </div>
          </dl>
        </section>
      </Reveal>

      {finished.length === 0 && (
        <Reveal delay={0.22}>
          <p className="text-center text-sm text-slate-500">
            Tes statistiques se rempliront au fil des matchs joués. 📈
          </p>
        </Reveal>
      )}
    </div>
  );
}

function Seg({
  count,
  total,
  className,
}: {
  count: number;
  total: number;
  className: string;
}) {
  if (count <= 0) return null;
  return (
    <div
      className={`${className} transition-all`}
      style={{ width: `${(count / total) * 100}%` }}
    />
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
      <span className="font-semibold text-white">{value}</span>
    </span>
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
      <div className="font-display text-2xl font-extrabold text-emerald-400">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
