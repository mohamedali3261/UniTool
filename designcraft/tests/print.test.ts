import { test } from "node:test";
import assert from "node:assert/strict";
import { fabric } from "fabric";
import { DEFAULT_CARTON, MM_TO_PX } from "../src/packaging/geometry";
import {
  printSpec,
  pngWithDpi,
  assertPhysicalCanvas,
} from "../src/packaging/printMath";
import { cartonMask } from "../src/packaging/boundary";
import { withCartonPrecision } from "../src/packaging/precision";
import { imagePreflight } from "../src/packaging/print";
test("300/600 DPI pixel counts use exact nominal mm, independent of viewport", () => {
  const a = printSpec(DEFAULT_CARTON, 300),
    b = printSpec(DEFAULT_CARTON, 600);
  assert.equal(a.width, 3095);
  assert.equal(a.height, 2764);
  assert.equal(b.width, 6189);
  assert.equal(b.height, 5528);
  assert.equal(a.multiplier, 3.125);
  assert.equal(b.mmWidth, 262);
});
test("oversized rasters fail rather than silently reducing DPI; resized sheets fail closed", () => {
  assert.throws(
    () =>
      printSpec(
        { width: 300, height: 500, depth: 150, glue: 30, tuck: 30 },
        600,
      ),
    /PRINT_TOO_LARGE/,
  );
  assert.throws(
    () => assertPhysicalCanvas(DEFAULT_CARTON, 100, 100),
    /MISMATCH/,
  );
  assert.doesNotThrow(() =>
    assertPhysicalCanvas(DEFAULT_CARTON, 262 * MM_TO_PX, 234 * MM_TO_PX),
  );
});
test("PNG embeds one pHYs chunk in pixels/metre, including a valid CRC32", () => {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh9sAAAAASUVORK5CYII=",
    "base64",
  );
  const result = pngWithDpi(pngWithDpi(bytes, 300), 600);
  let i = 8,
    count = 0;
  while (i < result.length) {
    const v = new DataView(result.buffer, result.byteOffset + i),
      n = v.getUint32(0),
      name = String.fromCharCode(...result.slice(i + 4, i + 8));
    if (name === "pHYs") {
      count++;
      assert.equal(v.getUint32(8), 23622);
      assert.equal(v.getUint32(12), 23622);
      assert.equal(result[i + 16], 1);
      let c = 0xffffffff;
      for (const b of result.slice(i + 4, i + 17)) {
        c ^= b;
        for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
      assert.equal(v.getUint32(17), (c ^ 0xffffffff) >>> 0);
    }
    i += n + 12;
  }
  assert.equal(count, 1);
});
test("silhouette is a filled, non-stroked cut path at mm-to-pixel scale", () => {
  const m = cartonMask(DEFAULT_CARTON);
  assert.equal(m.type, "path");
  assert.equal(m.fill, "#000");
  assert.equal(m.strokeWidth, 0);
  assert.equal(m.scaleX, MM_TO_PX);
  assert.equal(m.scaleY, MM_TO_PX);
});
test("six-digit Fabric precision is restored even when serialization fails", () => {
  const old = fabric.Object.NUM_FRACTION_DIGITS;
  assert.throws(() =>
    withCartonPrecision(() => {
      assert.equal(fabric.Object.NUM_FRACTION_DIGITS, 6);
      throw Error("test");
    }),
  );
  assert.equal(fabric.Object.NUM_FRACTION_DIGITS, old);
});
test("low-resolution image warnings account for actual group/object scale", () => {
  const o = {
    type: "image",
    visible: true,
    opacity: 1,
    name: "Photo",
    getObjectScaling: () => ({ scaleX: 4, scaleY: 2 }),
  };
  const report = imagePreflight({ getObjects: () => [o] } as any, 300);
  assert.equal(report.low.length, 1);
  assert.equal(report.low[0].dpi, 24);
});
