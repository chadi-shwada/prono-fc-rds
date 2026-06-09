"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isPushConfigured, sendTestNotification, broadcastToAll } from "@/lib/push";
import { isDiscordWebhookEnabled, postToDiscord } from "@/lib/discord";
import { appName } from "@/lib/features";

type SubInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * L'endpoint vient du navigateur du client : on le valide pour empêcher un
 * utilisateur malveillant de faire contacter par le serveur une URL arbitraire
 * (SSRF) via l'envoi de notifications — les vrais services push (FCM, Mozilla,
 * APNs web…) sont toujours en HTTPS sur un nom de domaine public.
 */
function isValidPushEndpoint(endpoint: string): boolean {
  if (endpoint.length > 1024) return false;
  let u: URL;
  try {
    u = new URL(endpoint);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  // Pas d'IP littérale (IPv4 ou IPv6) : bloque les adresses internes/cloud.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false;
  return host.includes(".");
}

/** Enregistre (ou met à jour) l'abonnement push du navigateur courant. */
export async function savePushSubscriptionAction(sub: SubInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;
  if (!isValidPushEndpoint(sub.endpoint)) return;
  if (sub.keys.p256dh.length > 256 || sub.keys.auth.length > 256) return;

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
}

/** Supprime un abonnement (désactivation des notifications). */
export async function deletePushSubscriptionAction(endpoint: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !endpoint) return;
  await prisma.pushSubscription
    .deleteMany({ where: { endpoint, userId: user.id } })
    .catch(() => {});
}

export type TestResult = { ok: boolean; sent: number; error?: string };

/** Envoie une notification de test à l'utilisateur courant (vérification). */
export async function sendTestNotificationAction(): Promise<TestResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, sent: 0, error: "Non connecté." };
  if (!isPushConfigured()) {
    return { ok: false, sent: 0, error: "Notifications non configurées (clés VAPID manquantes)." };
  }
  const sent = await sendTestNotification(user.id);
  if (sent === 0) {
    return { ok: false, sent: 0, error: "Aucun abonnement : active d'abord les notifications sur ton Profil." };
  }
  return { ok: true, sent };
}

export type BroadcastResult = { ok: boolean; devices: number; error?: string };

/** Diffuse une notification à tous les abonnés (admin uniquement). */
export async function broadcastNotificationAction(
  message: string,
): Promise<BroadcastResult> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return { ok: false, devices: 0, error: "Accès refusé." };
  if (!isPushConfigured() && !isDiscordWebhookEnabled()) {
    return { ok: false, devices: 0, error: "Notifications non configurées." };
  }
  const body = message.trim().slice(0, 180);
  if (!body) return { ok: false, devices: 0, error: "Message vide." };

  const devices = await broadcastToAll({
    title: `${appName()} 📣`,
    body,
    url: "/dashboard",
  });
  if (isDiscordWebhookEnabled()) await postToDiscord(`📣 ${body}`);
  return { ok: true, devices };
}
