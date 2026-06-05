import Tooltip from "@/components/Tooltip";
import type { Badge } from "@/lib/badges";

/** Rangée de badges (hauts faits), chacun avec une infobulle explicative. */
export default function Badges({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <Tooltip key={b.key} label={b.desc}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10">
            <span className="text-base leading-none">{b.emoji}</span>
            {b.label}
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
