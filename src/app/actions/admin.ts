"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recomputeMatchPoints, recomputeChampionBonus } from "@/lib/scoring";
import { syncFromFootballData } from "@/lib/football-api";
import { MATCH_STATUS } from "@/lib/constants";

export type AdminState = { ok?: boolean; error?: string } | undefined;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Accès refusé");
  return user;
}

function parseScore(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : null;
}

const VALID_STATUSES = [
  MATCH_STATUS.SCHEDULED,
  MATCH_STATUS.LIVE,
  MATCH_STATUS.FINISHED,
] as const;

/** Minute de jeu (0-130), ou null si vide/invalide. */
function parseMinute(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 130 ? n : null;
}

/** Saisie/correction manuelle du statut + résultat d'un match + recalcul des points. */
export async function setResultAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const matchId = (formData.get("matchId") ?? "").toString();
  const statusRaw = (formData.get("status") ?? "").toString();
  const status = (VALID_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : MATCH_STATUS.SCHEDULED;
  const home = parseScore(formData.get("homeScore"));
  const away = parseScore(formData.get("awayScore"));
  const minute = parseMinute(formData.get("liveMinute"));
  const winnerSel = (formData.get("winner") ?? "").toString(); // "HOME" | "AWAY" | ""

  if (status === MATCH_STATUS.FINISHED && (home === null || away === null)) {
    return { error: "Renseigne les deux scores pour marquer le match terminé." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match introuvable." };

  // Vainqueur du match : déduit du score, sauf égalité (T.A.B.) où l'admin choisit.
  let winnerTeamId: string | null = null;
  if (status === MATCH_STATUS.FINISHED && home !== null && away !== null) {
    if (home > away) winnerTeamId = match.homeTeamId;
    else if (away > home) winnerTeamId = match.awayTeamId;
    else if (winnerSel === "HOME") winnerTeamId = match.homeTeamId;
    else if (winnerSel === "AWAY") winnerTeamId = match.awayTeamId;
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: home,
      awayScore: away,
      status,
      // La minute n'a de sens qu'en direct.
      liveMinute: status === MATCH_STATUS.LIVE ? minute : null,
      winnerTeamId,
    },
  });

  await recomputeMatchPoints(matchId);

  revalidatePath("/admin");
  revalidatePath("/classement");
  revalidatePath("/matchs");
  revalidatePath("/calendrier");
  return { ok: true };
}

/** Crée un nouveau code d'invitation. */
export async function createCodeAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const code = (formData.get("code") ?? "").toString().trim();
  const label = (formData.get("label") ?? "").toString().trim() || null;
  const maxUsesRaw = (formData.get("maxUses") ?? "").toString().trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;

  if (code.length < 3) return { error: "Code trop court (3 caractères min)." };
  if (maxUsesRaw && (!Number.isInteger(maxUses) || (maxUses as number) < 1)) {
    return { error: "Limite d'utilisation invalide." };
  }
  const existing = await prisma.inviteCode.findUnique({ where: { code } });
  if (existing) return { error: "Ce code existe déjà." };

  await prisma.inviteCode.create({ data: { code, label, maxUses } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Réinitialise (supprime) tous les pronos d'un match — uniquement avant le coup d'envoi. */
export async function resetMatchPredictionsAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const matchId = (formData.get("matchId") ?? "").toString();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.kickoff <= new Date()) return; // match commencé → on ne touche plus

  await prisma.prediction.deleteMany({ where: { matchId } });
  revalidatePath("/admin");
  revalidatePath("/matchs");
  revalidatePath("/classement");
}

/** Active / désactive un code d'invitation. */
export async function toggleCodeActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = (formData.get("id") ?? "").toString();
  const c = await prisma.inviteCode.findUnique({ where: { id } });
  if (c) {
    await prisma.inviteCode.update({
      where: { id },
      data: { active: !c.active },
    });
  }
  revalidatePath("/admin");
}

export type SyncState =
  | { ok?: boolean; error?: string; message?: string }
  | undefined;

/** Déclenche la synchro depuis l'API foot (résultats automatiques). */
export async function triggerSyncAction(): Promise<SyncState> {
  await requireAdmin();
  try {
    const r = await syncFromFootballData();
    await recomputeChampionBonus();
    revalidatePath("/admin");
    revalidatePath("/classement");
    revalidatePath("/matchs");
    return {
      ok: true,
      message: `Synchro OK : ${r.matches} matchs, ${r.teams} équipes, ${r.finishedRecomputed} résultats calculés.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur de synchro." };
  }
}
