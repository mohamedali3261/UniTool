import test from "node:test";
import assert from "node:assert/strict";
import { blankProject, type Clip, type Project } from "../src/types";
import {
  adjacentPoint,
  followOffset,
  navigationPoints,
  overviewTime,
} from "../src/pages/Editor/timeline/navigation";
import {
  defaultTimelineView,
  normalizeTimelineView,
} from "../src/pages/Editor/timeline/view";

const clip: Clip = {
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
const project: Project = {
  ...blankProject(),
  clips: [clip, { ...clip, id: "b" }],
  markers: [{ id: "m", time: 1, label: "beat", color: "#ffffff" }],
};

test("navigation rail merges cuts, markers and keyframes without duplicates", () => {
  const p = {
    ...project,
    clips: [
      {
        ...clip,
        keyframes: [
          { id: "k", t: 1, x: 0, y: 0, scale: 1, opacity: 1 },
          { id: "k2", t: 1.5, x: 0, y: 0, scale: 1, opacity: 1 },
        ],
      },
      { ...clip, id: "b" },
    ],
  };
  assert.deepEqual(navigationPoints(p), [0, 1, 1.5, 2, 4]);
  assert.equal(adjacentPoint(navigationPoints(p), 1, 1), 1.5);
  assert.equal(adjacentPoint(navigationPoints(p), 1.5, -1), 1);
  assert.equal(adjacentPoint(navigationPoints(p), 0, -1), 0);
  assert.equal(adjacentPoint(navigationPoints(p), 4, 1), 4);
});

test("follow offset only scrolls when the playhead leaves the safe margin", () => {
  assert.equal(followOffset(1, 50, 0, 400), null);
  assert.equal(followOffset(7.2, 50, 0, 400), 220);
  assert.equal(followOffset(0.5, 50, 300, 400), 0);
});

test("overview maps pointer position to bounded project time", () => {
  assert.equal(overviewTime(150, 100, 200, 8), 2);
  assert.equal(overviewTime(0, 100, 200, 8), 0);
  assert.equal(overviewTime(999, 100, 200, 8), 8);
});

test("timeline view preferences normalize untrusted storage and keep editing defaults", () => {
  assert.deepEqual(normalizeTimelineView(null), defaultTimelineView);
  assert.deepEqual(
    normalizeTimelineView({ snap: false, ripple: false, follow: false, roomy: true, height: 320 }),
    { snap: false, ripple: false, follow: false, roomy: true, height: 320 },
  );
  const bad = normalizeTimelineView({ snap: "no", height: 9999, roomy: 1 });
  assert.equal(bad.snap, true);
  assert.equal(bad.height, 540);
  assert.equal(bad.roomy, false);
  assert.equal(normalizeTimelineView({ height: 1 }).height, 180);
});
