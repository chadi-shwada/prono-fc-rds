// Rendu serveur + CSS (visible sans JS). rise-in sur le wrapper, survol (lift)
// en CSS sur la carte interne pour ne pas entrer en conflit de transform.
export default function FeatureCard({
  icon,
  title,
  text,
  step,
  delay = 0,
}: {
  icon: string;
  title: string;
  text: string;
  /** Numéro d'étape affiché en filigrane (ex. "01"). */
  step?: string;
  delay?: number;
}) {
  return (
    <div className="rise-in h-full" style={{ animationDelay: `${delay}s` }}>
      <div className="card-hover glass relative h-full overflow-hidden rounded-2xl p-5">
        {step && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 right-2 font-display text-6xl font-extrabold leading-none text-white/[0.06]"
          >
            {step}
          </span>
        )}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-400/5 text-2xl ring-1 ring-emerald-400/20">
          {icon}
        </div>
        <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}
