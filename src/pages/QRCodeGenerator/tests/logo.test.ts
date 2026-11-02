import { test } from "node:test";
import assert from "node:assert/strict";
import { logoBox, qrSvg, alphaBounds } from "../logo";
test("logo remains centered and clamped and has no extra backing or padding", () => {
  for (const percent of [0, 10, 16, 20, 100]) {
    const b = logoBox(256, 256, percent);
    assert.equal(b.x + b.size / 2, 128);
    assert.equal(b.y + b.size / 2, 128);
    assert.ok(b.size >= 25.6 && b.size <= 76.8);
    assert.equal(b.padding, 0);
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

test("transparent margins are cropped without erasing opaque white artwork", () => {
  const d = new Uint8ClampedArray(10 * 8 * 4);
  d[(2 * 10 + 3) * 4 + 3] = 255;
  d[(5 * 10 + 7) * 4 + 3] = 1;
  assert.deepEqual(alphaBounds(d, 10, 8), { x: 3, y: 2, width: 5, height: 4 });
  assert.equal(alphaBounds(new Uint8ClampedArray(16), 2, 2), null);
  d.fill(255);
  assert.deepEqual(alphaBounds(d, 10, 8), { x: 0, y: 0, width: 10, height: 8 });
});
test("above and below layouts reserve space without shrinking or covering the QR", async () => {
  const { logoLayout } = await import("../logo");
  for (const size of [128, 256, 512])
    for (const percent of [10, 16, 30]) {
      const above = logoLayout(size, percent, "above"),
        below = logoLayout(size, percent, "below");
      assert.ok(above.y + above.size < above.qrY);
      assert.equal(below.qrY, 0);
      assert.ok(below.y > size);
      assert.ok(below.y + below.size <= below.height);
      assert.equal(above.height, below.height);
      assert.equal(above.width, size);
      assert.equal(above.x + above.size / 2, size / 2);
    }
});
test("SVG applies optional background and outside positioning to both geometry and page height", async () => {
  const { logoLayout } = await import("../logo");
  const logo = { src: "data:image/png;base64,AA==", name: "logo" };
  for (const position of ["above", "center", "below"] as const) {
    const layout = logoLayout(256, 16, position);
    const svg = await qrSvg("test", 256, "#000000", "#ffffff", logo, 16, {
      position,
      background: "#ffcc00",
    });
    assert.ok(svg.includes(`height="${layout.height + 55}"`));
    assert.ok(svg.includes('fill="#ffcc00"'));
    assert.ok(svg.includes(`<image x="${layout.x}" y="${layout.y}"`));
  }
});
