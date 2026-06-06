"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isPushConfigured, sendTestNotification } from "@/lib/push";

type SubInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Enregistre (ou met à jour) l'abonnement push du navigateur courant. */
export async function savePushSubscriptionAction(sub: SubInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;

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
