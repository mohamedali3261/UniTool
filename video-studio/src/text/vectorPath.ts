export type VectorPoint = { x: number; y: number };
export function validPoints(value: unknown): value is VectorPoint[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.length <= 64 &&
    value.every(
      (p) =>
        p &&
        typeof p.x === "number" &&
        Number.isFinite(p.x) &&
        Math.abs(p.x) <= 1 &&
        typeof p.y === "number" &&
        Number.isFinite(p.y) &&
        Math.abs(p.y) <= 1,
    )
  );
}
