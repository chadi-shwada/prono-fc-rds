"use client";

import { useEffect, useRef, useState } from "react";
import type { LeaderboardRow } from "@/lib/leaderboard";
import type { DailyAward } from "@/lib/dailyAward";
import { formatDayLabel } from "@/lib/format";
import Reveal from "@/components/Reveal";
import Avatar from "@/components/Avatar";
import LiveLeaderboard from "@/components/LiveLeaderboard";

/**
 * Région dynamique du classement : titre, joueur du jour, sélecteur de journée
 * et tableau. Le filtre par jour se fait ENTIÈREMENT côté client à partir des
 * données déjà calculées au rendu serveur — donc changer de journée est instantané,
 * sans navigation ni re-fetch (`force-dynamic` faisait sinon un aller-retour serveur
 * + un flash du skeleton `loading.tsx` à chaque clic, d'où l'effet « ça frise »).
 *
 * Les puces restent de vrais liens (`href`) pour le partage / l'ouverture dans un
 * nouvel onglet ; on intercepte le clic simple pour basculer sans recharger et on
 * tient l'URL à jour via `history.replaceState`.
 */
export default function ClassementView({
  general,
  byDay,
  days,
  dayLabels,
  initialDay,
  meId,
  playerOfDay,
}: {
  general: LeaderboardRow[];
  byDay: Record<string, LeaderboardRow[]>;
  days: string[];
  dayLabels: Record<string, string>;
  initialDay: string | null;
  meId: string;
  playerOfDay: DailyAward | null;
}) {
  const [activeDay, setActiveDay] = useState<string | null>(initialDay);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = activeDay ? byDay[activeDay] ?? [] : general;
  const subtitle = activeDay
    ? `Points gagnés le ${formatDayLabel(new Date(activeDay)).toLowerCase()}`
    : "Qui sera le meilleur pronostiqueur ? 🏆";

  // Sans navigation, le navigateur (surtout WebKit/iOS) ne recompose pas toujours
  // l'écran après la mise à jour du tableau : le contenu reste figé tant qu'on ne
  // scrolle pas. On force un repaint en promouvant brièvement le conteneur sur sa
  // propre couche (translateZ) le temps d'une frame, à chaque changement de journée.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.transform = "translateZ(0)";
    void el.offsetHeight; // force le recalcul/repaint immédiat avec la couche promue
    const id = requestAnimationFrame(() => {
      if (containerRef.current) containerRef.current.style.transform = "";
    });
    return () => cancelAnimationFrame(id);
  }, [activeDay]);

  const select = (day: string | null) => {
    setActiveDay(day);
    const url = day ? `/classement?jour=${day}` : "/classement";
    // Met l'URL à jour sans déclencher de navigation Next (donc sans aller-retour
    // serveur ni flash) ; un vrai rechargement relira ce paramètre côté serveur.
    window.history.replaceState(null, "", url);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <Reveal>
        <h1 className="font-display text-3xl font-extrabold">Classement</h1>
        <p className="text-slate-400">{subtitle}</p>
      </Reveal>

      {playerOfDay && (
        <Reveal delay={0.03}>
          <section className="glow-gold flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-300/10 to-transparent p-4">
            <span className="float text-3xl leading-none">👑</span>
            <Avatar name={playerOfDay.name} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Joueur du jour
              </div>
              <div className="truncate font-display text-lg font-extrabold capitalize">
                {playerOfDay.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-extrabold text-amber-300">
                +{playerOfDay.points}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">
                {playerOfDay.dayLabel}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {days.length > 0 && (
        <Reveal delay={0.04}>
          <div className="flex flex-wrap gap-2">
            <Chip
              href="/classement"
              active={!activeDay}
              label="Général"
              onSelect={() => select(null)}
            />
            {days.map((d) => (
              <Chip
                key={d}
                href={`/classement?jour=${d}`}
                active={activeDay === d}
                label={dayLabels[d]}
                onSelect={() => select(d)}
              />
            ))}
          </div>
        </Reveal>
      )}

      {rows.length === 0 ? (
        <p className="py-6 text-center text-slate-400">
          Aucun point sur cette journée pour l&apos;instant.
        </p>
      ) : (
        <LiveLeaderboard
          key={activeDay ?? "general"}
          rows={rows}
          meId={meId}
          showDelta={!activeDay}
        />
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  label,
  onSelect,
}: {
  href: string;
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        // Laisse passer ctrl/cmd-clic, clic molette… (ouverture nouvel onglet).
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onSelect();
      }}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-emerald-500 text-emerald-950"
          : "glass text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}
