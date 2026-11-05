/** Minimal RIFF/WebP animation muxer. Frames are genuine browser-encoded WebP,
 * not renamed PNGs. Each full-canvas ANMF replaces the previous frame. */
const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const uint = (v: number, bytes: number) =>
  Uint8Array.from(
    { length: bytes },
    (_, i) => Math.floor(v / 2 ** (i * 8)) & 255,
  );
function join(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
function chunk(tag: string, payload: Uint8Array) {
  return join([
    ascii(tag),
    uint(payload.length, 4),
    payload,
    ...(payload.length % 2 ? [new Uint8Array(1)] : []),
  ]);
}
function framePayload(bytes: Uint8Array) {
  const tag = (at: number) =>
      String.fromCharCode(...bytes.subarray(at, at + 4)),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 20 ||
    tag(0) !== "RIFF" ||
    tag(8) !== "WEBP" ||
    view.getUint32(4, true) + 8 !== bytes.length
  )
    throw Error("The browser did not encode WebP");
  const parts: Uint8Array[] = [];
  let alpha = false,
    bitstream = false;
  for (let at = 12; at + 8 <= bytes.length;) {
    const size = view.getUint32(at + 4, true),
      end = at + 8 + size;
    if (end > bytes.length) throw Error("Truncated WebP frame");
    const name = tag(at);
    if (name === "ALPH" || name === "VP8 " || name === "VP8L") {
      parts.push(chunk(name, bytes.slice(at + 8, end)));
      if (name !== "ALPH") bitstream = true;
    }
    if (
      name === "ALPH" ||
      (name === "VP8X" && !!(bytes[at + 8] & 16)) ||
      (name === "VP8L" && size >= 5 && !!(bytes[at + 12] & 16))
    )
      alpha = true;
    at = end + (size % 2);
  }
  if (!bitstream) throw Error("Missing WebP bitstream");
  return { data: join(parts), alpha };
}
export function animatedWebP(
  frames: Uint8Array[],
  width: number,
  height: number,
  delayMs: number,
): Uint8Array<ArrayBuffer> {
  if (
    !frames.length ||
    frames.length > 120 ||
    ![width, height].every((v) => Number.isInteger(v) && v >= 1 && v <= 1024) ||
    !Number.isInteger(delayMs) ||
    delayMs < 10 ||
    delayMs > 1000
  )
    throw Error("Invalid animated WebP dimensions or timing");
  const payloads = frames.map(framePayload),
    header = join([
      uint(2 | (payloads.some((f) => f.alpha) ? 16 : 0), 1),
      new Uint8Array(3),
      uint(width - 1, 3),
      uint(height - 1, 3),
    ]);
  const body = join([
    ascii("WEBP"),
    chunk("VP8X", header),
    chunk("ANIM", new Uint8Array(6)),
    ...payloads.map((f) =>
      chunk(
        "ANMF",
        join([
          new Uint8Array(6),
          uint(width - 1, 3),
          uint(height - 1, 3),
          uint(delayMs, 3),
          uint(2, 1),
          f.data,
        ]),
      ),
    ),
  ]);
  return join([ascii("RIFF"), uint(body.length, 4), body]);
}
