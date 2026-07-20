// Vérifie que le bonus « champion du monde » (+10 pts) a bien été crédité
// à tous ceux qui ont pronostiqué le vainqueur final.
//
// Lancer sur le VPS, DANS le conteneur app (la base SQLite y est montée) :
//   docker compose exec app npx tsx scripts/verify-champion-bonus.ts
// (RATP). Pour l'instance Discord : `docker compose exec app-discord ...`.
//
// Le script est en LECTURE SEULE : il n'écrit rien. S'il détecte un manque,
// relancer une synchro (bouton admin « Synchroniser ») recrédite le bonus,
// car recomputeChampionBonus() est idempotent.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHAMPION_BONUS = 10; // doit rester aligné sur SCORING.CHAMPION_BONUS

/** Rejoue la logique de getChampionTeamId() (src/lib/scoring.ts). */
async function getChampionTeamId(): Promise<string | null> {
  const final = await prisma.match.findFirst({
    where: { stage: "FINAL", status: "FINISHED" },
    orderBy: { kickoff: "desc" },
  });
  if (!final) return null;
  if (final.winnerTeamId) return final.winnerTeamId;
  if (final.homeScore === null || final.awayScore === null) return null;
  if (final.homeScore === final.awayScore) return null;
  return final.homeScore > final.awayScore ? final.homeTeamId : final.awayTeamId;
}

async function main() {
  const final = await prisma.match.findFirst({
    where: { stage: "FINAL", status: "FINISHED" },
    orderBy: { kickoff: "desc" },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!final) {
    console.log("❌ Aucune finale TERMINÉE en base. Le bonus ne peut pas être crédité.");
    console.log("   → Marque la finale « terminée » (admin) ou lance une synchro.");
    return;
  }

  const winnerId = await getChampionTeamId();
  const winner = winnerId
    ? await prisma.team.findUnique({ where: { id: winnerId } })
    : null;

  console.log("=== Finale ===");
  console.log(
    `${final.homeTeam?.name ?? "?"} ${final.homeScore ?? "?"} - ${final.awayScore ?? "?"} ${final.awayTeam?.name ?? "?"}` +
      (final.winnerTeamId ? "  (vainqueur explicite renseigné)" : ""),
  );
  console.log(`Champion détecté : ${winner ? `${winner.flag ?? ""} ${winner.name}` : "AUCUN (⚠️)"}`);
  console.log("");

  if (!winnerId) {
    console.log("❌ Pas de champion déterminé (finale nulle sans winnerTeamId ?).");
    console.log("   → L'admin doit renseigner le vainqueur. Aucun bonus ne sera crédité sans ça.");
    return;
  }

  // Tous les pronos champion, avec équipe et utilisateur.
  const preds = await prisma.championPrediction.findMany({
    include: { team: true, user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const forWinner = preds.filter((p) => p.teamId === winnerId);

  console.log(`=== Pronos « champion » : ${preds.length} au total ===`);
  console.log(`Ont trouvé le champion (${winner?.name}) : ${forWinner.length}`);
  console.log("");

  let problems = 0;
  console.log("Détail de ceux qui ont trouvé le champion :");
  for (const p of forWinner) {
    const ok = p.points === CHAMPION_BONUS;
    if (!ok) problems++;
    console.log(
      `  ${ok ? "✅" : "❌"} ${p.user.name.padEnd(20)} points bonus = ${p.points ?? "null"}` +
        (ok ? "" : `  ← ATTENDU ${CHAMPION_BONUS}`),
    );
  }

  // Sanity check inverse : personne d'AUTRE ne doit avoir de bonus crédité.
  const wrongCredited = preds.filter(
    (p) => p.teamId !== winnerId && p.points != null && p.points !== 0,
  );
  if (wrongCredited.length) {
    console.log("");
    console.log("⚠️ Bonus crédité à tort (n'ont PAS trouvé le champion) :");
    for (const p of wrongCredited) {
      problems++;
      console.log(`  ❌ ${p.user.name} a prédit ${p.team.name} mais points = ${p.points}`);
    }
  }

  console.log("");
  if (problems === 0) {
    console.log(`🎉 OK : les ${forWinner.length} joueur(s) ayant trouvé le champion ont bien leurs +${CHAMPION_BONUS} points, et personne d'autre.`);
  } else {
    console.log(`❗ ${problems} anomalie(s) détectée(s). Relance une synchro (admin) pour recréditer le bonus.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
