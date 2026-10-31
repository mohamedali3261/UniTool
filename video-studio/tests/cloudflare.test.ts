import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cloudflareProject } from "../src/templates/cloudflare-checklist/project";
import { cloudflareChecklist } from "../src/templates/cloudflare-checklist";
import { validateProjectData } from "../src/lib/projectIO";
import {
  counterText,
  frame,
  layerFrameAt,
  validLayerAnimation,
} from "../src/animation/layerFrames";
import { textAt } from "../src/animation/evaluate";
import { boxesAt } from "../src/preview/model";
import { durationOf } from "../src/types";
const data = { version: 1, ...cloudflareProject() };
test("Cloudflare reel matches all seven exact scene boundaries, 66 seconds and portable layers", () => {
  const { project, assets } = validateProjectData(data);
  assert.equal(durationOf(project), 66);
  assert.deepEqual(
    project.markers?.map((m) => m.time),
    [0, 4, 16, 28, 40, 52, 60],
  );
  assert.equal(cloudflareChecklist.scenes.length, 7);
  assert.equal(project.ratio, "9:16");
  assert.equal(project.texts.length, 215);
  assert.equal(assets.length, 2);
  assert.ok(
    assets.every((a) => a.url.startsWith("data:image/svg+xml;base64,")),
  );
  assert.ok(project.texts.every((t) => t.name));
  assert.equal(new Set(project.texts.map((t) => t.id)).size, 215);
  assert.ok(project.overlays?.every((l) => l.foreground));
  assert.equal(project.overlays![0].end, 66);
  assert.equal(project.overlays![1].at, 64.4);
});
test("typewriter uses 40ms per command character and counters reach exact values", () => {
  const db = data.project.texts.find(
    (t) => t.name === "أمر إنشاء قاعدة البيانات",
  )!;
  assert.equal(db.animationDuration, db.text.length * 0.04);
  assert.ok(textAt(db, db.start + 0.4).text.length >= 9);
  assert.equal(
    textAt(db, db.start + db.animationDuration! + 0.01).text,
    db.text,
  );
  const counter = data.project.texts.find((t) => t.counter)!;
  assert.equal(counterText(counter, counter.start), "2.4s");
  assert.equal(counterText(counter, counter.start + 1), "1.3s");
  assert.equal(counterText(counter, counter.start + 2), "0.3s");
  assert.equal(counterText(counter, 100), "0.3s");
});
test("frames are deterministic, support spring, blur, shake/fall and remain finite throughout the reel", () => {
  for (let t = 0; t < 66; t += 0.13)
    for (const layer of data.project.texts) {
      const a = layerFrameAt(layer, t);
      assert.deepEqual(a, layerFrameAt(layer, t));
      for (const key of [
        "x",
        "y",
        "rotation",
        "scaleX",
        "scaleY",
        "opacity",
        "blur",
      ] as const)
        assert.ok(Number.isFinite(a[key]));
      assert.ok(a.opacity >= 0 && a.opacity <= 1);
      assert.ok(a.blur >= 0 && a.blur <= 24);
    }
  const key = data.project.texts.find((t) => t.name === "مفتاح توضيحي مكشوف")!;
  assert.ok(layerFrameAt(key, key.start + 1.2).blur > 5);
  const fragment = data.project.texts.find((t) => t.name === "صورة الموقع")!;
  assert.ok(layerFrameAt(fragment, 1.5).y > 20);
});
test("bad motion/counter JSON and nonboolean foreground overlays are rejected", () => {
  const layer = data.project.texts[0];
  for (const patch of [
    { frames: [frame(1), frame(0)] },
    { frames: [frame(0, { scaleX: 0 })] },
    { frames: [frame(0, { blur: 25 })] },
    { frames: [frame(0, { x: Infinity })] },
    { counter: { from: 0, to: 5, duration: 2, decimals: 100, suffix: "s" } },
    { counter: null },
  ]) {
    assert.equal(validLayerAnimation({ ...layer, ...patch } as any), false);
    assert.throws(() =>
      validateProjectData({
        ...data,
        project: { ...data.project, texts: [{ ...layer, ...patch }] },
      }),
    );
  }
  assert.throws(() =>
    validateProjectData({
      ...data,
      project: {
        ...data.project,
        overlays: [{ ...data.project.overlays![0], foreground: "yes" }],
      },
    }),
  );
});
test("animated selection bounds follow transformed geometry and foreground avatars stay on top", () => {
  const ctx = {
    save() {},
    restore() {},
    measureText(t: string) {
      return { width: t.length * 10 };
    },
  } as unknown as CanvasRenderingContext2D;
  const layer = data.project.texts.find((t) => t.name === "عمود قبل 1")!;
  const before = boxesAt(data.project, layer.start + 0.6, ctx, new Map()).find(
    (b) => b.id === layer.id,
  )!;
  const after = boxesAt(data.project, layer.start + 2.7, ctx, new Map()).find(
    (b) => b.id === layer.id,
  )!;
  assert.ok(Math.abs(before.height / 5 - after.height) < 0.001);
  const top = boxesAt(data.project, 30, ctx, new Map());
  assert.equal(top.at(-1)?.id, data.project.overlays![0].id);
});
test("shipped HTML is self-contained and JSON validates", () => {
  const html = readFileSync(
    "public/video-studio-templates/cloudflare-checklist.html",
    "utf8",
  );
  assert.ok(html.includes('width="720" height="1280"'));
  assert.ok(!/<script[^>]+src=/.test(html));
  assert.ok(!/<link[^>]+href=/.test(html));
  const json = JSON.parse(
    readFileSync(
      "public/video-studio-templates/cloudflare-checklist.json",
      "utf8",
    ),
  );
  assert.equal(durationOf(validateProjectData(json).project), 66);
});

test("editable continent paths roundtrip; malformed or excessive polygons are rejected", () => {
  const continent = data.project.texts.find((t) => t.box?.points)!;
  assert.ok(continent.box!.points!.length >= 3);
  for (const points of [
    [{ x: 0, y: 0 }],
    Array.from({ length: 65 }, () => ({ x: 0, y: 0 })),
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ],
    [
      { x: NaN, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ],
  ])
    assert.throws(() =>
      validateProjectData({
        ...data,
        project: {
          ...data.project,
          texts: [{ ...continent, box: { ...continent.box, points } }],
        },
      }),
    );
});
