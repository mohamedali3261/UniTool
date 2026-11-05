import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  ALL_BOX_PRESETS,
  HINGED_PRESETS,
  boxFamily,
} from "../src/packaging/catalog";
import {
  cartonError,
  cartonGeometry,
  MM_TO_PX,
} from "../src/packaging/geometry";
import {
  cartonAssembly,
  paperPoint,
  polygonArea,
} from "../src/packaging/preview3d/assembly";
import { buildCarton } from "../src/packaging/preview3d/mesh";
import { createCartonProject } from "../src/packaging/project";
import { parseProjectFile } from "../src/utils/projectFile";
import { cartonArtwork } from "../src/packaging/artwork";
import { faces } from "../src/advanced/core/faces";
import {
  packagingProjects,
  isPackagingProject,
} from "../src/packaging/projectScope";
import { printSpec } from "../src/packaging/printMath";
const near = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-3, `${a} != ${b}`);
test("28 unique templates, nine standard pizza diameters, two actual constructions", () => {
  assert.equal(ALL_BOX_PRESETS.length, 28);
  assert.equal(new Set(ALL_BOX_PRESETS.map((p) => p.id)).size, 28);
  assert.equal(
    HINGED_PRESETS.filter((p) => boxFamily(p.size) === "pizza").length,
    9,
  );
  assert.deepEqual(
    new Set(ALL_BOX_PRESETS.map((p) => p.size.construction || "reverse-tuck")),
    new Set(["reverse-tuck", "hinged-lid"]),
  );
});
for (const preset of HINGED_PRESETS)
  test(
    preset.id +
      ": connected non-overlapping physical net, matching UVs, six planes, editable/saveable native art",
    () => {
      const s = preset.size,
        g = cartonGeometry(s),
        pieces = cartonAssembly(s);
      assert.equal(cartonError(s), null);
      assert.equal(pieces.length, 13);
      assert.equal(g.folds.length, 12);
      const numbers = g.cut.match(/-?\d+(?:\.\d+)?/g)!.map(Number),
        outline: Array<[number, number]> = [];
      for (let i = 0; i < numbers.length; i += 2)
        outline.push([numbers[i], numbers[i + 1]]);
      near(
        pieces.reduce((sum, p) => sum + polygonArea(p.polygon), 0),
        polygonArea(outline),
      );
      for (const line of g.folds) assert.ok(line.every(Number.isFinite));
      const texture = new THREE.Texture(),
        model = buildCarton(s, texture, g);
      model.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3()
        .setFromObject(model.root)
        .getSize(new THREE.Vector3());
      near(bounds.x, s.width);
      near(bounds.y, s.height);
      near(bounds.z, s.depth);
      for (const [id, normal] of Object.entries({
        front: [0, 0, 1],
        right: [1, 0, 0],
        back: [0, 0, -1],
        left: [-1, 0, 0],
        top: [0, 1, 0],
        bottom: [0, -1, 0],
      })) {
        new THREE.Vector3(0, 0, 1)
          .transformDirection(model.groups.get(id)!.matrixWorld)
          .toArray()
          .forEach((v, i) => near(v, normal[i]));
      }
      model.setFold(0);
      model.root.updateMatrixWorld(true);
      let offset: THREE.Vector3 | undefined;
      for (const piece of pieces)
        for (const p of piece.polygon) {
          const paper = paperPoint(piece, p),
            world = new THREE.Vector3(...p, 0).applyMatrix4(
              model.groups.get(piece.id)!.matrixWorld,
            );
          assert.ok(
            paper[0] >= 0 &&
              paper[0] <= g.width &&
              paper[1] >= 0 &&
              paper[1] <= g.height,
          );
          const shift = new THREE.Vector3(
            world.x - paper[0],
            world.y + paper[1],
            world.z,
          );
          offset ??= shift.clone();
          near(shift.distanceTo(offset), 0);
        }
      const face = faces(s).find((f) => f.id === "top")!;
      near(face.width, s.width);
      near(face.height, s.depth);
      const project = createCartonProject(s, preset.id),
        art = cartonArtwork(s, preset.artwork);
      assert.ok(art.length >= 9);
      assert.ok(
        art.every((o) => ["rect", "circle", "textbox"].includes(o.type)),
      );
      assert.ok(art.some((o) => o.text === preset.artwork.brand));
      project.canvasData.objects.push(...art);
      const parsed = parseProjectFile({
        format: "unitool-designcraft",
        version: 1,
        project,
      });
      assert.equal(parsed.packaging?.kind, "hinged-lid");
      assert.deepEqual(parsed.packaging?.size, s);
      near(parsed.width, g.width * MM_TO_PX);
      near(parsed.height, g.height * MM_TO_PX);
      model.dispose();
      texture.dispose();
    },
  );
test("scope views separate designs and all families, retaining legacy metadata-free packaging", () => {
  const saved = ALL_BOX_PRESETS.map((p) => createCartonProject(p.size, p.id)),
    normal = {
      ...saved[0],
      id: "normal",
      category: "custom",
      packaging: undefined,
    },
    legacy = { ...normal, id: "legacy", category: "packaging" };
  const all = [...saved, normal, legacy];
  assert.equal(all.filter((p) => !isPackagingProject(p)).length, 1);
  assert.equal(packagingProjects(all, "all").length, 29);
  assert.equal(packagingProjects(all, "carton").length, 13);
  assert.equal(packagingProjects(all, "pizza").length, 9);
  assert.equal(packagingProjects(all, "bakery").length, 4);
  assert.equal(packagingProjects(all, "mailer").length, 3);
  assert.equal(all.length, 30);
});
test("hinged limits, incompatible metadata, and large-print raster budget remain explicit", () => {
  const s = HINGED_PRESETS[0].size;
  for (const invalid of [
    { ...s, width: 99 },
    { ...s, height: 151 },
    { ...s, tuck: 30 },
    { ...s, construction: undefined },
  ])
    assert.notEqual(cartonError(invalid), null);
  const project = createCartonProject(s, "invalid");
  project.packaging!.kind = "reverse-tuck";
  assert.throws(() =>
    parseProjectFile({ format: "unitool-designcraft", version: 1, project }),
  );
  assert.throws(
    () => printSpec(HINGED_PRESETS.find((p) => p.id === "pizza-24")!.size, 300),
    /PRINT_TOO_LARGE/,
  );
});
