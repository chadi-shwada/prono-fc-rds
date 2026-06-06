"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
