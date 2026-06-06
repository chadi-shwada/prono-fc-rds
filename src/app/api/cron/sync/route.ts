import { NextResponse } from "next/server";
import { syncFromFootballData } from "@/lib/football-api";
import { recomputeChampionBonus } from "@/lib/scoring";
import { purgeExpiredSessions } from "@/lib/auth";
import { runPushNotifications } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Synchro automatique des résultats (appelée par le cron Vercel).
// Vercel ajoute l'en-tête « Authorization: Bearer <CRON_SECRET> » si la variable
// d'env CRON_SECRET est définie. On exige ce secret en production.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré" },
      { status: 500 },
    );
  }

  try {
    const result = await syncFromFootballData();
    await recomputeChampionBonus();
    const sessionsPurged = await purgeExpiredSessions();
    // Notifications push (rappels + résultats), idempotent.
    await runPushNotifications();
    return NextResponse.json({ ok: true, ...result, sessionsPurged });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur de synchro" },
      { status: 500 },
    );
  }
}
