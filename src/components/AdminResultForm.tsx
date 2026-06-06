"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Flag from "@/components/Flag";
import ScoreInput from "@/components/ScoreInput";
import { setResultAction, type AdminState } from "@/app/actions/admin";
import { MATCH_STATUS, isKnockout } from "@/lib/constants";

type TeamInfo = { name: string; code: string | null };

type Props = {
  matchId: string;
  home: TeamInfo;
  away: TeamInfo;
  initialHome: number | null;
  initialAway: number | null;
  initialStatus: string;
  initialMinute: number | null;
  stage: string;
  initialWinner: "HOME" | "AWAY" | null;
};

const STATUS_OPTIONS = [
  { value: MATCH_STATUS.SCHEDULED, label: "Programmé", live: false },
  { value: MATCH_STATUS.LIVE, label: "En direct", live: true },
  { value: MATCH_STATUS.FINISHED, label: "Terminé", live: false },
] as const;

function StatusLabel({ label, live }: { label: string; live: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {live && <span className="h-1.5 w-1.5 rounded-full bg-red-400" />}
      {label}
    </span>
  );
}

export default function AdminResultForm({
  matchId,
  home,
  away,
  initialHome,
  initialAway,
  initialStatus,
  initialMinute,
  stage,
  initialWinner,
}: Props) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setResultAction,
    undefined,
  );
  const [status, setStatus] = useState(initialStatus);
  const [winner, setWinner] = useState<"HOME" | "AWAY" | "">(
    initialWinner ?? "",
  );
  const [open, setOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const isLive = status === MATCH_STATUS.LIVE;
  // Vainqueur à choisir seulement pour un match à élimination terminé (T.A.B.).
  const showWinner = isKnockout(stage) && status === MATCH_STATUS.FINISHED;
  const current =
    STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  // Fermer le menu au clic en dehors.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="winner" value={showWinner ? winner : ""} />
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

      {/* Sélecteur de statut au design de l'app */}
      <div ref={ddRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Statut du match"
          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 outline-none transition hover:border-white/25 focus:border-emerald-400"
        >
          <StatusLabel label={current.label} live={current.live} />
          <span className="text-slate-500">▾</span>
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute right-0 z-30 mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 py-1 shadow-xl shadow-black/40 backdrop-blur"
          >
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === status}
                onClick={() => {
                  setStatus(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3 py-1.5 text-left text-xs transition hover:bg-white/10 ${
                  o.value === status ? "bg-white/5 text-white" : "text-slate-300"
                }`}
              >
                <StatusLabel label={o.label} live={o.live} />
              </button>
            ))}
          </div>
        )}
      </div>

      {showWinner && (
        <div
          className="flex items-center gap-1 text-xs text-slate-300"
          title="Vainqueur en cas d'égalité après prolongation (tirs au but)"
        >
          <span className="text-slate-500">T.A.B.&nbsp;:</span>
          {(
            [
              ["HOME", home.code ?? home.name.slice(0, 3)],
              ["", "Auto"],
              ["AWAY", away.code ?? away.name.slice(0, 3)],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val || "auto"}
              type="button"
              onClick={() => setWinner(val)}
              aria-pressed={winner === val}
              className={`rounded-md border px-2 py-1 transition ${
                winner === val
                  ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

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
