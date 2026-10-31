import test from "node:test";
import assert from "node:assert/strict";
import { nova } from "../src/templates/nova";
import { novaArt } from "../src/templates/nova/art";
import {
  novaSoundtrack,
  NOVA_SECONDS,
  NOVA_RATE,
} from "../src/templates/nova/soundtrack";
test("NOVA has six distinct editable scenes totaling 24 seconds", () => {
  assert.equal(nova.scenes.length, 6);
  assert.equal(nova.ratio, "16:9");
  assert.equal(
    nova.scenes.reduce((n, s) => n + s.seconds, 0),
    NOVA_SECONDS,
  );
  assert.equal(new Set(nova.scenes.map((s) => s.text)).size, 6);
  assert.equal(new Set(nova.scenes.map((_, i) => novaArt(i))).size, 6);
  for (let i = 0; i < 6; i++) {
    assert.match(novaArt(i), /width="1920"/);
    assert.doesNotMatch(novaArt(i), /<script|https?:\/\/(?!www.w3.org)/);
  }
});
function energy(data: Uint8Array, start: number, end: number) {
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let sum = 0;
  for (let i = Math.floor(start * NOVA_RATE); i < end * NOVA_RATE; i++) {
    const n = v.getInt16(44 + i * 2, true) / 32768;
    sum += n * n;
  }
  return sum / ((end - start) * NOVA_RATE);
}
test("original score is a bounded, deterministic 24-second PCM WAV", () => {
  const data = novaSoundtrack();
  const v = new DataView(data.buffer);
  assert.equal(new TextDecoder().decode(data.slice(0, 4)), "RIFF");
  assert.equal(new TextDecoder().decode(data.slice(8, 12)), "WAVE");
  assert.equal(v.getUint32(24, true), NOVA_RATE);
  assert.equal(v.getUint16(22, true), 1);
  assert.equal(data.length, 44 + NOVA_SECONDS * NOVA_RATE * 2);
  assert.deepEqual(data, novaSoundtrack());
  assert.ok(energy(data, 1, 3) > 0.001);
  assert.ok(energy(data, 23.9, 24) < energy(data, 22, 22.1));
  let peak = 0;
  for (let i = 44; i < data.length; i += 2)
    peak = Math.max(peak, Math.abs(v.getInt16(i, true)));
  assert.ok(peak < 32767);
  assert.ok(peak > 5000);
});
test("transition-only track is silent between cues and rises around each cut", () => {
  const data = novaSoundtrack("sfx");
  assert.equal(energy(data, 2, 3), 0);
  for (const at of [4, 8, 12, 16, 20]) {
    assert.ok(energy(data, at - 0.3, at) > 0.001);
    assert.ok(energy(data, at, at + 0.3) > 0.005);
  }
  assert.notDeepEqual(data, novaSoundtrack("music"));
});
