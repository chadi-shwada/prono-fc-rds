/** Score en direct d'un match en cours (rouge, mis à jour à chaque synchro). */
export default function LiveScore({
  home,
  away,
  className = "",
}: {
  home: number | null;
  away: number | null;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1 font-display font-bold tabular-nums text-red-200 ${className}`}
    >
      {home ?? 0}
      <span className="text-red-400/60">-</span>
      {away ?? 0}
    </span>
  );
}
