import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STAGES, MATCH_STATUS } from "../src/lib/constants";

const prisma = new PrismaClient();

// Données minimales de démarrage :
// - 1 code d'invitation pour les collègues
// - 1 compte admin (Chadi)
// - quelques équipes + matchs de démo pour que l'UI s'affiche
//   (le vrai calendrier complet sera importé via l'API foot — étape 5)

const DEMO_TEAMS = [
  { code: "FRA", name: "France", flag: "🇫🇷", groupName: "A" },
  { code: "USA", name: "États-Unis", flag: "🇺🇸", groupName: "A" },
  { code: "MEX", name: "Mexique", flag: "🇲🇽", groupName: "B" },
  { code: "CAN", name: "Canada", flag: "🇨🇦", groupName: "B" },
  { code: "BRA", name: "Brésil", flag: "🇧🇷", groupName: "C" },
  { code: "ARG", name: "Argentine", flag: "🇦🇷", groupName: "C" },
  { code: "ESP", name: "Espagne", flag: "🇪🇸", groupName: "D" },
  { code: "ENG", name: "Angleterre", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", groupName: "D" },
];

async function main() {
  // --- Code d'invitation ---
  const inviteCode = process.env.SEED_INVITE_CODE ?? "RATP2026";
  await prisma.inviteCode.upsert({
    where: { code: inviteCode },
    update: {},
    create: { code: inviteCode, label: "Collègues RATP" },
  });
  console.log(`✓ Code d'invitation : ${inviteCode}`);

  // --- Compte admin ---
  const adminName = process.env.SEED_ADMIN_NAME ?? "chadi";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { name: adminName },
    update: { isAdmin: true },
    create: { name: adminName, passwordHash, isAdmin: true },
  });
  console.log(`✓ Admin : ${adminName} (mot de passe par défaut : ${adminPassword} — à changer !)`);

  // --- Équipes de démo ---
  const teams: Record<string, string> = {};
  for (const t of DEMO_TEAMS) {
    const team = await prisma.team.upsert({
      where: { code: t.code },
      update: { name: t.name, flag: t.flag, groupName: t.groupName },
      create: t,
    });
    teams[t.code] = team.id;
  }
  console.log(`✓ ${DEMO_TEAMS.length} équipes de démo`);

  // --- Matchs de démo (quelques rencontres pour tester l'UI) ---
  // On nettoie d'abord les matchs de démo précédents (externalId préfixé "demo-")
  await prisma.match.deleteMany({ where: { externalId: { startsWith: "demo-" } } });

  const now = Date.now();
  const hour = 3600_000;
  const demoMatches = [
    { ext: "demo-1", home: "FRA", away: "USA", stage: STAGES.GROUP, group: "A", offset: 2 * hour },
    { ext: "demo-2", home: "MEX", away: "CAN", stage: STAGES.GROUP, group: "B", offset: 26 * hour },
    { ext: "demo-3", home: "BRA", away: "ARG", stage: STAGES.GROUP, group: "C", offset: 50 * hour },
    { ext: "demo-4", home: "ESP", away: "ENG", stage: STAGES.GROUP, group: "D", offset: 74 * hour },
  ];
  for (const m of demoMatches) {
    await prisma.match.create({
      data: {
        externalId: m.ext,
        stage: m.stage,
        groupName: m.group,
        kickoff: new Date(now + m.offset),
        status: MATCH_STATUS.SCHEDULED,
        homeTeamId: teams[m.home],
        awayTeamId: teams[m.away],
      },
    });
  }
  console.log(`✓ ${demoMatches.length} matchs de démo`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
