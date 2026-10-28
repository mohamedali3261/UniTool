import test from "node:test";
import assert from "node:assert/strict";
import { effects, effectById, categories } from "../src/effects/registry";
import { effectFrame, drawEffectOverlay } from "../src/effects/renderer";
import { drawFrame } from "../src/lib/media";
import { blankProject, filters, type Clip } from "../src/types";
import { loadProject } from "../src/lib/projectIO";
const clip: Clip = {
  id: "c",
  assetId: "a",
  start: 0,
  end: 5,
  speed: 1,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  volume: 1,
};
function mock() {
  const calls: unknown[][] = [];
  const ctx = new Proxy(
    { canvas: { width: 640, height: 360 } },
    {
      get(target, key) {
        if (key in target) return target[key as keyof typeof target];
        return (...args: unknown[]) => {
          calls.push([key, ...args]);
          if (String(key).includes("Gradient"))
            return {
              addColorStop: (...args: unknown[]) =>
                calls.push(["stop", ...args]),
            };
        };
      },
      set(target, key, value) {
        calls.push([
          "set",
          key,
          typeof value === "object" ? "gradient" : value,
        ]);
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}
test("34 unique effects, five isolated categories; all legacy preset IDs retained", () => {
  assert.equal(effects.length, 34);
  assert.equal(effectById.size, effects.length);
  assert.equal(categories.length, 5);
  for (const id of [
    "original",
    "cinema",
    "warm",
    "mono",
    "vintage",
    "vivid",
    "cool",
    "dream",
  ])
    assert.equal(effectById.get(id)?.kind, "filter");
  for (const c of categories)
    assert.ok(effects.some((e) => e.category === c.id));
  assert.equal(filters.length, 17);
});
test("camera transforms are bounded, deterministic, and zero intensity is identity", () => {
  for (const e of effects) {
    for (const seconds of [0, 0.5, 2, 5]) {
      const a = effectFrame(e.id, 640, 360, seconds, seconds / 5, 1, 1);
      const b = effectFrame(e.id, 640, 360, seconds, seconds / 5, 1, 1);
      assert.deepEqual(a.camera, b.camera);
      for (const value of Object.values(a.camera))
        assert.ok(Number.isFinite(value));
      const z = effectFrame(e.id, 640, 360, seconds, seconds / 5, 0, 1).camera;
      assert.equal(z.zoom ?? 1, 1);
      assert.equal(z.x ?? 0, 0);
      assert.equal(z.y ?? 0, 0);
      assert.equal(z.rotate ?? 0, 0);
    }
  }
});
test("effect speed applies to both time-based and progress-based movement", () => {
  assert.equal(
    effectFrame("push-in", 640, 360, 1, 0.2, 1, 2).frame.progress,
    0.4,
  );
  assert.equal(effectFrame("float", 640, 360, 1, 0.2, 1, 2).frame.t, 2);
  assert.equal(effectFrame("push-in", 640, 360, 10, 2, 1, 2).frame.progress, 1);
});
test("overlays are deterministic and balanced; zero intensity performs no overlay work", () => {
  for (const e of effects.filter((e) => e.overlay)) {
    const a = mock(),
      b = mock();
    drawEffectOverlay(a.ctx, effectFrame(e.id, 640, 360, 1, 0.2));
    drawEffectOverlay(b.ctx, effectFrame(e.id, 640, 360, 1, 0.2));
    assert.deepEqual(a.calls, b.calls);
    assert.equal(a.calls[0][0], "save");
    assert.equal(a.calls.at(-1)![0], "restore");
    const off = mock();
    drawEffectOverlay(off.ctx, effectFrame(e.id, 640, 360, 1, 0.2, 0));
    assert.deepEqual(off.calls, []);
  }
});
test("shared frame renderer applies camera and overlays before text", () => {
  const { ctx, calls } = mock();
  const c = { ...clip, effect: "push-in" };
  drawFrame(
    ctx,
    { naturalWidth: 640, naturalHeight: 360 } as CanvasImageSource,
    { ...blankProject(), clips: [c] },
    2,
    c,
  );
  assert.ok(calls.some((c) => c[0] === "scale" && Number(c[1]) > 1));
  const overlay = mock();
  drawFrame(
    overlay.ctx,
    null,
    { ...blankProject(), clips: [{ ...clip, effect: "light-leak" }] },
    2,
    { ...clip, effect: "light-leak" },
  );
  assert.ok(overlay.calls.some((c) => c[0] === "createRadialGradient"));
});
test("effect settings roundtrip, and invalid IDs/ranges are rejected", async () => {
  const assets = [
    {
      id: "a",
      name: "x.png",
      type: "image",
      duration: 5,
      url: "data:image/png;base64,AA==",
    },
  ];
  const file = (extra: object) =>
    new File(
      [
        JSON.stringify({
          version: 1,
          assets,
          project: { ...blankProject(), clips: [{ ...clip, ...extra }] },
        }),
      ],
      "p.json",
    );
  const c = (
    await loadProject(
      file({
        effect: "prism",
        effectIntensity: 0.65,
        effectSpeed: 1.5,
        filter: "teal-amber",
      }),
    )
  ).project.clips[0];
  assert.equal(c.effect, "prism");
  assert.equal(c.filter, "teal-amber");
  for (const bad of [
    { effect: "not-real" },
    { effect: "original" },
    { effectIntensity: -1 },
    { effectIntensity: 2 },
    { effectSpeed: 0 },
    { effectSpeed: 3 },
    { filter: "push-in" },
  ])
    await assert.rejects(loadProject(file(bad)));
});
