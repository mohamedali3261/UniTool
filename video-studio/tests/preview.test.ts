import test from "node:test";
import assert from "node:assert/strict";
import {
  blankProject,
  type Project,
  type TextLayer,
  type Clip,
  type OverlayLayer,
} from "../src/types";
import {
  boxesAt,
  hitBox,
  moveObject,
  scaleObject,
  patchObject,
  deleteObject,
  duplicateObject,
  rotation,
} from "../src/preview/model";
import { textLayout } from "../src/text/layout";
import { validateProjectData } from "../src/lib/projectIO";
import { sceneAt } from "../src/composition/scene";
const clip: Clip = {
  id: "base",
  assetId: "image",
  start: 0,
  end: 5,
  speed: 1,
  volume: 1,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
};
const text: TextLayer = {
  id: "caption",
  text: "first\nsecond",
  start: 0,
  end: 5,
  x: 50,
  y: 70,
  size: 50,
  color: "#ffffff",
};
const layer: OverlayLayer = {
  id: "logo",
  assetId: "image",
  at: 0,
  start: 0,
  end: 5,
  x: 75,
  y: 25,
  width: 20,
  opacity: 1,
  rotation: 0,
  volume: 0,
};
const p: Project = {
  ...blankProject(),
  ratio: "16:9",
  clips: [clip],
  texts: [text],
  overlays: [layer],
};
const s = { kind: "text" as const, id: text.id };
const ctx = {
  save() {},
  restore() {},
  measureText(t: string) {
    return { width: t.length * 25 };
  },
} as unknown as CanvasRenderingContext2D;
const dims = new Map([
  ["base", { width: 160, height: 90 }],
  ["logo", { width: 160, height: 90 }],
]);
const assets = [
  {
    id: "image",
    name: "image.png",
    type: "image",
    url: "data:image/png;base64,AA==",
    duration: 5,
  },
];
test("hit testing reverses rotation and respects transformed local bounds", () => {
  const box = boxesAt(
    { ...p, texts: [{ ...text, rotation: 90 }] },
    1,
    ctx,
    dims,
  ).at(-1)!;
  assert.equal(box.cx, 450);
  assert.equal(box.cy, 378);
  assert.ok(hitBox(box, box.cx, box.cy + 60));
  assert.ok(!hitBox(box, box.cx + 100, box.cy));
  const layout = textLayout(ctx, text, 960);
  assert.equal(layout.font, "700 50px Arial, sans-serif");
  assert.equal(layout.height, 110);
});
test("preview geometry respects ratio, native media size, static position and animation", () => {
  const animated = {
    ...clip,
    x: 10,
    y: -10,
    zoom: 1.5,
    motion: "push-in" as const,
  };
  const boxes = boxesAt({ ...p, clips: [animated] }, 1, ctx, dims);
  assert.equal(boxes[0].cx, 576);
  assert.equal(boxes[0].cy, 216);
  assert.ok(boxes[0].width > 960);
  assert.equal(boxes[1].cx, 720);
  assert.equal(boxes[1].width, 192);
  const portrait = boxesAt({ ...p, ratio: "9:16" }, 1, ctx, dims)[0];
  assert.equal(portrait.width, 960);
  assert.equal(portrait.height, 540);
});
test("moves and proportional scales are immutable, bounded and preserve keyframes", () => {
  const source = structuredClone(p);
  const moved = moveObject(p, s, 96, -54);
  assert.equal(moved.texts[0].x, 60);
  assert.equal(moved.texts[0].y, 60);
  assert.deepEqual(p, source);
  assert.equal(moveObject(p, s, 99999, -99999).texts[0].x, 100);
  assert.equal(scaleObject(p, s, 1000).texts[0].size, 180);
  assert.equal(
    scaleObject(p, { kind: "overlay", id: "logo" }, 0.001).overlays![0].width,
    10,
  );
  assert.equal(
    scaleObject(p, { kind: "clip", id: "base" }, 1000).clips[0].zoom,
    3,
  );
  assert.equal(
    moveObject(p, { kind: "clip", id: "base" }, 96, 54).clips[0].x,
    10,
  );
});
test("locked objects cannot move, resize or duplicate; duplication respects layer capacity", () => {
  const locked = patchObject(p, s, { locked: true });
  assert.equal(moveObject(locked, s, 10, 10), locked);
  assert.equal(scaleObject(locked, s, 2), locked);
  assert.equal(duplicateObject(locked, s), null);
  const copy = duplicateObject(p, s)!;
  assert.notEqual(copy.selection.id, text.id);
  assert.equal(copy.project.texts.length, 2);
  assert.equal(copy.project.texts[1].x, 53);
  assert.equal(p.texts.length, 1);
  const full = {
    ...p,
    overlays: Array.from({ length: 6 }, (_, i) => ({ ...layer, id: `l${i}` })),
  };
  assert.equal(duplicateObject(full, { kind: "overlay", id: "l0" }), null);
  assert.equal(deleteObject(p, s).clips.length, 1);
  assert.equal(deleteObject(p, s).texts.length, 0);
});
test("hidden overlays stop rendering/decoding but remain selectable in the layer picker", () => {
  const hidden = {
    ...p,
    overlays: [{ ...layer, hidden: true, locked: true }],
    texts: [{ ...text, hidden: true }],
  };
  assert.equal(sceneAt(hidden, 1).entries.length, 1);
  const boxes = boxesAt(hidden, 1, ctx, dims);
  assert.equal(boxes.length, 3);
  assert.equal(boxes[1].hidden, true);
  assert.equal(boxes[1].locked, true);
  assert.equal(boxes[2].hidden, true);
});
test("new preview transforms and text styles roundtrip and arbitrary rotations are supported", () => {
  const styled = {
    ...p,
    clips: [{ ...clip, x: -12, y: 24, rotation: 17.5, locked: true }],
    overlays: [{ ...layer, rotation: 33.3, hidden: true, locked: true }],
    texts: [
      {
        ...text,
        rotation: 337.2,
        opacity: 0.6,
        bold: false,
        font: "serif",
        background: "#101116",
        outline: true,
        hidden: false,
        locked: true,
      },
    ],
  };
  assert.deepEqual(
    validateProjectData({ version: 1, project: styled, assets }).project,
    styled,
  );
  assert.deepEqual(
    validateProjectData({ version: 1, project: p, assets }).project,
    p,
  );
  assert.equal(rotation(-15), 345);
  assert.equal(rotation(450), 90);
});
test("malformed direct-edit fields are rejected before import or autosave restore", () => {
  for (const patch of [
    { rotation: Infinity },
    { rotation: -1 },
    { rotation: 361 },
    { opacity: 2 },
    { font: "script" },
    { background: "url(evil)" },
    { background: 123 },
    { locked: "true" },
    { hidden: 1 },
    { bold: [] },
    { outline: null },
  ]) {
    assert.throws(() =>
      validateProjectData({
        version: 1,
        project: patchObject(p, s, patch),
        assets,
      }),
    );
  }
  for (const patch of [{ x: 101 }, { y: NaN }, { locked: 1 }])
    assert.throws(() =>
      validateProjectData({
        version: 1,
        project: patchObject(p, { kind: "clip", id: "base" }, patch),
        assets,
      }),
    );
});

test("shared compositor paints text styles and rotation, but not hidden text", async () => {
  const { drawFrame } = await import("../src/lib/media");
  const painted: string[] = [],
    angles: number[] = [],
    alpha: number[] = [],
    fonts: string[] = [];
  const target: Record<string, unknown> = {
    canvas: { width: 1920, height: 1080 },
    save() {},
    restore() {},
    fillRect() {},
    translate() {},
    scale() {},
    rotate(r: number) {
      angles.push(r);
    },
    measureText(t: string) {
      return { width: t.length * 40 };
    },
    strokeText(t: string) {
      painted.push(`stroke:${t}`);
    },
    fillText(t: string) {
      painted.push(t);
    },
  };
  const context = new Proxy(target, {
    set(o, key, value) {
      if (key === "globalAlpha") alpha.push(value);
      if (key === "font") fonts.push(value);
      o[String(key)] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  const styled = {
    ...p,
    texts: [
      {
        ...text,
        font: "serif" as const,
        bold: false,
        background: "#101116",
        outline: true,
        rotation: 37,
        opacity: 0.4,
      },
    ],
  };
  drawFrame(context, null, styled, 1);
  assert.deepEqual(painted, [
    "stroke:first",
    "first",
    "stroke:second",
    "second",
  ]);
  assert.ok(angles.includes((37 * Math.PI) / 180));
  assert.ok(alpha.includes(0.4));
  assert.ok(fonts.includes("400 100px Georgia, serif"));
  painted.length = 0;
  drawFrame(
    context,
    null,
    { ...styled, texts: styled.texts.map((t) => ({ ...t, hidden: true })) },
    1,
  );
  assert.deepEqual(painted, []);
});
