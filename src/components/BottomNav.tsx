"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

// Onglets principaux (mobile). Le reste (Calendrier, Carte, Tableau, Règles,
// Admin, Déconnexion) reste accessible via le menu hamburger.
const TABS = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/matchs", label: "Matchs", icon: "⚽" },
  { href: "/classement", label: "Classement", icon: "🏆" },
  { href: "/profil", label: "Profil", icon: "👤" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/90 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-pill"
                    className="absolute inset-x-3 inset-y-1 rounded-xl bg-emerald-500/15"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={`relative z-10 text-lg leading-none transition-transform ${
                    active ? "scale-110" : ""
                  }`}
                >
                  {t.icon}
                </span>
                <span
                  className={`relative z-10 ${
                    active ? "text-emerald-300" : "text-slate-400"
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
