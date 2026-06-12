import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { syncFromFootballData } from "@/lib/football-api";
import { recomputeChampionBonus } from "@/lib/scoring";
import { purgeExpiredSessions } from "@/lib/auth";
import { runNotifications, notifyAdmins } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Échecs de synchro consécutifs — gardé en mémoire du process (survit entre les
// passages du cron, remis à 0 au redémarrage du conteneur). Si la synchro casse
// durablement (clé API expirée, source qui change de format…), on alerte les
// admins une fois au seuil, puis une fois par heure (~ALERT_REPEAT × intervalle)
// pour ne pas spammer.
let consecutiveFailures = 0;
const ALERT_THRESHOLD = 3;
const ALERT_REPEAT = 30;

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
    // Synchro rétablie après une panne signalée : on rassure les admins.
    if (consecutiveFailures >= ALERT_THRESHOLD) {
      await notifyAdmins({
        title: "Synchro rétablie ✅",
        body: `La synchronisation refonctionne (après ${consecutiveFailures} échecs).`,
        url: "/admin",
      }).catch(() => {});
    }
    consecutiveFailures = 0;
    return NextResponse.json({ ok: true, ...result, sessionsPurged });
  } catch (e) {
    consecutiveFailures++;
    const msg = e instanceof Error ? e.message : "Erreur de synchro";
    console.error(`[cron/sync] échec #${consecutiveFailures}: ${msg}`);
    // Alerte au seuil, puis périodiquement, pour éviter le spam.
    if (
      consecutiveFailures === ALERT_THRESHOLD ||
      (consecutiveFailures > ALERT_THRESHOLD &&
        consecutiveFailures % ALERT_REPEAT === 0)
    ) {
      await notifyAdmins({
        title: "⚠️ Synchro en échec",
        body: `${consecutiveFailures} échecs consécutifs : ${msg}. Vérifie la clé API et les sources.`,
        url: "/admin",
      }).catch(() => {});
    }
    return NextResponse.json(
      { ok: false, error: msg, consecutiveFailures },
      { status: 500 },
    );
  }
}
