import { test } from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { blank, node, type Project } from "../types";
import {
  setTrack,
  trackFor,
  trackFrame,
  sequenceTracks,
  orderedElements,
  changeMotionDuration,
  validTrack,
  graphemes,
} from "../motion-tracks";
import { motionFrame } from "../motion";
import {
  motionTemplates,
  motionTemplateProject,
  motionIndustries,
} from "../motion-templates";
import { fitForPublishing, publishingSizes } from "../motion-layout";
import {
  addMotionVersion,
  switchMotionVersion,
  deleteMotionVersion,
} from "../motion-versions";
import { validateProject, saveProject, allProjects } from "../storage";
import { symbolMap } from "../catalog";
import { svgString } from "../render";
import { animatedWebP } from "../animated-webp";
const design = (): Project => ({
  ...blank(),
  nodes: [
    node({ kind: "text", name: "Detail", text: "وصف", fontSize: 20, y: 400 }),
    node({ name: "Symbol", kind: "icon", asset: "Coffee", y: 200 }),
    node({
      kind: "text",
      name: "Brand",
      text: "مُحَمَّد 👩🏽‍💻",
      fontSize: 70,
      y: 310,
    }),
  ],
  motion: { preset: "reveal", duration: 3 },
});
test("24 templates include six industries with three distinct editable compositions each", () => {
  assert.equal(motionTemplates.length, 24);
  assert.equal(new Set(motionTemplates.map((t) => t.id)).size, 24);
  for (const [id] of motionIndustries.filter(
    (s) => !["all", "general"].includes(s[0]),
  )) {
    const choices = motionTemplates.filter((t) => t.sector === id);
    assert.equal(choices.length, 3);
    const layouts = new Set(choices.map((t) => t.template.layout));
    assert.ok(layouts.size >= 2);
    for (const choice of choices)
      for (const lang of ["ar", "en"] as const) {
        const p = validateProject(
          motionTemplateProject(choice.id, lang, "TEST"),
        );
        assert.ok(p.nodes.some((n) => n.kind === "text" && n.text === "TEST"));
        assert.ok(p.nodes.some((n) => n.kind !== "text"));
        assert.ok(p.motion?.tracks);
        for (const n of p.nodes.filter((n) => n.kind === "icon"))
          assert.ok(symbolMap.has(n.asset));
      }
  }
});
test("auto-sequence sorts symbol, largest brand text, then details, without reordering artwork layers", () => {
  const source = design(),
    original = structuredClone(source),
    p = sequenceTracks(source);
  assert.deepEqual(
    orderedElements(p).map((n) => n.name),
    ["Symbol", "Brand", "Detail"],
  );
  const start = (name: string) =>
    trackFor(
      p,
      p.nodes.find((n) => n.name === name)!,
    ).start;
  assert.ok(start("Symbol") < start("Brand"));
  assert.ok(start("Brand") < start("Detail"));
  assert.deepEqual(source, original);
  assert.deepEqual(p.nodes, source.nodes);
});
test("local entry, hold and exit preserve editable source, apply exact boundaries, and rescale timing with duration", () => {
  let p = design();
  const n = p.nodes[1];
  p = setTrack(p, n.id, {
    start: 0.4,
    end: 2.6,
    enterDuration: 0.5,
    exitDuration: 0.4,
    enter: "slide-left",
    hold: "pulse",
    exit: "shrink",
  });
  const original = structuredClone(p),
    track = trackFor(p, n);
  assert.equal(trackFrame(n, track, 0.3, p).opacity, 0);
  assert.ok(trackFrame(n, track, 0.5, p).x < n.x);
  assert.equal(trackFrame(n, track, 1.2, p).x, n.x);
  assert.ok(trackFrame(n, track, 2.5, p).w < n.w);
  assert.equal(trackFrame(n, track, 2.9, p).opacity, 0);
  assert.deepEqual(p, original);
  const resized = changeMotionDuration(p, 6);
  assert.equal(trackFor(resized, n).start, 0.8);
  assert.equal(trackFor(resized, n).end, 5.2);
  assert.ok(validTrack(trackFor(resized, n), 6));
  validateProject(resized);
  const trimmed = setTrack(p, n.id, { start: 2.5, end: 2.6 });
  assert.ok(validTrack(trackFor(trimmed, n), 3));
});
test("typewriter uses grapheme clusters including Arabic combining marks and joined emoji", () => {
  const p = design(),
    n = p.nodes[2],
    units = graphemes(n.text);
  assert.ok(units.includes("مُ"));
  assert.ok(units.includes("👩🏽‍💻"));
  const q = setTrack(p, n.id, { enter: "type", enterDuration: 1 });
  const t = trackFor(q, n);
  assert.equal(trackFrame(n, t, 0, q).text, "");
  assert.equal(
    trackFrame(n, t, 0.5, q).text,
    units.slice(0, Math.ceil(units.length / 2)).join(""),
  );
  assert.equal(trackFrame(n, t, 1, q).text, n.text);
  assert.equal(q.nodes[2].text, n.text);
});
test("draw and shine render actual geometry effects in the shared SVG and do not leak into source JSON", () => {
  let p = design();
  const n = p.nodes[1];
  p = setTrack(p, n.id, {
    enter: "draw",
    enterDuration: 1,
    hold: "shine",
    exitDuration: 0.3,
  });
  const drawn = svgString(motionFrame(p, 0.15));
  assert.match(drawn, /pathLength="1"/);
  assert.match(drawn, /stroke-dashoffset="0.55/);
  const shine = svgString(motionFrame(p, 0.6));
  assert.match(shine, /data-motion-shine/);
  assert.match(shine, /shine-mask/);
  assert.ok(!JSON.stringify(p).includes("motionVisual"));
  assert.equal(validateProject(p), p);
  assert.throws(() =>
    validateProject({
      ...p,
      nodes: p.nodes.map((n) => ({ ...n, motionVisual: { draw: 0.1 } })),
    }),
  );
});
test("all publishing sizes fit rotated artwork uniformly inside safe margins and retain tracks", () => {
  const source = sequenceTracks(design());
  source.nodes[1].rotation = 42;
  const original = structuredClone(source);
  for (const target of publishingSizes) {
    const p = validateProject(fitForPublishing(source, target.id));
    assert.equal(p.width, target.width);
    assert.equal(p.height, target.height);
    assert.deepEqual(p.motion, source.motion);
    const scale = p.nodes[0].w / source.nodes[0].w;
    for (let i = 0; i < p.nodes.length; i++) {
      const n = p.nodes[i];
      assert.ok(Math.abs(n.h / source.nodes[i].h - scale) < 1e-9);
      assert.ok(Math.abs(n.fontSize / source.nodes[i].fontSize - scale) < 1e-9);
      assert.equal(n.rotation, source.nodes[i].rotation);
      const r = (n.rotation * Math.PI) / 180,
        hx = (Math.abs(Math.cos(r)) * n.w + Math.abs(Math.sin(r)) * n.h) / 2,
        hy = (Math.abs(Math.sin(r)) * n.w + Math.abs(Math.cos(r)) * n.h) / 2;
      assert.ok(
        n.x - hx >= p.width * 0.1 - 0.01 && n.x + hx <= p.width * 0.9 + 0.01,
      );
      assert.ok(
        n.y - hy >= p.height * 0.1 - 0.01 && n.y + hy <= p.height * 0.9 + 0.01,
      );
    }
  }
  assert.deepEqual(source, original);
  const tiny = design();
  tiny.nodes.push(node({ w: 1, h: 1, fontSize: 4, x: 20000 }));
  assert.throws(() => fitForPublishing(tiny, "avatar"));
});
test("alternatives preserve latest unsaved text, colors, timings and size across switches, save and JSON round trip", async () => {
  let p = addMotionVersion(design(), "Test B");
  const first = p.motionVersions![0].id,
    second = p.activeMotionVersion!;
  p = {
    ...p,
    nodes: p.nodes.map((n) => ({ ...n, fill: "#ff0000", text: "Edited" })),
  };
  p = changeMotionDuration(p, 5);
  p = fitForPublishing(p, "story");
  p = switchMotionVersion(p, first);
  assert.equal(p.width, 800);
  assert.equal(p.motion?.duration, 3);
  assert.notEqual(p.nodes[0].text, "Edited");
  p = switchMotionVersion(p, second);
  assert.equal(p.height, 1920);
  assert.equal(p.motion?.duration, 5);
  assert.equal(p.nodes[0].fill, "#ff0000");
  assert.equal(p.nodes[0].text, "Edited");
  validateProject(JSON.parse(JSON.stringify(p)));
  await saveProject(p);
  assert.deepEqual(
    (await allProjects()).find((v) => v.id === p.id)?.motionVersions,
    p.motionVersions,
  );
  const unchanged = deleteMotionVersion(p, second);
  assert.equal(unchanged, p);
  p = deleteMotionVersion(p, first);
  assert.equal(p.motionVersions?.length, 1);
  validateProject(p);
  while (p.motionVersions!.length < 6) p = addMotionVersion(p, "More");
  assert.throws(() => addMotionVersion(p, "Overflow"));
});
test("unsafe track timings, excessive alternatives and malformed WebP input are rejected", () => {
  const p = design(),
    id = p.nodes[0].id,
    t = trackFor(p, p.nodes[0]);
  for (const track of [
    { ...t, start: NaN },
    { ...t, end: 10 },
    { ...t, enter: "evil" },
    { ...t, enterDuration: -1 },
    { ...t, exitDuration: 3 },
  ])
    assert.throws(() =>
      validateProject({
        ...p,
        motion: { ...p.motion, tracks: { [id]: track } },
      }),
    );
  assert.throws(() =>
    validateProject({
      ...p,
      motionVersions: Array(7).fill({}),
      activeMotionVersion: "x",
    }),
  );
  assert.throws(() => animatedWebP([], 256, 256, 50));
  assert.throws(() =>
    animatedWebP([new Uint8Array([137, 80, 78, 71])], 256, 256, 50),
  );
});
