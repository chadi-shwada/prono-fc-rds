/**
 * Infobulle au style de l'app (verre sombre), CSS pur — pas de JS, utilisable
 * dans les Server Components. Remplace les `title=""` natifs du navigateur.
 */
export default function Tooltip({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`group/tip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-xs font-medium text-slate-100 opacity-0 shadow-xl shadow-black/40 backdrop-blur transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100"
      >
        {label}
        {/* petite flèche */}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-white/10 bg-slate-900/95" />
      </span>
    </span>
  );
}
