import test from "node:test";
import assert from "node:assert/strict";
import {
  boundaries,
  clipStart,
  trimClip,
  snapTime,
  reorderClips,
  textLanes,
  clipOpacity,
  musicTime,
} from "../src/lib/timeline";
import { blankProject, type Clip, type TextLayer } from "../src/types";
const clip: Clip = {
  id: "a",
  assetId: "video",
  start: 1,
  end: 5,
  speed: 2,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  volume: 1,
};
const clips = [
  clip,
  { ...clip, id: "b", speed: 1 },
  { ...clip, id: "c", speed: 1 },
];
const project = { ...blankProject(), clips };
test("timeline boundaries account for trims and speed", () => {
  assert.deepEqual(boundaries(project), [0, 2, 6, 10]);
  assert.equal(clipStart(project, "b"), 2);
});
test("trim handles clamp source bounds and keep minimum source duration", () => {
  assert.equal(trimClip(clip, "start", -20, 8).start, 0);
  assert.equal(trimClip(clip, "start", 20, 8).start, 4.9);
  assert.equal(trimClip(clip, "end", 20, 8).end, 8);
  assert.equal(trimClip(clip, "end", -20, 8).end, 1.1);
  assert.equal(clip.start, 1);
});
test("snap chooses nearest boundary only inside pixel-derived threshold", () => {
  assert.equal(snapTime(1.94, [0, 2, 2.1], 0.1), 2);
  assert.equal(snapTime(1.5, [0, 2], 0.1), 1.5);
});
test("reorder moves before target or to end, preserving clip properties", () => {
  assert.deepEqual(
    reorderClips(clips, "c", "a").map((c) => c.id),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    reorderClips(clips, "a", null).map((c) => c.id),
    ["b", "c", "a"],
  );
  assert.equal(reorderClips(clips, "a", "a"), clips);
  assert.equal(reorderClips(clips, "missing", null), clips);
  assert.equal(reorderClips(clips, "a", "b"), clips);
});
test("overlapping texts get separate lanes; contiguous texts can share", () => {
  const t = (id: string, start: number, end: number): TextLayer => ({
    id,
    start,
    end,
    text: id,
    x: 50,
    y: 50,
    size: 52,
    color: "#ffffff",
  });
  const result = textLanes([t("1", 0, 2), t("2", 1, 3), t("3", 2, 4)]);
  assert.equal(result.count, 2);
  assert.equal(result.lanes.get("1"), result.lanes.get("3"));
  assert.notEqual(result.lanes.get("1"), result.lanes.get("2"));
});
test("fades use timeline seconds rather than source seconds at speed 2x", () => {
  const c = { ...clip, fadeIn: 1, fadeOut: 1 };
  assert.equal(clipOpacity(c, 1), 0);
  assert.equal(clipOpacity(c, 2), 0.5);
  assert.equal(clipOpacity(c, 3), 1);
  assert.equal(clipOpacity(c, 4), 0.5);
  assert.equal(clipOpacity(c, 5), 0);
});
test("music start, source trim, loop and one-shot agree on exact boundaries", () => {
  const p = { ...project, audioStart: 2, audioOffset: 1 };
  assert.equal(musicTime(p, 4, 1), null);
  assert.equal(musicTime(p, 4, 2), 1);
  assert.equal(musicTime(p, 4, 4), 3);
  assert.equal(musicTime(p, 4, 5), 1);
  assert.equal(musicTime({ ...p, audioLoop: false }, 4, 5), null);
  assert.equal(musicTime(p, 0, 2), null);
});
