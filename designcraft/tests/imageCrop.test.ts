import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCrop, ratioCrop, moveCrop } from '../src/utils/imageCrop';
test('crop clamps invalid edges and always retains source pixels', () => {
  assert.deepEqual(
    normalizeCrop(100, 80, {
      cropLeft: NaN,
      cropTop: -10,
      cropRight: Infinity,
    }),
    { cropLeft: 0, cropTop: 0, cropRight: 0, cropBottom: 0 },
  );
  const c = normalizeCrop(100, 80, {
    cropLeft: 200,
    cropRight: 100,
    cropTop: 200,
    cropBottom: 100,
  });
  assert.equal(100 - c.cropLeft - c.cropRight, 1);
  assert.equal(80 - c.cropTop - c.cropBottom, 1);
  assert.equal(
    normalizeCrop(100, 80, { cropLeft: 75 }).cropLeft,
    75,
    'can crop off more than half of one edge',
  );
});
for (const ratio of [1, 4 / 3, 3 / 4, 16 / 9, 9 / 16])
  test(`centered ${ratio} crop preserves requested ratio for scaled and portrait images`, () => {
    for (const [w, h] of [
      [800, 400],
      [400, 800],
      [800, 600],
    ]) {
      const c = ratioCrop(w, h, ratio);
      assert.ok(
        Math.abs(
          (w - c.cropLeft - c.cropRight) / (h - c.cropTop - c.cropBottom) -
            ratio,
        ) < 1e-10,
      );
      assert.equal(c.cropLeft, c.cropRight);
      assert.equal(c.cropTop, c.cropBottom);
    }
  });
test('drag keeps crop dimensions and stops exactly at image edges', () => {
  const c = ratioCrop(800, 400, 1),
    r = moveCrop(800, 400, c, 5000, -300);
  assert.equal(r.cropLeft, 400);
  assert.equal(r.cropRight, 0);
  assert.equal(r.cropTop, 0);
  assert.equal(800 - r.cropLeft - r.cropRight, 400);
  const l = moveCrop(800, 400, r, -5000, 5000);
  assert.equal(l.cropLeft, 0);
  assert.equal(l.cropRight, 400);
});
