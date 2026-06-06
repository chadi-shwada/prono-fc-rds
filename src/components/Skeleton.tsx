/** Bloc de chargement (placeholder animé). Purement décoratif. */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-xl ${className}`} />;
}
