"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Flag from "@/components/Flag";

export type TeamOption = { id: string; name: string; code: string | null };

type Props = {
  teams: TeamOption[];
  value: string;
  onChange: (id: string) => void;
};

/** Dropdown personnalisé avec drapeaux + recherche (remplace le select natif). */
export default function ChampionSelect({ teams, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, query]);

  // Fermeture au clic extérieur + touche Échap
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-white/20"
      >
        {selected ? (
          <>
            <Flag code={selected.code} size={30} />
            <span className="flex-1 font-semibold text-white">{selected.name}</span>
          </>
        ) : (
          <>
            <span className="flex h-[22px] w-[30px] items-center justify-center rounded bg-white/10 text-xs">
              🏆
            </span>
            <span className="flex-1 text-slate-400">Choisis ton champion…</span>
          </>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-slate-400"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50"
          >
            <div className="border-b border-white/10 p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un pays…"
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto p-1">
              {filtered.length === 0 && (
                <li className="px-3 py-3 text-center text-sm text-slate-500">
                  Aucun pays trouvé
                </li>
              )}
              {filtered.map((t) => {
                const active = t.id === value;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(t.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-amber-400/20 text-amber-200"
                          : "text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <Flag code={t.code} size={26} />
                      <span className="flex-1 font-medium">{t.name}</span>
                      {active && <span className="text-amber-300">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
