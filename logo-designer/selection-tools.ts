import { bounds, type Project } from "./types";
export type Arrangement =
  | "left"
  | "center-x"
  | "right"
  | "top"
  | "center-y"
  | "bottom"
  | "space-x"
  | "space-y"
  | "front"
  | "back";
/** حدود الاختيار تُحسب كغلاف مرئي للعناصر المدورة؛ المقفول لا يتحرك. */
function extent(n: Project["nodes"][number]) {
  const angle = (n.rotation * Math.PI) / 180;
  return {
    w: Math.abs(n.w * Math.cos(angle)) + Math.abs(n.h * Math.sin(angle)),
    h: Math.abs(n.w * Math.sin(angle)) + Math.abs(n.h * Math.cos(angle)),
  };
}
export function arrangeSelection(
  p: Project,
  ids: string[],
  mode: Arrangement,
): Project {
  const selected = p.nodes.filter(
    (n) => ids.includes(n.id) && !n.locked && !n.hidden,
  );
  if (selected.length < 2) return p;
  if (mode === "front" || mode === "back") {
    const chosen = new Set(selected.map((n) => n.id)),
      rest = p.nodes.filter((n) => !chosen.has(n.id));
    return {
      ...p,
      nodes: mode === "front" ? [...rest, ...selected] : [...selected, ...rest],
    };
  }
  const ext = selected.map((n) => ({ ...n, ...extent(n) })),
    b = bounds(ext),
    patch = new Map<string, { x: number; y: number }>();
  if (mode === "space-x" || mode === "space-y") {
    if (selected.length < 3) return p;
    const axis = mode === "space-x" ? "x" : "y",
      size = axis === "x" ? "w" : "h",
      ordered = [...ext].sort(
        (a, b) => a[axis] - a[size] / 2 - (b[axis] - b[size] / 2),
      ),
      start = ordered[0][axis] - ordered[0][size] / 2,
      end = ordered.at(-1)![axis] + ordered.at(-1)![size] / 2,
      gap =
        (end - start - ordered.reduce((sum, n) => sum + n[size], 0)) /
        (ordered.length - 1);
    let cursor = start;
    ordered.forEach((n) => {
      patch.set(n.id, { x: n.x, y: n.y, [axis]: cursor + n[size] / 2 });
      cursor += n[size] + gap;
    });
  } else
    selected.forEach((n) => {
      const e = extent(n);
      patch.set(n.id, {
        x:
          mode === "left"
            ? b.x + e.w / 2
            : mode === "center-x"
              ? b.x + b.w / 2
              : mode === "right"
                ? b.x + b.w - e.w / 2
                : n.x,
        y:
          mode === "top"
            ? b.y + e.h / 2
            : mode === "center-y"
              ? b.y + b.h / 2
              : mode === "bottom"
                ? b.y + b.h - e.h / 2
                : n.y,
      });
    });
  return {
    ...p,
    nodes: p.nodes.map((n) =>
      patch.has(n.id) ? { ...n, ...patch.get(n.id) } : n,
    ),
  };
}
