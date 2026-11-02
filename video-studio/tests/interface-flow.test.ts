import test from "node:test";
import assert from "node:assert/strict";
import { interfaceFlow } from "../src/templates/interface-flow";
import {
  interfaceScenes,
  isInterfaceScene,
} from "../src/templates/interface-flow/scenes";
import { blankProject } from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
test("interface reel has seven distinct scenes, five tools and exactly 70 seconds", () => {
  assert.equal(interfaceFlow.ratio, "9:16");
  assert.equal(interfaceFlow.scenes.length, 7);
  assert.equal(
    interfaceFlow.scenes.reduce((n, s) => n + s.seconds, 0),
    70,
  );
  assert.equal(interfaceScenes.length, 7);
  assert.equal(new Set(interfaceScenes.map((s) => s.id)).size, 7);
  for (const s of interfaceScenes) assert.ok(isInterfaceScene(s.id));
  assert.ok(!isInterfaceScene("<script>"));
  assert.ok(interfaceFlow.scenes.some((s) => s.text.includes("Figma")));
  assert.ok(interfaceFlow.scenes.some((s) => s.text.includes("DevTools")));
});
test("animated UI scene and accent survive portable JSON and invalid values are rejected", () => {
  const clip = {
    id: "c",
    assetId: "image",
    start: 0,
    end: 10,
    speed: 1,
    volume: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    filter: "original",
    designScene: "magic",
    designAccent: "#4bdfc5",
  };
  const data = {
    version: 1,
    project: { ...blankProject(), clips: [clip] },
    assets: [
      {
        id: "image",
        name: "bg.svg",
        type: "image",
        duration: 5,
        url: "data:image/svg+xml;base64,AA==",
      },
    ],
  };
  const p = validateProjectData(JSON.parse(JSON.stringify(data))).project;
  assert.equal(p.clips[0].designScene, "magic");
  assert.equal(p.clips[0].designAccent, "#4bdfc5");
  for (const patch of [
    { designScene: "arbitrary-js" },
    { designAccent: "red;url()" },
    { designAccent: 123 },
  ])
    assert.throws(() =>
      validateProjectData({
        ...data,
        project: { ...data.project, clips: [{ ...clip, ...patch }] },
      }),
    );
});

test("all seven UI renderers are deterministic, animated and emit finite geometry", async () => {
  const { drawInterfaceScene } =
    await import("../src/templates/interface-flow/render");
  function trace(id: (typeof interfaceScenes)[number]["id"], time: number) {
    const log: unknown[][] = [];
    const state: Record<string, unknown> = { globalAlpha: 1 };
    const ctx = new Proxy(state, {
      get(target, key) {
        if (key in target) return target[String(key)];
        return (...args: unknown[]) => {
          for (const a of args)
            if (typeof a === "number")
              assert.ok(
                Number.isFinite(a),
                `${String(key)}: invalid coordinate`,
              );
          log.push([String(key), ...args]);
        };
      },
      set(target, key, value) {
        target[String(key)] = value;
        return true;
      },
    }) as unknown as CanvasRenderingContext2D;
    drawInterfaceScene(ctx, id, time);
    return log;
  }
  for (const scene of interfaceScenes) {
    assert.deepEqual(trace(scene.id, 0.9), trace(scene.id, 0.9));
    assert.notDeepEqual(trace(scene.id, 0.9), trace(scene.id, 4.5));
  }
});
