import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { distributePositions, union } from "../src/advanced/core/arrange";
import { faces, offsetCut, validatePrint } from "../src/advanced/core/faces";
import { DEFAULT_CARTON, cartonGeometry } from "../src/packaging/geometry";
import { validateBrand } from "../src/advanced/core/brand";
import {
  saveRecovery,
  recoveryPoints,
  deleteRecovery,
} from "../src/advanced/core/recovery";
import { parseProjectFile } from "../src/utils/projectFile";
Object.assign(globalThis, { indexedDB });
test("equal gaps account for different widths, preserve endpoints and original order indices", () => {
  const boxes = [
    { left: 400, top: 0, width: 100, height: 30 },
    { left: 20, top: 0, width: 60, height: 30 },
    { left: 140, top: 0, width: 80, height: 30 },
  ];
  const changes = distributePositions(boxes, "x");
  const after = changes.map((c) => ({
    ...boxes[c.index],
    left: boxes[c.index].left + c.delta,
  }));
  assert.equal(after[0].left, 20);
  assert.equal(after[2].left, 400);
  assert.equal(
    after[1].left - after[0].left - after[0].width,
    after[2].left - after[1].left - after[1].width,
  );
  assert.throws(() => distributePositions(boxes.slice(0, 2), "x"));
});
test("vertical distribution permits overlap without corrupting endpoints", () => {
  const b = [
    { left: 0, top: 0, width: 10, height: 100 },
    { left: 0, top: 10, width: 10, height: 100 },
    { left: 0, top: 40, width: 10, height: 100 },
  ];
  const p = distributePositions(b, "y");
  assert.equal(p[0].delta, 0);
  assert.equal(p[2].delta, 0);
  assert.ok(p[0].gap < 0);
  assert.deepEqual(union(b), { left: 0, top: 0, width: 10, height: 140 });
});
test("six carton faces use the actual shared cut geometry", () => {
  const f = faces(DEFAULT_CARTON),
    g = cartonGeometry(DEFAULT_CARTON);
  assert.equal(f.length, 6);
  assert.equal(f[0].x, g.panels[0].x);
  assert.equal(f[4].y, f[0].y - DEFAULT_CARTON.depth);
  assert.equal(f[5].y, f[2].y + DEFAULT_CARTON.height);
});
test("polygon bleed expands and safety contracts including concave flaps", () => {
  const numbers = (s: string) => s.match(/-?\d+(?:\.\d+)?/g)!.map(Number),
    source = numbers(cartonGeometry(DEFAULT_CARTON).cut),
    outer = numbers(offsetCut(DEFAULT_CARTON, 3)),
    inner = numbers(offsetCut(DEFAULT_CARTON, -3));
  const minX = (a: number[]) => Math.min(...a.filter((_, i) => i % 2 === 0));
  assert.ok(minX(outer) < minX(source));
  assert.ok(minX(inner) > minX(source));
  assert.ok(offsetCut(DEFAULT_CARTON, 0).endsWith("Z"));
});
test("print settings reject NaN, oversized margins and string booleans", () => {
  for (const patch of [{ safeMm: NaN }, { bleedMm: 9 }, { showGuides: "yes" }])
    assert.throws(() =>
      validatePrint({ safeMm: 3, bleedMm: 3, showGuides: false, ...patch }),
    );
});
test("brand data is validated rather than executing imported SVG or URLs", () => {
  assert.equal(
    validateBrand({ name: "Brand", colors: ["#123456"], font: "Cairo" }).font,
    "Cairo",
  );
  for (const patch of [
    { colors: ["url(x)"] },
    { logo: "https://example.com/x.png" },
    { logo: "data:image/svg+xml;base64,AAAA" },
  ])
    assert.throws(() =>
      validateBrand({
        name: "Brand",
        colors: ["#123456"],
        font: "Cairo",
        ...patch,
      }),
    );
});
test("project files retain print settings and fitting modes", () => {
  const file = {
    format: "unitool-designcraft",
    version: 1,
    project: {
      title: "A",
      width: 800,
      height: 600,
      studio: { safeMm: 4, bleedMm: 2, showGuides: true },
      canvasData: {
        objects: [
          {
            type: "textbox",
            text: "Hi",
            textFitMode: "shrink",
            textFitHeight: 100,
            textFitMaxSize: 40,
          },
        ],
      },
    },
  };
  assert.equal(parseProjectFile(file).studio!.safeMm, 4);
  assert.equal(
    parseProjectFile(file).canvasData.objects[0].textFitMode,
    "shrink",
  );
});
test("IndexedDB keeps five recovery points per design and removes only that design", async () => {
  for (let i = 0; i < 7; i++) {
    await saveRecovery("A", JSON.stringify({ i }));
  }
  await saveRecovery("B", "other");
  assert.equal((await recoveryPoints("A")).length, 5);
  assert.equal((await recoveryPoints("B")).length, 1);
  await deleteRecovery("A");
  assert.equal((await recoveryPoints("A")).length, 0);
  assert.equal((await recoveryPoints("B")).length, 1);
});
