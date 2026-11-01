import test from "node:test";
import assert from "node:assert/strict";
import { insertElement } from "../src/elements/insert";
import { blankProject, newClip, type Asset } from "../src/types";
import { loadElements } from "../../src/pages/Elements/registry";
import { isBackgroundText } from "../src/composition/stacking";
import { drawFrame } from "../src/lib/media";
import { boxesAt } from "../src/preview/model";
import { validateProjectData } from "../src/lib/projectIO";
const items = loadElements();
const asset: Asset = {
  id: "base",
  name: "base",
  url: "data:image/png;base64,AA==",
  type: "image",
  duration: 10,
  width: 960,
  height: 540,
};
const text = {
  id: "title",
  text: "TITLE",
  x: 50,
  y: 50,
  size: 70,
  color: "#ffffff",
  start: 0,
  end: 10,
};
const p = {
  ...blankProject(),
  clips: [{ ...newClip(asset), end: 10 }],
  texts: [text],
};
test("background SVG never enters the foreground and is inserted below normal image overlays", () => {
  const svg = items.find(
    (i) => i.kind === "svg" && i.category === "backgrounds",
  )!;
  const old = {
    id: "logo",
    assetId: "logo-asset",
    at: 0,
    start: 0,
    end: 5,
    x: 50,
    y: 50,
    width: 20,
    rotation: 0,
    opacity: 1,
    volume: 0,
    foreground: true,
  };
  const result = insertElement({ ...p, overlays: [old] }, svg, 0);
  assert.equal(result.project.overlays![0].backgroundLayer, true);
  assert.equal(result.project.overlays![0].foreground, false);
  assert.equal(result.project.overlays![0].width, 100);
  assert.equal(result.project.overlays![1], old);
  assert.equal(result.project.texts[0], text);
});
test("native background paint and hit testing remain behind titles regardless of insertion order", () => {
  const bg = {
    ...text,
    id: "background",
    text: "BACKGROUND",
    name: "خلفية المشهد",
  };
  const painted: string[] = [];
  const ctx = {
    canvas: { width: 960, height: 540 },
    save() {},
    restore() {},
    fillRect() {},
    translate() {},
    scale() {},
    rotate() {},
    measureText: (t: string) => ({ width: t.length * 30 }),
    fillText: (t: string) => painted.push(t),
  } as unknown as CanvasRenderingContext2D;
  drawFrame(ctx, null, { ...p, texts: [text, bg] }, 1);
  assert.deepEqual(painted, ["BACKGROUND", "TITLE"]);
  const boxes = boxesAt({ ...p, texts: [text, bg] }, 1, ctx, new Map());
  assert.equal(boxes.at(-1)?.id, "title");
  assert.ok(isBackgroundText(bg));
});
test("new ready kits are distinct editable layers, grouped in one insertion and portable", () => {
  const old = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        getContext: () => ({
          save() {},
          restore() {},
          measureText: (t: string) => ({ width: t.length * 20 }),
        }),
      }),
    },
  });
  try {
    const kits = items.filter((i) => i.kind === "group");
    assert.equal(kits.length, 32);
    for (const kit of kits) {
      const before = JSON.stringify(kit),
        result = insertElement(p, kit, 2, undefined, 6);
      const layers = result.project.texts.slice(1);
      assert.equal(layers.length, kit.layers!.length);
      assert.equal(new Set(layers.map((l) => l.groupId)).size, 1);
      assert.equal(new Set(layers.map((l) => l.id)).size, layers.length);
      assert.ok(layers.every((l) => l.start === 2 && l.end === 8));
      assert.equal(JSON.stringify(kit), before);
      validateProjectData({
        version: 1,
        project: result.project,
        assets: [asset, ...result.assets],
      });
    }
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: old,
    });
  }
});
test("shared preview/export compositor paints legacy background, new SVG background, content, then foreground", () => {
  const painted: string[] = [];
  const overlay = (
    id: string,
    backgroundLayer = false,
    foreground = false,
  ) => ({
    id,
    assetId: id,
    at: 0,
    start: 0,
    end: 5,
    x: 50,
    y: 50,
    width: 100,
    rotation: 0,
    opacity: 1,
    volume: 0,
    backgroundLayer,
    foreground,
  });
  const bg = { ...text, id: "bg", name: "خلفية المشهد", text: "LEGACY-BG" };
  const project = {
    ...p,
    texts: [text, bg],
    overlays: [overlay("logo", false, true), overlay("svg", true)],
  };
  const ctx = {
    canvas: { width: 960, height: 540 },
    save() {},
    restore() {},
    fillRect() {},
    translate() {},
    scale() {},
    rotate() {},
    measureText: (t: string) => ({ width: t.length * 30 }),
    fillText: (t: string) => painted.push(t),
    drawImage: (image: { tag: string }) => painted.push(image.tag),
  } as unknown as CanvasRenderingContext2D;
  const image = (tag: string) =>
    ({
      naturalWidth: 960,
      naturalHeight: 540,
      tag,
    }) as unknown as CanvasImageSource;
  drawFrame(
    ctx,
    null,
    project,
    1,
    undefined,
    new Map([
      [p.clips[0].id, image("BASE")],
      ["svg", image("SVG-BG")],
      ["logo", image("LOGO")],
    ]),
  );
  assert.deepEqual(painted, ["BASE", "LEGACY-BG", "SVG-BG", "TITLE", "LOGO"]);
});

test("new video icons are foreground overlays rather than scene backgrounds", () => {
  const icons = items.filter((item) => item.id.startsWith("video-icon-"));
  assert.equal(icons.length, 24);
  for (const icon of icons) {
    const result = insertElement(p, icon, 2, undefined, 4);
    assert.equal(result.project.clips[0].id, p.clips[0].id);
    assert.equal(
      result.project.overlays?.length,
      (p.overlays?.length || 0) + 1,
    );
    const overlay = result.project.overlays!.at(-1)!;
    assert.notEqual(overlay.backgroundLayer, true);
    assert.equal(overlay.at, 2);
    assert.equal(overlay.start, 0);
    assert.equal(overlay.width, 20);
  }
});
