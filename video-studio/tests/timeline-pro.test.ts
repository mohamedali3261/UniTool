import test from "node:test";
import assert from "node:assert/strict";
import {
  blankProject,
  durationOf,
  newClip,
  type Project,
  type Clip,
  type Asset,
} from "../src/types";
import {
  allPoints,
  closeGaps,
  duplicateItems,
  expand,
  groupItems,
  insertFrozen,
  locked,
  removeItems,
  reorderItems,
  shiftItems,
  trimBase,
  trimOverlay,
} from "../src/pages/Editor/timeline/editing";
import { motionAt, ease } from "../src/animation/evaluate";
import { sceneAt } from "../src/composition/scene";
import { musicTime } from "../src/lib/timeline";
import { validateProjectData } from "../src/lib/projectIO";
const c: Clip = {
  id: "a",
  assetId: "image",
  start: 0,
  end: 2,
  speed: 1,
  volume: 1,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
};
const asset: Asset = {
  id: "image",
  name: "image.png",
  type: "image",
  url: "data:image/png;base64,AA==",
  duration: 5,
};
const p: Project = {
  ...blankProject(),
  clips: [c, { ...c, id: "b" }, { ...c, id: "c" }],
  texts: [
    {
      id: "text",
      text: "caption",
      start: 4,
      end: 5,
      x: 50,
      y: 50,
      size: 50,
      color: "#ffffff",
    },
  ],
  overlays: [
    {
      id: "layer",
      assetId: "image",
      at: 3,
      start: 1,
      end: 3,
      x: 50,
      y: 50,
      width: 30,
      opacity: 1,
      rotation: 0,
      volume: 0,
    },
  ],
  markers: [{ id: "m", time: 5, label: "Beat", color: "#b7f568" }],
};
const text = { kind: "text" as const, id: "text" },
  overlay = { kind: "overlay" as const, id: "layer" },
  base = { kind: "clip" as const, id: "a" };
test("grouped timed items move both ways, clamp as a group and do not mutate source", () => {
  const original = structuredClone(p);
  const grouped = groupItems(p, [text, overlay]);
  const moved = shiftItems(grouped, [text], -2);
  assert.equal(expand(grouped, [text]).length, 2);
  assert.equal(moved.texts[0].start, 2);
  assert.equal(moved.overlays![0].at, 1);
  assert.deepEqual(p, original);
  const clamped = shiftItems(grouped, [overlay], -100);
  assert.equal(clamped.overlays![0].at, 0);
  assert.equal(clamped.texts[0].start, 1);
  assert.equal(
    groupItems(grouped, expand(grouped, [text]), true).texts[0].groupId,
    undefined,
  );
});
test("base clips reorder as a block and linked elements retain their offsets", () => {
  const linked = groupItems(p, [base, text]);
  const moved = reorderItems(linked, [base], null);
  assert.deepEqual(
    moved.clips.map((c) => c.id),
    ["b", "c", "a"],
  );
  assert.equal(moved.texts[0].start, 8);
  const block = reorderItems(p, [base, { kind: "clip", id: "b" }], null);
  assert.deepEqual(
    block.clips.map((c) => c.id),
    ["c", "a", "b"],
  );
});
test("Ripple removal closes duration and translates timed layers, markers and music", () => {
  const removed = removeItems({ ...p, audioStart: 4 }, [base], true);
  assert.equal(durationOf(removed), 4);
  assert.equal(removed.texts[0].start, 2);
  assert.equal(removed.overlays![0].at, 1);
  assert.equal(removed.markers![0].time, 3);
  assert.equal(removed.audioStart, 2);
});
test("non-Ripple deletion preserves a real non-rendered gap and close gaps is reversible data editing", () => {
  const gap = removeItems(p, [base], false);
  assert.equal(durationOf(gap), 6);
  assert.equal(gap.clips[0].gap, true);
  assert.equal(sceneAt(gap, 0.5).entries.length, 0);
  assert.equal(gap.texts[0].start, 4);
  const compact = closeGaps(gap);
  assert.equal(durationOf(compact), 4);
  assert.equal(compact.texts[0].start, 2);
  assert.equal(p.clips[0].gap, undefined);
});
test("base trim can preserve following timing using a gap or ripple the rest", () => {
  const kept = trimBase(p, "a", "end", -1, 5, false);
  assert.equal(durationOf(kept), 6);
  assert.equal(kept.clips[1].gap, true);
  assert.equal(kept.texts[0].start, 4);
  const ripple = trimBase(p, "a", "end", -1, 5, true);
  assert.equal(durationOf(ripple), 5);
  assert.equal(ripple.texts[0].start, 3);
  assert.equal(trimBase(p, "a", "end", 1, 5, false), p);
});
test("overlay edge trimming preserves source clock and respects source/timeline limits", () => {
  const left = trimOverlay(p, "layer", "start", 0.5, [asset]);
  assert.equal(left.overlays![0].at, 3.5);
  assert.equal(left.overlays![0].start, 1.5);
  assert.equal(left.overlays![0].end, 3);
  const video = { ...asset, type: "video" as const, duration: 4 };
  const right = trimOverlay(p, "layer", "end", 99, [video]);
  assert.equal(right.overlays![0].end, 4);
  const limited = trimOverlay(p, "layer", "start", -100, [asset]);
  assert.equal(limited.overlays![0].at, 2);
  assert.equal(limited.overlays![0].start, 0);
});
test("track locks block gestures, duplication, trim, reorder and deletion", () => {
  const protectedProject = {
    ...p,
    tracks: {
      video: { locked: true },
      text: { locked: true },
      layer: { locked: true },
    },
  };
  assert.ok(locked(protectedProject, text));
  assert.equal(
    trimBase(protectedProject, "a", "end", -1, 5, true),
    protectedProject,
  );
  assert.equal(
    trimOverlay(protectedProject, "layer", "end", 1, [asset]),
    protectedProject,
  );
  assert.deepEqual(
    removeItems(protectedProject, [base, text, overlay], true).clips,
    p.clips,
  );
  assert.equal(
    duplicateItems(protectedProject, [base, text, overlay]).texts.length,
    1,
  );
});
test("duplicate a linked group without linking copies to original items and enforce six-layer cap", () => {
  const linked = groupItems(p, [base, text]);
  const copy = duplicateItems(linked, [base]);
  assert.equal(copy.clips.length, 4);
  assert.equal(copy.texts.length, 2);
  assert.notEqual(copy.texts[1].groupId, linked.texts[0].groupId);
  assert.equal(copy.texts[1].start, 6);
  const full = {
    ...p,
    overlays: Array.from({ length: 6 }, (_, i) => ({
      ...p.overlays![0],
      id: `l${i}`,
    })),
  };
  assert.equal(duplicateItems(full, [{ kind: "overlay", id: "l0" }]), full);
});
test("hidden/muted track state is shared by composition and music timing", () => {
  const hidden = {
    ...p,
    tracks: {
      video: { hidden: true },
      layer: { hidden: true },
      audio: { muted: true },
    },
  };
  assert.equal(sceneAt(hidden, 3.5).entries.length, 0);
  assert.equal(musicTime(hidden, 10, 1), null);
  const muted = { ...p, tracks: { video: { muted: true } } };
  assert.equal(sceneAt(muted, 1).entries[0].clip.volume, 0);
  const detached = {
    ...p,
    audioStart: 2,
    audioOffset: 1,
    audioEnd: 3,
    audioSpeed: 2,
    audioLoop: false,
  };
  assert.equal(musicTime(detached, 5, 2.25), 1.5);
  assert.equal(musicTime(detached, 5, 3), null);
});
test("keyframe easing changes rendered interpolation, remains bounded and defaults to legacy linear", () => {
  const frames = [
    { id: "start", t: 0, x: 0, y: 0, scale: 1, opacity: 1 },
    {
      id: "end",
      t: 2,
      x: 100,
      y: 0,
      scale: 2,
      opacity: 0,
      easing: "ease-in" as const,
    },
  ];
  assert.equal(motionAt({ ...c, keyframes: frames }, 1).x, 25);
  assert.equal(ease(0.5, "ease-out"), 0.75);
  assert.equal(ease(0.5, "ease-in-out"), 0.5);
  assert.equal(
    motionAt(
      { ...c, keyframes: frames.map((f) => ({ ...f, easing: undefined })) },
      1,
    ).x,
    50,
  );
});
test("freeze inserts an independent image, splits source and shifts later cues", () => {
  const frozen = newClip({ ...asset, id: "still", duration: 2 });
  const next = insertFrozen(p, "a", 1, frozen);
  assert.equal(next.clips.length, 5);
  assert.equal(next.clips[0].end, 1);
  assert.equal(next.clips[2].start, 1);
  assert.equal(durationOf(next), 8);
  assert.equal(next.texts[0].start, 6);
  assert.equal(next.markers![0].time, 7);
});
test("portable timeline metadata validates, roundtrips, and unsafe fields are rejected", () => {
  const enriched = {
    ...groupItems(p, [base, text]),
    tracks: {
      video: { name: "Main", height: 90, locked: true },
      text: { collapsed: true },
    },
    audioEnd: 3,
    audioSpeed: 1.5,
  };
  assert.deepEqual(
    validateProjectData({ version: 1, project: enriched, assets: [asset] })
      .project,
    enriched,
  );
  assert.ok(allPoints(p).includes(5));
  for (const extra of [
    { markers: [{ id: "x", time: NaN, label: "bad", color: "#ffffff" }] },
    { markers: [{ id: "x", time: 0, label: "bad", color: "red" }] },
    { tracks: { video: { height: 1000 } } },
    { tracks: { video: { locked: "yes" } } },
    { audioSpeed: 0 },
    { audioEnd: -1 },
    { clips: [{ ...c, groupId: 3 }] },
    {
      clips: [
        {
          ...c,
          keyframes: [
            { id: "k", t: 1, x: 0, y: 0, scale: 1, opacity: 1, easing: "evil" },
          ],
        },
      ],
    },
  ])
    assert.throws(() =>
      validateProjectData({
        version: 1,
        project: { ...p, ...extra },
        assets: [asset],
      }),
    );
});

test("splitting eased curves preserves every sampled pose, including subsequent splits", async () => {
  const { splitKeyframes } = await import("../src/animation/evaluate");
  const source = {
    ...c,
    keyframes: [
      { id: "k0", t: 0, x: 0, y: 10, scale: 1, opacity: 1 },
      {
        id: "k1",
        t: 2,
        x: 100,
        y: -10,
        scale: 2,
        opacity: 0.2,
        easing: "ease-in-out" as const,
      },
    ],
  };
  const { head, tail } = splitKeyframes(source, 0.7);
  for (const t of [0, 0.2, 0.5, 0.7, 1, 1.4, 1.9]) {
    const original = motionAt(source, t),
      part =
        t < 0.7
          ? motionAt({ ...source, keyframes: head }, t)
          : motionAt({ ...source, keyframes: tail }, t - 0.7);
    assert.ok(Math.abs(part.x - original.x) < 1e-8);
    assert.ok(Math.abs(part.scale - original.scale) < 1e-8);
  }
  const second = splitKeyframes({ ...source, keyframes: tail }, 0.5);
  assert.ok(
    Math.abs(
      motionAt({ ...source, keyframes: second.tail }, 0.3).x -
        motionAt(source, 1.5).x,
    ) < 1e-8,
  );
});
