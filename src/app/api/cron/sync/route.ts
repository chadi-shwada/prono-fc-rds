import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { syncFromFootballData } from "@/lib/football-api";
import { recomputeChampionBonus } from "@/lib/scoring";
import { purgeExpiredSessions } from "@/lib/auth";
import { runNotifications } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Comparaison en temps constant (évite de divulguer le secret octet par octet). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Synchro automatique des résultats (appelée par le cron Vercel).
// Vercel ajoute l'en-tête « Authorization: Bearer <CRON_SECRET> » si la variable
// d'env CRON_SECRET est définie. On exige ce secret en production.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret) {
    if (!auth || !safeEqual(auth, `Bearer ${secret}`)) {
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
    // Notifications (push + Discord) : rappels + résultats, idempotent.
    await runNotifications();
    return NextResponse.json({ ok: true, ...result, sessionsPurged });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur de synchro" },
      { status: 500 },
    );
  }
}
