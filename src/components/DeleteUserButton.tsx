"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/app/actions/admin";

export default function DeleteUserButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (
      !window.confirm(
        `Supprimer « ${name} » et tous ses pronos ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    startTransition(() => deleteUserAction(userId));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={`Supprimer ${name}`}
      className="rounded-lg border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/35 disabled:opacity-50"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
