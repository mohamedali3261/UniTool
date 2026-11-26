export const fabricTypes = [
  { id: "cotton", ar: "قطن", en: "Cotton" },
  { id: "blend", ar: "قطن مخلوط ناعم", en: "Smooth blend" },
  { id: "interlock", ar: "إنترلوك", en: "Interlock" },
  { id: "sport", ar: "نسيج رياضي", en: "Sport knit" },
  { id: "pique", ar: "بيكيه", en: "Piqué" },
  { id: "rib", ar: "ريب", en: "Rib knit" },
  { id: "waffle", ar: "وافل", en: "Waffle" },
  { id: "fleece", ar: "فليس / فرنش تيري", en: "Fleece / terry" },
  { id: "mesh", ar: "شبكي رياضي", en: "Athletic mesh" },
] as const;
export type FabricType = (typeof fabricTypes)[number]["id"];
export interface Gradient {
  colors: string[];
  angle: number;
  radial?: boolean;
  positions?: number[];
}
export function validGradient(g: unknown): g is Gradient {
  const v = g as Gradient;
  return (
    !!v &&
    Array.isArray(v.colors) &&
    v.colors.length >= 2 &&
    v.colors.length <= 5 &&
    v.colors.every((c) => /^#[0-9a-f]{6}$/i.test(c)) &&
    Number.isFinite(v.angle) &&
    Math.abs(v.angle) <= 180 &&
    (v.radial === undefined || typeof v.radial === "boolean") &&
    (v.positions === undefined ||
      (Array.isArray(v.positions) &&
        v.positions.length === v.colors.length &&
        v.positions.every(
          (p, i) =>
            Number.isFinite(p) &&
            p >= 0 &&
            p <= 1 &&
            (i === 0 || p >= v.positions![i - 1]),
        )))
  );
}
export function gradientFill(
  ctx: CanvasRenderingContext2D,
  g: Gradient,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const a = (g.angle * Math.PI) / 180,
    r = Math.abs(w * Math.cos(a)) / 2 + Math.abs(h * Math.sin(a)) / 2;
  const fill = g.radial
    ? ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        0,
        x + w / 2,
        y + h / 2,
        Math.max(w, h) / 2,
      )
    : ctx.createLinearGradient(
        x + w / 2 - Math.cos(a) * r,
        y + h / 2 - Math.sin(a) * r,
        x + w / 2 + Math.cos(a) * r,
        y + h / 2 + Math.sin(a) * r,
      );
  g.colors.forEach((c, i) => fill.addColorStop(gradientPositions(g)[i], c));
  return fill;
}

export function gradientPositions(g: Gradient) {
  return g.positions ?? g.colors.map((_, i) => i / (g.colors.length - 1));
}
export function moveGradientStop(
  g: Gradient,
  index: number,
  position: number,
): Gradient {
  const positions = [...gradientPositions(g)];
  positions[index] = Math.max(
    positions[index - 1] ?? 0,
    Math.min(
      positions[index + 1] ?? 1,
      Number.isFinite(position) ? position : positions[index],
    ),
  );
  return { ...g, positions };
}
export function removeGradientStop(g: Gradient, index: number): Gradient {
  if (g.colors.length <= 2) return g;
  return {
    ...g,
    colors: g.colors.filter((_, i) => i !== index),
    positions: gradientPositions(g).filter((_, i) => i !== index),
  };
}
export function sampleGradient(g: Gradient, position: number) {
  const ps = gradientPositions(g);
  let i = 0;
  while (i < ps.length - 2 && position >= ps[i + 1]) i++;
  const t = Math.max(
    0,
    Math.min(1, (position - ps[i]) / Math.max(0.000001, ps[i + 1] - ps[i])),
  );
  const rgb = (c: string) =>
    [1, 3, 5].map((p) => parseInt(c.slice(p, p + 2), 16));
  const a = rgb(g.colors[i]),
    b = rgb(g.colors[i + 1]);
  return (
    "#" +
    a
      .map((v, j) =>
        Math.round(v * (1 - t) + b[j] * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function insertGradientStop(
  g: Gradient,
  position: number,
  color?: string,
): Gradient {
  if (g.colors.length >= 5) return g;
  const p = Math.max(
      0,
      Math.min(1, Number.isFinite(position) ? position : 0.5),
    ),
    ps = gradientPositions(g);
  const stops = g.colors.map((c, i) => ({ color: c, position: ps[i] }));
  stops.push({ color: color ?? sampleGradient(g, p), position: p });
  stops.sort((a, b) => a.position - b.position);
  return {
    ...g,
    colors: stops.map((s) => s.color),
    positions: stops.map((s) => s.position),
  };
}
