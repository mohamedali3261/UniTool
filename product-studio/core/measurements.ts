import type { Layer } from "./model";
import type { PrintArea } from "./advanced";
export type DisplayUnit = "mm" | "cm" | "in";
export function fromCm(cm: number, unit: DisplayUnit) {
  return unit === "mm" ? cm * 10 : unit === "in" ? cm / 2.54 : cm;
}
export function toCm(value: number, unit: DisplayUnit) {
  return unit === "mm" ? value / 10 : unit === "in" ? value * 2.54 : value;
}
export function selectionSize(
  l: Layer,
  area: PrintArea | undefined,
  unit: DisplayUnit = "mm",
) {
  if (!area) return `${Math.round(l.w)} × ${Math.round(l.h)} px`;
  const format = (v: number) =>
    fromCm(v, unit)
      .toFixed(unit === "mm" ? 0 : 2)
      .replace(/\.00$/, "");
  return `${format((l.w / 1024) * area.width)} × ${format((l.h / 1024) * area.height)} ${unit}`;
}
export function rotatedBounds(l: Layer) {
  const a = (l.rotation * Math.PI) / 180,
    c = Math.abs(Math.cos(a)),
    s = Math.abs(Math.sin(a)),
    w = l.w * c + l.h * s,
    h = l.w * s + l.h * c;
  return { x: l.x + l.w / 2 - w / 2, y: l.y + l.h / 2 - h / 2, w, h };
}
