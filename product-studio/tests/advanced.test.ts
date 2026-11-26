import { test } from "node:test";
import assert from "node:assert/strict";
import { initialProject, layer, parseProject } from "../core/model";
import { resizeCorner } from "../core/transforms";
import { snapPosition, printPixels, effectiveDpi } from "../core/advanced";
import { validateGlb } from "../core/glb";
test("corners resize around opposite anchor and preserve aspect ratio", () => {
  const l = layer("text", { x: 100, y: 100, w: 400, h: 200 });
  const p = resizeCorner(l, 100, 50, 1, 1);
  assert.equal(p.w / p.h, 2);
  assert.equal(p.x, 100);
  assert.equal(p.y, 100);
  const q = resizeCorner(l, -100, -50, -1, -1);
  assert.equal(q.x + q.w, 500);
  assert.equal(q.y + q.h, 300);
});
test("rotated resize remains finite and free ratio supports height only", () => {
  const l = layer("shape", { rotation: 90, lockRatio: false });
  const p = resizeCorner(l, -100, 0, 1, 1);
  assert.ok(p.h > l.h);
  assert.ok(Object.values(p).every(Number.isFinite));
});
test("snap aligns to canvas center and other layer edges", () => {
  const l = layer("shape", { w: 200, h: 200 });
  const p = snapPosition(l, 408, 410, []);
  assert.equal(p.x, 412);
  assert.equal(p.y, 412);
  assert.equal(p.gx, 512);
  const other = layer("shape", { x: 80, y: 80, w: 200, h: 200 });
  assert.equal(snapPosition(l, 85, 85, [other]).x, 80);
});
test("physical dimensions and effective DPI use real units", () => {
  assert.deepEqual(
    printPixels({ width: 25.4, height: 12.7, dpi: 300, safe: 1 }),
    { width: 3000, height: 1500 },
  );
  assert.equal(
    effectiveDpi(1500, 512, { width: 25.4, height: 25.4, dpi: 300, safe: 1 }),
    300,
  );
});
test("advanced layer settings round trip in project files", () => {
  const p = initialProject();
  Object.assign(p.sides.front[0], {
    flipX: true,
    outline: 4,
    curve: 35,
    brightness: 120,
    crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
  });
  p.printAreas = { front: { width: 30, height: 40, dpi: 300, safe: 1 } };
  const q = parseProject(JSON.stringify(p));
  assert.equal(q.sides.front[0].curve, 35);
  assert.equal(q.printAreas?.front?.width, 30);
});
for (const patch of [
  { brightness: Infinity },
  { contrast: -1 },
  { crop: { x: 0.5, y: 0, w: 0.9, h: 1 } },
  { flipX: "yes" },
  { curve: 999 },
  { outlineColor: "url(evil)" },
])
  test("reject malformed effect " + JSON.stringify(patch), () => {
    const p = initialProject();
    Object.assign(p.sides.front[0], patch);
    assert.throws(() => parseProject(JSON.stringify(p)));
  });
test("reject unsafe fonts and physical measurements", () => {
  const p = initialProject();
  p.fonts = [{ name: "Injected", data: "https://example.com/font.ttf" }];
  assert.throws(() => parseProject(JSON.stringify(p)));
  delete p.fonts;
  p.printAreas = { front: { width: -1, height: 30, dpi: 300, safe: 1 } };
  assert.throws(() => parseProject(JSON.stringify(p)));
});
function glb(json: object) {
  const text = new TextEncoder().encode(JSON.stringify(json));
  const n = Math.ceil(text.length / 4) * 4;
  const b = new ArrayBuffer(20 + n);
  const v = new DataView(b);
  v.setUint32(0, 0x46546c67, true);
  v.setUint32(4, 2, true);
  v.setUint32(8, b.byteLength, true);
  v.setUint32(12, n, true);
  v.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(b, 20).fill(32);
  new Uint8Array(b, 20, text.length).set(text);
  return b;
}
test("GLB validation accepts self contained JSON and rejects external assets", () => {
  assert.ok(validateGlb(glb({ asset: { version: "2.0" } })));
  assert.throws(() =>
    validateGlb(glb({ buffers: [{ uri: "https://example.com/private" }] })),
  );
  assert.throws(() => validateGlb(new ArrayBuffer(12)));
  assert.throws(() =>
    validateGlb(glb({ extensionsRequired: ["KHR_draco_mesh_compression"] })),
  );
});
