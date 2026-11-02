import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ART_STYLES,
  DEFAULT_ARTWORK,
  cartonArtwork,
  artworkPreview,
} from "../src/packaging/artwork";
import { PERFUME_PRESETS } from "../src/packaging/perfume";
import { createCartonProject } from "../src/packaging/project";
for (const style of Object.keys(ART_STYLES) as (keyof typeof ART_STYLES)[])
  test(`${style}: native artwork remains editable and preserves physical guides`, () => {
    const size = PERFUME_PRESETS[1].size,
      options = { ...DEFAULT_ARTWORK, style };
    const art = cartonArtwork(size, options),
      p = createCartonProject(size, "Test");
    assert.ok(art.length > 20);
    assert.ok(art.some((o) => o.type === "textbox" && o.text === "NOCTURNE"));
    assert.ok(
      art.every(
        (o) => o.selectable && o.evented && !o.id.startsWith("packaging-"),
      ),
    );
    assert.equal(new Set(art.map((o) => o.id)).size, art.length);
    assert.ok(
      art.every((o) =>
        [o.left, o.top, o.width ?? 0, o.height ?? 0].every(Number.isFinite),
      ),
    );
    assert.equal(p.canvasData.objects.length, 13);
    assert.ok(p.canvasData.clipPath);
    assert.equal(cartonArtwork(size, DEFAULT_ARTWORK).length, 0);
  });
test("preview escapes custom text, clips all artwork and keeps suggested safe area preview-only", () => {
  const size = PERFUME_PRESETS[0].size,
    options = {
      ...DEFAULT_ARTWORK,
      style: "rose" as const,
      brand: '<script>"&',
      product: "A & B",
    };
  const svg = artworkPreview(size, options, true, true);
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("art-preview-mask"));
  assert.ok(svg.includes("suggested-safe-area"));
  assert.ok(
    !artworkPreview(size, options, false).includes("suggested-safe-area"),
  );
  assert.ok(
    !cartonArtwork(size, options).some((o) => o.id === "suggested-safe-area"),
  );
});
