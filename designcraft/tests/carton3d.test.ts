import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  cartonAssembly,
  paperPoint,
  polygonArea,
  foldStage,
} from "../src/packaging/preview3d/assembly";
import { buildCarton } from "../src/packaging/preview3d/mesh";
import {
  cartonGeometry,
  DEFAULT_CARTON,
  type CartonSize,
} from "../src/packaging/geometry";
const sizes: CartonSize[] = [
  DEFAULT_CARTON,
  { width: 40, height: 95, depth: 30, glue: 10, tuck: 10 },
  { width: 300, height: 500, depth: 150, glue: 25, tuck: 25 },
  { width: 20, height: 30, depth: 10, glue: 5, tuck: 5 },
];
const near = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-4, `${a} != ${b}`);
for (const size of sizes) {
  test(`${size.width}x${size.height}x${size.depth}: all 13 cut pieces exactly cover the net`, () => {
    const g = cartonGeometry(size),
      pieces = cartonAssembly(size);
    assert.equal(pieces.length, 13);
    assert.equal(new Set(pieces.map((p) => p.id)).size, 13);
    const cut = g.cut.match(/-?\d+(?:\.\d+)?/g)!.map(Number),
      outline: Array<[number, number]> = [];
    for (let i = 0; i < cut.length; i += 2) outline.push([cut[i], cut[i + 1]]);
    near(
      pieces.reduce((sum, p) => sum + polygonArea(p.polygon), 0),
      polygonArea(outline),
    );
    for (const piece of pieces)
      for (const vertex of piece.polygon) {
        const [x, y] = paperPoint(piece, vertex);
        assert.ok(x >= 0 && x <= g.width && y >= 0 && y <= g.height);
      }
  });
  test(`${size.width}x${size.height}x${size.depth}: closed dimensions and all six exterior normals are exact`, () => {
    const texture = new THREE.Texture(),
      model = buildCarton(size, texture, cartonGeometry(size));
    model.root.updateMatrixWorld(true);
    const all = new THREE.Box3().setFromObject(model.root),
      span = all.getSize(new THREE.Vector3());
    near(span.x, size.width);
    near(span.y, size.height);
    near(span.z, size.depth);
    const expected = {
      front: [0, 0, 1],
      right: [1, 0, 0],
      back: [0, 0, -1],
      left: [-1, 0, 0],
      top: [0, 1, 0],
      bottom: [0, -1, 0],
    };
    for (const [id, normal] of Object.entries(expected)) {
      const group = model.groups.get(id)!,
        n = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld);
      n.toArray().forEach((value, i) => near(value, normal[i]));
    }
    model.dispose();
    texture.dispose();
  });
  test(`${size.width}x${size.height}x${size.depth}: unfolded artwork coordinates align across every hinge`, () => {
    const g = cartonGeometry(size),
      model = buildCarton(size, new THREE.Texture(), g),
      f = g.panels[0];
    model.setFold(0);
    model.root.updateMatrixWorld(true);
    for (const piece of model.pieces)
      for (const point of piece.polygon) {
        const world = new THREE.Vector3(...point, 0).applyMatrix4(
            model.groups.get(piece.id)!.matrixWorld,
          ),
          paper = paperPoint(piece, point);
        near(world.x, paper[0] - (f.x + size.width / 2));
        near(world.y, f.y + size.height / 2 - paper[1]);
        near(world.z, size.depth / 2);
      }
    model.dispose();
  });
}
test("body, dust, lids and tuck close in sequence rather than burying the flaps first", () => {
  assert.equal(foldStage("body", 0.55), 1);
  assert.equal(foldStage("lid", 0.55), 0);
  assert.equal(foldStage("dust", 0.72), 1);
  assert.equal(foldStage("tuck", 0.9), 0);
  for (const role of ["body", "lid", "dust", "tuck", "glue"] as const) {
    assert.equal(foldStage(role, 0), 0);
    assert.equal(foldStage(role, 1), 1);
  }
});
test("geometry is finite, UV mapped to the original sheet, and resources can be repeatedly released", () => {
  for (let iteration = 0; iteration < 3; iteration++) {
    const texture = new THREE.Texture(),
      model = buildCarton(
        DEFAULT_CARTON,
        texture,
        cartonGeometry(DEFAULT_CARTON),
      );
    model.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        for (const value of geometry.attributes.position.array)
          assert.ok(Number.isFinite(value));
        for (const value of geometry.attributes.uv.array)
          assert.ok(value >= 0 && value <= 1);
        assert.equal(geometry.groups.length, 3);
      }
    });
    model.dispose();
    texture.dispose();
  }
});
