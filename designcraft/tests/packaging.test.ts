import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import {
  cartonGeometry,
  cartonError,
  cartonSvg,
  DEFAULT_CARTON,
  MM_TO_PX,
  paperFor,
} from "../src/packaging/geometry";
import { cartonPdf } from "../src/packaging/export";
import { createCartonProject } from "../src/packaging/project";
import { physicalCartonSvg } from "../src/packaging/physicalSvg";
test("four carton faces and twelve crease lines match physical dimensions", () => {
  const a = cartonGeometry(DEFAULT_CARTON);
  assert.equal(a.width, 262);
  assert.equal(a.height, 234);
  assert.equal(a.folds.length, 12);
  assert.deepEqual(
    a.panels.map((p) => p.width),
    [80, 35, 80, 35],
  );
  assert.equal(paperFor(a), "A3");
});
test("decimal dimensions are preserved in physical SVG units", () => {
  const s = {
    width: 100.5,
    height: 150.2,
    depth: 40.1,
    glue: 12.5,
    tuck: 12.2,
  };
  assert.equal(cartonGeometry(s).width, 313.7);
  assert.equal(cartonGeometry(s).height, 274.8);
  assert.ok(cartonSvg(s).includes('width="313.7mm"'));
  assert.ok(!cartonSvg(s).includes("<text"));
  assert.ok(cartonSvg(s, true).includes("W 100.5 mm"));
});
test("invalid values and oversized tabs are rejected", () => {
  for (const patch of [
    { width: NaN },
    { depth: Infinity },
    { height: 0 },
    { glue: 40 },
    { tuck: 31 },
    { width: 20, glue: 12 },
  ]) {
    const s = { ...DEFAULT_CARTON, ...patch };
    assert.ok(cartonError(s));
    assert.throws(() => cartonGeometry(s));
  }
  assert.equal(
    cartonError({ width: 20, height: 30, depth: 10, glue: 5, tuck: 5 }),
    null,
  );
});
test("all cut vertices remain inside nominal sheet margins", () => {
  for (const s of [
    DEFAULT_CARTON,
    { width: 20, height: 30, depth: 10, glue: 5, tuck: 5 },
    { width: 300, height: 500, depth: 150, glue: 30, tuck: 30 },
  ]) {
    const a = cartonGeometry(s),
      points = a.cut.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    for (let i = 0; i < points.length; i += 2) {
      assert.ok(points[i] >= 10 && points[i] <= a.width - 10);
      assert.ok(points[i + 1] >= 10 && points[i + 1] <= a.height - 10);
    }
  }
});
test("native project stores physical metadata and thirteen locked guide objects", () => {
  const p = createCartonProject(DEFAULT_CARTON, "Box");
  assert.equal(p.canvasData.objects.length, 13);
  assert.equal(p.canvasData.objects[0].type, "path");
  assert.equal(p.width, 262 * MM_TO_PX);
  assert.deepEqual(p.packaging?.size, DEFAULT_CARTON);
  assert.ok(
    p.canvasData.objects.every(
      (o: any) => o.locked && !o.selectable && o.lockScalingX,
    ),
  );
});
test("PDF has exact physical page dimensions and no raster image objects", async () => {
  const doc = await PDFDocument.load(await cartonPdf(DEFAULT_CARTON)),
    p = doc.getPage(0);
  assert.ok(Math.abs((p.getWidth() * 25.4) / 72 - 262) < 0.001);
  assert.ok(Math.abs((p.getHeight() * 25.4) / 72 - 234) < 0.001);
  assert.ok(p.node.Contents());
  const images = p.node.Resources()?.lookup(PDFName.of("XObject")) as
    PDFDict | undefined;
  assert.equal(images?.keys().length ?? 0, 0);
});
test("resized canvas does not falsely claim original physical size", () => {
  const svg = '<svg width="100"/>';
  assert.equal(physicalCartonSvg(svg, DEFAULT_CARTON, 100, 100), svg);
});
