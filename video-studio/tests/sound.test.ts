import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { soundPresets, soundCategories } from "../src/sound/presets";
import { synthSound, SOUND_RATE } from "../src/sound/synth";
import { cueTime } from "../src/sound/timing";
import { blankProject, assetIsUsed, type SoundCue } from "../src/types";
import { validateProjectData } from "../src/lib/projectIO";
import { closeGaps } from "../src/pages/Editor/timeline/editing";
const cue: SoundCue = {
  id: "cue",
  assetId: "sound",
  at: 3,
  start: 0.1,
  end: 0.6,
  volume: 0.7,
};
test("56 unique deterministic original sound effects across seven categories", () => {
  assert.equal(soundPresets.length, 56);
  assert.equal(new Set(soundPresets.map((s) => s.id)).size, 56);
  const hashes = new Set<string>();
  for (const category of soundCategories)
    assert.equal(
      soundPresets.filter((s) => s.category === category.id).length,
      8,
    );
  for (const p of soundPresets) {
    const b = synthSound(p),
      v = new DataView(b.buffer);
    hashes.add(createHash("sha256").update(b).digest("hex"));
    assert.equal(v.getUint32(24, true), SOUND_RATE);
    assert.equal(b.length, 44 + Math.ceil(p.seconds * SOUND_RATE) * 2);
    let peak = 0,
      energy = 0;
    for (let i = 44; i < b.length; i += 2) {
      const s = v.getInt16(i, true);
      peak = Math.max(peak, Math.abs(s));
      energy += s * s;
    }
    assert.ok(peak < 32767 && peak > 500);
    assert.ok(energy > 0);
    assert.deepEqual(b, synthSound(p));
  }
  assert.equal(hashes.size, 56);
});
test("sound cues honor trim, timing, mute and portable asset usage", () => {
  const p = { ...blankProject(), sounds: [cue] };
  assert.equal(cueTime(p, cue, 2.99), null);
  assert.ok(Math.abs(cueTime(p, cue, 3.2)! - 0.3) < 0.0001);
  assert.equal(cueTime(p, cue, 3.5), null);
  assert.equal(
    cueTime({ ...p, tracks: { sfx: { muted: true } } }, cue, 3.1),
    null,
  );
  assert.ok(assetIsUsed(p, "sound"));
  const data = {
    version: 1,
    project: p,
    assets: [
      {
        id: "sound",
        name: "cue.wav",
        type: "audio",
        duration: 1,
        url: "data:audio/wav;base64,AA==",
      },
    ],
  };
  assert.equal(validateProjectData(data).project.sounds?.[0].at, 3);
  for (const bad of [
    { volume: 2 },
    { at: -1 },
    { start: 0.8, end: 0.4 },
    { end: 2 },
    { assetId: "missing" },
  ])
    assert.throws(() =>
      validateProjectData({
        ...data,
        project: { ...p, sounds: [{ ...cue, ...bad }] },
      }),
    );
  assert.throws(() =>
    validateProjectData({
      ...data,
      project: {
        ...p,
        sounds: Array.from({ length: 33 }, (_, i) => ({
          ...cue,
          id: String(i),
        })),
      },
    }),
  );
});
test("closing timeline gaps translates sounds unless the SFX track is locked", () => {
  const clip = {
    id: "gap",
    assetId: "image",
    start: 0,
    end: 2,
    speed: 1,
    volume: 0,
    filter: "original",
    brightness: 1,
    contrast: 1,
    saturation: 1,
    gap: true,
  };
  const p = {
    ...blankProject(),
    clips: [clip, { ...clip, id: "video", gap: false }],
    sounds: [cue],
  };
  assert.equal(closeGaps(p).sounds?.[0].at, 1);
  assert.equal(
    closeGaps({ ...p, tracks: { sfx: { locked: true } } }).sounds?.[0].at,
    3,
  );
});
