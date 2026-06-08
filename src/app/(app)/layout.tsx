import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";
import Particles from "@/components/Particles";
import SenegalEasterEgg from "@/components/SenegalEasterEgg";
import { isEasterEggEnabled, appName, appTagline } from "@/lib/features";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Particles />
      {isEasterEggEnabled() && <SenegalEasterEgg />}
      <NavBar user={user} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-10">
        {children}
      </main>
      <footer className="border-t border-white/10 px-4 pt-4 pb-24 text-center text-xs text-slate-400 md:pb-4">
        <Link href="/regles" className="hover:text-emerald-400">
          Règles du jeu
        </Link>
        <span className="mx-2">·</span>
        <span className="whitespace-nowrap">{appName()}</span>
        <span className="mx-2 hidden sm:inline">·</span>
        <span className="mt-1 block sm:mt-0 sm:inline">
          Coupe du Monde 2026 · {appTagline()}
        </span>
      </footer>
      <BottomNav />
    </div>
  );
}
