import test from "node:test";
import assert from "node:assert/strict";
import { sceneAt, transitionDuration } from "../src/composition/scene";
import { motionAt, textAt, splitKeyframes } from "../src/animation/evaluate";
import {
  blankProject,
  assetIsUsed,
  durationOf,
  type Clip,
  type Project,
  type OverlayLayer,
} from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
import { templates } from "../src/templates";
const clip: Clip = {
  id: "a",
  assetId: "image",
  start: 0,
  end: 4,
  speed: 1,
  volume: 1,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
};
const project: Project = {
  ...blankProject(),
  clips: [
    clip,
    { ...clip, id: "b", transition: { kind: "crossfade", duration: 1 } },
  ],
};
const overlay: OverlayLayer = {
  id: "overlay",
  assetId: "logo",
  at: 1,
  start: 0,
  end: 2,
  x: 75,
  y: 25,
  width: 30,
  opacity: 0.7,
  rotation: 0,
  volume: 0,
};
const assets = [
  {
    id: "image",
    name: "image.png",
    type: "image",
    url: "data:image/png;base64,AA==",
    duration: 5,
  },
  {
    id: "logo",
    name: "logo.png",
    type: "image",
    url: "data:image/png;base64,AA==",
    duration: 5,
  },
];
test("crossfades straddle cuts, preserve length and bound both source clocks", () => {
  assert.equal(durationOf(project), 8);
  assert.deepEqual(
    sceneAt(project, 3.49).entries.map((e) => e.id),
    ["a"],
  );
  const center = sceneAt(project, 4).entries;
  assert.equal(center.length, 2);
  assert.equal(center[1].alpha, 0.5);
  assert.equal(center[0].audioAlpha, 0.5);
  assert.ok(center[0].local < 4);
  assert.equal(center[1].local, 0);
  assert.equal(center[0].playing, false);
  assert.deepEqual(
    sceneAt(project, 4.51).entries.map((e) => e.id),
    ["b"],
  );
  assert.equal(
    transitionDuration({ ...clip, end: 0.2 }, project.clips[1]),
    0.2,
  );
});
test("slide, zoom and light transitions are deterministic and bounded", () => {
  for (const kind of ["slide", "zoom", "light"] as const) {
    const p = {
      ...project,
      clips: [clip, { ...project.clips[1], transition: { kind, duration: 1 } }],
    };
    const a = sceneAt(p, 4);
    assert.deepEqual(sceneAt(p, 4), a);
    if (kind === "slide") {
      assert.equal(a.entries[0].shift, -0.5);
      assert.equal(a.entries[1].shift, 0.5);
      assert.equal(a.entries[1].alpha, 1);
    }
    if (kind === "zoom") assert.equal(a.entries[0].scale, 1.125);
    if (kind === "light") assert.equal(a.flash, 0.9);
  }
});
test("overlay visibility, ordering and independent clocks are explicit", () => {
  const p = {
    ...project,
    overlays: [overlay, { ...overlay, id: "top", start: 1, end: 3 }],
  };
  assert.equal(sceneAt(p, 0.9).entries.length, 1);
  const entries = sceneAt(p, 2).entries;
  assert.deepEqual(
    entries.map((e) => e.id),
    ["a", "overlay", "top"],
  );
  assert.equal(entries[2].local, 2);
  assert.equal(entries[1].alpha, 0.7);
  assert.equal(sceneAt(p, 3).entries.length, 1);
  assert.ok(assetIsUsed(p, "logo"));
});
test("keyframes interpolate location, scale and opacity without mutating project", () => {
  const keyframes = [
    { id: "k1", t: 0, x: 0, y: 0, scale: 1, opacity: 1 },
    { id: "k2", t: 4, x: 40, y: -20, scale: 2, opacity: 0 },
  ];
  const value = motionAt({ ...clip, keyframes }, 2);
  assert.deepEqual(value, { x: 20, y: -10, scale: 1.5, opacity: 0.5 });
  assert.equal(motionAt({ ...clip, keyframes }, 20).opacity, 0);
  assert.equal(keyframes[0].x, 0);
  assert.equal(motionAt({ ...clip, motion: "push-in" }, 4).scale, 1.18);
});
test("text entry/exit clamps short layers and typewriter never splits a grapheme", () => {
  const t = {
    id: "t",
    text: "👨‍👩‍👧‍👦ع",
    start: 0,
    end: 4,
    x: 50,
    y: 50,
    size: 48,
    color: "#ffffff",
    animationIn: "typewriter" as const,
    animationOut: "fade" as const,
    animationDuration: 2,
  };
  assert.equal(textAt(t, 1).text, "👨‍👩‍👧‍👦");
  assert.equal(textAt(t, 2).text, t.text);
  assert.equal(textAt(t, 4).opacity, 0);
  assert.ok(Number.isFinite(textAt({ ...t, end: 0.2 }, 0.1).scale));
});
test("all eight templates have valid ratios and distinct editable scene scripts", () => {
  assert.equal(templates.length, 8);
  assert.equal(new Set(templates.map((t) => t.id)).size, 8);
  for (const t of templates) {
    assert.ok(["9:16", "4:5", "1:1", "16:9"].includes(t.ratio));
    assert.ok(t.scenes.length);
    assert.ok(t.scenes.every((s) => s.text && s.caption && s.seconds > 0));
  }
});
test("new creative settings roundtrip alongside old project files", () => {
  const p = {
    ...project,
    overlays: [overlay],
    texts: [
      {
        id: "text",
        text: "عنوان",
        start: 0,
        end: 4,
        x: 50,
        y: 50,
        size: 48,
        color: "#ffffff",
        animationIn: "typewriter",
        animationOut: "fade",
        animationDuration: 0.6,
      },
    ],
  };
  assert.deepEqual(
    validateProjectData({ version: 1, project: p, assets }).project,
    p,
  );
  assert.equal(
    validateProjectData({ version: 1, project, assets }).project.clips.length,
    2,
  );
});
test("unsafe animation, transition, keyframe and layer fields are rejected", () => {
  const payload = (p: unknown) => () =>
    validateProjectData({ version: 1, project: p, assets });
  for (const patch of [
    { motion: "evil" },
    { transition: { kind: "script", duration: 1 } },
    { transition: { kind: "slide", duration: 99 } },
    { keyframes: [{ id: "k", t: 1, x: Infinity, y: 0, scale: 1, opacity: 1 }] },
  ])
    assert.throws(payload({ ...project, clips: [{ ...clip, ...patch }] }));
  for (const patch of [
    { assetId: "missing" },
    { at: -1 },
    { width: 0 },
    { end: -1 },
    { opacity: 2 },
    { rotation: 361 },
    { volume: 2 },
    { x: NaN },
  ])
    assert.throws(
      payload({ ...project, overlays: [{ ...overlay, ...patch }] }),
    );
  assert.throws(
    payload({
      ...project,
      overlays: Array.from({ length: 7 }, (_, i) => ({
        ...overlay,
        id: String(i),
      })),
    }),
  );
  assert.throws(payload({ ...project, overlays: [{ ...overlay, id: "a" }] }));
});

test("splitting preserves keyframe continuity and respects the frame limit", () => {
  const c = {
    ...clip,
    keyframes: [
      { id: "a", t: 0, x: 0, y: 0, scale: 1, opacity: 1 },
      { id: "b", t: 4, x: 40, y: 0, scale: 2, opacity: 0.2 },
    ],
  };
  const split = splitKeyframes(c, 2);
  assert.equal(motionAt({ ...c, end: 2, keyframes: split.head }, 2).x, 20);
  assert.equal(motionAt({ ...c, start: 2, keyframes: split.tail }, 0).x, 20);
  assert.equal(
    motionAt({ ...c, start: 2, keyframes: split.tail }, 1).x,
    motionAt(c, 3).x,
  );
  const many = {
    ...clip,
    keyframes: Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      t: i / 5,
      x: i,
      y: 0,
      scale: 1,
      opacity: 1,
    })),
  };
  for (const at of [0.01, 1, 3.9]) {
    const parts = splitKeyframes(many, at);
    assert.ok(parts.head!.length <= 20);
    assert.ok(parts.tail!.length <= 20);
  }
});
