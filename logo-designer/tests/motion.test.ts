import { test } from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { blank, node } from "../types";
import {
  motionFrame,
  motionPresets,
  validMotion,
  motionSettings,
} from "../motion";
import { motionTemplates, motionTemplateProject } from "../motion-templates";
import { validateProject, saveProject, allProjects } from "../storage";
import {
  nouvellePalette,
  recense,
  indexe,
  gifIndexe,
} from "../../bloub-svg/src/ui/anime";

test("all six motion templates retain independently editable valid artwork in both languages", () => {
  assert.equal(motionTemplates.length, 24);
  for (const preset of motionPresets)
    for (const lang of ["ar", "en"] as const) {
      const p = validateProject(motionTemplateProject(preset.id, lang));
      assert.equal(p.motion?.preset, preset.id);
      assert.ok(p.nodes.some((n) => n.kind === "text"));
      assert.ok(p.nodes.some((n) => n.kind !== "text"));
      assert.equal(new Set(p.nodes.map((n) => n.id)).size, p.nodes.length);
      assert.ok(
        motionTemplateProject(preset.id, lang, "CUSTOM").nodes.some(
          (n) => n.text === "CUSTOM",
        ),
      );
    }
});
test("motion evaluation is deterministic, bounded and does not modify source, hidden nodes or authored style", () => {
  for (const preset of motionPresets) {
    const project = motionTemplateProject(preset.id, "ar");
    project.nodes.push(node({ kind: "shape", hidden: true, opacity: 0.3 }));
    const original = structuredClone(project);
    for (const t of [-1, 0, 0.2, 0.5, 0.8, 1, 2]) {
      const frame = motionFrame(project, t);
      assert.deepEqual(frame, motionFrame(project, t));
      assert.deepEqual(frame.nodes.at(-1), project.nodes.at(-1));
      frame.nodes.forEach((n, i) => {
        assert.ok(
          Number.isFinite(n.x) && Number.isFinite(n.y) && n.w > 0 && n.h > 0,
        );
        assert.ok(n.opacity >= 0 && n.opacity <= project.nodes[i].opacity);
        assert.equal(n.fill, project.nodes[i].fill);
        assert.equal(n.text, project.nodes[i].text);
      });
    }
    assert.deepEqual(project, original);
    const first = motionFrame(project, 0),
      last = motionFrame(project, 1);
    if (preset.id === "pulse") assert.deepEqual(first.nodes, last.nodes);
    else
      for (const frame of [first, last])
        assert.ok(
          frame.nodes.filter((n) => !n.hidden).every((n) => n.opacity === 0),
        );
  }
});
test("invalid settings are rejected on import; old projects have safe defaults", () => {
  const p = blank();
  assert.equal(validateProject(p).motion, undefined);
  assert.equal(motionSettings(p).preset, "reveal");
  for (const motion of [
    null,
    {},
    "spin",
    { preset: "evil", duration: 3 },
    { preset: "rise", duration: Infinity },
    { preset: "rise", duration: 1 },
    { preset: "rise", duration: 7 },
  ]) {
    assert.equal(validMotion(motion), false);
    assert.throws(() => validateProject({ ...p, motion }));
  }
});
test("saved editable projects retain animation settings", async () => {
  const p = motionTemplateProject("assemble", "en");
  p.motion.duration = 5;
  await saveProject(p);
  assert.deepEqual(
    (await allProjects()).find((n) => n.id === p.id)?.motion,
    p.motion,
  );
});
test("GIF codec produces genuine animated GIF structure, disposal, loop and frame delays", () => {
  const palette = nouvellePalette(),
    a = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]),
    b = new Uint8ClampedArray([0, 0, 0, 0, 0, 255, 0, 255]);
  recense(palette, a);
  recense(palette, b);
  const data = gifIndexe(
    palette,
    [indexe(palette, a), indexe(palette, b)],
    2,
    1,
    100,
  );
  const bytes = Buffer.from(data);
  assert.equal(bytes.subarray(0, 6).toString(), "GIF89a");
  assert.ok(bytes.includes(Buffer.from("NETSCAPE2.0")));
  assert.equal(bytes.readUInt16LE(6), 2);
  assert.equal(bytes.readUInt16LE(8), 1);
  assert.equal(
    bytes.filter((v, i) => v === 0x21 && bytes[i + 1] === 0xf9).length,
    2,
  );
  assert.equal(data.at(-1), 0x3b);
});
