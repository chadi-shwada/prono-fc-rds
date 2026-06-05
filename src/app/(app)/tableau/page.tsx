import { prisma } from "@/lib/prisma";
import { LEFT_R32, RIGHT_R32, type Slot } from "@/lib/bracket";
import { STAGES } from "@/lib/constants";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

const dateRange = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

const ROUND_INFO: { stage: string; label: string }[] = [
  { stage: STAGES.R32, label: "Seizièmes" },
  { stage: STAGES.R16, label: "Huitièmes" },
  { stage: STAGES.QF, label: "Quarts" },
  { stage: STAGES.SF, label: "Demies" },
  { stage: STAGES.FINAL, label: "Finale" },
];

export default async function TableauPage() {
  const knockout = await prisma.match.findMany({
    where: { stage: { not: STAGES.GROUP } },
    select: { stage: true, kickoff: true },
    orderBy: { kickoff: "asc" },
  });

  // Plage de dates par tour
  const ranges = new Map<string, { min: Date; max: Date }>();
  for (const m of knockout) {
    const r = ranges.get(m.stage);
    if (!r) ranges.set(m.stage, { min: m.kickoff, max: m.kickoff });
    else if (m.kickoff > r.max) r.max = m.kickoff;
  }

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Tableau final</h1>
        <p className="text-slate-400">
          Le parcours vers le titre 🏆 — les seizièmes une fois la phase de groupes
          terminée.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap gap-2 text-xs">
          {ROUND_INFO.map((r) => {
            const range = ranges.get(r.stage);
            return (
              <span
                key={r.stage}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
              >
                <span className="font-semibold text-emerald-300">{r.label}</span>
                {range && (
                  <span className="ml-1.5 text-slate-400">
                    {dateRange.format(range.min)}
                    {range.min.getTime() !== range.max.getTime() &&
                      ` – ${dateRange.format(range.max)}`}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="overflow-x-auto pb-3">
          <div className="mx-auto flex h-[620px] w-full min-w-[840px] max-w-[1180px] items-stretch justify-between gap-2">
            {/* Demi-tableau gauche */}
            <Column label="Seizièmes" minWidth={112}>
              {LEFT_R32.map((s, i) => (
                <Affiche key={i} slot={s} />
              ))}
            </Column>
            <Column label="Huitièmes">{empties(4)}</Column>
            <Column label="Quarts">{empties(2)}</Column>
            <Column label="Demies">{empties(1)}</Column>

            {/* Centre */}
            <div className="flex min-w-[120px] flex-col items-center justify-center gap-3">
              <div className="float text-6xl drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                🏆
              </div>
              <div className="text-center font-display text-sm font-extrabold uppercase tracking-wide text-amber-300">
                Champion
                <br />
                du monde
              </div>
              <div className="h-12 w-full rounded-lg border-2 border-amber-400/40 bg-amber-400/5" />
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                Finale · 19 juil.
              </div>
            </div>

            {/* Demi-tableau droit */}
            <Column label="Demies">{empties(1)}</Column>
            <Column label="Quarts">{empties(2)}</Column>
            <Column label="Huitièmes">{empties(4)}</Column>
            <Column label="Seizièmes" minWidth={112}>
              {RIGHT_R32.map((s, i) => (
                <Affiche key={i} slot={s} />
              ))}
            </Column>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="text-center text-xs text-slate-500">
          1E = 1er du groupe E · 2A = 2e du groupe A · 3 A/B/… = un des meilleurs 3es
        </p>
      </Reveal>
    </div>
  );
}

function empties(n: number) {
  return Array.from({ length: n }, (_, i) => (
    <div
      key={i}
      className="h-10 w-full rounded-lg border border-dashed border-white/10 bg-white/[0.03]"
    />
  ));
}

function Column({
  label,
  minWidth = 72,
  children,
}: {
  label: string;
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col" style={{ minWidth }}>
      <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="flex flex-1 flex-col justify-around gap-2">{children}</div>
    </div>
  );
}

function Affiche({ slot }: { slot: Slot }) {
  return (
    <div className="glass overflow-hidden rounded-lg text-center text-[11px] font-bold text-white shadow-md">
      <div className="px-2 py-1.5">{slot.a}</div>
      <div className="h-px bg-white/10" />
      <div className="bg-white/[0.03] px-2 py-1.5 text-slate-300">{slot.b}</div>
    </div>
  );
}
