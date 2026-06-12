/**
 * Pastille « En direct » (matchs en cours). `clock` (ex: "90+4", temps
 * additionnel inclus) est prioritaire ; `minute` (entier) sert de repli.
 */
export default function LiveBadge({
  minute,
  clock,
}: {
  minute?: number | null;
  clock?: string | null;
}) {
  const label = clock ?? (minute != null ? String(minute) : null);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
      </span>
      En direct
      {label != null && (
        <span className="font-display tabular-nums text-red-200">{`· ${label}'`}</span>
      )}
    </span>
  );
}
