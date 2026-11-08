import type { CartonSize } from "./geometry";

export type PackagingUnit = "mm" | "cm";

/**
 * Exact decimal conversion from millimetres to the chosen display/input unit
 * (`mm` or `cm`, where `1 cm = 10 mm`) without IEEE-754 floating-point noise.
 */
export function mmToUnit(mm: number, unit: PackagingUnit): number {
  if (!Number.isFinite(mm)) return NaN;
  return unit === "cm" ? Number((mm / 10).toFixed(4)) : Number(mm.toFixed(4));
}

/**
 * Exact decimal conversion from the active input unit (`mm` or `cm`) back to
 * canonical millimetres (`CartonSize` is always stored and exported in `mm`).
 */
export function unitToMm(value: number, unit: PackagingUnit): number {
  if (!Number.isFinite(value)) return NaN;
  return unit === "cm"
    ? Number((value * 10).toFixed(4))
    : Number(value.toFixed(4));
}

export function formatUnitNumber(mm: number, unit: PackagingUnit): string {
  const converted = mmToUnit(mm, unit);
  if (!Number.isFinite(converted)) return "";
  return String(converted);
}

export function unitShortLabel(unit: PackagingUnit, ar: boolean): string {
  if (unit === "cm") return ar ? "سم" : "cm";
  return ar ? "مم" : "mm";
}

export function unitCodeLabel(unit: PackagingUnit): string {
  return unit === "cm" ? "cm" : "mm";
}

export function unitAriaSuffix(unit: PackagingUnit, ar: boolean): string {
  if (unit === "cm") return ar ? " بالسنتيمتر" : " in centimetres";
  return ar ? " بالملليمتر" : " in millimetres";
}

export function formatCartonDims(
  size: Pick<CartonSize, "height" | "width" | "depth">,
  unit: PackagingUnit,
  ar = false,
): string {
  const h = formatUnitNumber(size.height, unit);
  const w = formatUnitNumber(size.width, unit);
  const d = formatUnitNumber(size.depth, unit);
  const suffix = unit === "cm" ? (ar ? "سم" : "cm") : "mm";
  return `${h} × ${w} × ${d} ${suffix}`;
}

export function formatSheetDims(
  widthMm: number,
  heightMm: number,
  unit: PackagingUnit,
  ar = false,
): string {
  const w = formatUnitNumber(widthMm, unit);
  const h = formatUnitNumber(heightMm, unit);
  const suffix = unit === "cm" ? (ar ? "سم" : "cm") : "mm";
  return `${w} × ${h} ${suffix}`;
}
