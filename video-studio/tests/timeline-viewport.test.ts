import test from "node:test";
import assert from "node:assert/strict";
import {
  clipLayout,
  visibleInTimeline,
} from "../src/pages/Editor/timeline/viewport";
import type { Clip } from "../src/types";
const clip: Clip = {
  id: "one",
  assetId: "image",
  start: 1,
  end: 5,
  speed: 2,
  volume: 1,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
};

test("linear clip layout preserves speed, gaps and source order without mutations", () => {
  const clips = [
    clip,
    { ...clip, id: "gap", start: 0, end: 3, speed: 1, gap: true },
    { ...clip, id: "last" },
  ];
  const before = JSON.stringify(clips);
  const layout = clipLayout(clips);
  assert.deepEqual(
    layout.map((c) => c.start),
    [0, 2, 5],
  );
  assert.equal(layout[2].clip, clips[2]);
  assert.equal(JSON.stringify(clips), before);
  assert.deepEqual(clipLayout([]), []);
});
test("horizontal buffering covers a full scroll bucket, including long overlapping clips", () => {
  const view = { left: 1200, top: 0, width: 600, height: 150 };
  assert.equal(visibleInTimeline(12, 1, 0, 40, view, 55), true);
  assert.equal(visibleInTimeline(0, 100, 0, 40, view, 55), true);
  assert.equal(visibleInTimeline(0, 1, 0, 40, view, 55), false);
  assert.equal(visibleInTimeline(60, 1, 0, 40, view, 55), false);
});
test("vertical buffering removes far-away lanes but retains neighboring lanes", () => {
  const view = { left: 0, top: 900, width: 600, height: 150 };
  assert.equal(visibleInTimeline(0, 10, 100, 24, view, 55), false);
  assert.equal(visibleInTimeline(0, 10, 805, 24, view, 55), true);
  assert.equal(visibleInTimeline(0, 10, 1200, 24, view, 55), true);
  assert.equal(visibleInTimeline(0, 10, 1300, 24, view, 55), false);
  assert.equal(visibleInTimeline(0, 10, 1300, 24, view, 55, false), true);
});
test("buffered windows stay bounded across thousands of clips and zoom levels", () => {
  const layout = clipLayout(
    Array.from({ length: 2000 }, (_, i) => ({ ...clip, id: String(i) })),
  );
  for (const zoom of [5, 55, 720]) {
    for (const left of [0, 6000, 90000]) {
      const visible = layout.filter((c) =>
        visibleInTimeline(
          c.start,
          2,
          0,
          24,
          { left, top: 0, width: 800, height: 150 },
          zoom,
        ),
      );
      assert.ok(visible.length < 265);
      assert.ok(visible.every((c) => c.start * zoom <= left + 2000));
    }
  }
});

test("fit-scale rulers label the entire viewport without generating thousands of tiny ticks", async () => {
  const { rulerTicks } = await import("../src/pages/Editor/timeline/ruler");
  const ticks = rulerTicks(720, 0.1, 0, 720);
  assert.ok(ticks.length < 20);
  assert.ok(ticks.some((t) => t >= 3600));
  assert.ok(ticks.every((t, i) => i === 0 || (t - ticks[i - 1]) * 0.1 >= 40));
});
