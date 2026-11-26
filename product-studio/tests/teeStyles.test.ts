import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { teeStyles, teePoint, deformTeeGeometry } from "../core/teeStyles";
import { initialProject, parseProject } from "../core/model";
test("seven distinct shirt silhouettes including fitted, wide, V and long sleeves", () => {
  assert.equal(teeStyles.length, 7);
  const signatures = teeStyles.map((s) =>
    [
      [-1.43, 0.52, 0.1],
      [0.8, -1.18, 0.1],
      [0, 1.055, 0.1],
      [0.7, -0.2, 0.1],
    ]
      .flatMap(([x, y, z]) => teePoint(x, y, z, s.id).toArray())
      .map((v) => v.toFixed(5))
      .join(","),
  );
  assert.equal(new Set(signatures).size, 7);
});
test("V neck only lowers front and leaves rear neck raised", () => {
  assert.ok(teePoint(0, 1.055, 0.1, "vneck").y < 0.86);
  assert.equal(teePoint(0, 1.155, -0.1, "vneck").y, 1.155);
  assert.equal(teePoint(0.7, 1, 0.1, "vneck").y, 1);
});
test("long sleeves extend down and out; boxy has shorter wider body", () => {
  const sleeve = teePoint(1.43, 0.52, 0.1, "longsleeve");
  assert.ok(sleeve.x > 1.8 && sleeve.y < -0.6);
  const box = teePoint(0.8, -1.18, 0.1, "boxy");
  assert.ok(box.x > 0.9 && box.y > -1);
});
test("every style is finite and preserves symmetry and continuous sewn boundaries", () => {
  for (const s of teeStyles)
    for (let x = 0; x < 1.5; x += 0.1)
      for (let y = -1.2; y < 1.2; y += 0.2) {
        const a = teePoint(x, y, 0.1, s.id),
          b = teePoint(-x, y, 0.1, s.id);
        assert.ok(a.toArray().every(Number.isFinite));
        assert.ok(Math.abs(a.x + b.x) < 1e-8 && Math.abs(a.y - b.y) < 1e-8);
        assert.ok(a.distanceTo(teePoint(x + 0.000001, y, 0.1, s.id)) < 0.0001);
      }
});
test("geometry warp preserves UVs and transforms normalized normals with finite bounds", () => {
  for (const s of teeStyles) {
    const g = new THREE.PlaneGeometry(1.25, 1.25, 8, 8);
    const uv = Array.from(g.attributes.uv.array);
    deformTeeGeometry(g, s.id);
    assert.deepEqual(Array.from(g.attributes.uv.array), uv);
    for (let i = 0; i < g.attributes.normal.count; i++) {
      const n = new THREE.Vector3().fromBufferAttribute(g.attributes.normal, i);
      assert.ok(Math.abs(n.length() - 1) < 1e-5);
    }
    g.computeBoundingBox();
    assert.ok(Number.isFinite(g.boundingBox!.max.x));
    g.dispose();
  }
});
test("shirt selection persists without touching artwork or legacy projects", () => {
  const p = initialProject(),
    art = JSON.stringify(p.sides);
  for (const s of teeStyles) {
    p.appearance.teeStyle = s.id;
    const loaded = parseProject(JSON.stringify(p));
    assert.equal(loaded.appearance.teeStyle, s.id);
    assert.equal(JSON.stringify(loaded.sides), art);
  }
  delete p.appearance.teeStyle;
  assert.ok(parseProject(JSON.stringify(p)));
  assert.throws(() =>
    parseProject(
      JSON.stringify({
        ...p,
        appearance: { ...p.appearance, teeStyle: "unknown" },
      }),
    ),
  );
});
