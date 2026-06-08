import "server-only";

// Connexion Discord (OAuth2) — activée uniquement si les variables d'env sont
// présentes. Sinon l'app reste en connexion « pseudo + code » (instance RATP).

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export function siteUrl(): string {
  // APP_URL est lu au RUNTIME (contrairement à NEXT_PUBLIC_*, figé au build) →
  // indispensable pour l'URL de redirection OAuth, propre à chaque instance.
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

/** Annonces dans un salon Discord activées sur cette instance ? */
export function isDiscordWebhookEnabled(): boolean {
  return !!WEBHOOK_URL;
}

/** Poste un message dans le salon Discord (best-effort, sans mention). */
export async function postToDiscord(content: string): Promise<void> {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      cache: "no-store",
    });
  } catch {
    // best-effort
  }
}

function redirectUri(): string {
  return `${siteUrl()}/api/auth/discord/callback`;
}

/** Connexion Discord disponible sur cette instance ? */
export function isDiscordEnabled(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

/** URL d'autorisation Discord (avec state anti-CSRF). */
export function discordAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export type DiscordUser = { id: string; name: string };

/** Échange le code OAuth contre les infos du compte Discord (id + pseudo). */
export async function exchangeDiscordCode(
  code: string,
): Promise<DiscordUser | null> {
  if (!isDiscordEnabled()) return null;

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return null;
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!meRes.ok) return null;
  const me = (await meRes.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
  };
  const name = (me.global_name || me.username || "Joueur").trim();
  return { id: me.id, name };
}
