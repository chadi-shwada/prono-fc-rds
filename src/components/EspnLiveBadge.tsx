import { getEspnMatchDetail } from "@/lib/espn-summary";
import LiveBadge from "@/components/LiveBadge";

/**
 * Pastille « En direct » de la page match avec l'horloge ESPN (temps additionnel
 * inclus), soumise au même délai d'affichage que le score et le fil du match.
 * Repli sur l'horloge/minute en base le temps du chargement. À envelopper dans
 * <Suspense>.
 */
export default async function EspnLiveBadge({
  homeCode,
  awayCode,
  kickoff,
  fallbackClock,
  fallbackMinute,
}: {
  homeCode: string;
  awayCode: string;
  kickoff: Date;
  fallbackClock: string | null;
  fallbackMinute: number | null;
}) {
  const d = await getEspnMatchDetail(homeCode, awayCode, kickoff);
  return <LiveBadge minute={fallbackMinute} clock={d?.clock ?? fallbackClock} />;
}
