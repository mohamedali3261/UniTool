import ClipperLib from "clipper-lib";
import {
  cartonGeometry,
  MM_TO_PX,
  type CartonSize,
} from "../../packaging/geometry";
export interface PrintSettings {
  safeMm: number;
  bleedMm: number;
  showGuides: boolean;
}
export const DEFAULT_PRINT: PrintSettings = {
  safeMm: 3,
  bleedMm: 3,
  showGuides: false,
};
export function validatePrint(value: unknown): PrintSettings {
  const p = value as PrintSettings;
  if (
    !p ||
    !Number.isFinite(p.safeMm) ||
    !Number.isFinite(p.bleedMm) ||
    p.safeMm < 0 ||
    p.safeMm > 8 ||
    p.bleedMm < 0 ||
    p.bleedMm > 8 ||
    typeof p.showGuides !== "boolean"
  )
    throw Error("PRINT_SETTINGS");
  return { safeMm: p.safeMm, bleedMm: p.bleedMm, showGuides: p.showGuides };
}
export function faces(size: CartonSize) {
  const geometry = cartonGeometry(size);
  if ("faces" in geometry && geometry.faces) {
    const rectangles = geometry.faces;
    return (["front", "right", "back", "left", "top", "bottom"] as const).map(
      (id, i) => ({
        ...rectangles[id],
        id,
        ar: ["الأمام", "اليمين", "الخلف", "اليسار", "الأعلى", "الأسفل"][i],
        en: ["Front", "Right", "Back", "Left", "Top", "Bottom"][i],
      }),
    );
  }
  const g = geometry,
    p = g.panels;
  return [
    ...p.map((r, i) => ({
      ...r,
      id: ["front", "right", "back", "left"][i],
      ar: ["الأمام", "اليمين", "الخلف", "اليسار"][i],
      en: ["Front", "Right", "Back", "Left"][i],
    })),
    {
      x: p[0].x,
      y: p[0].y - size.depth,
      width: size.width,
      height: size.depth,
      id: "top",
      ar: "الأعلى",
      en: "Top",
    },
    {
      x: p[2].x,
      y: p[2].y + size.height,
      width: size.width,
      height: size.depth,
      id: "bottom",
      ar: "الأسفل",
      en: "Bottom",
    },
  ];
}
/** Integer polygon offset, including concave flap corners, not a scaled bounding box. */
export function offsetCut(size: CartonSize, mm: number) {
  const values = cartonGeometry(size)
    .cut.match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  const path = [];
  for (let i = 0; i < values.length; i += 2)
    path.push({
      X: Math.round(values[i] * 1000),
      Y: Math.round(values[i + 1] * 1000),
    });
  if (!ClipperLib.Clipper.Orientation(path)) path.reverse();
  const offset = new ClipperLib.ClipperOffset(2, 0.25);
  offset.AddPath(
    path,
    ClipperLib.JoinType.jtMiter,
    ClipperLib.EndType.etClosedPolygon,
  );
  const solution: any[] = [];
  offset.Execute(solution, mm * 1000);
  return solution
    .map(
      (poly) =>
        poly
          .map(
            (p: any, i: number) =>
              `${i ? "L" : "M"}${p.X / 1000} ${p.Y / 1000}`,
          )
          .join(" ") + " Z",
    )
    .join(" ");
}
export function facePixels(face: ReturnType<typeof faces>[number]) {
  return {
    left: face.x * MM_TO_PX,
    top: face.y * MM_TO_PX,
    width: face.width * MM_TO_PX,
    height: face.height * MM_TO_PX,
  };
}
