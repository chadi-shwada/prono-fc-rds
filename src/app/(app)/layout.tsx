import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import Particles from "@/components/Particles";
import SenegalEasterEgg from "@/components/SenegalEasterEgg";

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
      <SenegalEasterEgg />
      <NavBar user={user} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-10">
        {children}
      </main>
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        <Link href="/regles" className="text-slate-400 hover:text-emerald-400">
          Règles du jeu
        </Link>
        <span className="mx-2">·</span>
Prono FC RDS · Coupe du Monde 2026 · entre collègues RATP
      </footer>
    </div>
  );
}
