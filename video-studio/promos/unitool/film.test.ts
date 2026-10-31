import test from "node:test";
import assert from "node:assert/strict";
import {
  CONFIG,
  TIMELINE,
  SCENES,
  render,
  audioSample,
  AUDIO_CUES,
  spring,
  smooth,
} from "./film";
test("eight scene functions cover exactly 92 seconds and 2760 frames without gaps", () => {
  assert.equal(CONFIG.width, 1920);
  assert.equal(CONFIG.height, 1080);
  assert.equal(CONFIG.fps, 30);
  assert.equal(CONFIG.duration, 92);
  assert.equal(SCENES.length, 8);
  assert.deepEqual(
    TIMELINE.map((s) => s.start),
    [0, 6, 22, 36, 52, 68, 80, 86],
  );
  assert.deepEqual(
    TIMELINE.map((s) => s.end - s.start),
    [6, 16, 14, 16, 16, 12, 6, 6],
  );
  for (let i = 1; i < TIMELINE.length; i++)
    assert.equal(TIMELINE[i - 1].end, TIMELINE[i].start);
  assert.equal(CONFIG.duration * CONFIG.fps, 2760);
});
test("all 2760 rendered frames have finite geometry and are deterministic; no stock images", () => {
  for (let f = 0; f < 2760; f++) {
    const t = f / 30,
      svg = render(t);
    assert.ok(!/NaN|Infinity/.test(svg), `invalid geometry at ${t}`);
    assert.ok(svg.startsWith("<svg"));
    assert.ok(!/<image\b|<img\b|https?:\/\/(?!www.w3.org)/.test(svg));
    if (f % 37 === 0) assert.equal(svg, render(t));
  }
});
test("easing settles exactly, is bounded on input, and spring has a controlled overshoot", () => {
  assert.equal(smooth(-1), 0);
  assert.equal(smooth(2), 1);
  assert.equal(spring(0), 0);
  assert.equal(spring(1), 1);
  const values = Array.from({ length: 101 }, (_, i) => spring(i / 100));
  assert.ok(Math.max(...values) > 1);
  assert.ok(Math.max(...values) < 1.2);
});
test("ending has the editable site, CTA and share line; code uses escaped SVG text", () => {
  const last = render(91);
  assert.ok(last.includes(CONFIG.site));
  assert.ok(last.includes("ابدأ الآن"));
  assert.ok(last.includes("شاركه مع حد محتاجه"));
  assert.ok(render(75).includes("&lt;svg"));
});
test("UI audio is deterministic, non-silent, finite, unclipped and sync cues fit the timeline", () => {
  assert.ok(AUDIO_CUES.length > 35);
  assert.ok(AUDIO_CUES.every((c) => c.at >= 0 && c.at < 92));
  for (let i = 0; i < 92000; i++) {
    const t = i / 1000,
      a = audioSample(t);
    assert.ok(Number.isFinite(a));
    assert.ok(Math.abs(a) <= 0.9);
    if (i % 1200 === 0) assert.equal(a, audioSample(t));
  }
  let energy = 0;
  for (let i = 0; i < 6000; i++)
    energy += audioSample(3.35 + i / 48000, false) ** 2;
  assert.ok(energy > 0.01);
  assert.equal(audioSample(0, false), 0);
  assert.ok(Math.abs(audioSample(91.999)) < 0.00001);
});
