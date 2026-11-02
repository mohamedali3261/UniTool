import test from "node:test";
import assert from "node:assert/strict";
import { orbitLaunch, orbitElements } from "../src/templates/orbit-launch";
import { paperStories, paperElements } from "../src/templates/paper-stories";
import { blankProject } from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
import { textLayout } from "../src/text/layout";
import { scaleObject } from "../src/preview/model";
import { LatestFrameQueue } from "../src/performance/LatestFrameQueue";
for (const [template, elements] of [
  [orbitLaunch, orbitElements()],
  [paperStories, paperElements()],
] as const) {
  test(`${template.id}: every visible element is an editable named layer, including the background`, () => {
    assert.equal(elements.length, template.scenes.length);
    for (const scene of elements) {
      assert.ok(scene.length > 8);
      assert.equal(scene[0].box?.width, 960);
      assert.equal(scene[0].box?.height, 1707);
      for (const t of scene) {
        assert.ok(t.name);
        assert.ok(t.x! >= 0 && t.x! <= 100);
        assert.ok(t.y! >= 0 && t.y! <= 100);
        assert.ok(!t.locked);
        if (!t.text) assert.ok(t.box);
      }
    }
  });
}
const shape = {
  id: "shape",
  text: "",
  name: "Card",
  start: 0,
  end: 5,
  x: 50,
  y: 50,
  size: 24,
  color: "#ffffff",
  background: "#223344",
  box: {
    width: 400,
    height: 200,
    radius: 20,
    borderWidth: 3,
    borderColor: "#abcdef",
  },
};
const data = {
  version: 1,
  project: { ...blankProject(), texts: [shape] },
  assets: [],
};
test("vector geometry roundtrips and rejects malformed or non-finite dimensions", () => {
  assert.deepEqual(
    validateProjectData(JSON.parse(JSON.stringify(data))).project.texts[0],
    shape,
  );
  for (const box of [
    { ...shape.box, width: 0 },
    { ...shape.box, height: Infinity },
    { ...shape.box, radius: -1 },
    { ...shape.box, borderWidth: 101 },
    { ...shape.box, borderColor: "url(foo)" },
  ])
    assert.throws(() =>
      validateProjectData({
        ...data,
        project: { ...data.project, texts: [{ ...shape, box }] },
      }),
    );
});
test("empty vector layers have centered bounds and resize independently of text size", () => {
  const ctx = {
    save() {},
    restore() {},
    measureText() {
      return { width: 0 };
    },
  } as unknown as CanvasRenderingContext2D;
  const layout = textLayout(ctx, shape, 480);
  assert.equal(layout.width, 200);
  assert.equal(layout.height, 100);
  assert.equal(layout.offsetY, 0);
  const scaled = scaleObject(data.project, { kind: "text", id: "shape" }, 2)
    .texts[0];
  assert.equal(scaled.box?.width, 800);
  assert.equal(scaled.box?.height, 400);
  assert.equal(scaled.box?.radius, 40);
});
test("slow frame completes; intervening ticks coalesce into the newest frame, never concurrent decoders", async () => {
  let finish!: () => void;
  const gate = new Promise<void>((r) => (finish = r));
  const frames: number[] = [];
  let active = 0,
    max = 0;
  const q = new LatestFrameQueue<number>(async (n) => {
    max = Math.max(max, ++active);
    if (n === 1) await gate;
    frames.push(n);
    active--;
  });
  q.request(1);
  q.request(2);
  q.request(3);
  q.request(4);
  finish();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(frames, [1, 4]);
  assert.equal(max, 1);
  q.dispose();
  q.request(5);
  assert.deepEqual(frames, [1, 4]);
});
test("queue recovers after an error and does not start pending work after disposal", async () => {
  let release!: () => void;
  const errors: unknown[] = [];
  const frames: number[] = [];
  const q = new LatestFrameQueue<number>(
    async (n) => {
      frames.push(n);
      if (n === 1) throw Error("decode");
      if (n === 2) await new Promise<void>((r) => (release = r));
    },
    (e) => errors.push(e),
  );
  q.request(1);
  await new Promise((r) => setImmediate(r));
  q.request(2);
  q.request(3);
  q.dispose();
  release();
  await new Promise((r) => setImmediate(r));
  assert.equal(errors.length, 1);
  assert.deepEqual(frames, [1, 2]);
});

import { readFileSync } from "node:fs";
for (const id of ["orbit-launch", "paper-stories"])
  test(`${id}: shipped independent JSON file validates without external assets`, () => {
    const data = JSON.parse(
      readFileSync(`public/video-studio-templates/${id}.json`, "utf8"),
    );
    const { project, assets } = validateProjectData(data);
    assert.ok(project.texts.length > 50);
    assert.equal(assets.length, 1);
    assert.ok(assets.every((a) => a.url.startsWith("data:")));
    assert.ok(project.markers?.length);
    assert.ok(project.texts.every((t) => t.name));
  });
