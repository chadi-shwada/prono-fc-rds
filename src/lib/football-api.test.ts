import { test } from "node:test";
import assert from "node:assert/strict";
import { pitchScoreFromApi } from "./football-api";

// football-data plie les T.A.B. dans `fullTime`. Le barème doit noter le score
// du terrain (fin du temps réglementaire/prolongation), pas l'issue des tirs au
// but — sinon un prono exact (ex. 1-1) perd tous ses points quand les penaltys
// arrivent. Régression : Pays-Bas 1-1 Maroc, élimination aux T.A.B.

test("pitchScoreFromApi : retire les T.A.B. de fullTime", () => {
  // 1-1 a.p., Maroc gagne 4-2 aux tirs au but → football-data renvoie fullTime 5-3.
  assert.deepEqual(
    pitchScoreFromApi({
      winner: "AWAY_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 5, away: 3 },
      penalties: { home: 4, away: 2 },
    }),
    { home: 1, away: 1 },
  );
});

test("pitchScoreFromApi : exemple de la doc officielle (7-6 / 6-5 t.a.b.)", () => {
  assert.deepEqual(
    pitchScoreFromApi({
      winner: "HOME_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 7, away: 6 },
      penalties: { home: 6, away: 5 },
    }),
    { home: 1, away: 1 },
  );
});

test("pitchScoreFromApi : fullTime SANS T.A.B. pliés (penalties à part) → pas de score négatif", () => {
  // L'API n'est pas régulière : ici `fullTime` est déjà le score du terrain (1-1)
  // et `penalties` (2-4) est fourni à part. Soustraire donnerait 1-2 = -1 (bug
  // d'affichage « -1 - 1 »). On doit conserver le score du terrain tel quel.
  assert.deepEqual(
    pitchScoreFromApi({
      winner: "AWAY_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 1, away: 1 },
      penalties: { home: 2, away: 4 },
    }),
    { home: 1, away: 1 },
  );
});

test("pitchScoreFromApi : sans T.A.B., fullTime est déjà le bon score", () => {
  assert.deepEqual(
    pitchScoreFromApi({
      winner: "HOME_TEAM",
      duration: "REGULAR",
      fullTime: { home: 2, away: 1 },
    }),
    { home: 2, away: 1 },
  );
});

test("pitchScoreFromApi : prolongation sans T.A.B. (penalties absent)", () => {
  // 2-2 puis but en prolongation → fullTime 3-2, pas de penalties.
  assert.deepEqual(
    pitchScoreFromApi({
      winner: "HOME_TEAM",
      duration: "EXTRA_TIME",
      fullTime: { home: 3, away: 2 },
      penalties: null,
    }),
    { home: 3, away: 2 },
  );
});

test("pitchScoreFromApi : match non joué (scores null)", () => {
  assert.deepEqual(
    pitchScoreFromApi({
      winner: null,
      fullTime: { home: null, away: null },
    }),
    { home: null, away: null },
  );
});
