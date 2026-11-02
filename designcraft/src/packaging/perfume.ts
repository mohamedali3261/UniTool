import { cartonError, type CartonSize } from "./geometry";
/** Starter carton sizes only: capacity never determines external bottle dimensions. */
export const PERFUME_PRESETS = [
  { ml: 30, size: { height: 95, width: 40, depth: 30, glue: 10, tuck: 8 } },
  { ml: 50, size: { height: 115, width: 50, depth: 35, glue: 12, tuck: 10 } },
  { ml: 100, size: { height: 140, width: 60, depth: 45, glue: 12, tuck: 12 } },
] as const;
export type BottleMeasurements = {
  length: number;
  width: number;
  depth: number;
  clearance: number;
};
export function cartonForBottle(
  b: BottleMeasurements,
  tabs: Pick<CartonSize, "glue" | "tuck">,
): CartonSize {
  if (
    ![b.length, b.width, b.depth, b.clearance].every(Number.isFinite) ||
    b.length <= 0 ||
    b.width <= 0 ||
    b.depth <= 0 ||
    b.clearance < 0 ||
    b.clearance > 10
  )
    throw Error("INVALID_BOTTLE");
  const round = (n: number) => Math.round(n * 100) / 100;
  const down = (n: number) => Math.floor(n * 100 + 1e-9) / 100;
  const width = round(b.width + 2 * b.clearance),
    depth = round(b.depth + 2 * b.clearance);
  const size = {
    height: round(b.length + 2 * b.clearance),
    width,
    depth,
    glue: down(Math.min(tabs.glue, width * 0.4, 30)),
    tuck: down(Math.min(tabs.tuck, depth * 0.6, width * 0.25, 30)),
  };
  if (cartonError(size)) throw Error("BOTTLE_OUT_OF_RANGE");
  return size;
}
