import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fromCm,
  toCm,
  selectionSize,
  rotatedBounds,
} from "../core/measurements";
import {
  initialProject,
  layer,
  parseProject,
  updateLayer,
} from "../core/model";
import { layerRasterKey } from "../core/artwork";
import { validGradient } from "../core/materials";
import { crc32, pngWithDpi, productionEntries } from "../core/production";
test("real unit conversion round trips", () => {
  for (const unit of ["mm", "cm", "in"] as const)
    assert.ok(Math.abs(toCm(fromCm(26, unit), unit) - 26) < 1e-8);
  assert.equal(fromCm(2.54, "in"), 1);
});
test("selection measurements never fabricate centimeters without calibration", () => {
  const l = layer("image", { w: 512, h: 256 });
  assert.equal(selectionSize(l, undefined), "512 × 256 px");
  assert.equal(
    selectionSize(l, { width: 52, height: 91.6, dpi: 300, safe: 1 }),
    "260 × 229 mm",
  );
  assert.equal(
    selectionSize(l, { width: 52, height: 91.6, dpi: 300, safe: 1 }, "cm"),
    "26 × 22.90 cm",
  );
});
test("rotated bounds cover the full print", () => {
  const b = rotatedBounds(
    layer("shape", { x: 0, y: 0, w: 400, h: 200, rotation: 90 }),
  );
  assert.ok(Math.abs(b.w - 200) < 1e-8);
  assert.ok(Math.abs(b.h - 400) < 1e-8);
});
test("raster cache excludes pointer transformations but includes visual edits", () => {
  const l = layer("text");
  assert.equal(
    layerRasterKey(l),
    layerRasterKey({
      ...l,
      id: "other",
      name: "new",
      x: 600,
      y: 23,
      rotation: 85,
      opacity: 0.2,
      locked: true,
    }),
  );
  assert.notEqual(layerRasterKey(l), layerRasterKey({ ...l, text: "new" }));
  assert.notEqual(layerRasterKey(l), layerRasterKey({ ...l, w: 700 }));
  assert.notEqual(layerRasterKey(l), layerRasterKey(l, 0.5));
});
test("equal updates do not generate history or render work", () => {
  const p = initialProject();
  assert.equal(
    updateLayer(p, "front", p.sides.front[0].id, { x: p.sides.front[0].x }),
    p,
  );
});
test("fabric and artwork gradients roundtrip with typography and new shapes", () => {
  const p = initialProject();
  p.appearance.gradient = {
    colors: ["#ff0000", "#00ff00", "#0000ff"],
    angle: 90,
  };
  p.appearance.material = "waffle";
  p.sides.front[0] = {
    ...p.sides.front[0],
    italic: true,
    lineHeight: 1.5,
    letterSpacing: 2,
    gradient: { colors: ["#ff0000", "#0000ff"], angle: 45 },
  };
  p.sides.back = [
    layer("shape", { shape: "triangle", outlineOnly: true, dashed: true }),
  ];
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
});
for (const bad of [
  { colors: ["#fff"], angle: 0 },
  { colors: ["red", "#ffffff"], angle: 0 },
  { colors: ["#ffffff", "#000000"], angle: Infinity },
  { colors: Array(6).fill("#ffffff"), angle: 0 },
])
  test("reject invalid gradient " + JSON.stringify(bad), () =>
    assert.equal(validGradient(bad), false),
  );
test("production exports require explicit measurements for every printed part", () => {
  const p = initialProject();
  assert.throws(() => productionEntries(p));
  p.printAreas = { front: { width: 40, height: 30, dpi: 300, safe: 1 } };
  const e = productionEntries(p);
  assert.equal(e.length, 2);
  assert.equal(e[0].widthCm, 30);
  assert.equal(e[0].xCm, 5);
  p.sides.back = [layer("shape")];
  assert.throws(() => productionEntries(p));
});
test("PNG pHYs metadata records actual target DPI with valid CRC", () => {
  const png = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/w8AAgMBApXlWQAAAABJRU5ErkJggg==",
      "base64",
    ),
  );
  const out = pngWithDpi(png, 300);
  const type = Buffer.from(out).indexOf("pHYs");
  assert.ok(type > 0);
  const v = new DataView(out.buffer);
  assert.equal(v.getUint32(type + 4), 11811);
  assert.equal(v.getUint32(type + 8), 11811);
  assert.equal(out[type + 12], 1);
  assert.equal(v.getUint32(type + 13), crc32(out.subarray(type, type + 13)));
  const again = pngWithDpi(out, 150);
  assert.equal(
    Buffer.from(again).indexOf("pHYs"),
    Buffer.from(again).lastIndexOf("pHYs"),
  );
});
