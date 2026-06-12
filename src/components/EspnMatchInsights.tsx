import { getEspnMatchDetail } from "@/lib/espn-summary";
import { teamColor } from "@/lib/teamColor";

/** Largeur de barre proportionnelle si les deux valeurs sont numériques. */
function barWidths(home: string, away: string): [number, number] | null {
  const h = parseFloat(home);
  const a = parseFloat(away);
  if (!Number.isFinite(h) || !Number.isFinite(a) || h + a <= 0) return null;
  const total = h + a;
  return [(h / total) * 100, (a / total) * 100];
}

/**
 * Détails live d'un match via ESPN (buteurs, stats, T.A.B.). Composant serveur
 * asynchrone : à envelopper dans <Suspense> pour streamer sans bloquer la page.
 * Ne rend rien si ESPN n'a pas (ou plus) le match, ou si aucune donnée exploitable.
 */
export default async function EspnMatchInsights({
  homeCode,
  awayCode,
}: {
  homeCode: string;
  awayCode: string;
}) {
  const d = await getEspnMatchDetail(homeCode, awayCode);
  if (!d) return null;
  const { goals, stats, shootout } = d;
  if (goals.length === 0 && stats.length === 0 && !shootout) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Tirs au but (phase finale) */}
      {shootout && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tirs au but
          </div>
          <div className="font-display text-xl font-extrabold text-white">
            {shootout.home} <span className="text-slate-500">-</span>{" "}
            {shootout.away}
          </div>
        </div>
      )}

      {/* Buteurs : chaque but du côté de l'équipe qui l'a marqué (dom. à gauche) */}
      {goals.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Buts ⚽
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {goals.map((g, i) => {
              const isHome =
                (g.teamCode ?? "").toUpperCase() === homeCode.toUpperCase();
              const label = `${g.scorer}${g.note ? ` (${g.note})` : ""}`;
              const dot = (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: g.teamCode
                      ? teamColor(g.teamCode)
                      : "rgb(148 163 184)",
                  }}
                />
              );
              const min = (
                <span className="shrink-0 font-display font-bold tabular-nums text-emerald-300">
                  {g.minute ?? ""}
                </span>
              );
              return (
                <li key={i} className="flex items-center gap-2">
                  {/* Moitié domicile */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isHome && (
                      <>
                        {min}
                        {dot}
                        <span className="min-w-0 truncate text-slate-200">
                          {label}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Moitié extérieur */}
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    {!isHome && (
                      <>
                        <span className="min-w-0 truncate text-right text-slate-200">
                          {label}
                        </span>
                        {dot}
                        {min}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Statistiques */}
      {stats.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Statistiques
          </div>
          <div className="flex flex-col gap-3">
            {stats.map((s) => {
              const widths = barWidths(s.home, s.away);
              return (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold tabular-nums text-white">
                      {s.home}
                    </span>
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-bold tabular-nums text-white">
                      {s.away}
                    </span>
                  </div>
                  {widths && (
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        style={{
                          width: `${widths[0]}%`,
                          background: teamColor(homeCode),
                        }}
                      />
                      <div
                        style={{
                          width: `${widths[1]}%`,
                          background: teamColor(awayCode),
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
