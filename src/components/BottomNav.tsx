"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { logoutAction } from "@/app/actions/auth";

// Onglets principaux (mobile). Le reste passe par l'onglet « Plus ».
const TABS = [
  { href: "/dashboard", label: "Accueil", icon: "🏠" },
  { href: "/matchs", label: "Matchs", icon: "⚽" },
  { href: "/classement", label: "Classement", icon: "🏆" },
  { href: "/profil", label: "Profil", icon: "👤" },
] as const;

// Destinations secondaires, regroupées dans la feuille « Plus ».
const MORE_LINKS = [
  { href: "/groupes", label: "Groupes", icon: "📊" },
  { href: "/calendrier", label: "Calendrier", icon: "📅" },
  { href: "/carte", label: "Carte", icon: "🗺️" },
  { href: "/tableau", label: "Tableau", icon: "📋" },
  { href: "/regles", label: "Règles", icon: "📖" },
] as const;

export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const moreLinks = isAdmin
    ? [...MORE_LINKS, { href: "/admin", label: "Admin", icon: "⚙️" }]
    : MORE_LINKS;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = moreLinks.some((l) => isActive(l.href));

  return (
    <>
      {/* Feuille « Plus » : destinations secondaires + déconnexion */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              role="menu"
              className="fixed inset-x-3 z-50 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl shadow-black/60 md:hidden"
              style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-slate-200">
                  Plus
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {moreLinks.map((l) => {
                  const active = isActive(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                        active
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        {l.icon}
                      </span>
                      {l.label}
                    </Link>
                  );
                })}
              </div>
              <form action={logoutAction} className="mt-3">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/30"
                >
                  Déconnexion
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-3 z-50 rounded-2xl border border-white/10 bg-slate-950/95 shadow-lg shadow-black/50 md:hidden"
        style={{ bottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch">
          {TABS.map((t) => {
            const active = isActive(t.href);
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
                >
                  {active && (
                    <motion.span
                      layoutId="bottomnav-pill"
                      className="absolute inset-x-2 inset-y-1 rounded-xl bg-emerald-500/15"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span
                    className={`relative z-10 text-lg leading-none transition-transform ${
                      active ? "scale-110" : ""
                    }`}
                    aria-hidden
                  >
                    {t.icon}
                  </span>
                  <span
                    className={`relative z-10 whitespace-nowrap ${
                      active ? "text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    {t.label}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Onglet « Plus » : ouvre la feuille des autres destinations */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label="Plus de menus"
              className="relative flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
            >
              <span
                className={`absolute inset-x-2 inset-y-1 rounded-xl transition-colors ${
                  moreActive || open ? "bg-emerald-500/15" : ""
                }`}
                aria-hidden
              />
              <span
                className={`relative z-10 text-lg leading-none transition-transform ${
                  moreActive || open ? "scale-110" : ""
                }`}
                aria-hidden
              >
                ☰
              </span>
              <span
                className={`relative z-10 whitespace-nowrap ${
                  moreActive || open ? "text-emerald-300" : "text-slate-400"
                }`}
              >
                Plus
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
