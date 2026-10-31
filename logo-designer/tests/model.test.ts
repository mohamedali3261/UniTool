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
test("60 templates have editable, valid independent nodes", () => {
  assert.equal(templates.length, 60);
  for (const t of templates)
    for (const lang of ["ar", "en"] as const) {
      const p = validateProject(templateProject(t, lang));
      assert.ok(p.nodes.some((n) => n.kind === "text"));
      assert.ok(p.nodes.some((n) => n.kind === "icon" || n.kind === "vector"));
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

test("new original marks and symbols have unique IDs and safe portable paths", async () => {
  const { vectorMarks, vectorNode } = await import("../vector-library");
  const { symbols } = await import("../catalog");
  assert.equal(vectorMarks.length, 28);
  assert.equal(new Set(symbols.map((s) => s.id)).size, symbols.length);
  assert.equal(new Set(vectorMarks.map((s) => s.id)).size, vectorMarks.length);
  for (const m of vectorMarks) {
    const p = blank();
    p.nodes = [node(vectorNode(m))];
    assert.doesNotThrow(() => validateProject(p));
  }
});
test("extended templates use six distinct compositions with valid symbol references", async () => {
  const { symbolMap } = await import("../catalog");
  const fresh = templates.filter((t) => t.id.startsWith("collection-"));
  assert.equal(fresh.length, 24);
  assert.equal(new Set(fresh.map((t) => t.layout)).size, 6);
  for (const t of fresh) {
    assert.ok(symbolMap.has(t.icon));
    assert.ok(templateProject(t, "en").nodes.length >= 6);
  }
});
test("selection alignment, distribution and order preserve locked nodes and input project", async () => {
  const { arrangeSelection } = await import("../selection-tools");
  const p = blank();
  p.nodes = [
    node({ x: 100, y: 120, w: 40, h: 40 }),
    node({ x: 280, y: 220, w: 60, h: 60 }),
    node({ x: 500, y: 320, w: 80, h: 80 }),
    node({ x: 777, locked: true }),
  ];
  const ids = p.nodes.map((n) => n.id);
  const aligned = arrangeSelection(p, ids, "left");
  assert.equal(aligned.nodes[0].x - 20, aligned.nodes[2].x - 40);
  assert.equal(aligned.nodes[3].x, 777);
  assert.equal(p.nodes[1].x, 280);
  const spaced = arrangeSelection(p, ids, "space-x");
  const gaps = [
    spaced.nodes[1].x - 30 - (spaced.nodes[0].x + 20),
    spaced.nodes[2].x - 40 - (spaced.nodes[1].x + 30),
  ];
  assert.equal(gaps[0], gaps[1]);
  const reordered = arrangeSelection(p, [ids[0], ids[1]], "front");
  assert.deepEqual(
    reordered.nodes.slice(-2).map((n) => n.id),
    ids.slice(0, 2),
  );
  assert.equal(arrangeSelection(p, [ids[0]], "left"), p);
});
test("Arabic search ignores diacritics and alef variants", async () => {
  const { matchesSearch } = await import("../search");
  assert.ok(matchesSearch("افق", "أُفُق"));
  assert.ok(matchesSearch("صحة", "صحة وعناية"));
  assert.ok(!matchesSearch("طيران", "قهوة"));
});

test("12 compositions contain independent safe layers and registered icons", async () => {
  const { compositions, compositionNodes } = await import("../compositions");
  const { symbolMap } = await import("../catalog");
  assert.equal(compositions.length, 12);
  for (const c of compositions) {
    const nodes = compositionNodes(c, { x: 400, y: 300, size: 220 });
    assert.ok(nodes.length >= 3);
    assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length);
    assert.equal(new Set(nodes.map((n) => n.group)).size, 1);
    const p = blank();
    p.nodes = nodes;
    assert.doesNotThrow(() => validateProject(p));
    for (const n of nodes)
      if (n.kind === "icon") assert.ok(symbolMap.has(n.asset), n.asset);
  }
});
test("composition instances have fresh groups, scalable positions and editable initial/colors", async () => {
  const { compositions, compositionNodes } = await import("../compositions");
  const c = compositions.find((c) => c.id === "shield-initial")!;
  const first = compositionNodes(c, {
      x: 400,
      y: 300,
      size: 200,
      primary: "#112233",
      accent: "#aabbcc",
      initial: "ن",
    }),
    second = compositionNodes(c, { x: 100, y: 100, size: 100, grouped: false });
  assert.ok(first.every((n) => n.group === first[0].group));
  assert.ok(second.every((n) => !n.group));
  assert.notEqual(first[0].id, second[0].id);
  assert.equal(first[0].w, second[0].w * 2);
  assert.equal(first.find((n) => n.kind === "text")!.text, "ن");
  assert.ok(first.some((n) => n.fill === "#112233"));
  assert.ok(first.some((n) => n.fill === "#aabbcc"));
  const again = compositionNodes(c, { x: 400, y: 300, size: 200 });
  assert.notEqual(first[0].group, again[0].group);
});
