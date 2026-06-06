import { test } from "node:test";
import assert from "node:assert/strict";
import { outcome, basePoints, computePoints } from "./scoring-core";
import { SCORING, STAGES } from "./constants";

test("outcome : signe du résultat", () => {
  assert.equal(outcome({ homeScore: 2, awayScore: 0 }), 1);
  assert.equal(outcome({ homeScore: 0, awayScore: 3 }), -1);
  assert.equal(outcome({ homeScore: 1, awayScore: 1 }), 0);
});

test("basePoints : score exact = EXACT", () => {
  assert.equal(
    basePoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }),
    SCORING.EXACT,
  );
  // nul exact aussi
  assert.equal(
    basePoints({ homeScore: 0, awayScore: 0 }, { homeScore: 0, awayScore: 0 }),
    SCORING.EXACT,
  );
});

test("basePoints : bon résultat + bon écart = DIFF", () => {
  // pari 2-1 (dom +1), réel 3-2 (dom +1) → même vainqueur, même écart, score différent
  assert.equal(
    basePoints({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 2 }),
    SCORING.DIFF,
  );
  // Cas nul : l'écart vaut 0 des deux côtés, donc un prono nul correct (score
  // différent) compte toujours « bon résultat + bon écart », jamais RESULT seul.
  assert.equal(
    basePoints({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 2 }),
    SCORING.DIFF,
  );
});

test("basePoints : bon résultat seul = RESULT", () => {
  // pari 2-1 sur réel 3-1 (cas validé dans la mémoire projet) → bon vainqueur, écart différent
  assert.equal(
    basePoints({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 1 }),
    SCORING.RESULT,
  );
});

test("basePoints : mauvais résultat = 0", () => {
  // pari victoire domicile, réel victoire extérieur
  assert.equal(
    basePoints({ homeScore: 2, awayScore: 0 }, { homeScore: 0, awayScore: 1 }),
    0,
  );
  // pari nul, réel victoire
  assert.equal(
    basePoints({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 0 }),
    0,
  );
});

test("computePoints : phase de groupes = points bruts", () => {
  assert.equal(
    computePoints(
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1 },
      STAGES.GROUP,
    ),
    SCORING.EXACT,
  );
});

test("computePoints : phases finales = ×KNOCKOUT_MULTIPLIER", () => {
  for (const stage of [STAGES.R32, STAGES.R16, STAGES.QF, STAGES.SF, STAGES.FINAL]) {
    assert.equal(
      computePoints(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 2, awayScore: 1 },
        stage,
      ),
      SCORING.EXACT * SCORING.KNOCKOUT_MULTIPLIER,
    );
  }
});

test("computePoints : mauvais prono reste 0 même en phase finale", () => {
  assert.equal(
    computePoints(
      { homeScore: 2, awayScore: 0 },
      { homeScore: 0, awayScore: 1 },
      STAGES.FINAL,
    ),
    0,
  );
});
