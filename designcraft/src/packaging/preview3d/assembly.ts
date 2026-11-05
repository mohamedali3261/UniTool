import { hingedPieces } from "../hinged";
import { cartonGeometry, type CartonSize } from "../geometry";
export type Point2 = [number, number];
export type CartonPiece = {
  id: string;
  parent: string | null;
  role: "body" | "lid" | "dust" | "tuck" | "glue";
  hinge: [number, number, number];
  axis: "x" | "y";
  angle: number;
  polygon: Point2[];
  paperOrigin: Point2;
  inset?: [number, number, number];
};
/** All coordinates are nominal millimetres. Paper Y runs down; model Y runs up. */
export function cartonAssembly(size: CartonSize): CartonPiece[] {
  if (size.construction === "hinged-lid") {
    cartonGeometry(size);
    return hingedPieces(size);
  }
  const g = cartonGeometry(size),
    { width: w, height: h, depth: d, glue: gl, tuck: t } = size;
  const [f, r, b, l] = g.panels,
    q = Math.min(w * 0.45, d * 0.75, h * 0.4),
    i = Math.min(4, d * 0.12),
    bevel = Math.min(4, t * 0.3, w * 0.08),
    gc = Math.min(4, h * 0.1),
    a = Math.PI / 2;
  const rect = (
    left: number,
    right: number,
    bottom: number,
    top: number,
  ): Point2[] => [
    [left, bottom],
    [right, bottom],
    [right, top],
    [left, top],
  ];
  const result: CartonPiece[] = [
    {
      id: "front",
      parent: null,
      role: "body",
      hinge: [0, 0, d / 2],
      axis: "y",
      angle: 0,
      polygon: rect(-w / 2, w / 2, -h / 2, h / 2),
      paperOrigin: [f.x + w / 2, f.y + h / 2],
    },
    {
      id: "right",
      parent: "front",
      role: "body",
      hinge: [w / 2, 0, 0],
      axis: "y",
      angle: a,
      polygon: rect(0, d, -h / 2, h / 2),
      paperOrigin: [r.x, r.y + h / 2],
    },
    {
      id: "back",
      parent: "right",
      role: "body",
      hinge: [d, 0, 0],
      axis: "y",
      angle: a,
      polygon: rect(0, w, -h / 2, h / 2),
      paperOrigin: [b.x, b.y + h / 2],
    },
    {
      id: "left",
      parent: "back",
      role: "body",
      hinge: [w, 0, 0],
      axis: "y",
      angle: a,
      polygon: rect(0, d, -h / 2, h / 2),
      paperOrigin: [l.x, l.y + h / 2],
    },
    {
      id: "glue",
      parent: "front",
      role: "glue",
      hinge: [-w / 2, 0, 0],
      axis: "y",
      angle: -a,
      polygon: [
        [-gl, h / 2 - gc],
        [0, h / 2],
        [0, -h / 2],
        [-gl, -h / 2 + gc],
      ],
      paperOrigin: [f.x, f.y + h / 2],
    },
    {
      id: "top",
      parent: "front",
      role: "lid",
      hinge: [0, h / 2, 0],
      axis: "x",
      angle: -a,
      polygon: rect(-w / 2, w / 2, 0, d),
      paperOrigin: [f.x + w / 2, f.y],
    },
    {
      id: "top-tuck",
      parent: "top",
      role: "tuck",
      hinge: [0, d, 0],
      axis: "x",
      angle: -a,
      polygon: [
        [-w / 2, 0],
        [w / 2, 0],
        [w / 2 - bevel, t],
        [-w / 2 + bevel, t],
      ],
      paperOrigin: [f.x + w / 2, f.y - d],
    },
    {
      id: "bottom",
      parent: "back",
      role: "lid",
      hinge: [w / 2, -h / 2, 0],
      axis: "x",
      angle: a,
      polygon: rect(-w / 2, w / 2, -d, 0),
      paperOrigin: [b.x + w / 2, b.y + h],
    },
    {
      id: "bottom-tuck",
      parent: "bottom",
      role: "tuck",
      hinge: [0, -d, 0],
      axis: "x",
      angle: a,
      polygon: [
        [-w / 2, 0],
        [-w / 2 + bevel, -t],
        [w / 2 - bevel, -t],
        [w / 2, 0],
      ],
      paperOrigin: [b.x + w / 2, b.y + h + d],
    },
  ];
  for (const [name, panel] of [
    ["right", r],
    ["left", l],
  ] as const) {
    result.push({
      id: name + "-top-dust",
      parent: name,
      role: "dust",
      hinge: [0, h / 2, 0],
      axis: "x",
      angle: -a,
      polygon: [
        [0, 0],
        [d, 0],
        [d - i, q],
        [i, q],
      ],
      paperOrigin: [panel.x, panel.y],
    });
    result.push({
      id: name + "-bottom-dust",
      parent: name,
      role: "dust",
      hinge: [0, -h / 2, 0],
      axis: "x",
      angle: a,
      polygon: [
        [0, 0],
        [i, -q],
        [d - i, -q],
        [d, 0],
      ],
      paperOrigin: [panel.x, panel.y + h],
    });
  }
  return result;
}
export function foldStage(role: CartonPiece["role"], progress: number) {
  const [start, end] =
    role === "body" || role === "glue"
      ? [0, 0.55]
      : role === "dust"
        ? [0.55, 0.72]
        : role === "lid"
          ? [0.72, 0.92]
          : [0.92, 1];
  const x = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return x * x * (3 - 2 * x);
}
export function piecePose(
  piece: CartonPiece,
  progress: number,
  thickness: number,
) {
  const stage = foldStage(piece.role, Math.max(0, Math.min(1, progress))),
    position = [...piece.hinge] as [number, number, number];
  // Closure layers are displaced inward, never outside the nominal six exterior faces.
  if (piece.inset) {
    piece.inset.forEach(
      (offset, i) => (position[i] += offset * thickness * stage),
    );
    return { position, rotation: piece.angle * stage };
  }
  if (piece.role === "glue") position[0] += thickness * 1.2 * stage;
  if (piece.role === "dust")
    position[1] += (piece.angle < 0 ? -1 : 1) * thickness * 1.2 * stage;
  if (piece.role === "tuck")
    position[1] += (piece.angle < 0 ? -1 : 1) * thickness * 1.5 * stage;
  return { position, rotation: piece.angle * stage };
}
export function paperPoint(piece: CartonPiece, [x, y]: Point2): Point2 {
  return [piece.paperOrigin[0] + x, piece.paperOrigin[1] - y];
}
export function polygonArea(points: Point2[]) {
  return Math.abs(
    points.reduce((n, [x, y], i) => {
      const next = points[(i + 1) % points.length];
      return n + x * next[1] - next[0] * y;
    }, 0) / 2,
  );
}
