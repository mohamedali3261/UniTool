import type { Project } from "./types";
export const publishingSizes = [
  {
    id: "square",
    ar: "منشور مربع",
    en: "Square post",
    width: 1080,
    height: 1080,
  },
  {
    id: "story",
    ar: "ستوري / ريلز",
    en: "Story / Reel",
    width: 1080,
    height: 1920,
  },
  {
    id: "video",
    ar: "مقدمة فيديو",
    en: "Video intro",
    width: 1920,
    height: 1080,
  },
  {
    id: "portrait",
    ar: "منشور رأسي",
    en: "Portrait post",
    width: 1080,
    height: 1350,
  },
  {
    id: "avatar",
    ar: "صورة شخصية",
    en: "Profile avatar",
    width: 800,
    height: 800,
  },
] as const;
/** Fit visible, rotated artwork into a 10% safe area without distortion. All
 * editable nodes (including hidden ones) share one translation and scale. */
export function fitForPublishing(p: Project, id: string): Project {
  const target = publishingSizes.find((s) => s.id === id);
  if (!target) return p;
  const visible = p.nodes.filter((n) => !n.hidden);
  if (!visible.length)
    return { ...p, width: target.width, height: target.height };
  const points = visible.flatMap((n) => {
    const r = (n.rotation * Math.PI) / 180,
      pad = n.strokeWidth / 2 + n.shadow + n.blur * 2,
      w = n.w / 2 + pad,
      h = n.h / 2 + pad;
    return [
      [-w, -h],
      [w, -h],
      [w, h],
      [-w, h],
    ].map(([x, y]) => ({
      x: n.x + x * Math.cos(r) - y * Math.sin(r),
      y: n.y + x * Math.sin(r) + y * Math.cos(r),
    }));
  });
  const left = Math.min(...points.map((v) => v.x)),
    right = Math.max(...points.map((v) => v.x)),
    top = Math.min(...points.map((v) => v.y)),
    bottom = Math.max(...points.map((v) => v.y));
  let k = Math.min(
    (target.width * 0.8) / Math.max(1, right - left),
    (target.height * 0.8) / Math.max(1, bottom - top),
  );
  // Stay inside the editor's serializable field limits, even for imported art.
  for (const n of p.nodes) {
    for (const [value, max] of [
      [n.fontSize, 600],
      [n.strokeWidth, 40],
      [n.radius, 1000],
      [n.shadow, 80],
      [n.blur, 30],
      [Math.abs(n.spacing), n.spacing < 0 ? 20 : 80],
      [n.w, 20000],
      [n.h, 20000],
    ])
      if (value > 0) k = Math.min(k, max / value);
  }
  const cx = (left + right) / 2,
    cy = (top + bottom) / 2;
  for (const n of p.nodes) {
    for (const [delta, center] of [
      [n.x - cx, target.width / 2],
      [n.y - cy, target.height / 2],
    ])
      if (delta)
        k = Math.min(k, (20000 - Math.sign(delta) * center) / Math.abs(delta));
  }
  const minimum = Math.max(
    ...p.nodes.flatMap((n) => [4 / n.fontSize, 1 / n.w, 1 / n.h]),
  );
  if (k + 1e-8 < minimum)
    throw Error(
      "This artwork would exceed the editor minimum size. Reduce the spread of its elements first.",
    );
  return {
    ...p,
    width: target.width,
    height: target.height,
    nodes: p.nodes.map((n) => ({
      ...n,
      x: target.width / 2 + (n.x - cx) * k,
      y: target.height / 2 + (n.y - cy) * k,
      w: n.w * k,
      h: n.h * k,
      fontSize: n.fontSize * k,
      strokeWidth: n.strokeWidth * k,
      radius: n.radius * k,
      spacing: n.spacing * k,
      shadow: n.shadow * k,
      blur: n.blur * k,
    })),
  };
}
