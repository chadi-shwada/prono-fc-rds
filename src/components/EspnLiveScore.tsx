import { getEspnMatchDetail } from "@/lib/espn-summary";
import LiveScore from "@/components/LiveScore";

/**
 * Score en direct du haut de la page match, aligné sur la fraîcheur du fil du
 * match : il lit le score depuis la même requête ESPN (mémoïsée) que les
 * buteurs, au lieu de la base (mise à jour seulement toutes les ~2 min par le
 * cron). Repli sur le score en base si ESPN n'a pas (ou plus) la donnée.
 * À envelopper dans <Suspense> avec le score base en fallback.
 */
export default async function EspnLiveScore({
  homeCode,
  awayCode,
  kickoff,
  fallbackHome,
  fallbackAway,
  className,
}: {
  homeCode: string;
  awayCode: string;
  kickoff: Date;
  fallbackHome: number | null;
  fallbackAway: number | null;
  className?: string;
}) {
  const d = await getEspnMatchDetail(homeCode, awayCode, kickoff);
  const home = d?.score?.home ?? fallbackHome;
  const away = d?.score?.away ?? fallbackAway;
  return <LiveScore home={home} away={away} className={className} />;
}
