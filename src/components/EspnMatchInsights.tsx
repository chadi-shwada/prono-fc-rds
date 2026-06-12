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
  kickoff,
}: {
  homeCode: string;
  awayCode: string;
  kickoff: Date;
}) {
  const d = await getEspnMatchDetail(homeCode, awayCode, kickoff);
  if (!d) return null;
  const { timeline, stats, shootout, predictor } = d;
  if (timeline.length === 0 && stats.length === 0 && !shootout && !predictor)
    return null;

  const icon = { goal: "⚽", yellow: "🟨", red: "🟥", sub: "🔄" } as const;
  const eventLabel = (e: (typeof timeline)[number]) => {
    if (e.kind === "sub") return e.sub ? `${e.text} ↔ ${e.sub}` : e.text;
    return e.sub ? `${e.text} (${e.sub})` : e.text;
  };

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

      {/* Pronostic des cotes : proba implicite de chaque issue (dom. / nul / ext.) */}
      {predictor && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pronostic des cotes 🔮
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            {predictor.home > 0 && (
              <div
                style={{
                  width: `${predictor.home}%`,
                  background: teamColor(homeCode),
                }}
              />
            )}
            {predictor.draw > 0 && (
              <div className="bg-slate-500" style={{ width: `${predictor.draw}%` }} />
            )}
            {predictor.away > 0 && (
              <div
                style={{
                  width: `${predictor.away}%`,
                  background: teamColor(awayCode),
                }}
              />
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: teamColor(homeCode) }}
              />
              <span className="font-bold text-white">{predictor.home}%</span>
            </span>
            <span className="shrink-0 text-slate-400">Nul {predictor.draw}%</span>
            <span className="flex items-center justify-end gap-1.5">
              <span className="font-bold text-white">{predictor.away}%</span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: teamColor(awayCode) }}
              />
            </span>
          </div>
        </div>
      )}

      {/* Fil du match : buts, cartons, remplacements (dom. à gauche, ext. à droite) */}
      {timeline.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Fil du match
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {timeline.map((e, i) => {
              const isHome =
                (e.teamCode ?? "").toUpperCase() === homeCode.toUpperCase();
              const label = eventLabel(e);
              const muted = e.kind === "sub";
              const emoji = (
                <span className="shrink-0 text-xs leading-none" aria-hidden>
                  {icon[e.kind]}
                </span>
              );
              const min = (
                <span className="shrink-0 font-display font-bold tabular-nums text-emerald-300">
                  {e.minute ?? ""}
                </span>
              );
              return (
                <li key={i} className="flex items-center gap-2">
                  {/* Moitié domicile */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isHome && (
                      <>
                        {min}
                        {emoji}
                        <span
                          className={`min-w-0 truncate ${muted ? "text-slate-400" : "text-slate-200"}`}
                        >
                          {label}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Moitié extérieur */}
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    {!isHome && (
                      <>
                        <span
                          className={`min-w-0 truncate text-right ${muted ? "text-slate-400" : "text-slate-200"}`}
                        >
                          {label}
                        </span>
                        {emoji}
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
