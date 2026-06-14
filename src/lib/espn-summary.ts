import "server-only";
import { cache } from "react";

// Détails d'un match via l'endpoint "summary" d'ESPN (non-officiel) : buteurs,
// statut détaillé (mi-temps / prolongation / T.A.B.), stats (possession, tirs…) et
// score des tirs au but. 100 % best-effort et LECTURE SEULE : aucune écriture en
// base, aucun impact sur la synchro ni le scoring. Si un champ manque ou si ESPN
// change son format, on renvoie simplement `null`/listes vides → la section ne
// s'affiche pas (aucune régression).

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

// --- Types souples (tous les champs optionnels : on accède via optional chaining) ---
type TeamRef = { id?: string | number; abbreviation?: string; displayName?: string };
type StatusType = {
  state?: string;
  detail?: string;
  shortDetail?: string;
  description?: string;
};
type Competitor = {
  team?: TeamRef;
  homeAway?: string; // "home" | "away" (l'attribution ESPN peut différer de la nôtre)
  score?: number | string; // score en cours (temps réglementaire)
  shootoutScore?: number;
};
// Cotes (paris) : moneyline américain par issue (domicile / nul / extérieur).
type OddSide = { moneyLine?: number | string };
type OddsEntry = {
  homeTeamOdds?: OddSide;
  awayTeamOdds?: OddSide;
  drawOdds?: OddSide;
};
type Event = {
  id?: string;
  status?: { type?: StatusType; displayClock?: string };
  competitions?: { competitors?: Competitor[] }[];
};
type KeyEvent = {
  type?: { text?: string };
  text?: string;
  shortText?: string;
  scoringPlay?: boolean;
  clock?: { displayValue?: string };
  team?: TeamRef;
  athletesInvolved?: { displayName?: string }[];
};
type StatItem = { name?: string; displayValue?: string };
type BoxTeam = { team?: TeamRef; statistics?: StatItem[] };
type PredictorSide = {
  id?: string | number;
  team?: TeamRef;
  gameProjection?: string | number; // % de victoire estimé
  teamChanceTie?: string | number; // % de match nul
};
type Summary = {
  header?: {
    competitions?: {
      status?: { type?: StatusType; displayClock?: string };
      competitors?: Competitor[];
      odds?: OddsEntry[];
    }[];
  };
  keyEvents?: KeyEvent[];
  scoringPlays?: KeyEvent[];
  boxscore?: { teams?: BoxTeam[] };
  pickcenter?: OddsEntry[];
  predictor?: { homeTeam?: PredictorSide; awayTeam?: PredictorSide };
};

// Fil du match : buts, cartons et remplacements, dans l'ordre chronologique.
export type EspnEventKind = "goal" | "yellow" | "red" | "sub";
export type EspnTimelineEvent = {
  kind: EspnEventKind;
  minute: string | null;
  sort: number; // clé de tri (minute + temps additionnel)
  teamCode: string | null;
  text: string; // buteur / joueur averti / joueur entrant
  sub: string | null; // but : "pén."/"csc" · remplacement : joueur sortant
};
export type EspnStat = { label: string; home: string; away: string };
// Pronostic ESPN (% de victoire / nul), du point de vue domicile/extérieur.
export type EspnPredictor = { home: number; draw: number; away: number };
export type EspnMatchDetail = {
  statusDetail: string | null;
  // Horloge de jeu (temps additionnel inclus, ex. "90+4"), pour la pastille live.
  clock: string | null;
  // Score en cours d'après ESPN (même fraîcheur que le fil du match), pour éviter
  // que le score du haut soit en retard sur les buts affichés dans le fil.
  score: { home: number; away: number } | null;
  timeline: EspnTimelineEvent[];
  stats: EspnStat[];
  shootout: { home: number; away: number } | null;
  predictor: EspnPredictor | null;
};

// Stats à afficher (nom ESPN → libellé FR), dans l'ordre.
const STAT_LABELS: [string, string][] = [
  ["possessionPct", "Possession"],
  ["totalShots", "Tirs"],
  ["shotsOnTarget", "Tirs cadrés"],
  ["wonCorners", "Corners"],
  ["foulsCommitted", "Fautes"],
  ["offsides", "Hors-jeu"],
  ["saves", "Arrêts"],
];

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const up = (s: string | undefined) => (s ?? "").toUpperCase();

/** Horloge propre, temps additionnel inclus : "90'+4'" → "90+4", sinon null. */
function parseClockText(clock: string | undefined): string | null {
  if (!clock) return null;
  const baseMatch = clock.match(/(\d+)/);
  if (!baseMatch) return null;
  const base = Number(baseMatch[1]);
  if (!Number.isFinite(base) || base < 0 || base > 130) return null;
  const plusMatch = clock.match(/\+\s*(\d+)/);
  if (plusMatch) {
    const add = Number(plusMatch[1]);
    if (Number.isFinite(add) && add > 0) return `${base}+${add}`;
  }
  return `${base}`;
}

// Extrait le nom du buteur depuis le texte anglais d'ESPN, ex. :
// "Goal! Mexico 1, South Africa 0. Julián Quiñones (Mexico) right footed shot…"
// → "Julián Quiñones". Sert de repli si athletesInvolved est absent.
function scorerFromText(text: string): string | null {
  const afterScore = text.split(/\.\s+/).slice(1).join(". ");
  const m = afterScore.match(/^([^(]+?)\s*\(/);
  return m ? m[1].trim() : null;
}

// Nom du joueur précédant la parenthèse de l'équipe, ex. :
// "Lionel Messi (Argentina) is shown the yellow card." → "Lionel Messi".
function playerBeforeTeam(text: string): string | null {
  const m = text.match(/^([^(]+?)\s*\(/);
  return m ? m[1].trim() : null;
}

// Remplacement, ex. "Substitution, Argentina. Joueur A replaces Joueur B."
// → { in: "Joueur A", out: "Joueur B" }.
function parseSub(text: string): { in: string; out: string } | null {
  const m = text.match(/\.\s*([^.]+?)\s+replaces\s+([^.]+?)\s*\.?\s*$/i);
  return m ? { in: m[1].trim(), out: m[2].trim() } : null;
}

// Clé de tri d'une minute ESPN ("45'+2'", "90'+4'") : minute×100 + additionnel.
function clockSort(display: string | undefined | null): number {
  if (!display) return 99999;
  const m = display.match(/(\d+)(?:\s*\+\s*(\d+))?/);
  if (!m) return 99999;
  return Number(m[1]) * 100 + (m[2] ? Number(m[2]) : 0);
}

/**
 * Récupère les détails ESPN d'un match identifié par la paire de codes FIFA.
 * Renvoie `null` si le match n'est pas trouvé côté ESPN (ex. pas dans la journée
 * en cours) ou en cas d'erreur.
 */
async function fetchEspnMatchDetail(
  homeCode: string,
  awayCode: string,
  kickoff: Date,
): Promise<EspnMatchDetail | null> {
  const hc = up(homeCode);
  const ac = up(awayCode);
  const key = [hc, ac].sort().join("|");

  const matchesPair = (e: Event) => {
    const codes = (e.competitions?.[0]?.competitors ?? [])
      .map((c) => up(c.team?.abbreviation))
      .filter(Boolean)
      .sort();
    return codes.length === 2 && codes.join("|") === key;
  };

  // ESPN ne renvoie par défaut que la journée en cours : on interroge donc la
  // plage de dates autour du coup d'envoi (±1 j pour absorber les décalages de
  // fuseau), avec repli sur le scoreboard par défaut (matchs du jour / en direct).
  const day = 24 * 60 * 60 * 1000;
  const ymd = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
      d.getUTCDate(),
    ).padStart(2, "0")}`;
  const dated = `${BASE}/scoreboard?dates=${ymd(
    new Date(kickoff.getTime() - day),
  )}-${ymd(new Date(kickoff.getTime() + day))}`;

  let event: Event | undefined;
  for (const url of [dated, `${BASE}/scoreboard`]) {
    const board = (await fetchJson(url)) as { events?: Event[] } | null;
    event = board?.events?.find(matchesPair);
    if (event?.id) break;
  }
  if (!event?.id) return null;

  const summary = (await fetchJson(
    `${BASE}/summary?event=${event.id}`,
  )) as Summary | null;
  if (!summary) return null;

  const headerComp = summary.header?.competitions?.[0];

  // Table de correspondance équipe ESPN → code FIFA, pour situer chaque but du bon
  // côté : les keyEvents n'exposent pas toujours l'abréviation directement.
  const idToCode = new Map<string, string>();
  const nameToCode = new Map<string, string>();
  const indexTeam = (t: TeamRef | undefined) => {
    const code = t?.abbreviation?.toUpperCase();
    if (!code) return;
    if (t?.id != null) idToCode.set(String(t.id), code);
    if (t?.displayName) nameToCode.set(t.displayName.toLowerCase(), code);
  };
  for (const c of event.competitions?.[0]?.competitors ?? []) indexTeam(c.team);
  for (const c of headerComp?.competitors ?? []) indexTeam(c.team);

  // Résout le code de l'équipe d'un but : id ESPN, puis abréviation, puis nom
  // complet, puis nom entre parenthèses du texte ("… Buteur (Team Name) …").
  const resolveTeamCode = (ev: KeyEvent): string | null => {
    const t = ev.team;
    if (t?.id != null) {
      const c = idToCode.get(String(t.id));
      if (c) return c;
    }
    if (t?.abbreviation) return t.abbreviation.toUpperCase();
    if (t?.displayName) {
      const c = nameToCode.get(t.displayName.toLowerCase());
      if (c) return c;
    }
    const m = (ev.text ?? ev.shortText ?? "").match(/\(([^)]+)\)/);
    if (m) {
      const c = nameToCode.get(m[1].trim().toLowerCase());
      if (c) return c;
    }
    return null;
  };

  // Statut détaillé (mi-temps, prolongation, T.A.B., minute…).
  const statusDetail =
    event.status?.type?.detail ??
    headerComp?.status?.type?.detail ??
    headerComp?.status?.type?.shortDetail ??
    null;

  // Horloge de jeu (temps additionnel inclus) pour la pastille « En direct ».
  const clock = parseClockText(
    event.status?.displayClock ?? headerComp?.status?.displayClock,
  );

  // Fil du match : buts, cartons et remplacements (keyEvents, sinon scoringPlays
  // pour les seuls buts), classés et triés par minute.
  const rawEvents = summary.keyEvents ?? summary.scoringPlays ?? [];
  const timeline: EspnTimelineEvent[] = [];
  for (const ev of rawEvents) {
    const raw = ev.text ?? ev.shortText ?? "";
    const typeText = ev.type?.text ?? "";
    const both = `${typeText} ${raw}`;
    const base = {
      minute: ev.clock?.displayValue ?? null,
      sort: clockSort(ev.clock?.displayValue),
      teamCode: resolveTeamCode(ev),
    };

    const isGoal = ev.scoringPlay === true || /goal/i.test(typeText);
    if (isGoal) {
      const isOwn = /own goal/i.test(both);
      const isPen = /penalt/i.test(both);
      const scorer =
        ev.athletesInvolved?.[0]?.displayName?.trim() ||
        scorerFromText(raw) ||
        "But";
      timeline.push({
        ...base,
        kind: "goal",
        text: scorer,
        sub: isOwn ? "csc" : isPen ? "pén." : null,
      });
      continue;
    }

    if (/substitution/i.test(both)) {
      const players = parseSub(raw);
      const inName =
        players?.in || ev.athletesInvolved?.[0]?.displayName?.trim() || null;
      const outName =
        players?.out || ev.athletesInvolved?.[1]?.displayName?.trim() || null;
      if (!inName && !outName) continue;
      timeline.push({
        ...base,
        kind: "sub",
        text: inName ?? "—",
        sub: outName,
      });
      continue;
    }

    const isRed = /red card/i.test(both) || /yellow[\s-]*red/i.test(both);
    const isYellow = !isRed && /yellow card/i.test(both);
    if (isRed || isYellow) {
      const player =
        ev.athletesInvolved?.[0]?.displayName?.trim() ||
        playerBeforeTeam(raw) ||
        "Carton";
      timeline.push({
        ...base,
        kind: isRed ? "red" : "yellow",
        text: player,
        sub: null,
      });
    }
  }
  timeline.sort((a, b) => a.sort - b.sort);

  // Stats : on relie chaque équipe du boxscore à domicile/extérieur par son code.
  const teams = summary.boxscore?.teams ?? [];
  const homeBox = teams.find((t) => up(t.team?.abbreviation) === hc);
  const awayBox = teams.find((t) => up(t.team?.abbreviation) === ac);
  const statVal = (t: BoxTeam | undefined, name: string) =>
    t?.statistics?.find((s) => s.name === name)?.displayValue ?? null;
  const stats: EspnStat[] = STAT_LABELS.map(([name, label]) => {
    const home = statVal(homeBox, name);
    const away = statVal(awayBox, name);
    return home != null && away != null ? { label, home, away } : null;
  }).filter((s): s is EspnStat => s !== null);

  // Tirs au but (phase finale).
  const comps = headerComp?.competitors ?? [];
  const sHome = comps.find((c) => up(c.team?.abbreviation) === hc)?.shootoutScore;
  const sAway = comps.find((c) => up(c.team?.abbreviation) === ac)?.shootoutScore;
  const shootout =
    typeof sHome === "number" && typeof sAway === "number"
      ? { home: sHome, away: sAway }
      : null;

  // Score en cours (header ESPN) — sert au score affiché en haut de la page match,
  // pour qu'il bouge en même temps que les buts du fil du match.
  const rawHome = Number(comps.find((c) => up(c.team?.abbreviation) === hc)?.score);
  const rawAway = Number(comps.find((c) => up(c.team?.abbreviation) === ac)?.score);
  const score =
    Number.isFinite(rawHome) && Number.isFinite(rawAway)
      ? { home: rawHome, away: rawAway }
      : null;

  // Probabilités : ESPN (foot) n'expose pas de « predictor » mais des COTES
  // (pickcenter / odds du header). On convertit les moneyline en probabilités
  // implicites, puis on normalise (retire la marge bookmaker) pour 3 % lisibles.
  // L'attribution domicile/extérieur d'ESPN peut être inversée par rapport à la
  // nôtre : on détecte le « home » ESPN via homeAway et on échange si besoin.
  const espnComps =
    headerComp?.competitors ?? event.competitions?.[0]?.competitors ?? [];
  const espnHomeCode = up(
    espnComps.find((c) => c.homeAway === "home")?.team?.abbreviation,
  );
  const swap = espnHomeCode === ac; // « home » ESPN = notre extérieur

  let predictor: EspnPredictor | null = null;
  const oddsEntries = [
    ...(summary.pickcenter ?? []),
    ...(headerComp?.odds ?? []),
  ];
  for (const e of oddsEntries) {
    const h = impliedFromMoneyline(e.homeTeamOdds?.moneyLine);
    const a = impliedFromMoneyline(e.awayTeamOdds?.moneyLine);
    if (h == null || a == null) continue;
    const d = impliedFromMoneyline(e.drawOdds?.moneyLine) ?? 0;
    // h/a = proba ESPN domicile/extérieur ; on les remet dans notre repère.
    const homeP = swap ? a : h;
    const awayP = swap ? h : a;
    const sum = homeP + awayP + d;
    if (sum <= 0) continue;
    predictor = {
      home: Math.round((homeP / sum) * 100),
      draw: Math.round((d / sum) * 100),
      away: Math.round((awayP / sum) * 100),
    };
    break;
  }

  // Repli : si jamais un « predictor » (champ sports US) est présent.
  if (!predictor && summary.predictor) {
    const sideCode = (s: PredictorSide | undefined): string | null => {
      if (!s) return null;
      if (s.id != null) {
        const c = idToCode.get(String(s.id));
        if (c) return c;
      }
      if (s.team?.abbreviation) return s.team.abbreviation.toUpperCase();
      return null;
    };
    let homeWin: number | null = null;
    let awayWin: number | null = null;
    let tie: number | null = null;
    for (const s of [summary.predictor.homeTeam, summary.predictor.awayTeam]) {
      const win = Number(s?.gameProjection);
      const t = Number(s?.teamChanceTie);
      if (Number.isFinite(t)) tie = t;
      if (!Number.isFinite(win)) continue;
      const code = sideCode(s);
      if (code === hc) homeWin = win;
      else if (code === ac) awayWin = win;
    }
    if (homeWin != null && awayWin != null) {
      const draw =
        tie != null && Number.isFinite(tie)
          ? tie
          : Math.max(0, 100 - homeWin - awayWin);
      predictor = {
        home: Math.round(homeWin),
        draw: Math.round(draw),
        away: Math.round(awayWin),
      };
    }
  }

  return { statusDetail, clock, score, timeline, stats, shootout, predictor };
}

// --- Délai d'affichage live (anti-avance sur le direct) -----------------------
// Les données ESPN sont quasi temps réel ; pour rester DERRIÈRE le direct plutôt
// qu'en avance, on garde un court historique par match et on renvoie l'instantané
// d'il y a ~LIVE_DELAY_SECONDS. Mémoire process (réinitialisé au redémarrage,
// se recharge en quelques secondes). Réglable via la variable d'env.
type Snapshot = { at: number; detail: EspnMatchDetail | null };
const liveHistory = new Map<string, Snapshot[]>();

function liveDelayMs(): number {
  const s = Number(process.env.LIVE_DELAY_SECONDS);
  return Number.isFinite(s) && s > 0 ? s * 1000 : 0;
}

async function getEspnMatchDetailDelayed(
  homeCode: string,
  awayCode: string,
  kickoff: Date,
): Promise<EspnMatchDetail | null> {
  const fresh = await fetchEspnMatchDetail(homeCode, awayCode, kickoff);
  const delay = liveDelayMs();
  if (delay <= 0) return fresh;

  const key = [up(homeCode), up(awayCode)].sort().join("|");
  const now = Date.now();
  const buf = liveHistory.get(key) ?? [];
  buf.push({ at: now, detail: fresh });
  // Purge ce qui est plus vieux que nécessaire (délai + marge).
  const cutoff = now - delay - 60_000;
  while (buf.length > 1 && buf[0].at < cutoff) buf.shift();
  liveHistory.set(key, buf);

  // Instantané le plus proche de (maintenant − délai).
  const target = now - delay;
  let chosen = buf[0];
  let best = Math.abs(buf[0].at - target);
  for (const s of buf) {
    const d = Math.abs(s.at - target);
    if (d <= best) {
      best = d;
      chosen = s;
    }
  }
  return chosen.detail;
}

// Mémoïsé par requête : la page match appelle ce détail plusieurs fois (score,
// pastille, fil/stats) — `cache` garantit un seul appel ESPN (et un seul
// instantané cohérent) par rendu.
export const getEspnMatchDetail = cache(getEspnMatchDetailDelayed);

/** Probabilité implicite (0–1) d'une cote moneyline américaine, sinon null. */
function impliedFromMoneyline(ml: number | string | undefined): number | null {
  const n = Number(ml);
  if (!Number.isFinite(n) || n === 0) return null;
  return n > 0 ? 100 / (n + 100) : -n / (-n + 100);
}
