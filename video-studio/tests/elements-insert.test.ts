import test from "node:test";
import assert from "node:assert/strict";
import { insertElement } from "../src/elements/insert";
import { blankProject, newClip, durationOf, type Asset } from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
import { loadElements } from "../../src/pages/Elements/registry";
const items = loadElements();
const base: Asset = {
  id: "existing",
  type: "image",
  name: "Existing.svg",
  url:
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"/>',
    ),
  duration: 10,
  width: 960,
  height: 540,
};
const project = () => ({
  ...blankProject(),
  name: "Keep me",
  clips: [{ ...newClip(base), end: 10 }],
});
test("SVG inserts over the cursor without replacing clips, and each insertion has fresh IDs", () => {
  const p = project(),
    svg = items.find((i) => i.kind === "svg")!;
  const a = insertElement(p, svg, 3, undefined, 4),
    b = insertElement(a.project, svg, 5, undefined, 4);
  assert.deepEqual(a.project.clips, p.clips);
  assert.equal(a.project.overlays?.[0].at, 3);
  assert.equal(a.project.name, "Keep me");
  assert.equal(b.project.overlays?.length, 2);
  assert.notEqual(a.selection.id, b.selection.id);
  validateProjectData({
    version: 1,
    project: b.project,
    assets: [base, ...a.assets, ...b.assets],
  });
});
test("scene appends a procedural editable clip and preserves the existing timeline", () => {
  const p = project(),
    scene = items.find((i) => i.kind === "scene")!;
  const a = insertElement(p, scene, 2, "#22aa88", 6);
  assert.equal(a.at, 10);
  assert.equal(a.project.clips[0].id, p.clips[0].id);
  assert.equal(a.project.clips[1].designScene, scene.scene);
  assert.equal(a.project.clips[1].designAccent, "#22aa88");
  assert.equal(durationOf(a.project), 16);
  validateProjectData({
    version: 1,
    project: a.project,
    assets: [base, ...a.assets],
  });
});
test("text is independently editable, timeline is extended safely, source is not mutated", () => {
  const old = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        getContext: () => ({
          save() {},
          restore() {},
          measureText: (s: string) => ({ width: s.length * 15 }),
        }),
      }),
    },
  });
  try {
    const item = items.find((i) => i.kind === "layer")!,
      before = JSON.stringify(item),
      p = project();
    const a = insertElement(p, item, 9, "#22aa88", 5);
    assert.equal(a.project.texts[0].start, 9);
    assert.equal(a.project.texts[0].end, 14);
    assert.equal(a.project.texts[0].color, "#22aa88");
    assert.equal(durationOf(a.project), 14);
    assert.equal(JSON.stringify(item), before);
    validateProjectData({
      version: 1,
      project: a.project,
      assets: [base, ...a.assets],
    });
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: old,
    });
  }
});
test("locked tracks, overlay limits, malformed timing never partially change projects", () => {
  const svg = items.find((i) => i.kind === "svg")!,
    scene = items.find((i) => i.kind === "scene")!;
  const p = project();
  assert.throws(() =>
    insertElement({ ...p, tracks: { video: { locked: true } } }, scene, 0),
  );
  assert.throws(() => insertElement(p, svg, NaN));
  assert.throws(() => insertElement(p, svg, 0, undefined, 40));
  let next = p;
  for (let i = 0; i < 6; i++) next = insertElement(next, svg, 0).project;
  assert.throws(() => insertElement(next, svg, 0));
  assert.equal(p.clips.length, 1);
  assert.equal(p.overlays, undefined);
});
