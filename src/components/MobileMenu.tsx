"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { NAV_LINKS } from "@/lib/navLinks";
import { logoutAction } from "@/app/actions/auth";

export default function MobileMenu({
  isAdmin,
  name,
}: {
  isAdmin: boolean;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = isAdmin
    ? [...NAV_LINKS, { href: "/admin", label: "Admin" }]
    : NAV_LINKS;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-white/10 bg-white/5"
      >
        <motion.span
          animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          className="block h-0.5 w-5 rounded bg-white"
        />
        <motion.span
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          className="block h-0.5 w-5 rounded bg-white"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          className="block h-0.5 w-5 rounded bg-white"
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-[57px] z-30 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-full z-40 border-b border-white/10 bg-slate-950/95 p-3 backdrop-blur"
            >
              <div className="mb-2 px-2 text-xs uppercase tracking-wide text-slate-500">
                Connecté · <span className="capitalize text-slate-300">{name}</span>
              </div>
              <nav className="flex flex-col gap-1">
                {links.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-white/10 text-white"
                          : l.href === "/admin"
                            ? "text-amber-300"
                            : "text-slate-300"
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
                <Link
                  href="/profil"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300"
                >
                  Mon profil
                </Link>
                <Link
                  href="/regles"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300"
                >
                  Règles du jeu
                </Link>
              </nav>
              <form action={logoutAction} className="mt-2 border-t border-white/10 pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/30"
                >
                  Déconnexion
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
