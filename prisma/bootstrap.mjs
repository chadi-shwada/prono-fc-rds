import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Bootstrap production : crée (si absents) le compte admin et un code d'invitation.
// Aucune donnée de démo — le vrai calendrier vient de la synchro API.

const prisma = new PrismaClient();

async function main() {
  const code = process.env.SEED_INVITE_CODE ?? "RDS2026";
  const label = process.env.SEED_INVITE_LABEL ?? "Collègues RDS";
  await prisma.inviteCode.upsert({
    where: { code },
    update: {},
    create: { code, label },
  });

  // Sur l'instance Discord (login OAuth), on NE crée PAS de compte admin par nom :
  // il serait « fantôme » (sans discordId → impossible de s'y connecter via
  // Discord) et serait recréé à chaque démarrage du conteneur. L'admin y est
  // promu à la connexion via DISCORD_ADMIN_ID (voir le callback OAuth).
  const discordAdminId = process.env.DISCORD_ADMIN_ID?.trim();
  const isDiscordOAuth = !!process.env.DISCORD_CLIENT_ID && !!discordAdminId;

  if (isDiscordOAuth) {
    console.log(
      `✓ Bootstrap : instance Discord — admin promu via DISCORD_ADMIN_ID au login. Code d'invitation « ${code} ».`,
    );
    return;
  }

  const adminName = process.env.SEED_ADMIN_NAME ?? "chadi";
  const admin = await prisma.user.upsert({
    where: { name: adminName },
    update: { isAdmin: true },
    create: { name: adminName, isAdmin: true },
  });

  // PIN admin initial (SEED_ADMIN_PIN, 4-8 chiffres) : posé seulement si le
  // compte n'en a pas déjà un — un PIN changé depuis le profil n'est jamais
  // écrasé au redémarrage du conteneur.
  const pin = (process.env.SEED_ADMIN_PIN ?? "").trim();
  if (pin && !admin.passwordHash) {
    if (/^\d{4,8}$/.test(pin)) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { passwordHash: await bcrypt.hash(pin, 10) },
      });
      console.log("✓ PIN admin initialisé (SEED_ADMIN_PIN)");
    } else {
      console.warn("⚠ SEED_ADMIN_PIN ignoré : il faut 4 à 8 chiffres.");
    }
  }

  console.log(`✓ Bootstrap : admin « ${adminName} », code d'invitation « ${code} »`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
