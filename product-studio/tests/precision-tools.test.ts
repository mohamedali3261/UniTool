import { test } from "node:test";
import assert from "node:assert/strict";
import {
  moveCrop,
  resizeCrop,
  aspectCrop,
  alphaCrop,
  fullCrop,
} from "../core/crop";
import {
  gradientPositions,
  insertGradientStop,
  moveGradientStop,
  removeGradientStop,
  validGradient,
  sampleGradient,
} from "../core/materials";
import { initialProject, parseProject } from "../core/model";
import { traceMask } from "../core/vectorTrace";
test("crop movement stays inside source image", () => {
  assert.deepEqual(moveCrop({ x: 0.2, y: 0.1, w: 0.4, h: 0.5 }, 8, -5), {
    x: 0.6,
    y: 0,
    w: 0.4,
    h: 0.5,
  });
  assert.deepEqual(fullCrop, { x: 0, y: 0, w: 1, h: 1 });
});
test("all eight crop handles maintain positive bounded rectangles", () => {
  for (const sx of [-1, 0, 1])
    for (const sy of [-1, 0, 1])
      for (const dx of [-4, -0.3, 0.1, 3]) {
        const r = resizeCrop(
          { x: 0.2, y: 0.3, w: 0.4, h: 0.5 },
          dx,
          -dx,
          sx,
          sy,
        );
        assert.ok(r.x >= 0 && r.y >= 0);
        assert.ok(r.w >= 0.009999 && r.h >= 0.009999);
        assert.ok(r.x + r.w <= 1.00001 && r.y + r.h <= 1.00001);
      }
});
test("aspect crop is based on physical image aspect not a stretched preview", () => {
  for (const ratio of [1, 4 / 5, 16 / 9]) {
    const c = aspectCrop(320, 200, ratio);
    assert.ok(Math.abs((c.w * 320) / (c.h * 200) - ratio) < 1e-8);
    assert.ok(c.x >= 0 && c.y >= 0);
  }
});
test("transparent trim selection is non-destructive normalized coordinates", () => {
  const d = new Uint8ClampedArray(4 * 4 * 4);
  d[(1 * 4 + 1) * 4 + 3] = 255;
  d[(2 * 4 + 2) * 4 + 3] = 255;
  assert.deepEqual(alphaCrop(d, 4, 4), { x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
  assert.throws(() => alphaCrop(new Uint8ClampedArray(16), 2, 2));
});
const gradient = { colors: ["#000000", "#ffffff"], angle: 0 };
test("legacy gradients retain even stop positions", () =>
  assert.deepEqual(gradientPositions(gradient), [0, 1]));
test("stop insertion samples the current ramp and preserves offsets", () => {
  assert.equal(sampleGradient(gradient, 0.5), "#808080");
  const g = insertGradientStop(gradient, 0.25);
  assert.deepEqual(g.positions, [0, 0.25, 1]);
  assert.equal(g.colors[1], "#404040");
  assert.ok(validGradient(g));
});
test("stop movement clamps at neighbors and removal preserves remaining offsets", () => {
  let g = insertGradientStop(gradient, 0.25);
  g = moveGradientStop(g, 1, 5);
  assert.deepEqual(g.positions, [0, 1, 1]);
  g = moveGradientStop(g, 1, -8);
  assert.deepEqual(g.positions, [0, 0, 1]);
  g = moveGradientStop(g, 1, 0.3);
  assert.deepEqual(removeGradientStop(g, 0).positions, [0.3, 1]);
  assert.equal(removeGradientStop(gradient, 0), gradient);
});
test("five-stop limit and nonfinite offsets are safe", () => {
  let g = gradient;
  for (let i = 0; i < 8; i++) g = insertGradientStop(g, 0.5);
  assert.equal(g.colors.length, 5);
  assert.ok(validGradient(insertGradientStop(gradient, NaN)));
});
for (const positions of [[0], [0.8, 0.2], [0, Infinity], [-1, 1], [0, 1.1]])
  test("reject malformed stop positions " + positions, () =>
    assert.equal(validGradient({ ...gradient, positions }), false),
  );
test("explicit positions round trip for both fabric and artwork", () => {
  const p = initialProject();
  p.appearance.gradient = { ...gradient, positions: [0.2, 0.8] };
  p.sides.front[0].gradient = { ...gradient, positions: [0.1, 0.4] };
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
});
test("mask tracing emits vector runs, preserves white holes and ignores transparency", () => {
  const d = new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 255,
  ]);
  const path = traceMask(d, 2, 2);
  assert.equal(path, "M0 0h1v1h-1zM1 1h1v1h-1z");
  assert.equal(traceMask(new Uint8ClampedArray(16), 2, 2), "");
});
