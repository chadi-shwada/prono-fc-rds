import Reveal from "@/components/Reveal";
import { SCORING } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function ReglesPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Comment ça marche</h1>
        <p className="text-slate-400">Les règles du jeu, en 30 secondes ⚽</p>
      </Reveal>

      <Reveal delay={0.05}>
        <Section title="🎯 Le principe">
          <p>
            Avant chaque match, tu pronostiques le <strong>score exact</strong>.
            Plus tu es précis, plus tu marques de points. À la fin du tournoi, le
            meilleur pronostiqueur gagne !
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.1}>
        <Section title="🏅 Le barème">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2 font-medium">Ton prono…</th>
                <th className="pb-2 text-center font-medium">Groupes</th>
                <th className="pb-2 text-center font-medium">Phases finales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <Row
                label="🎯 Score exact"
                group={SCORING.EXACT}
                ko={SCORING.EXACT * SCORING.KNOCKOUT_MULTIPLIER}
              />
              <Row
                label="✅ Bon résultat + bon écart de buts"
                group={SCORING.DIFF}
                ko={SCORING.DIFF * SCORING.KNOCKOUT_MULTIPLIER}
              />
              <Row
                label="✅ Bon résultat (vainqueur ou nul)"
                group={SCORING.RESULT}
                ko={SCORING.RESULT * SCORING.KNOCKOUT_MULTIPLIER}
              />
              <Row label="❌ Mauvais résultat" group={0} ko={0} />
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Les matchs à élimination directe comptent <strong>double</strong> (×
            {SCORING.KNOCKOUT_MULTIPLIER}) — ils sont plus décisifs !
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.15}>
        <Section title="🏆 Le bonus vainqueur">
          <p>
            Avant le coup d&apos;envoi du tournoi, choisis l&apos;équipe que tu vois
            championne du monde. Si tu as raison&nbsp;:{" "}
            <strong className="text-amber-300">+{SCORING.CHAMPION_BONUS} points</strong>{" "}
            🎉
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.2}>
        <Section title="🔒 Le verrouillage">
          <p>
            Chaque prono est modifiable jusqu&apos;au <strong>coup d&apos;envoi</strong>{" "}
            du match. Après, c&apos;est verrouillé — et tu peux voir les pronos de tout
            le monde. Pas de triche, chacun parie en aveugle !
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.25}>
        <Section title="🔑 La connexion">
          <p>
            Pas de mot de passe : tu te connectes avec ton <strong>pseudo</strong> et
            le <strong>code d&apos;invitation</strong> partagé par l&apos;organisateur.
            Ton compte se crée tout seul la première fois.
          </p>
        </Section>
      </Reveal>

      {/* Indice (énigme) vers l'easter egg : taper « senegal » au clavier 🦁 */}
      <Reveal delay={0.3}>
        <p className="select-none text-center text-xs italic leading-relaxed text-slate-600">
          🦁 On raconte qu&apos;un lion sommeille quelque part dans ces pages…
          <br />
          pour le réveiller, tape son royaume au clavier.
        </p>
      </Reveal>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-2 font-display text-lg font-bold">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

function Row({
  label,
  group,
  ko,
}: {
  label: string;
  group: number;
  ko: number;
}) {
  return (
    <tr>
      <td className="py-2">{label}</td>
      <td className="py-2 text-center font-display font-bold text-emerald-400">
        {group}
      </td>
      <td className="py-2 text-center font-display font-bold text-emerald-400">
        {ko}
      </td>
    </tr>
  );
}
