// Correspondance code FIFA (3 lettres) → code drapeau (flag-icons, ISO 3166-1 alpha-2).
// Couvre les nations susceptibles de jouer la CDM 2026 (utile aussi pour la synchro API).

const FIFA_TO_ISO: Record<string, string> = {
  // Europe (UEFA)
  FRA: "fr", GER: "de", ESP: "es", ITA: "it", ENG: "gb-eng", SCO: "gb-sct",
  WAL: "gb-wls", NIR: "gb-nir", POR: "pt", NED: "nl", BEL: "be", CRO: "hr",
  SUI: "ch", SRB: "rs", POL: "pl", DEN: "dk", SWE: "se", NOR: "no", AUT: "at",
  UKR: "ua", CZE: "cz", TUR: "tr", GRE: "gr", RUS: "ru", ROU: "ro", HUN: "hu",
  SVK: "sk", SVN: "si", IRL: "ie", ISL: "is", FIN: "fi", BUL: "bg", ALB: "al",
  BIH: "ba", MKD: "mk", MNE: "me", GEO: "ge", LUX: "lu",
  // Amérique du Sud (CONMEBOL)
  BRA: "br", ARG: "ar", URU: "uy", URY: "uy", COL: "co", CHI: "cl", PER: "pe",
  ECU: "ec", PAR: "py", BOL: "bo", VEN: "ve",
  // Amérique du Nord/Centrale (CONCACAF)
  USA: "us", MEX: "mx", CAN: "ca", CRC: "cr", PAN: "pa", HON: "hn", JAM: "jm",
  SLV: "sv", GUA: "gt", HAI: "ht", TRI: "tt", CUW: "cw",
  // Asie (AFC)
  JPN: "jp", KOR: "kr", KSA: "sa", IRN: "ir", AUS: "au", QAT: "qa", IRQ: "iq",
  UAE: "ae", UZB: "uz", CHN: "cn", JOR: "jo", OMA: "om", SYR: "sy", LBN: "lb",
  THA: "th", VIE: "vn", IND: "in", PRK: "kp",
  // Afrique (CAF)
  MAR: "ma", SEN: "sn", TUN: "tn", ALG: "dz", EGY: "eg", NGA: "ng", CMR: "cm",
  GHA: "gh", CIV: "ci", MLI: "ml", RSA: "za", COD: "cd", BFA: "bf", GAB: "ga",
  CPV: "cv", GUI: "gn", ANG: "ao", ZAM: "zm", UGA: "ug", BEN: "bj", MTN: "mr",
  NAM: "na", MOZ: "mz", KEN: "ke",
  // Océanie (OFC)
  NZL: "nz",
};

/** Renvoie le code drapeau (flag-icons) pour un code FIFA, ou null si inconnu. */
export function fifaToIso(fifaCode?: string | null): string | null {
  if (!fifaCode) return null;
  return FIFA_TO_ISO[fifaCode.toUpperCase()] ?? null;
}
