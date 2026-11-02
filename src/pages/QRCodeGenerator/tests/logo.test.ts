import { test } from "node:test";
import assert from "node:assert/strict";
import { logoBox, qrSvg } from "../logo";
test("logo remains centered and clamped to a conservative size", () => {
  for (const percent of [0, 10, 16, 20, 100]) {
    const b = logoBox(256, 256, percent);
    assert.equal(b.x + b.size / 2, 128);
    assert.equal(b.y + b.size / 2, 128);
    assert.ok(b.size >= 25.6 && b.size <= 51.2);
    assert.ok(b.size + b.padding * 2 <= 256 * 0.24 + 1e-9);
  }
});
test("SVG includes embedded logo and correctly sized credit area, retaining vector QR paths", async () => {
  const src = "data:image/png;base64,AA==",
    svg = await qrSvg(
      "https://example.com",
      256,
      "#000000",
      "#ffffff",
      { src, name: "test" },
      16,
    );
  assert.ok(svg.includes('viewBox="0 0 288 311"'));
  assert.ok(svg.includes("<path"));
  assert.ok(svg.includes(`<image `));
  assert.ok(svg.includes(`href="${src}"`));
  assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'));
  assert.ok(
    !(await qrSvg("test", 256, "#000000", "#ffffff", null, 16)).includes(
      "<image",
    ),
  );
});
