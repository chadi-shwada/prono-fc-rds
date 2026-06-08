import Flag from "@/components/Flag";
import Avatar from "@/components/Avatar";
import { previewNames } from "@/lib/features";

// Aperçu « produit » — rendu serveur + CSS (visible sans JS). rise-in sur les
// wrappers, inclinaison/redressement au survol en CSS sur la carte interne.
export default function LandingPreview() {
  const [n1, n2, n3] = previewNames();
  const RANKING = [
    { name: n1, pts: 48, medal: "🥇", width: "100%" },
    { name: n2, pts: 41, medal: "🥈", width: "85%" },
    { name: n3, pts: 37, medal: "🥉", width: "77%" },
  ];
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      {/* Carte de prono */}
      <div className="rise-in">
        <div className="glass relative overflow-hidden rounded-2xl p-5 transition-transform duration-300 sm:-rotate-2 sm:hover:rotate-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, #2563eb, #f59e0b)" }}
          />
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium">
              Phase de groupes · Groupe C
            </span>
            <span>Aujourd&apos;hui 21:00</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm font-semibold">
            <span className="flex flex-1 items-center justify-end gap-2 text-right">
              <span className="truncate">France</span>
              <Flag code="FRA" size={32} className="shrink-0" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-lg bg-white/10 px-3 py-1 font-display text-lg font-extrabold">
                2
              </span>
              <span className="text-slate-500">-</span>
              <span className="rounded-lg bg-white/10 px-3 py-1 font-display text-lg font-extrabold">
                1
              </span>
            </span>
            <span className="flex flex-1 items-center gap-2">
              <Flag code="BRA" size={32} className="shrink-0" />
              <span className="truncate">Brésil</span>
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <span className="rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-300">
              ✓ Prono enregistré
            </span>
          </div>
        </div>
      </div>

      {/* Mini-classement */}
      <div className="rise-in" style={{ animationDelay: "0.1s" }}>
        <div className="glass rounded-2xl p-5 transition-transform duration-300 sm:rotate-2 sm:hover:rotate-0">
          <div className="mb-3 font-display text-lg font-bold">Classement</div>
          <ol className="flex flex-col gap-2.5">
            {RANKING.map((r, i) => (
              <li
                key={r.name}
                className={`relative overflow-hidden rounded-xl border px-3 py-2.5 ${
                  i === 0
                    ? "border-amber-300/40 bg-amber-300/[0.07]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/15 to-transparent"
                  style={{ width: r.width }}
                />
                <div className="relative flex items-center gap-2.5">
                  <span className="w-5 text-center text-lg">{r.medal}</span>
                  <Avatar name={r.name} size={28} />
                  <span className="flex-1 font-semibold">{r.name}</span>
                  <span className="scoreboard font-display text-lg font-extrabold text-emerald-400">
                    {r.pts}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
