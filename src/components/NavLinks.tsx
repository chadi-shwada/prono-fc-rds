"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_LINKS } from "@/lib/navLinks";

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...NAV_LINKS, { href: "/admin", label: "Admin" }]
    : NAV_LINKS;

  return (
    <div className="hidden items-center gap-0.5 text-sm md:flex">
      {links.map((l) => {
        const active = pathname === l.href;
        const admin = l.href === "/admin";
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative rounded-lg px-2.5 py-1.5 transition-colors ${
              active
                ? "text-white"
                : admin
                  ? "text-amber-300 hover:text-amber-200"
                  : "text-slate-300 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-lg bg-white/10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{l.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
