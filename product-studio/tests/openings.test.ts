import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  flatTeeShape,
  flatTeeMesh,
  teeSurfaceDepth,
  sleeveUV,
  backNeckLift,
} from "../core/flatTee";
import { defaultAppearance } from "../core/fabric";
function hits(origin: THREE.Vector3, direction: THREE.Vector3, far: number) {
  const g = flatTeeMesh("#ddddcc", defaultAppearance);
  g.updateMatrixWorld(true);
  return new THREE.Raycaster(
    origin,
    direction.normalize(),
    0,
    far,
  ).intersectObject(g, true);
}
test("lower hem is an opening, not a sealed cap", () => {
  assert.equal(
    hits(new THREE.Vector3(0, -1.55, 0), new THREE.Vector3(0, 1, 0), 0.8)
      .length,
    0,
  );
});
test("neck has no panel bridging front and back", () => {
  assert.equal(
    hits(new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, -1, 0), 0.8).length,
    0,
  );
});
for (const sign of [-1, 1])
  test(`sleeve ${sign} has an open cuff`, () => {
    const center = new THREE.Vector3(sign * 1.275, 0.385, 0),
      axis = new THREE.Vector3(sign * 0.657, -0.754, 0);
    assert.equal(
      hits(
        center.clone().addScaledVector(axis, 0.2),
        axis.clone().negate(),
        0.4,
      ).length,
      0,
    );
  });
test("the shell closes at sewn side seams, not at garment openings", () => {
  assert.ok(teeSurfaceDepth(0.8, -1.18, 0.5) < 0.002);
  assert.ok(teeSurfaceDepth(0, -1.215, 0.5) > 0.1);
  assert.ok(backNeckLift(0, 1.055) > 0.09);
});
test("sleeve print uses a full local patch, not a cropped torso UV", () => {
  const uv = sleeveUV(1.02, 0.59);
  assert.ok(uv.x > 0.25 && uv.x < 0.75);
  assert.ok(uv.y > 0.25 && uv.y < 0.75);
  const a = sleeveUV(-1.02, 0.59);
  assert.ok(a.distanceTo(uv) < 1e-10);
});
test("there are separate unprinted inner faces and sleeve rear panels", () => {
  const g = flatTeeMesh("#ddddcc", defaultAppearance);
  const outer = g.getObjectByName("leftSleeve") as THREE.Mesh,
    inner = g.getObjectByName("leftSleeve-lining") as THREE.Mesh;
  assert.ok(inner);
  assert.equal((outer.material as THREE.Material).side, THREE.FrontSide);
  assert.equal((inner.material as THREE.Material).side, THREE.BackSide);
  assert.ok(g.getObjectByName("leftSleeve_back"));
});

test("every sampled sewn boundary joins front and back without cracks", () => {
  flatTeeShape().curves.forEach((curve, index) => {
    if ([0, 3, 6, 9].includes(index)) return;
    const points = curve.getPoints(14);
    for (let i = 0; i < points.length - 1; i++)
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const p = points[i].clone().lerp(points[i + 1], t);
        assert.ok(
          teeSurfaceDepth(p.x, p.y, 1) < 0.00001,
          `seam ${index} at ${p.x},${p.y}`,
        );
      }
  });
});
