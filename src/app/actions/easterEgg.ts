"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SCORING } from "@/lib/constants";

export type EasterEggResult = { awarded: boolean; points: number };

/** Crédite le bonus « lion » une seule fois par joueur. */
export async function claimEasterEggAction(): Promise<EasterEggResult> {
  const user = await getCurrentUser();
  if (!user) return { awarded: false, points: SCORING.EASTER_EGG };

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { foundEasterEgg: true },
  });
  if (!u || u.foundEasterEgg) {
    return { awarded: false, points: SCORING.EASTER_EGG };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { foundEasterEgg: true },
  });
  revalidatePath("/classement");
  revalidatePath("/dashboard");
  revalidatePath("/profil");
  return { awarded: true, points: SCORING.EASTER_EGG };
}
