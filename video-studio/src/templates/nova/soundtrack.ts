export const NOVA_SECONDS = 24;
export const NOVA_RATE = 22050;
export type SoundMode = "mix" | "music" | "sfx";
/** Deterministic, original synth score: 120 BPM, six four-second scenes.
 * No external downloads, speech, copyrighted samples, or AudioContext needed. */
export function novaSoundtrack(mode: SoundMode = "mix"): Uint8Array {
  const count = NOVA_SECONDS * NOVA_RATE;
  const bytes = new Uint8Array(44 + count * 2);
  const view = new DataView(bytes.buffer);
  const label = (at: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  label(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  label(8, "WAVE");
  label(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, NOVA_RATE, true);
  view.setUint32(28, NOVA_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  label(36, "data");
  view.setUint32(40, count * 2, true);
  let seed = 703;
  const root = [130.8128, 103.8262, 155.5635, 116.5409, 130.8128, 130.8128];
  for (let i = 0; i < count; i++) {
    const t = i / NOVA_RATE,
      scene = Math.min(5, Math.floor(t / 4));
    const beat = t % 0.5,
      step = t % 0.25,
      f = root[scene];
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const noise = (seed >>> 0) / 2147483648 - 1;
    let music = 0,
      sfx = 0;
    if (mode !== "sfx") {
      const chord =
        Math.sin(2 * Math.PI * f * t) +
        0.55 * Math.sin(2 * Math.PI * f * 1.189207 * t) +
        0.45 * Math.sin(2 * Math.PI * f * 1.498307 * t);
      const arp = f * [2, 2.378414, 2.996614, 4][Math.floor(t * 4) % 4];
      music =
        0.065 * chord +
        0.07 * Math.sin(2 * Math.PI * arp * t) * Math.exp(-step * 15);
      music +=
        0.23 *
        Math.sin(2 * Math.PI * (48 * beat + 1.2 * (1 - Math.exp(-beat * 35)))) *
        Math.exp(-beat * 19);
      music += 0.024 * noise * Math.exp(-(t % 0.25) * 65);
    }
    if (mode !== "music") {
      // Rise into each cut, then a low impact + bright transient on its boundary.
      const phase = t % 4;
      if (phase > 3.35 && t < 23.3) {
        const p = (phase - 3.35) / 0.65;
        sfx +=
          0.17 * noise * p * p +
          0.04 * Math.sin(2 * Math.PI * (350 * t + 900 * p * p)) * p;
      }
      if (t >= 4 && phase < 0.65)
        sfx +=
          0.32 * Math.sin(2 * Math.PI * 52 * phase) * Math.exp(-phase * 10) +
          0.13 * noise * Math.exp(-phase * 35);
      if (t < 1.5)
        sfx +=
          0.08 *
          Math.sin(2 * Math.PI * 65.4064 * t) *
          Math.sin((Math.PI * t) / 1.5);
      if (t > 20)
        sfx +=
          0.07 *
          Math.sin(2 * Math.PI * 523.251 * t) *
          Math.exp(-(t - 20) * 1.5);
    }
    const fade = Math.min(1, t / 0.12, (NOVA_SECONDS - t) / 1.2);
    const value = Math.max(-0.92, Math.min(0.92, (music + sfx) * fade));
    view.setInt16(44 + i * 2, Math.round(value * 32767), true);
  }
  return bytes;
}
