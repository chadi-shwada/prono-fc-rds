import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKickoff } from "@/lib/format";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { toggleCodeActiveAction } from "@/app/actions/admin";
import AdminResultForm from "@/components/AdminResultForm";
import SyncButton from "@/components/SyncButton";
import CreateCodeForm from "@/components/CreateCodeForm";
import ResetPronosButton from "@/components/ResetPronosButton";
import TestNotificationButton from "@/components/TestNotificationButton";
import { isPushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

const memberDateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/dashboard");

  const now = new Date();
  const [matches, invites, members] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        _count: { select: { predictions: true } },
      },
    }),
    prisma.inviteCode.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { predictions: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-slate-400">
          Saisie des résultats et synchronisation. Réservé aux admins.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-1 font-semibold">Résultats automatiques</h2>
        <p className="mb-3 text-sm text-slate-400">
          Importe le calendrier et les scores depuis l&apos;API foot, puis
          recalcule les points. (Nécessite une clé <code>FOOTBALL_API_KEY</code>.)
        </p>
        <SyncButton />
      </section>

      {isPushConfigured() && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-1 font-semibold">Notifications push</h2>
          <p className="mb-3 text-sm text-slate-400">
            Vérifie que les notifications fonctionnent (envoi immédiat sur tes
            appareils où tu les as activées).
          </p>
          <TestNotificationButton />
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-1 font-semibold">Codes d&apos;invitation</h2>
        <p className="mb-3 text-sm text-slate-400">
          Crée un code à partager avec tes collègues, ou désactive-en un.
        </p>
        <CreateCodeForm />
        <ul className="mt-4 flex flex-col divide-y divide-white/5 text-sm">
          {invites.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <span className="font-mono font-semibold text-emerald-400">
                {c.code}
              </span>
              <span className="flex-1 text-slate-500">
                {c.label ? `${c.label} · ` : ""}
                {c.uses}
                {c.maxUses ? `/${c.maxUses}` : ""} inscription
                {c.uses > 1 ? "s" : ""}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.active
                    ? "bg-emerald-500/30 text-white"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {c.active ? "Actif" : "Inactif"}
              </span>
              <form action={toggleCodeActiveAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    c.active
                      ? "border-red-400/40 bg-red-500/30 text-red-100 hover:bg-red-500/45"
                      : "border-emerald-400/40 bg-emerald-500/30 text-emerald-100 hover:bg-emerald-500/45"
                  }`}
                >
                  {c.active ? "Désactiver" : "Activer"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">
          Membres <span className="text-slate-500">({members.length})</span>
        </h2>
        <ul className="flex flex-col divide-y divide-white/5 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <span className="font-medium capitalize">{m.name}</span>
              {m.isAdmin && (
                <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                  admin
                </span>
              )}
              <span className="flex-1" />
              <span className="text-slate-500">
                {m._count.predictions} prono{m._count.predictions > 1 ? "s" : ""}
              </span>
              <span className="w-16 text-right text-xs text-slate-600">
                {memberDateFmt.format(m.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Saisie manuelle des résultats</h2>
        <ul className="flex flex-col gap-3">
          {matches.map((m) => {
            const home = {
              name: m.homeTeam?.name ?? "À déterminer",
              code: m.homeTeam?.code ?? null,
            };
            const away = {
              name: m.awayTeam?.name ?? "À déterminer",
              code: m.awayTeam?.code ?? null,
            };
            return (
              <li
                key={m.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-2 flex justify-between text-xs text-slate-400">
                  <span>
                    {STAGE_LABELS[m.stage as Stage] ?? m.stage}
                    {m.groupName ? ` · Groupe ${m.groupName}` : ""}
                  </span>
                  <span>{formatKickoff(m.kickoff)}</span>
                </div>
                <AdminResultForm
                  matchId={m.id}
                  home={home}
                  away={away}
                  initialHome={m.homeScore}
                  initialAway={m.awayScore}
                  initialStatus={m.status}
                  initialMinute={m.liveMinute}
                  stage={m.stage}
                  initialWinner={
                    m.winnerTeamId === m.homeTeamId
                      ? "HOME"
                      : m.winnerTeamId === m.awayTeamId
                        ? "AWAY"
                        : null
                  }
                />
                {m.kickoff > now && (
                  <div className="mt-3 flex justify-end border-t border-white/5 pt-2">
                    <ResetPronosButton
                      matchId={m.id}
                      count={m._count.predictions}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
