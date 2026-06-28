import type { PrismaClient } from "@prisma/client";
import schedule from "../data/wc2026-schedule.json";

// Import des lieux (stades/villes) depuis le calendrier officiel open data,
// en reliant chaque match à sa ville hôte (HOST_CITIES). Idempotent.

// Nom anglais (openfootball) -> code FIFA (= code en base).
export const EN_TO_CODE: Record<string, string> = {
  Algeria: "ALG", Argentina: "ARG", Australia: "AUS", Austria: "AUT",
  Belgium: "BEL", "Bosnia & Herzegovina": "BIH", Brazil: "BRA", Canada: "CAN",
  "Cape Verde": "CPV", Colombia: "COL", Croatia: "CRO", "Curaçao": "CUW",
  "Czech Republic": "CZE", "DR Congo": "COD", Ecuador: "ECU", Egypt: "EGY",
  England: "ENG", France: "FRA", Germany: "GER", Ghana: "GHA", Haiti: "HAI",
  Iran: "IRN", Iraq: "IRQ", "Ivory Coast": "CIV", Japan: "JPN", Jordan: "JOR",
  Mexico: "MEX", Morocco: "MAR", Netherlands: "NED", "New Zealand": "NZL",
  Norway: "NOR", Panama: "PAN", Paraguay: "PAR", Portugal: "POR", Qatar: "QAT",
  "Saudi Arabia": "KSA", Scotland: "SCO", Senegal: "SEN", "South Africa": "RSA",
  "South Korea": "KOR", Spain: "ESP", Sweden: "SWE", Switzerland: "SUI",
  Tunisia: "TUN", Turkey: "TUR", USA: "USA", Uruguay: "URY", Uzbekistan: "UZB",
};

// Lieu (openfootball) -> id de HOST_CITIES.
export const GROUND_TO_CITY: Record<string, string> = {
  "Mexico City": "mex",
  "Guadalajara (Zapopan)": "gua",
  Atlanta: "atl",
  "Monterrey (Guadalupe)": "mon",
  Toronto: "tor",
  "San Francisco Bay Area (Santa Clara)": "sfo",
  "Los Angeles (Inglewood)": "lax",
  Vancouver: "van",
  Seattle: "sea",
  "New York/New Jersey (East Rutherford)": "nyc",
  "Boston (Foxborough)": "bos",
  Philadelphia: "phi",
  "Miami (Miami Gardens)": "mia",
  Houston: "hou",
  "Kansas City": "kan",
  "Dallas (Arlington)": "dal",
};

export function toUTC(date: string, time: string): string | null {
  const mt = time.match(/(\d{2}):(\d{2})\s*UTC([+-]\d+)/);
  if (!mt) return null;
  const [, h, mi, off] = mt;
  const dt = new Date(`${date}T${h}:${mi}:00Z`);
  dt.setUTCHours(dt.getUTCHours() - parseInt(off, 10));
  return dt.toISOString();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function importVenues(
  db: PrismaClient,
): Promise<{ matched: number; total: number }> {
  const matches = await db.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });

  const groupIdx = new Map<string, string>();
  const koIdx = new Map<string, string>();
  for (const m of matches) {
    const utc = m.kickoff.toISOString();
    if (m.stage === "GROUP" && m.homeTeam && m.awayTeam) {
      groupIdx.set(
        `${utc}|${[m.homeTeam.code, m.awayTeam.code].sort().join("~")}`,
        m.id,
      );
    } else {
      koIdx.set(utc, m.id);
    }
  }

  let matched = 0;
  const all = (schedule as any).matches as any[];
  for (const s of all) {
    const cityId = GROUND_TO_CITY[s.ground];
    if (!cityId) continue;
    const utc = toUTC(s.date, s.time);
    if (!utc) continue;

    let dbId: string | undefined;
    if (s.group) {
      const c1 = EN_TO_CODE[s.team1];
      const c2 = EN_TO_CODE[s.team2];
      if (c1 && c2) dbId = groupIdx.get(`${utc}|${[c1, c2].sort().join("~")}`);
    } else {
      dbId = koIdx.get(utc);
    }
    if (!dbId) continue;

    await db.match.update({ where: { id: dbId }, data: { venueCity: cityId } });
    matched++;
  }

  return { matched, total: all.length };
}
