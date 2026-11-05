import ClipperLib from "clipper-lib";
import type { CartonSize } from "./geometry";
import type { CartonPiece, Point2 } from "./preview3d/assembly";
/** Hinged tray: base, four walls, four corner tongues, lid and three inward lid flaps. */
export function hingedPieces(s: CartonSize): CartonPiece[] {
  const { width: w, height: h, depth: d, tuck: t } = s,
    a = Math.PI / 2,
    q = Math.min(25, h * 0.65),
    gap = Math.min(2, h * 0.1);
  const rect = (l: number, r: number, b: number, u: number): Point2[] => [
    [l, b],
    [r, b],
    [r, u],
    [l, u],
  ];
  const piece = (
    id: string,
    parent: string | null,
    role: CartonPiece["role"],
    hinge: [number, number, number],
    axis: "x" | "y",
    angle: number,
    polygon: Point2[],
    inset?: [number, number, number],
  ): CartonPiece => ({
    id,
    parent,
    role,
    hinge,
    axis,
    angle,
    polygon,
    paperOrigin: [0, 0],
    inset,
  });
  const pieces = [
    piece(
      "bottom",
      null,
      "body",
      [0, -h / 2, 0],
      "x",
      a,
      rect(-w / 2, w / 2, -d / 2, d / 2),
    ),
    piece(
      "front",
      "bottom",
      "body",
      [0, d / 2, 0],
      "x",
      -a,
      rect(-w / 2, w / 2, 0, h),
    ),
    piece(
      "right",
      "bottom",
      "body",
      [w / 2, 0, 0],
      "y",
      a,
      rect(0, h, -d / 2, d / 2),
    ),
    piece(
      "back",
      "bottom",
      "body",
      [0, -d / 2, 0],
      "x",
      a,
      rect(-w / 2, w / 2, -h, 0),
    ),
    piece(
      "left",
      "bottom",
      "body",
      [-w / 2, 0, 0],
      "y",
      -a,
      rect(-h, 0, -d / 2, d / 2),
    ),
    piece("top", "back", "lid", [0, -h, 0], "x", a, rect(-w / 2, w / 2, -d, 0)),
    piece("top-tuck", "top", "tuck", [0, -d, 0], "x", a, [
      [-w / 2, 0],
      [-w / 2 + 3, -t],
      [w / 2 - 3, -t],
      [w / 2, 0],
    ]),
    piece(
      "top-right-tuck",
      "top",
      "tuck",
      [w / 2, 0, 0],
      "y",
      a,
      [
        [0, -d + 3],
        [t, -d + 6],
        [t, -6],
        [0, -3],
      ],
      [-1.5, 0, 0],
    ),
    piece(
      "top-left-tuck",
      "top",
      "tuck",
      [-w / 2, 0, 0],
      "y",
      -a,
      [
        [0, -d + 3],
        [0, -3],
        [-t, -6],
        [-t, -d + 6],
      ],
      [1.5, 0, 0],
    ),
  ];
  for (const side of ["front", "back"] as const)
    for (const sign of [-1, 1])
      pieces.push(
        piece(
          `${side}-${sign > 0 ? "right" : "left"}-corner`,
          side,
          "dust",
          [(sign * w) / 2, 0, 0],
          "y",
          sign * a,
          rect(
            sign > 0 ? 0 : -q,
            sign > 0 ? q : 0,
            side === "front" ? gap : -h + gap,
            side === "front" ? h - gap : -gap,
          ),
          [-sign * 1.2, 0, 0],
        ),
      );
  const origins = new Map<string, Point2>();
  for (const p of pieces) {
    const parent = p.parent ? origins.get(p.parent)! : [0, 0];
    p.paperOrigin = p.parent
      ? [parent[0] + p.hinge[0], parent[1] - p.hinge[1]]
      : [0, 0];
    origins.set(p.id, p.paperOrigin);
  }
  const all = pieces.flatMap((p) =>
    p.polygon.map(([x, y]) => [p.paperOrigin[0] + x, p.paperOrigin[1] - y]),
  );
  const dx = 10 - Math.min(...all.map((p) => p[0])),
    dy = 10 - Math.min(...all.map((p) => p[1]));
  pieces.forEach(
    (p) => (p.paperOrigin = [p.paperOrigin[0] + dx, p.paperOrigin[1] + dy]),
  );
  return pieces;
}
export function hingedGeometry(s: CartonSize) {
  const pieces = hingedPieces(s),
    scale = 100000;
  const paths = pieces.map((p) =>
    p.polygon.map(([x, y]) => ({
      X: Math.round((p.paperOrigin[0] + x) * scale),
      Y: Math.round((p.paperOrigin[1] - y) * scale),
    })),
  );
  paths.forEach((path) => {
    if (!ClipperLib.Clipper.Orientation(path)) path.reverse();
  });
  const clipper = new ClipperLib.Clipper();
  clipper.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
  const result: any[] = [];
  clipper.Execute(
    ClipperLib.ClipType.ctUnion,
    result,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  if (result.length !== 1) throw Error("Disconnected hinged net");
  const outline = result[0].map(
      (p: any) => [p.X / scale, p.Y / scale] as Point2,
    ),
    n = (v: number) => Number(v.toFixed(5));
  const face = (id: string) => {
    const p = pieces.find((p) => p.id === id)!,
      points = p.polygon.map(([x, y]) => [
        p.paperOrigin[0] + x,
        p.paperOrigin[1] - y,
      ]);
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    return {
      x: n(Math.min(...xs)),
      y: n(Math.min(...ys)),
      width: n(Math.max(...xs) - Math.min(...xs)),
      height: n(Math.max(...ys) - Math.min(...ys)),
    };
  };
  const folds = pieces
    .filter((p) => p.parent)
    .map((p) => {
      const origin = p.paperOrigin;
      const axis = p.axis === "x" ? "x" : "y";
      const zero = p.polygon.filter(
          (v) => Math.abs(v[axis === "x" ? 1 : 0]) < 1e-8,
        ),
        values = zero.map((v) => v[axis === "x" ? 0 : 1]);
      const min = Math.min(...values),
        max = Math.max(...values);
      return axis === "x"
        ? [n(origin[0] + min), n(origin[1]), n(origin[0] + max), n(origin[1])]
        : [n(origin[0]), n(origin[1] - min), n(origin[0]), n(origin[1] - max)];
    });
  return {
    width: n(Math.max(...outline.map((p) => p[0])) + 10),
    height: n(Math.max(...outline.map((p) => p[1])) + 10),
    cut:
      outline.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ") + " Z",
    folds,
    panels: ["front", "right", "back", "left"].map(face),
    faces: {
      front: face("front"),
      right: face("right"),
      back: face("back"),
      left: face("left"),
      top: face("top"),
      bottom: face("bottom"),
    },
  };
}
