// Structure officielle du tableau final de la CDM 2026 (format 48 équipes).
// Les seizièmes (Round of 32) sont définis par des "places" de groupe :
//   1E = 1er du groupe E, 2A = 2e du groupe A, 3ABCDF = un des meilleurs 3es.
// Les équipes réelles ne sont connues qu'après la phase de groupes.

export type Slot = { a: string; b: string };

// Demi-tableau gauche (haut → bas), 8 affiches.
export const LEFT_R32: Slot[] = [
  { a: "1E", b: "3 A/B/C/D/F" },
  { a: "1I", b: "3 C/D/F/G/H" },
  { a: "2A", b: "2B" },
  { a: "1F", b: "2C" },
  { a: "2K", b: "2L" },
  { a: "1H", b: "2J" },
  { a: "1D", b: "3 B/E/F/I/J" },
  { a: "1G", b: "3 A/E/H/I/J" },
];

// Demi-tableau droit (haut → bas), 8 affiches.
export const RIGHT_R32: Slot[] = [
  { a: "1C", b: "2F" },
  { a: "2E", b: "2I" },
  { a: "1A", b: "3 C/E/F/H/I" },
  { a: "1L", b: "3 E/H/I/J/K" },
  { a: "1J", b: "2H" },
  { a: "2D", b: "2G" },
  { a: "1B", b: "3 E/F/G/I/J" },
  { a: "1K", b: "3 D/E/I/J/L" },
];
