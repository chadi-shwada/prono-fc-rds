import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import NavLinks from "@/components/NavLinks";
import MobileMenu from "@/components/MobileMenu";
import Logo from "@/components/Logo";
import { appName } from "@/lib/features";

export default function NavBar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 font-display font-extrabold text-white"
        >
          <Logo
            size={28}
            className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
          />
          <span className="hidden sm:inline">{appName()}</span>
        </Link>

        <NavLinks isAdmin={user.isAdmin} />

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/profil"
            className="text-sm font-medium capitalize text-slate-300 transition hover:text-white"
          >
            {user.name}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-500/35"
            >
              Déconnexion
            </button>
          </form>
        </div>

        <MobileMenu isAdmin={user.isAdmin} name={user.name} />
      </nav>
    </header>
  );
}
