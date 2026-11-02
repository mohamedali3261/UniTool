import paper from "paper";
import { node, type Element } from "./types";
/** عمليات هندسية فعلية، وتطبيع الناتج إلى viewBox ثابت 128×128. */
const scope = new paper.PaperScope();
scope.setup(new scope.Size(128, 128));
function pathOf(n: Element): paper.PathItem {
  let p: paper.PathItem;
  if (n.kind === "vector") {
    p = new scope.CompoundPath({
      pathData: n.paths!.map((v) => v.d).join(" "),
      insert: false,
    });
    p.scale(n.w / 128, n.h / 128, new scope.Point(0, 0));
    p.translate(new scope.Point(-n.w / 2, -n.h / 2));
  } else if (n.kind === "shape") {
    const r = new scope.Rectangle(-n.w / 2, -n.h / 2, n.w, n.h);
    if (n.asset === "circle")
      p = new scope.Path.Ellipse({ rectangle: r, insert: false });
    else if (n.asset === "square")
      p = new scope.Path.Rectangle({
        rectangle: r,
        radius: Math.min(n.radius, n.w / 2, n.h / 2),
        insert: false,
      });
    else if (n.asset === "ring")
      throw new Error("Use filled shapes, not stroked rings.");
    else {
      const count = { triangle: 3, diamond: 4, hexagon: 6, star: 5, burst: 16 }[
        n.asset
      ];
      if (count) {
        p = ["star", "burst"].includes(n.asset)
          ? new scope.Path.Star({
              center: [0, 0],
              points: count,
              radius1: 50 * (n.asset === "star" ? 0.43 : 0.85),
              radius2: 50,
              insert: false,
            })
          : new scope.Path.RegularPolygon({
              center: [0, 0],
              sides: count,
              radius: 50,
              insert: false,
            });
        p.scale(n.w / p.bounds.width, n.h / p.bounds.height);
        p.position = new scope.Point(0, 0);
      } else {
        const paths: Record<string, string> = {
          shield: "M10 10L50 0L90 10V48Q90 78 50 100Q10 78 10 48Z",
          arch: "M0 100V50A50 50 0 0 1 100 50V100Z",
          wave: "M0 35Q25 0 50 35T100 35V70Q75 100 50 70T0 70Z",
          ribbon: "M0 0H100L85 50L100 100H0L15 50Z",
        };
        if (!paths[n.asset]) throw new Error("Unsupported shape");
        p = new scope.CompoundPath({ pathData: paths[n.asset], insert: false });
        p.scale(n.w / 100, n.h / 100, new scope.Point(0, 0));
        p.translate(new scope.Point(-n.w / 2, -n.h / 2));
      }
    }
  } else throw new Error("Choose filled shapes or vectors.");
  p.scale(n.flipX ? -1 : 1, n.flipY ? -1 : 1, new scope.Point(0, 0));
  p.rotate(n.rotation, new scope.Point(0, 0));
  p.translate(new scope.Point(n.x, n.y));
  return p;
}
export function canPath(n: Element) {
  return (
    !n.locked &&
    !n.hidden &&
    (n.kind === "vector" || (n.kind === "shape" && n.asset !== "ring"))
  );
}
function toNode(p: paper.PathItem, source: Element): Element {
  const b = p.bounds.clone();
  if (b.width < 0.01 || b.height < 0.01)
    throw new Error("The result is empty.");
  p.translate(new scope.Point(-b.x, -b.y));
  p.scale(128 / b.width, 128 / b.height, new scope.Point(0, 0));
  const result = node({
    ...source,
    id: source.id,
    kind: "vector",
    asset: "edited-path",
    name: "Editable path",
    x: b.center.x,
    y: b.center.y,
    w: b.width,
    h: b.height,
    rotation: 0,
    flipX: false,
    flipY: false,
    group: undefined,
    paths: [{ d: p.pathData, fill: source.fill }],
    recolor: true,
  });
  p.remove();
  return result;
}
export function convertPath(n: Element) {
  return toNode(pathOf(n), n);
}
export function booleanNodes(
  nodes: Element[],
  operation: "unite" | "subtract" | "intersect",
) {
  if (nodes.length < 2 || nodes.some((n) => !canPath(n)))
    throw new Error("Choose at least two unlocked filled shapes/vectors.");
  let result = pathOf(nodes[0]);
  for (const n of nodes.slice(1)) {
    const next = pathOf(n);
    const combined = result[operation](next, { insert: false });
    result.remove();
    next.remove();
    result = combined;
  }
  return toNode(result, nodes[0]);
}
export type PathPoint = {
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
  closed: boolean;
  contour: number;
  index: number;
};
export function readPoints(d: string): PathPoint[] {
  try {
    const p = new scope.CompoundPath({ pathData: d, insert: false });
    const points = (p.children as paper.Path[]).flatMap((c, contour) =>
      c.segments.map((s, index) => ({
        x: s.point.x,
        y: s.point.y,
        inX: s.handleIn.x,
        inY: s.handleIn.y,
        outX: s.handleOut.x,
        outY: s.handleOut.y,
        closed: c.closed,
        contour,
        index,
      })),
    );
    p.remove();
    return points;
  } catch {
    return [];
  }
}
export function changePoint(
  d: string,
  contour: number,
  index: number,
  change: Partial<PathPoint> | "delete",
) {
  const p = new scope.CompoundPath({ pathData: d, insert: false });
  const path = p.children[contour] as paper.Path;
  const s = path?.segments[index];
  if (!s) {
    p.remove();
    return d;
  }
  if (change === "delete") {
    if (path.segments.length <= (path.closed ? 3 : 2)) {
      p.remove();
      throw new Error("This contour needs more points.");
    }
    s.remove();
  } else {
    s.point = new scope.Point(change.x ?? s.point.x, change.y ?? s.point.y);
    s.handleIn = new scope.Point(
      change.inX ?? s.handleIn.x,
      change.inY ?? s.handleIn.y,
    );
    s.handleOut = new scope.Point(
      change.outX ?? s.handleOut.x,
      change.outY ?? s.handleOut.y,
    );
  }
  const result = p.pathData;
  p.remove();
  return result;
}
