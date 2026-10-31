import { test } from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { blank, node } from "../types";
import {
  validateProject,
  saveProject,
  allProjects,
  deleteProject,
} from "../storage";
import { templates, templateProject } from "../templates";
import { removeBackground, traceRuns } from "../image-tools";
import { generatePalette } from "../Colors";
import { reducer } from "../state";
test("36 templates have editable, valid independent nodes", () => {
  assert.equal(templates.length, 36);
  for (const t of templates)
    for (const lang of ["ar", "en"] as const) {
      const p = validateProject(templateProject(t, lang));
      assert.ok(p.nodes.some((n) => n.kind === "text"));
      assert.ok(p.nodes.some((n) => n.kind === "icon"));
      assert.equal(new Set(p.nodes.map((n) => n.id)).size, p.nodes.length);
    }
});
test("unsafe imports rejected", () => {
  for (const changed of [
    { asset: "https://evil.example/a.png", kind: "image" },
    { paths: [{ fill: "#ffffff", d: "<script/>" }], kind: "vector" },
    { font: "bad;src:url(https://x)" },
    { x: NaN },
    { fill: "url(https://evil)" },
  ]) {
    const p = blank();
    p.nodes = [node(changed as never)];
    assert.throws(() => validateProject(p));
  }
});
test("history gestures produce one undo entry and discard redo after edit", () => {
  const p = blank();
  let s = { doc: p, past: [], future: [] } as Parameters<typeof reducer>[0];
  s = reducer(s, { type: "begin" });
  for (let i = 0; i < 20; i++)
    s = reducer(s, { type: "live", fn: (p) => ({ ...p, name: String(i) }) });
  s = reducer(s, { type: "end" });
  assert.equal(s.past.length, 1);
  s = reducer(s, { type: "undo" });
  assert.equal(s.doc.name, p.name);
  s = reducer(s, { type: "redo" });
  assert.equal(s.doc.name, "19");
  s = reducer(s, { type: "undo" });
  s = reducer(s, { type: "commit", fn: (p) => ({ ...p, name: "new" }) });
  assert.equal(s.future.length, 0);
});
test("IndexedDB saves, duplicates, restores and deletes", async () => {
  const p = blank();
  await saveProject(p);
  const q = { ...p, id: crypto.randomUUID(), name: "copy" };
  await saveProject(q);
  assert.equal((await allProjects()).length, 2);
  await deleteProject(p.id);
  assert.equal((await allProjects())[0].name, "copy");
  await deleteProject(q.id);
  assert.equal((await allProjects()).length, 0);
});
test("background flood fill preserves a different center; vector runs are valid", () => {
  const pixels = new Uint8ClampedArray(3 * 3 * 4).fill(255);
  pixels.set([0, 0, 0, 255], 16);
  const removed = removeBackground(pixels, 3, 3, 10);
  assert.equal(removed[3], 0);
  assert.equal(removed[19], 255);
  assert.equal(pixels[3], 255);
  const paths = traceRuns(removed, 3, 3);
  assert.equal(paths.length, 1);
  assert.equal(paths[0].fill, "#000000");
  assert.match(paths[0].d, /^M/);
  const p = blank();
  p.nodes = [node({ kind: "vector", paths })];
  assert.doesNotThrow(() => validateProject(p));
});
test("seed palette always returns five usable colors", () => {
  for (const color of ["#000000", "#ffffff", "#71e3bf"]) {
    const colors = generatePalette(color);
    assert.equal(colors.length, 5);
    colors.forEach((c) => assert.match(c, /^#[a-f0-9]{6}$/));
  }
});
