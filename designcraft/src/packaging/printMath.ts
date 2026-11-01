import { cartonGeometry, MM_TO_PX, type CartonSize } from "./geometry";
export type PrintDpi = 300 | 600;
export function printSpec(size: CartonSize, dpi: PrintDpi) {
  if (dpi !== 300 && dpi !== 600) throw Error("Unsupported DPI");
  const g = cartonGeometry(size),
    width = Math.ceil((g.width * dpi) / 25.4),
    height = Math.ceil((g.height * dpi) / 25.4);
  if (width * height > 40_000_000 || width > 16384 || height > 16384)
    throw Error("PRINT_TOO_LARGE");
  return {
    mmWidth: g.width,
    mmHeight: g.height,
    width,
    height,
    dpi,
    multiplier: dpi / 96,
  };
}
export function assertPhysicalCanvas(
  size: CartonSize,
  width: number,
  height: number,
) {
  const g = cartonGeometry(size);
  if (
    Math.abs(width - g.width * MM_TO_PX) > 0.01 ||
    Math.abs(height - g.height * MM_TO_PX) > 0.01
  )
    throw Error("CANVAS_SIZE_MISMATCH");
}
/** pHYs encodes physical pixel density. Merely enlarging a PNG does not set print DPI. */
export function pngWithDpi(bytes: Uint8Array, dpi: PrintDpi): Uint8Array {
  if (
    bytes.length < 33 ||
    bytes[0] !== 137 ||
    String.fromCharCode(...bytes.slice(1, 4)) !== "PNG"
  )
    throw Error("Invalid PNG");
  const ppm = Math.round(dpi / 0.0254),
    chunk = new Uint8Array(21),
    view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4);
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  chunk[16] = 1;
  let crc = 0xffffffff;
  for (const b of chunk.slice(4, 17)) {
    crc ^= b;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  view.setUint32(17, (crc ^ 0xffffffff) >>> 0);
  const pieces: Uint8Array[] = [bytes.slice(0, 33), chunk];
  let offset = 33;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw Error("Truncated PNG");
    const length =
      new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0) +
      12;
    if (offset + length > bytes.length) throw Error("Truncated PNG");
    const name = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (name !== "pHYs") pieces.push(bytes.slice(offset, offset + length));
    offset += length;
  }
  const result = new Uint8Array(pieces.reduce((sum, p) => sum + p.length, 0));
  let cursor = 0;
  for (const p of pieces) {
    result.set(p, cursor);
    cursor += p.length;
  }
  return result;
}
