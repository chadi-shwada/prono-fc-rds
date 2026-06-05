import Reveal from "@/components/Reveal";
import HostMap from "@/components/HostMap";
import Flag from "@/components/Flag";
import { prisma } from "@/lib/prisma";
import { HOST_CITIES } from "@/lib/hostCities";
import { formatDateShort, formatTime } from "@/lib/format";
import { STAGE_LABELS, STAGES, type Stage } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CartePage() {
  const totalMatches = HOST_CITIES.reduce((s, c) => s + c.matches, 0);
  const cities = [...HOST_CITIES].sort(
    (a, b) => b.matches - a.matches || a.city.localeCompare(b.city),
  );

  const matches = await prisma.match.findMany({
    where: { venueCity: { not: null } },
    orderBy: { kickoff: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  const byCity = new Map<string, typeof matches>();
  for (const m of matches) {
    const arr = byCity.get(m.venueCity!) ?? [];
    arr.push(m);
    byCity.set(m.venueCity!, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Villes hôtes</h1>
        <p className="text-slate-400">
          16 villes, 3 pays. Survole une ville (ou clique pour voir ses matchs) 🗺️
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid grid-cols-3 gap-3">
          <Mini label="Villes" value="16" />
          <Mini label="Pays" value="3" />
          <Mini label="Matchs" value={String(totalMatches)} />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <HostMap />
      </Reveal>

      <Reveal delay={0.15}>
        <p className="text-center text-xs text-slate-500">
          🇺🇸 États-Unis (11 villes) · 🇨🇦 Canada (2) · 🇲🇽 Mexique (3)
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <h2 className="font-display text-xl font-bold">Les stades & leurs matchs</h2>
        <p className="text-sm text-slate-400">
          Clique sur une ville de la carte pour venir directement sur sa fiche.
        </p>
      </Reveal>

      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {cities.map((c, i) => (
          <Reveal
            key={c.id}
            delay={Math.min(i * 0.03, 0.3)}
            y={12}
            className="mb-3 break-inside-avoid"
          >
            <div
              id={`city-${c.id}`}
              className="card-hover glass scroll-mt-24 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <Flag code={c.countryCode} size={34} />
                <div className="flex-1">
                  <div className="font-display font-bold leading-tight">{c.city}</div>
                  <div className="text-xs text-slate-400">
                    🏟️ {c.stadium} · {c.country}
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-400/15 px-2.5 py-1 text-center font-display text-sm font-extrabold text-emerald-300">
                  {c.matches}
                  <span className="block text-[9px] font-medium text-emerald-400/80">
                    matchs
                  </span>
                </span>
              </div>

              {c.note && (
                <div className="mt-2 rounded-md bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-200">
                  {c.note}
                </div>
              )}

              <ul className="mt-3 flex flex-col divide-y divide-white/5 border-t border-white/5">
                {(byCity.get(c.id) ?? []).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 py-1.5 text-xs"
                  >
                    <span className="w-[5.25rem] shrink-0 leading-tight text-slate-400">
                      <span className="block">{formatDateShort(m.kickoff)}</span>
                      <span className="block font-medium text-slate-300">
                        {formatTime(m.kickoff)}
                      </span>
                    </span>
                    {m.stage === STAGES.GROUP ? (
                      <span className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Flag code={m.homeTeam?.code} size={18} className="shrink-0" />
                          <span className="truncate">{m.homeTeam?.name}</span>
                        </span>
                        <span className="shrink-0 text-slate-600">·</span>
                        <span className="flex min-w-0 items-center justify-end gap-1.5 text-right">
                          <span className="truncate">{m.awayTeam?.name}</span>
                          <Flag code={m.awayTeam?.code} size={18} className="shrink-0" />
                        </span>
                      </span>
                    ) : (
                      <span className="flex-1 text-center font-medium text-amber-200/90">
                        {STAGE_LABELS[m.stage as Stage] ?? m.stage}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="font-display text-2xl font-extrabold text-emerald-400">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
