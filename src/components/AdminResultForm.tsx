"use client";

import { useActionState, useState } from "react";
import Flag from "@/components/Flag";
import ScoreInput from "@/components/ScoreInput";
import { setResultAction, type AdminState } from "@/app/actions/admin";
import { MATCH_STATUS } from "@/lib/constants";

type TeamInfo = { name: string; code: string | null };

type Props = {
  matchId: string;
  home: TeamInfo;
  away: TeamInfo;
  initialHome: number | null;
  initialAway: number | null;
  initialStatus: string;
  initialMinute: number | null;
};

const STATUS_OPTIONS = [
  { value: MATCH_STATUS.SCHEDULED, label: "Programmé" },
  { value: MATCH_STATUS.LIVE, label: "🔴 En direct" },
  { value: MATCH_STATUS.FINISHED, label: "Terminé" },
] as const;

export default function AdminResultForm({
  matchId,
  home,
  away,
  initialHome,
  initialAway,
  initialStatus,
  initialMinute,
}: Props) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setResultAction,
    undefined,
  );
  const [status, setStatus] = useState(initialStatus);
  const isLive = status === MATCH_STATUS.LIVE;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right text-sm">
        <span className="truncate">{home.name}</span>
        <Flag code={home.code} size={26} className="shrink-0" />
      </span>
      <ScoreInput name="homeScore" defaultValue={initialHome} ariaLabel="Score domicile" />
      <span className="text-slate-500">-</span>
      <ScoreInput name="awayScore" defaultValue={initialAway} ariaLabel="Score extérieur" />
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <Flag code={away.code} size={26} className="shrink-0" />
        <span className="truncate">{away.name}</span>
      </span>

      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label="Statut du match"
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 outline-none transition focus:border-emerald-400"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>

      {isLive && (
        <label className="flex items-center gap-1.5 text-xs text-red-300">
          <input
            type="number"
            name="liveMinute"
            min={0}
            max={130}
            defaultValue={initialMinute ?? ""}
            placeholder="min"
            aria-label="Minute de jeu"
            className="w-14 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 text-center text-white outline-none transition focus:border-red-400"
          />
          &apos;
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-amber-400 px-3 py-1 text-sm font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-50"
      >
        {pending ? "…" : state?.ok ? "✓" : "Enregistrer"}
      </button>
      {state?.error && (
        <p className="w-full text-xs text-red-300">{state.error}</p>
      )}
    </form>
  );
}
