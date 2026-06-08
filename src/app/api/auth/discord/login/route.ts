import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { isDiscordEnabled, discordAuthorizeUrl } from "@/lib/discord";

export const dynamic = "force-dynamic";

// Démarre la connexion Discord : pose un state anti-CSRF et redirige vers Discord.
export async function GET(request: Request) {
  if (!isDiscordEnabled()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(discordAuthorizeUrl(state));
}
