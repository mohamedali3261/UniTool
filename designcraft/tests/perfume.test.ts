import { test } from "node:test";
import assert from "node:assert/strict";
import { PERFUME_PRESETS, cartonForBottle } from "../src/packaging/perfume";
import { cartonError, cartonGeometry } from "../src/packaging/geometry";
for (const p of PERFUME_PRESETS)
  test(`${p.ml} ml starter has matching opposing panels and valid closures`, () => {
    const s = p.size,
      g = cartonGeometry(s);
    assert.equal(cartonError(s), null);
    assert.equal(g.panels.length, 4);
    assert.deepEqual(
      g.panels.map((p) => [p.width, p.height]),
      [
        [s.width, s.height],
        [s.depth, s.height],
        [s.width, s.height],
        [s.depth, s.height],
      ],
    );
    assert.equal(g.width, 2 * (s.width + s.depth) + s.glue + 20);
    assert.equal(g.height, s.height + 2 * (s.depth + s.tuck) + 20);
    assert.equal(g.folds.length, 12);
    // Main cover spans exactly the depth; dust flaps leave a gap rather than crossing.
    assert.equal(g.folds[4][1] - g.folds[5][1], s.depth);
    assert.equal(g.folds[9][1] - g.folds[8][1], s.depth);
    assert.ok(
      2 * Math.min(s.width * 0.45, s.depth * 0.75, s.height * 0.4) < s.width,
    );
  });
test("measured bottle uses per-side clearance and keeps tabs valid", () => {
  const s = cartonForBottle(
    { length: 103.25, width: 43.5, depth: 31.2, clearance: 2 },
    { glue: 12, tuck: 12 },
  );
  assert.equal(s.height, 107.25);
  assert.equal(s.width, 47.5);
  assert.equal(s.depth, 35.2);
  assert.equal(s.tuck, 11.87);
  assert.equal(cartonError(s), null);
});
test("bottle sizing rejects invalid, missing or out-of-range dimensions", () => {
  for (const length of [NaN, 0, -1, Infinity, 1000])
    assert.throws(() =>
      cartonForBottle(
        { length, width: 40, depth: 30, clearance: 2 },
        { glue: 10, tuck: 8 },
      ),
    );
  assert.throws(() =>
    cartonForBottle(
      { length: 100, width: 40, depth: 30, clearance: -1 },
      { glue: 10, tuck: 8 },
    ),
  );
});
