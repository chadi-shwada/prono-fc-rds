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

  // dayKey() calculé une seule fois par match (évite ~3 recalculs/match ci-dessous).
  const withDay = matches.map((m) => ({ ...m, day: dayKey(m.kickoff) }));

  // Matchs du jour, jouables et pas encore commencés.
  const todayOpen = withDay.filter(
    (m) => m.homeTeamId && m.awayTeamId && m.kickoff > now && m.day === today,
  );
  const todayToPredict = todayOpen.filter((m) => !predicted.has(m.id)).length;

  const next = withDay.find((m) => m.homeTeamId && m.awayTeamId && m.kickoff > now);

  // Série : journées déjà entamées (kickoff passé), de la plus récente vers le
  // passé, comptées tant que l'utilisateur a pronostiqué ≥1 match du jour.
  // On indexe d'abord, par journée, s'il existe ≥1 prono de l'utilisateur.
  const startedDaySet = new Set<string>();
  const participatedDays = new Set<string>();
  for (const m of withDay) {
    if (m.kickoff > now) continue;
    startedDaySet.add(m.day);
    if (predicted.has(m.id)) participatedDays.add(m.day);
  }
  const startedDays = [...startedDaySet].sort();
  let streak = 0;
  for (let i = startedDays.length - 1; i >= 0; i--) {
    if (participatedDays.has(startedDays[i])) streak++;
    else break;
  }

  return {
    todayTotal: todayOpen.length,
    todayToPredict,
    nextKickoff: next?.kickoff ?? null,
    streak,
  };
}
