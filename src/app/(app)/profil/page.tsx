import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userTotalPoints } from "@/lib/scoring";
import { getLeaderboard } from "@/lib/leaderboard";
import { MATCH_STATUS } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import AnimatedNumber from "@/components/AnimatedNumber";
import Flag from "@/components/Flag";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = (await getCurrentUser())!;

  const [points, leaderboard, predictions, champion] = await Promise.all([
    userTotalPoints(user.id),
    getLeaderboard(),
    prisma.prediction.findMany({
      where: { userId: user.id },
      include: { match: true },
    }),
    prisma.championPrediction.findUnique({
      where: { userId: user.id },
      include: { team: true },
    }),
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Reveal>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 font-display text-2xl font-extrabold text-emerald-950">
            {user.name.charAt(0).toUpperCase()}
          </div>
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

      <Reveal delay={0.06}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Points" value={<AnimatedNumber value={points} />} />
          <Stat label="Pronos" value={<AnimatedNumber value={predictions.length} />} />
          <Stat label="Scores exacts" value={<AnimatedNumber value={exact} />} />
          <Stat label="Réussite" value={`${accuracy}%`} />
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Détails</h2>
          <dl className="flex flex-col divide-y divide-white/5 text-sm">
            <Line label="Bons résultats" value={`${correct} / ${finished.length}`} />
            <Line label="Scores exacts trouvés" value={`${exact}`} />
            <Line
              label="Matchs pronostiqués"
              value={`${predictions.length}`}
            />
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
        <Reveal delay={0.18}>
          <p className="text-center text-sm text-slate-500">
            Tes statistiques se rempliront au fil des matchs joués. 📈
          </p>
        </Reveal>
      )}
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
