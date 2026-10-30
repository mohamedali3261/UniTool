import test from "node:test";
import assert from "node:assert/strict";
import { classifyMedia } from "../src/media/files";
import { writeBase64, estimatedMediaBytes } from "../src/media/portable";
import { motions } from "../src/animation/motions";
import { motionAt } from "../src/animation/evaluate";
import { blankProject, newClip, type Asset } from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
test("MIME-less and generic files are classified by extension or a bounded container header", async () => {
  for (const [name, mime, expected] of [
    ["MOVIE.MP4", "", "video"],
    ["clip.mkv", "application/octet-stream", "video"],
    ["sound.m4a", "", "audio"],
    ["photo.png", "", "image"],
  ])
    assert.equal(
      (await classifyMedia(new File(["1234"], name, { type: mime }))).type,
      expected,
    );
  const bytes = new Uint8Array(64);
  bytes.set(new TextEncoder().encode("ftyp"), 4);
  assert.equal(
    (await classifyMedia(new File([bytes], "unknown.bin"))).mime,
    "video/mp4",
  );
  await assert.rejects(classifyMedia(new File([], "empty.mp4")), /فارغ/);
  await assert.rejects(
    classifyMedia(new File(["wrong"], "unknown.xyz")),
    /التعرف/,
  );
});
test("56 unique motion trajectories stay finite, bounded and roundtrip in projects", () => {
  assert.equal(motions.length, 56);
  assert.equal(new Set(motions.map((m) => m.id)).size, 56);
  assert.equal(new Set(motions.map((m) => m.name)).size, 56);
  const trajectories = new Set<string>();
  const asset: Asset = {
    id: "a",
    name: "video.mp4",
    type: "video",
    url: "data:video/mp4;base64,AA==",
    duration: 10,
  };
  for (const m of motions) {
    const values = [0, 0.13, 0.37, 0.72, 1].map((p) => m.sample(p));
    const signature = JSON.stringify(values);
    assert.ok(!trajectories.has(signature), m.id);
    trajectories.add(signature);
    for (const v of values) {
      for (const n of Object.values(v)) assert.ok(Number.isFinite(n));
      assert.ok(v.scale >= 0.5 && v.scale <= 1.7);
      assert.ok(v.opacity >= 0 && v.opacity <= 1);
      assert.ok(Math.abs(v.x) <= 25 && Math.abs(v.y) <= 25);
    }
    const clip = { ...newClip(asset), motion: m.id };
    assert.deepEqual(motionAt(clip, 3.7), m.sample(0.37));
    assert.equal(
      validateProjectData({
        version: 1,
        assets: [asset],
        project: { ...blankProject(), clips: [clip] },
      }).project.clips[0].motion,
      m.id,
    );
  }
});
test("large-file base64 streaming handles arbitrary chunk boundaries without truncation", async () => {
  for (const length of [0, 1, 2, 3, 65537, 196613]) {
    const bytes = Uint8Array.from({ length }, (_, i) => i % 251);
    let encoded = "",
      largest = 0;
    await writeBase64(new Blob([bytes]), async (part) => {
      largest = Math.max(largest, part.length);
      encoded += part;
    });
    assert.equal(encoded, Buffer.from(bytes).toString("base64"));
    assert.ok(largest <= 65536);
  }
  assert.equal(
    estimatedMediaBytes([
      {
        id: "a",
        name: "big",
        type: "video",
        url: "blob:test",
        duration: 1,
        size: 300 * 1024 * 1024,
      },
    ]),
    300 * 1024 * 1024,
  );
});

test("native project writer streams valid JSON and escapes embedded data URLs", async () => {
  const { saveLargeProject } = await import("../src/media/portable");
  const old = (globalThis as any).window;
  let output = "",
    closed = false;
  (globalThis as any).window = {
    showSaveFilePicker: async () => ({
      createWritable: async () => ({
        write: async (s: string) => {
          output += s;
        },
        close: async () => {
          closed = true;
        },
        abort: async () => {},
      }),
    }),
  };
  try {
    const asset: Asset = {
      id: "a",
      name: 'quoted "asset"',
      type: "image",
      duration: 5,
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
    };
    await saveLargeProject(blankProject(), [asset]);
    assert.equal(closed, true);
    assert.deepEqual(JSON.parse(output).assets, [asset]);
  } finally {
    (globalThis as any).window = old;
  }
});
test("native project write failures abort the incomplete file", async () => {
  const { saveLargeProject } = await import("../src/media/portable");
  const old = (globalThis as any).window;
  let aborted = false;
  (globalThis as any).window = {
    showSaveFilePicker: async () => ({
      createWritable: async () => ({
        write: async () => {
          throw new Error("disk full");
        },
        close: async () => {},
        abort: async () => {
          aborted = true;
        },
      }),
    }),
  };
  try {
    await assert.rejects(saveLargeProject(blankProject(), []), /disk full/);
    assert.ok(aborted);
  } finally {
    (globalThis as any).window = old;
  }
});

test("long timeline ruler stays bounded and labels the scrolled hours, not just the first 2000 ticks", async () => {
  const { rulerTicks } = await import("../src/pages/Editor/timeline/ruler");
  const ticks = rulerTicks(
    12 * 3600 * 55,
    55,
    Math.floor((3 * 3600 * 55) / 600),
    390,
  );
  assert.ok(ticks.length < 100);
  assert.ok(ticks.some((t) => t >= 3 * 3600));
  assert.ok(ticks[0] > 10000);
});
