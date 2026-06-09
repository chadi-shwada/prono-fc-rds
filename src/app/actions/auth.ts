"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { isRateLimited, recordAttempt } from "@/lib/rateLimit";

export type ActionState = { error?: string; needPin?: boolean } | undefined;

/** PIN admin : 4 à 8 chiffres. */
const PIN_RE = /^\d{4,8}$/;

// Anti-bruteforce du code d'invitation : seuls les ÉCHECS comptent, pour ne
// jamais bloquer des collègues légitimes derrière la même IP (NAT d'entreprise).
const AUTH_FAILURE_MAX = 15;
const AUTH_FAILURE_WINDOW_MS = 10 * 60_000;

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

async function clientIp(): Promise<string> {
  const h = await headers();
  // Caddy (reverse proxy) renseigne X-Forwarded-For ; on prend le 1er hop.
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

/**
 * Connexion / inscription en une étape : pseudo + code d'invitation.
 * - Pseudo connu → on se reconnecte (le code doit être valide et actif).
 * - Pseudo nouveau → on crée le compte (dans la limite du code).
 */
export async function authAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = clean(formData.get("name"));
  const code = clean(formData.get("code"));

  if (name.length < 2 || name.length > 20) {
    return { error: "Le pseudo doit faire entre 2 et 20 caractères." };
  }

  const ip = await clientIp();
  const rlKey = `auth:${ip}`;
  if (isRateLimited(rlKey, AUTH_FAILURE_MAX)) {
    return { error: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite || !invite.active) {
    recordAttempt(rlKey, AUTH_FAILURE_WINDOW_MS);
    return { error: "Code d'invitation invalide." };
  }

  // Correspondance insensible à la casse pour éviter les doublons
  // ("Chadi" et "chadi" = même compte). SQLite ne gère pas mode:insensitive,
  // on compare donc en mémoire (effectif vu le faible nombre de joueurs).
  const all = await prisma.user.findMany({
    select: { id: true, name: true, isAdmin: true, passwordHash: true },
  });
  const lower = name.toLowerCase();
  let user = all.find((u) => u.name.toLowerCase() === lower) ?? null;

  // Compte admin protégé par PIN : le code d'invitation étant partagé entre
  // collègues, sans PIN n'importe qui pourrait se connecter au pseudo de
  // l'admin et obtenir ses droits (résultats, suppression de joueurs…).
  if (user?.isAdmin && user.passwordHash) {
    const pin = clean(formData.get("pin"));
    if (!pin) {
      return {
        needPin: true,
        error: "Ce compte est protégé : saisis ton PIN admin.",
      };
    }
    if (!(await verifyPassword(pin, user.passwordHash))) {
      recordAttempt(rlKey, AUTH_FAILURE_WINDOW_MS);
      return { needPin: true, error: "PIN incorrect." };
    }
  }

  if (!user) {
    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      recordAttempt(rlKey, AUTH_FAILURE_WINDOW_MS);
      return { error: "Ce code d'invitation a atteint sa limite d'utilisation." };
    }
    user = await prisma.user.create({ data: { name } });
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } },
    });
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export type PinState = { ok?: boolean; error?: string } | undefined;

/** Définit ou change le PIN admin (protège le login pseudo+code du compte). */
export async function setAdminPinAction(
  _prev: PinState,
  formData: FormData,
): Promise<PinState> {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return { error: "Accès refusé." };

  const current = clean(formData.get("current"));
  const pin = clean(formData.get("pin"));
  const confirm = clean(formData.get("confirm"));

  if (!PIN_RE.test(pin)) return { error: "Le PIN doit faire 4 à 8 chiffres." };
  if (pin !== confirm) return { error: "La confirmation ne correspond pas." };

  const u = await prisma.user.findUnique({
    where: { id: me.id },
    select: { passwordHash: true },
  });
  // Changement : l'ancien PIN est exigé (un poste laissé ouvert ne suffit pas).
  if (u?.passwordHash && !(await verifyPassword(current, u.passwordHash))) {
    return { error: "PIN actuel incorrect." };
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(pin) },
  });
  return { ok: true };
}
