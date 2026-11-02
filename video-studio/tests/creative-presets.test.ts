import { test } from "node:test";
import assert from "node:assert/strict";
import { creativeCatalog, validCreative } from "../src/creative/catalog";
import { loadElements } from "../../src/pages/Elements/registry";
import { insertElement } from "../src/elements/insert";
import { blankProject, newClip, type Asset } from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
import { sceneAt } from "../src/composition/scene";
import { noise } from "../src/creative/renderers/common";
test("96 creative presets are unique, persisted native layers with a real registry entry", () => {
  assert.equal(creativeCatalog.length, 96);
  assert.equal(new Set(creativeCatalog.map((x) => x[0])).size, 96);
  const items = loadElements().filter((i) => i.id.startsWith("creative-"));
  assert.equal(items.length, 96);
  for (const item of items) {
    assert.equal(item.animated, true);
    assert.ok(validCreative(item.layer?.creative));
    assert.equal(item.kind, "layer");
  }
});
test("creative settings reject corrupt imported presets and nonfinite values", () => {
  const value = {
    id: "mesh",
    speed: 1,
    strength: 1,
    pointerX: 50,
    pointerY: 50,
  };
  assert.ok(validCreative(value));
  assert.ok(validCreative({ ...value, value: 43, data: [-5, 3, 100] }));
  for (const patch of [
    { id: "unknown" },
    { speed: NaN },
    { speed: 10 },
    { pointerX: -1 },
    { pointerY: Infinity },
    { strength: 0 },
    { highlight: 7 },
    { value: Infinity },
    { value: 101 },
    { value: -1 },
    { data: [1, NaN] },
    { data: [1] },
    { data: [1, 10001] },
    { data: Array(65).fill(2) },
  ])
    assert.equal(validCreative({ ...value, ...patch }), false);
});
test("every creative preset inserts without mutation and round trips through project validation", () => {
  const old = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        getContext: () => ({
          save() {},
          restore() {},
          measureText: (s: string) => ({ width: s.length * 20 }),
        }),
      }),
    },
  });
  try {
    for (const item of loadElements().filter((i) =>
      i.id.startsWith("creative-"),
    )) {
      const before = JSON.stringify(item),
        result = insertElement(blankProject(), item, 0, undefined, 5);
      assert.equal(JSON.stringify(item), before);
      assert.equal(
        result.project.texts[0].creative?.id,
        item.layer!.creative!.id,
      );
      assert.ok(result.project.texts[0].end === 5);
      validateProjectData({
        version: 1,
        project: result.project,
        assets: result.assets,
      });
    }
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: old,
    });
  }
});
test("new transitions operate on two actual clips, leave durations intact and survive importer validation", () => {
  const asset: Asset = {
    id: "a",
    type: "image",
    name: "image",
    url: "data:image/png;base64,AA==",
    duration: 4,
    width: 960,
    height: 540,
  };
  for (const kind of [
    "shared-card",
    "circle-reveal",
    "page-flip",
    "zoom-through",
    "liquid-wipe",
  ] as const) {
    const a = { ...newClip(asset), id: "first", end: 4 },
      b = {
        ...newClip(asset),
        id: "second",
        end: 4,
        transition: { kind, duration: 1 },
      };
    const project = { ...blankProject(), clips: [a, b] };
    const middle = sceneAt(project, 4);
    assert.equal(middle.entries.length, 2);
    assert.equal(middle.entries[0].audioAlpha, 0.5);
    assert.equal(middle.entries[1].audioAlpha, 0.5);
    assert.equal(
      project.clips.reduce((n, c) => n + c.end - c.start, 0),
      8,
    );
    validateProjectData({ version: 1, project, assets: [asset] });
    if (kind !== "zoom-through")
      assert.equal(middle.entries[1].reveal?.kind, kind);
  }
});
test("procedural noise is deterministic and bounded for rewind/export", () => {
  for (let i = 0; i < 100; i++) {
    assert.equal(noise(i), noise(i));
    assert.ok(noise(i) >= 0 && noise(i) < 1);
  }
});

test("grain and heatmap preserve inherited layer opacity and clamp animated alpha", async () => {
  const { drawBackground } =
    await import("../src/creative/renderers/backgrounds");
  const { drawData } = await import("../src/creative/renderers/data");
  const alphas: number[] = [];
  const c = new Proxy(
    {
      globalAlpha: 0.25,
      fillRect() {
        alphas.push(this.globalAlpha);
      },
      fill() {
        alphas.push(this.globalAlpha);
      },
    },
    {
      get(target, key) {
        return key in target ? Reflect.get(target, key) : () => undefined;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  drawBackground(c, "grain", 1, "#fff", "", 50, 50, 1);
  assert.ok(alphas.length === 2000);
  assert.ok(alphas.every((a) => Math.abs(a - 0.045) < 1e-10));
  assert.equal(c.globalAlpha, 0.25);
  alphas.length = 0;
  drawData(c, "heatmap", 20, "#fff", "Data", {
    id: "heatmap",
    speed: 1,
    strength: 1,
    pointerX: 50,
    pointerY: 50,
  });
  assert.equal(alphas.length, 98);
  assert.ok(alphas.every((a) => a >= 0 && a <= 0.25));
  assert.equal(c.globalAlpha, 0.25);
});
