import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { exchangeDiscordCode, siteUrl } from "@/lib/discord";

export const dynamic = "force-dynamic";

/** Génère un pseudo unique à partir du nom Discord. */
async function uniqueName(base: string): Promise<string> {
  const clean = (base || "Joueur").slice(0, 24);
  let name = clean;
  let i = 1;
  while (await prisma.user.findFirst({ where: { name }, select: { id: true } })) {
    name = `${clean.slice(0, 20)} #${i++}`;
  }
  return name;
}

// Retour de Discord : vérifie le state, échange le code, crée/retrouve le compte.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const saved = store.get("discord_oauth_state")?.value;
  store.delete("discord_oauth_state");

  if (!code || !state || !saved || state !== saved) {
    return NextResponse.redirect(`${siteUrl()}/login?error=discord`);
  }

  const du = await exchangeDiscordCode(code);
  if (!du) {
    return NextResponse.redirect(`${siteUrl()}/login?error=discord`);
  }

  let user = await prisma.user.findUnique({ where: { discordId: du.id } });
  if (!user) {
    user = await prisma.user.create({
      data: { discordId: du.id, name: await uniqueName(du.name) },
    });
  }

  await createSession(user.id);
  return NextResponse.redirect(`${siteUrl()}/dashboard`);
}
