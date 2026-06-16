import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { MATCH_STATUS } from "@/lib/constants";
import {
  isDiscordWebhookEnabled,
  postToDiscord,
  siteUrl,
} from "@/lib/discord";

const PUBLIC = process.env.VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@prono-fc-rds";

let configured = false;
function ensureConfigured(): boolean {
  if (!PUBLIC || !PRIVATE) return false;
  if (!configured) {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
    configured = true;
  }
  return true;
}

export function isPushConfigured(): boolean {
  return !!(PUBLIC && PRIVATE);
}

export function getVapidPublicKey(): string | null {
  return PUBLIC ?? null;
}

type Payload = { title: string; body: string; url?: string };

/** Notification de test immédiate (vérifier que le tuyau fonctionne). */
export async function sendTestNotification(userId: string): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await sendToUser(userId, {
    title: "Test ✅",
    body: "Les notifications fonctionnent ! Tu es prêt pour le tournoi ⚽",
    url: "/dashboard",
  });
  return subs.length;
}

/** Envoie une notif à tous les navigateurs d'un utilisateur (nettoie les morts). */
async function sendToUser(userId: string, payload: Payload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const data = JSON.stringify(payload);
  await Promise.all(subs.map((s) => sendOne(s, data)));
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/** Envoie à un abonnement ; supprime l'abonnement s'il est expiré (404/410). */
async function sendOne(s: Sub, data: string): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      data,
    );
    return true;
  } catch (e: unknown) {
    const code = (e as { statusCode?: number }).statusCode;
    // 404/410 = abonnement expiré → on le supprime.
    if (code === 404 || code === 410) {
      await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
    }
    return false;
  }
}

/** Diffuse une notif à TOUS les abonnés. Renvoie le nombre d'appareils atteints. */
export async function broadcastToAll(payload: Payload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany();
  const data = JSON.stringify(payload);
  const results = await Promise.all(subs.map((s) => sendOne(s, data)));
  return results.filter(Boolean).length;
}

/**
 * Alerte d'exploitation aux admins : push (navigateurs des admins) + Discord
 * webhook si activé. Best-effort. Sert p. ex. à signaler une synchro en échec
 * durable (clé API expirée, source qui change de format…).
 */
export async function notifyAdmins(payload: Payload): Promise<void> {
  const pushOn = ensureConfigured();
  const discordOn = isDiscordWebhookEnabled();
  if (!pushOn && !discordOn) return;
  if (pushOn) {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });
    await Promise.all(admins.map((a) => sendToUser(a.id, payload)));
  }
  if (discordOn) {
    await postToDiscord(`🚨 **${payload.title}** — ${payload.body}`);
  }
}

/**
 * Envoie les notifications en attente (push + Discord), idempotent grâce aux
 * horodatages :
 *  - rappel ~1h avant le coup d'envoi (push aux joueurs sans prono + Discord),
 *  - résultat final (push aux pronostiqueurs + Discord).
 * Appelé après chaque synchro (cron).
 */
export async function runNotifications(): Promise<void> {
  const pushOn = ensureConfigured();
  const discordOn = isDiscordWebhookEnabled();
  if (!pushOn && !discordOn) return;
  const now = new Date();

  // 1) Résultats des matchs terminés non encore notifiés.
  const finished = await prisma.match.findMany({
    where: {
      status: MATCH_STATUS.FINISHED,
      resultNotifiedAt: null,
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      predictions: { select: { userId: true, points: true } },
    },
  });
  for (const m of finished) {
    const label = `${m.homeTeam?.name ?? "?"} ${m.homeScore}-${m.awayScore} ${m.awayTeam?.name ?? "?"}`;
    if (pushOn) {
      await Promise.all(
        m.predictions.map((p) =>
          sendToUser(p.userId, {
            title: "Résultat ⚽",
            body: `${label} · tu marques ${p.points ?? 0} pt${(p.points ?? 0) !== 1 ? "s" : ""} !`,
            url: `/matchs/${m.id}`,
          }),
        ),
      );
    }
    if (discordOn) {
      // Best-effort : un échec Discord ne doit pas empêcher de poser
      // resultNotifiedAt ci-dessous (sinon les push résultats repartiraient
      // en double à la synchro suivante).
      await postToDiscord(
        `⚽ **${label}** — terminé ! Classement à jour 👉 ${siteUrl()}/classement`,
      ).catch(() => {});
    }
    await prisma.match.update({
      where: { id: m.id },
      data: { resultNotifiedAt: new Date() },
    });
  }

  // 2) Rappels ~1h avant le coup d'envoi (matchs jouables non encore rappelés).
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const upcoming = await prisma.match.findMany({
    where: {
      reminderSentAt: null,
      kickoff: { gt: now, lte: soon },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      predictions: { select: { userId: true } },
    },
  });
  if (upcoming.length > 0) {
    const subUsers = pushOn
      ? await prisma.pushSubscription.findMany({
          select: { userId: true },
          distinct: ["userId"],
        })
      : [];
    const allUserIds = subUsers.map((s) => s.userId);
    for (const m of upcoming) {
      const label = `${m.homeTeam?.name ?? "?"} - ${m.awayTeam?.name ?? "?"}`;
      if (pushOn) {
        const predicted = new Set(m.predictions.map((p) => p.userId));
        const targets = allUserIds.filter((uid) => !predicted.has(uid));
        await Promise.all(
          targets.map((uid) =>
            sendToUser(uid, {
              title: "N'oublie pas ton prono ⏰",
              body: `${label} commence bientôt — place ton score !`,
              url: "/matchs",
            }),
          ),
        );
      }
      if (discordOn) {
        // Best-effort : ne doit pas empêcher de poser reminderSentAt ci-dessous.
        await postToDiscord(
          `⏰ **${label}** commence dans moins d'1h — placez vos pronos ! 👉 ${siteUrl()}/matchs`,
        ).catch(() => {});
      }
      await prisma.match.update({
        where: { id: m.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }
}
