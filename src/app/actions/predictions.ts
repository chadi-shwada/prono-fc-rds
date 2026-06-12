"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseScore } from "@/lib/parse";

export type PredState = { ok?: boolean; error?: string } | undefined;

/** Enregistre/modifie le pronostic d'un match (verrouillé au coup d'envoi). */
export async function savePredictionAction(
  _prev: PredState,
  formData: FormData,
): Promise<PredState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non connecté." };

  const matchId = (formData.get("matchId") ?? "").toString();
  const home = parseScore(formData.get("homeScore"));
  const away = parseScore(formData.get("awayScore"));
  if (home === null || away === null) {
    return { error: "Scores invalides." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match introuvable." };
  if (match.kickoff <= new Date()) {
    return { error: "Trop tard, le match a commencé." };
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { homeScore: home, awayScore: away },
    create: { userId: user.id, matchId, homeScore: home, awayScore: away },
  });

  revalidatePath("/matchs");
  return { ok: true };
}

/** Enregistre le prono du vainqueur final (verrouillé au 1er match du tournoi). */
export async function saveChampionAction(
  _prev: PredState,
  formData: FormData,
): Promise<PredState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non connecté." };

  const teamId = (formData.get("teamId") ?? "").toString();
  if (!teamId) return { error: "Choisis une équipe." };

  const firstMatch = await prisma.match.findFirst({
    orderBy: { kickoff: "asc" },
  });
  if (firstMatch && firstMatch.kickoff <= new Date()) {
    return { error: "Le tournoi a commencé, le prono vainqueur est verrouillé." };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Équipe introuvable." };

  await prisma.championPrediction.upsert({
    where: { userId: user.id },
    update: { teamId },
    create: { userId: user.id, teamId },
  });

  revalidatePath("/matchs");
  return { ok: true };
}
