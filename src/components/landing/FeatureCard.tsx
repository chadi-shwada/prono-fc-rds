// Rendu serveur + CSS (visible sans JS). rise-in sur le wrapper, survol (lift)
// en CSS sur la carte interne pour ne pas entrer en conflit de transform.
export default function FeatureCard({
  icon,
  title,
  text,
  delay = 0,
}: {
  icon: string;
  title: string;
  text: string;
  delay?: number;
}) {
  return (
    <div className="rise-in h-full" style={{ animationDelay: `${delay}s` }}>
      <div className="card-hover glass h-full rounded-2xl p-5">
        <div className="text-4xl">{icon}</div>
        <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}
