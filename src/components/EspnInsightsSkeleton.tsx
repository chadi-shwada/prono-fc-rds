/** Placeholder pendant le chargement des détails ESPN (buteurs / stats). */
export default function EspnInsightsSkeleton() {
  return (
    <div className="glass animate-pulse rounded-2xl p-4">
      <div className="mb-3 h-3 w-20 rounded bg-white/10" />
      <div className="flex flex-col gap-2.5">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
        <div className="h-3 w-2/3 rounded bg-white/10" />
      </div>
    </div>
  );
}
