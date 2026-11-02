import type { SoundPreset } from "./presets";
export const SOUND_RATE = 22050;
/** Original deterministic synthesized effects, generated only on request. */
export function synthSound(p: SoundPreset): Uint8Array {
  const count = Math.ceil(p.seconds * SOUND_RATE),
    bytes = new Uint8Array(44 + count * 2),
    v = new DataView(bytes.buffer);
  const label = (at: number, text: string) =>
    [...text].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  label(0, "RIFF");
  v.setUint32(4, bytes.length - 8, true);
  label(8, "WAVE");
  label(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SOUND_RATE, true);
  v.setUint32(28, SOUND_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  label(36, "data");
  v.setUint32(40, count * 2, true);
  let seed = 17 + p.variant * 703 + p.category.charCodeAt(0) * 127,
    low = 0;
  const k = p.variant,
    pi = 2 * Math.PI,
    base = 180 + k * 63;
  for (let i = 0; i < count; i++) {
    const t = i / SOUND_RATE,
      q = t / p.seconds;
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const n = (seed >>> 0) / 2147483648 - 1;
    low = low * 0.92 + n * 0.08;
    let x = 0;
    if (p.category === "whoosh")
      x =
        (n * 0.25 +
          low * 2 +
          Math.sin(pi * (base * t + (k % 2 ? -1 : 1) * 700 * t * t)) * 0.16) *
        Math.pow(Math.sin(Math.PI * q), 1.4);
    if (p.category === "impact")
      x =
        (Math.sin(pi * ((36 + k * 12) * t + 2 * (1 - Math.exp(-t * 35)))) *
          0.65 +
          n * 0.3 * Math.exp(-t * 24)) *
        Math.exp(-t * (5 + k * 0.5));
    if (p.category === "ui")
      x =
        (Math.sin(pi * (650 + k * 170) * t) * 0.45 +
          Math.sin(pi * (980 + k * 100) * t) * 0.15) *
        Math.exp(-(t % (k === 3 ? 0.09 : p.seconds)) * 36);
    if (p.category === "chime")
      x =
        (Math.sin(pi * (520 + k * 72) * t) * 0.38 +
          Math.sin(pi * (780 + k * 108) * t) * 0.2 +
          Math.sin(pi * (1040 + k * 144) * t) * 0.1) *
        Math.exp(-t * 3);
    if (p.category === "cinema")
      x =
        (Math.sin(pi * ((45 + k * 17) * t + 60 * t * t)) * 0.4 +
          Math.sin(pi * (90 + k * 34) * t) * 0.18 +
          low * 0.5) *
        Math.sin(Math.PI * q) *
        (0.5 + 0.5 * q);
    if (p.category === "nature")
      x =
        k === 3 || k === 6
          ? Math.sin(pi * (800 + k * 130) * t + 12 * Math.sin(t * 35)) *
            Math.exp(-(t % 0.3) * 30) *
            0.4
          : (low * (1 + 0.5 * Math.sin(t * (2 + k))) +
              n * (k === 1 ? 0.12 : 0.025)) *
            0.75;
    if (p.category === "rhythm") {
      const a = k === 6 ? t % 0.23 : t;
      x =
        k === 0 || k === 5 || k === 6
          ? Math.sin(pi * ((44 + k * 10) * a + 2 * (1 - Math.exp(-a * 35)))) *
            0.7 *
            Math.exp(-a * 13)
          : n * 0.55 * Math.exp(-a * (k === 3 ? 9 : 30)) +
            Math.sin(pi * (180 + k * 45) * a) * 0.15 * Math.exp(-a * 18);
    }
    const fade = Math.min(1, t / 0.006, (p.seconds - t) / 0.04);
    v.setInt16(
      44 + i * 2,
      Math.round(Math.max(-0.9, Math.min(0.9, x)) * fade * 32767),
      true,
    );
  }
  return bytes;
}
