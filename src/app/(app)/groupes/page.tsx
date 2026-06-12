import { prisma } from "@/lib/prisma";
import { MATCH_STATUS } from "@/lib/constants";
import {
  computeGroupStandings,
  rankThirdPlaced,
  BEST_THIRDS_QUALIFY,
  type StandingRow,
  type ThirdPlaceRow,
} from "@/lib/standings";
import { teamColor } from "@/lib/teamColor";
import Reveal from "@/components/Reveal";
import Flag from "@/components/Flag";
import LiveRefresher from "@/components/LiveRefresher";

export const dynamic = "force-dynamic";

export default async function GroupesPage() {
  const matches = await prisma.match.findMany({
    where: { stage: "GROUP" },
    orderBy: { kickoff: "asc" },
    include: {
      homeTeam: { select: { id: true, name: true, code: true } },
      awayTeam: { select: { id: true, name: true, code: true } },
    },
  });
  const hasLive = matches.some((m) => m.status === MATCH_STATUS.LIVE);
  const standings = computeGroupStandings(matches);
  const thirds = rankThirdPlaced(standings);
  // Le classement des 3es n'a de sens qu'une fois des matchs joués.
  const showThirds = thirds.some((r) => r.played > 0);

  return (
    <div className="flex flex-col gap-6">
      {hasLive && <LiveRefresher />}
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Groupes</h1>
        <p className="text-slate-400">
          Le classement des 12 groupes, mis à jour à chaque résultat 📊
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Qualifié
            (1ᵉʳ-2ᵉ)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 3ᵉ — selon
            les meilleurs
          </span>
        </div>
      </Reveal>

      {standings.length === 0 ? (
        <p className="text-slate-400">
          Les groupes s&apos;afficheront dès que le tirage sera connu.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {standings.map((g, gi) => (
            <Reveal key={g.group} delay={Math.min(gi * 0.03, 0.3)} y={12}>
              <GroupCard group={g.group} rows={g.rows} />
            </Reveal>
          ))}
        </div>
      )}

      {showThirds && (
        <Reveal delay={0.1} y={12}>
          <ThirdsCard rows={thirds} />
        </Reveal>
      )}
    </div>
  );
}

function ThirdsCard({ rows }: { rows: ThirdPlaceRow[] }) {
  return (
    <section className="glass overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 px-4 py-2.5">
        <h2 className="font-display text-sm font-bold text-emerald-300">
          Classement des 3es
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Les {BEST_THIRDS_QUALIFY} meilleurs troisièmes se qualifient pour les
          16es.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-500">
            <th className="w-6 py-1.5 pl-3 text-left font-medium">#</th>
            <th className="py-1.5 text-left font-medium">Équipe</th>
            <th className="w-10 py-1.5 text-center font-medium" title="Groupe">
              Grp
            </th>
            <th className="w-7 py-1.5 text-center font-medium" title="Joués">
              J
            </th>
            <th
              className="w-9 py-1.5 text-center font-medium"
              title="Différence de buts"
            >
              Diff
            </th>
            <th className="w-8 py-1.5 pr-3 text-center font-bold" title="Points">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const qualifies = i < BEST_THIRDS_QUALIFY;
            return (
              <tr
                key={r.teamId}
                className={`border-t border-white/5 first:border-t-0 ${
                  qualifies ? "" : "opacity-55"
                }`}
              >
                <td className="py-2 pl-3 tabular-nums text-slate-400">{i + 1}</td>
                <td className="py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                        qualifies ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                      aria-hidden
                    />
                    <Flag code={r.code} size={20} className="shrink-0" />
                    <span className="truncate font-medium">{r.name}</span>
                  </span>
                </td>
                <td className="py-2 text-center font-mono text-xs text-slate-400">
                  {r.group}
                </td>
                <td className="py-2 text-center tabular-nums text-slate-400">
                  {r.played}
                </td>
                <td className="py-2 text-center tabular-nums text-slate-300">
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </td>
                <td className="py-2 pr-3 text-center font-display font-bold tabular-nums text-white">
                  {r.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function GroupCard({ group, rows }: { group: string; rows: StandingRow[] }) {
  return (
    <section className="glass overflow-hidden rounded-2xl">
      <h2 className="border-b border-white/10 px-4 py-2.5 font-display text-sm font-bold text-emerald-300">
        Groupe {group}
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-500">
            <th className="w-6 py-1.5 pl-3 text-left font-medium">#</th>
            <th className="py-1.5 text-left font-medium">Équipe</th>
            <th className="w-7 py-1.5 text-center font-medium" title="Joués">
              J
            </th>
            <th
              className="w-9 py-1.5 text-center font-medium"
              title="Différence de buts"
            >
              Diff
            </th>
            <th className="w-8 py-1.5 pr-3 text-center font-bold" title="Points">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pos = i + 1;
            const dotColor =
              pos <= 2 ? "bg-emerald-400" : pos === 3 ? "bg-amber-400" : "bg-slate-600";
            return (
              <tr
                key={r.teamId}
                className="border-t border-white/5 first:border-t-0"
              >
                <td className="py-2 pl-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
                    aria-hidden
                  />
                </td>
                <td className="py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Flag code={r.code} size={20} className="shrink-0" />
                    <span
                      className="truncate font-medium"
                      style={{
                        textDecorationColor: r.code
                          ? teamColor(r.code)
                          : undefined,
                      }}
                    >
                      {r.name}
                    </span>
                  </span>
                </td>
                <td className="py-2 text-center tabular-nums text-slate-400">
                  {r.played}
                </td>
                <td className="py-2 text-center tabular-nums text-slate-300">
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </td>
                <td className="py-2 pr-3 text-center font-display font-bold tabular-nums text-white">
                  {r.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
