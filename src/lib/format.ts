// Fuseau imposé : les horaires sont affichés en heure de Paris quelle que soit
// la timezone du serveur (un conteneur Docker tourne en UTC par défaut).
const TZ = "Europe/Paris";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

/** ex: "sam. 14 juin, 18:00" */
export function formatKickoff(d: Date): string {
  return dateFmt.format(d);
}

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

const dateShortFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

/** ex: "sam. 14 juin" (sans l'heure). */
export function formatDateShort(d: Date): string {
  return dateShortFmt.format(d);
}

const dayKeyFmt = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});

const dayLabelFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});

/** Clé de regroupement par jour (ex: "2026-06-11"). */
export function dayKey(d: Date): string {
  return dayKeyFmt.format(d);
}

/** Libellé d'un jour, 1re lettre en majuscule (ex: "Jeudi 11 juin"). */
export function formatDayLabel(d: Date): string {
  const s = dayLabelFmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
