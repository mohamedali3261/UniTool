import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialProject,
  layer,
  parseProject,
  reorder,
  updateLayer,
} from "../core/model";
import { historyReducer, type History } from "../core/history";
import { garmentMesh, garmentShape } from "../core/garment";
import { Mesh } from "three";
test("new projects have separate front and back, and unique IDs", () => {
  const a = initialProject(),
    b = initialProject();
  assert.notEqual(a.sides.front[0].id, b.sides.front[0].id);
  assert.equal(a.sides.back.length, 0);
});
test("JSON roundtrip preserves all editable details", () => {
  const p = initialProject();
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
});
test("layer changes are immutable and side-specific", () => {
  const p = initialProject(),
    id = p.sides.front[0].id,
    q = updateLayer(p, "front", id, { x: 80 });
  assert.equal(q.sides.front[0].x, 80);
  assert.equal(p.sides.front[0].x, 128);
  assert.equal(q.sides.back, p.sides.back);
});
test("z order works in both directions, bounded at edges", () => {
  const p = initialProject(),
    id = p.sides.front[0].id,
    q = reorder(p, "front", id, 1);
  assert.equal(q.sides.front[1].id, id);
  assert.deepEqual(reorder(q, "front", id, -1), p);
  assert.equal(reorder(p, "front", id, -1), p);
});
test("history coalesces a drag into exactly one undo step", () => {
  const p = initialProject();
  let h: History = { present: p, past: [], future: [], origin: null };
  h = historyReducer(h, { type: "begin" });
  for (let i = 0; i < 20; i++)
    h = historyReducer(h, { type: "set", project: { ...p, name: String(i) } });
  h = historyReducer(h, { type: "end" });
  assert.equal(h.past.length, 1);
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present, p);
  h = historyReducer(h, { type: "redo" });
  assert.equal(h.present.name, "19");
});
test("empty gesture adds no undo step and new edits clear redo", () => {
  const p = initialProject();
  let h: History = { present: p, past: [], future: [p], origin: null };
  h = historyReducer(historyReducer(h, { type: "begin" }), { type: "end" });
  assert.equal(h.past.length, 0);
  h = historyReducer(h, { type: "set", project: { ...p, name: "new" } });
  assert.equal(h.future.length, 0);
});
for (const product of ["tee", "hoodie", "tote", "sweatshirt"] as const)
  test(`${product} has real triangulated 3D geometry and finite coordinates`, () => {
    const shape = garmentShape(product);
    assert.ok(shape.getPoints().length > 5);
    const group = garmentMesh(product, "#234567");
    let count = 0;
    group.traverse((o) => {
      if (o instanceof Mesh) {
        count++;
        const a = o.geometry.attributes.position;
        for (let i = 0; i < a.count; i++)
          assert.ok(
            Number.isFinite(a.getX(i)) &&
              Number.isFinite(a.getY(i)) &&
              Number.isFinite(a.getZ(i)),
          );
        o.geometry.dispose();
      }
    });
    assert.ok(count >= 2);
  });
for (const [name, mutate] of Object.entries({
  version: (p: any) => (p.version = 2),
  product: (p: any) => (p.product = "unknown"),
  color: (p: any) => (p.color = "url(test)"),
  remoteImage: (p: any) => (p.sides.front[0].src = "https://example.com/a.png"),
  badGeometry: (p: any) => (p.sides.front[0].w = -1),
  duplicate: (p: any) => p.sides.front.push(p.sides.front[0]),
  tooMany: (p: any) =>
    (p.sides.back = Array.from({ length: 101 }, () => layer("text"))),
  missingSides: (p: any) => delete p.sides,
}))
  test(`reject invalid project: ${name}`, () => {
    const p = initialProject();
    mutate(p);
    assert.throws(() => parseProject(JSON.stringify(p)));
  });

test("legacy projects gain appearance and additional print panels", () => {
  const p: any = initialProject();
  delete p.appearance;
  delete p.sides.leftSleeve;
  delete p.sides.rightSleeve;
  delete p.sides.hoodLeft;
  delete p.sides.hoodRight;
  const restored = parseProject(JSON.stringify(p));
  assert.equal(restored.appearance.pose, "pockets");
  assert.deepEqual(restored.sides.leftSleeve, []);
});
test("reject invalid appearance settings", () => {
  for (const settings of [
    { wrinkles: 8 },
    { roughness: -1 },
    { lightPower: "huge" },
    { pose: "invalid" },
  ]) {
    const p = initialProject();
    Object.assign(p.appearance, settings);
    assert.throws(() => parseProject(JSON.stringify(p)));
  }
});
test("hoodie is volumetric with named hollow hood, sleeves, cuffs and pocket", () => {
  const group = garmentMesh("hoodie", "#dfd7c6");
  for (const name of [
    "torso",
    "leftSleeve",
    "rightSleeve",
    "hoodLeft",
    "hoodRight",
    "kangaroo-pocket",
    "waistband",
  ])
    assert.ok(group.getObjectByName(name), name);
  const torso = group.getObjectByName("torso") as Mesh;
  torso.geometry.computeBoundingBox();
  const box = torso.geometry.boundingBox!;
  assert.ok(box.max.z - box.min.z > 0.5);
});
test("sleeve and hood layers are independent and survive a project roundtrip", () => {
  const p = initialProject();
  p.sides.leftSleeve.push(layer("text", { text: "LEFT" }));
  p.sides.hoodRight.push(layer("shape", { shape: "star" }));
  const q = parseProject(JSON.stringify(p));
  assert.equal(q.sides.leftSleeve[0].text, "LEFT");
  assert.equal(q.sides.rightSleeve.length, 0);
  assert.equal(q.sides.hoodRight[0].shape, "star");
  assert.equal(q.sides.hoodLeft.length, 0);
});

test("flat tee has original continuous front/sleeve geometry and distinct panel meshes", () => {
  const g = garmentMesh("tee", "#496c50");
  assert.equal(g.name, "flat-hanging-tee");
  for (const name of ["torso", "leftSleeve", "rightSleeve"]) {
    const mesh = g.getObjectByName(name) as Mesh;
    assert.ok(mesh?.geometry.attributes.normal);
    assert.ok(mesh.geometry.attributes.position.count > 100);
  }
});
test("old project files disable the removed hanger and retain studio backdrop and print data", () => {
  const p: any = initialProject();
  delete p.appearance.hanger;
  delete p.appearance.backdrop;
  const q = parseProject(JSON.stringify(p));
  assert.equal(q.appearance.hanger, false);
  assert.equal(q.appearance.backdrop, "studio");
  assert.deepEqual(q.sides, p.sides);
});
test("invalid display staging settings are rejected on import", () => {
  for (const patch of [{ hanger: "yes" }, { backdrop: "remote-url" }]) {
    const p = initialProject();
    Object.assign(p.appearance, patch);
    assert.throws(() => parseProject(JSON.stringify(p)));
  }
});
