"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** Palette de réactions autorisées (chambrage entre collègues). */
export const REACTION_EMOJIS = ["🔥", "😂", "😱", "🥳", "😭", "💪"] as const;

/** Ajoute ou retire la réaction `emoji` de l'utilisateur sur un match. */
export async function toggleReactionAction(
  matchId: string,
  emoji: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (!(REACTION_EMOJIS as readonly string[]).includes(emoji)) return;

  const existing = await prisma.reaction.findUnique({
    where: { userId_matchId_emoji: { userId: user.id, matchId, emoji } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { userId: user.id, matchId, emoji } });
  }
  revalidatePath(`/matchs/${matchId}`);
}
