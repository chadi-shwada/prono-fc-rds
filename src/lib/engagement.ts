import { prisma } from "@/lib/prisma";
import { dayKey } from "@/lib/format";

export type Engagement = {
  /** Matchs du jour, jouables (équipes connues, pas encore commencés). */
  todayTotal: number;
  /** Parmi eux, ceux que l'utilisateur n'a pas encore pronostiqués. */
  todayToPredict: number;
  /** Coup d'envoi du prochain match jouable, ou null. */
  nextKickoff: Date | null;
  /** Journées consécutives (récentes, déjà entamées) avec ≥1 prono. */
  streak: number;
};

/**
 * Données « habitude » pour le tableau de bord : combien de pronos à faire
 * aujourd'hui, et la série de participation (revenir chaque jour de match).
 */
export async function getEngagement(userId: string): Promise<Engagement> {
  const now = new Date();
  const [matches, preds] = await Promise.all([
    prisma.match.findMany({
      select: { id: true, kickoff: true, homeTeamId: true, awayTeamId: true },
      orderBy: { kickoff: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId }, select: { matchId: true } }),
  ]);
  const predicted = new Set(preds.map((p) => p.matchId));
  const today = dayKey(now);

  // Matchs du jour, jouables et pas encore commencés.
  const todayOpen = matches.filter(
    (m) =>
      m.homeTeamId &&
      m.awayTeamId &&
      m.kickoff > now &&
      dayKey(m.kickoff) === today,
  );
  const todayToPredict = todayOpen.filter((m) => !predicted.has(m.id)).length;

  const next = matches.find((m) => m.homeTeamId && m.awayTeamId && m.kickoff > now);

  // Série : journées déjà entamées (kickoff passé), de la plus récente vers le
  // passé, comptées tant que l'utilisateur a pronostiqué ≥1 match du jour.
  const startedDays = [
    ...new Set(matches.filter((m) => m.kickoff <= now).map((m) => dayKey(m.kickoff))),
  ].sort();
  let streak = 0;
  for (let i = startedDays.length - 1; i >= 0; i--) {
    const d = startedDays[i];
    const participated = matches.some(
      (m) => dayKey(m.kickoff) === d && predicted.has(m.id),
    );
    if (participated) streak++;
    else break;
  }

  return {
    todayTotal: todayOpen.length,
    todayToPredict,
    nextKickoff: next?.kickoff ?? null,
    streak,
  };
}
