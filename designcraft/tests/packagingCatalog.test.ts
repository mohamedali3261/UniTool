import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { CARTON_PRESETS } from "../src/packaging/catalog";
import { cartonError, cartonGeometry } from "../src/packaging/geometry";
import { cartonArtwork } from "../src/packaging/artwork";
import { buildCarton } from "../src/packaging/preview3d/mesh";
import {
  atlasPixelsPerMm,
  previewTextureLimit,
} from "../src/packaging/preview3d/quality";
test("catalog has twelve unique physical proportions across all three families", () => {
  assert.equal(CARTON_PRESETS.length, 12);
  assert.equal(new Set(CARTON_PRESETS.map((p) => p.id)).size, 12);
  assert.equal(
    new Set(CARTON_PRESETS.map((p) => JSON.stringify(p.size))).size,
    12,
  );
  assert.deepEqual(
    new Set(CARTON_PRESETS.map((p) => p.category)),
    new Set(["compact", "tall", "wide"]),
  );
});
for (const preset of CARTON_PRESETS)
  test(`${preset.id}: printable, native editable artwork and matching 3D bounds`, () => {
    assert.equal(cartonError(preset.size), null);
    const g = cartonGeometry(preset.size),
      art = cartonArtwork(preset.size, preset.artwork);
    assert.ok(art.length > 20);
    assert.ok(art.every((o) => ["rect", "circle", "textbox"].includes(o.type)));
    assert.ok(!art.some((o) => o.type === "image"));
    if (preset.id !== "perfume")
      assert.ok(
        !art.some(
          (o) =>
            String(o.text || "").includes("PARFUM") ||
            String(o.text || "").includes("50 ml"),
        ),
      );
    const texture = new THREE.Texture(),
      model = buildCarton(preset.size, texture, g);
    model.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3()
      .setFromObject(model.root)
      .getSize(new THREE.Vector3());
    for (const [actual, expected] of [
      [bounds.x, preset.size.width],
      [bounds.y, preset.size.height],
      [bounds.z, preset.size.depth],
    ])
      assert.ok(Math.abs(actual - expected) < 1e-4);
    model.setFinish("satin");
    model.setFinish("matte");
    model.dispose();
    texture.dispose();
  });
test("preview budgets constrain texture area and long edges while increasing high-quality detail", () => {
  for (const mobile of [false, true])
    for (const quality of ["balanced", "high"] as const) {
      const limit = previewTextureLimit(quality, mobile);
      for (const [width, height] of [
        [262, 234],
        [1020, 40],
        [50, 840],
        [50, 50],
      ]) {
        const scale = atlasPixelsPerMm(width, height, limit.edge, limit.pixels);
        assert.ok(width * scale <= limit.edge + 1e-7);
        assert.ok(height * scale <= limit.edge + 1e-7);
        assert.ok(width * height * scale ** 2 <= limit.pixels + 1e-7);
        assert.ok(scale <= 32);
      }
    }
  assert.ok(
    atlasPixelsPerMm(262, 234, 4096, 16_000_000) >
      atlasPixelsPerMm(262, 234, 2048, 4_000_000),
  );
  assert.throws(() => atlasPixelsPerMm(0, 234, 2048, 4_000_000));
});
