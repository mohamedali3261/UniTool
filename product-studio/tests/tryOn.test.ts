import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultTryOn,
  validateTryOn,
  validQuad,
  bilinear,
  quadArea,
} from "../core/tryOn";
import { initialProject, parseProject } from "../core/model";
test("stock model preset has valid independent calibration copies", () => {
  const m = defaultTryOn(),
    f = defaultTryOn();
  assert.ok(validateTryOn(m));
  assert.ok(validateTryOn(f));
  assert.deepEqual(m.mask, f.mask);
  assert.notEqual(m.mask, f.mask);
  m.mask[0].x = 0;
  assert.notEqual(defaultTryOn().mask[0].x, 0);
});
test("bilinear mapping preserves all corners and maps the center", () => {
  const q = [
    { x: 0, y: 0 },
    { x: 1, y: 0.1 },
    { x: 0.8, y: 1 },
    { x: 0.1, y: 0.8 },
  ];
  assert.deepEqual(bilinear(q, 0, 0), q[0]);
  assert.deepEqual(bilinear(q, 1, 0), q[1]);
  assert.deepEqual(bilinear(q, 1, 1), q[2]);
  assert.deepEqual(bilinear(q, 0, 1), q[3]);
  const center = bilinear(q, 0.5, 0.5);
  assert.ok(Math.abs(center.x - 0.475) < 1e-12);
  assert.ok(Math.abs(center.y - 0.475) < 1e-12);
  assert.ok(quadArea(q) > 0.5);
});
test("collapsed, self-crossing and out-of-bounds print quads are rejected", () => {
  assert.equal(
    validQuad([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ]),
    false,
  );
  assert.equal(validQuad(Array(4).fill({ x: 0.5, y: 0.5 })), false);
  const q = defaultTryOn().quad;
  q[0].x = -1;
  assert.equal(validQuad(q), false);
});
test("custom photos must be embedded raster images, not external URLs or SVG", () => {
  for (const photo of [
    "https://example.com/person.png",
    "data:image/svg+xml;base64,abc",
    "",
  ]) {
    const t = { ...defaultTryOn(), source: "custom" as const, photo };
    assert.equal(validateTryOn(t), false);
  }
});
test("try-on settings survive save/load and older projects migrate", () => {
  const p = initialProject();
  p.tryOn = defaultTryOn();
  p.tryOn.strength = 0.4;
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
  const old: any = initialProject();
  delete old.tryOn;
  delete old.appearance.fit;
  const q = parseProject(JSON.stringify(old));
  assert.equal(q.tryOn.source, "man");
  assert.equal(q.appearance.fit, "regular");
});
test("project import rejects malicious or unusable try-on data", () => {
  for (const patch of [
    { strength: 3 },
    { mask: [] },
    { source: "wrong" },
    { quad: [{ x: NaN, y: 0 }] },
  ]) {
    const p = initialProject();
    Object.assign(p.tryOn, patch);
    assert.throws(() => parseProject(JSON.stringify(p)));
  }
});

test("removed stock model migrates to the retained male model", () => {
  const p: any = initialProject();
  p.tryOn.source = "woman";
  const q = parseProject(JSON.stringify(p));
  assert.equal(q.tryOn.source, "man");
});
