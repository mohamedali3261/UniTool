import { sceneAt } from "../composition/scene";
import { motionAt, textAt } from "../animation/evaluate";
import { effectFrame } from "../effects/renderer";
import { textLayout } from "../text/layout";
import {
  uid,
  type Project,
  type Clip,
  type OverlayLayer,
  type TextLayer,
} from "../types";
export type Selection = { kind: "clip" | "overlay" | "text"; id: string };
export type Box = Selection & {
  cx: number;
  cy: number;
  width: number;
  height: number;
  angle: number;
  locked: boolean;
  hidden: boolean;
  label: string;
};
export type Dimensions = Map<string, { width: number; height: number }>;
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export const rotation = (n: number) => ((n % 360) + 360) % 360;
export const selectionKey = (s: Selection) => `${s.kind}:${s.id}`;
export function selectedObject(
  p: Project,
  s: Selection | null,
): Clip | OverlayLayer | TextLayer | undefined {
  const o = !s
    ? undefined
    : s.kind === "text"
      ? p.texts.find((t) => t.id === s.id)
      : s.kind === "overlay"
        ? p.overlays?.find((l) => l.id === s.id)
        : p.clips.find((c) => c.id === s.id);
  const track =
    s?.kind === "clip" ? "video" : s?.kind === "text" ? "text" : s?.id || "";
  return o && p.tracks?.[track]?.locked ? { ...o, locked: true } : o;
}
export function patchObject(
  p: Project,
  s: Selection,
  patch: Record<string, unknown>,
): Project {
  if (s.kind === "text")
    return {
      ...p,
      texts: p.texts.map((t) => (t.id === s.id ? { ...t, ...patch } : t)),
    };
  if (s.kind === "overlay")
    return {
      ...p,
      overlays: (p.overlays || []).map((l) =>
        l.id === s.id ? { ...l, ...patch } : l,
      ),
    };
  return {
    ...p,
    clips: p.clips.map((c) => (c.id === s.id ? { ...c, ...patch } : c)),
  };
}
export function deleteObject(p: Project, s: Selection): Project {
  if (s.kind === "text")
    return { ...p, texts: p.texts.filter((t) => t.id !== s.id) };
  if (s.kind === "overlay")
    return { ...p, overlays: p.overlays?.filter((l) => l.id !== s.id) };
  return { ...p, clips: p.clips.filter((c) => c.id !== s.id) };
}
export function duplicateObject(
  p: Project,
  s: Selection,
): { project: Project; selection: Selection } | null {
  const source = selectedObject(p, s);
  if (!source || source.locked) return null;
  const id = uid();
  const selection = { ...s, id };
  if (s.kind === "overlay") {
    if ((p.overlays?.length || 0) >= 6) return null;
    const l = source as OverlayLayer;
    return {
      selection,
      project: {
        ...p,
        overlays: [
          ...(p.overlays || []),
          { ...l, id, x: clamp(l.x + 3, 0, 100), y: clamp(l.y + 3, 0, 100) },
        ],
      },
    };
  }
  if (s.kind === "text") {
    const t = source as TextLayer;
    return {
      selection,
      project: {
        ...p,
        texts: [
          ...p.texts,
          { ...t, id, x: clamp(t.x + 3, 0, 100), y: clamp(t.y + 3, 0, 100) },
        ],
      },
    };
  }
  return {
    selection,
    project: {
      ...p,
      clips: p.clips.flatMap((c) => (c.id === s.id ? [c, { ...c, id }] : [c])),
    },
  };
}
export function boxesAt(
  p: Project,
  time: number,
  ctx: CanvasRenderingContext2D,
  dims: Dimensions,
): Box[] {
  const w = 960;
  const [rw, rh] = p.ratio.split(":").map(Number);
  const h = (w * rh) / rw;
  const boxes: Box[] = [];
  // Hidden layers remain in the picker so they can be shown again.
  const visibleProject = {
    ...p,
    clips: p.clips.map((c) => ({ ...c, hidden: false })),
    tracks: Object.fromEntries(
      Object.entries(p.tracks || {}).map(([k, v]) => [
        k,
        { ...v, hidden: false },
      ]),
    ),
    overlays: p.overlays?.map((l) => ({ ...l, hidden: false })),
  };
  for (const entry of sceneAt(visibleProject, time).entries) {
    const c = entry.clip;
    const l = entry.overlay;
    const native = dims.get(entry.id) || { width: 16, height: 9 };
    const angle = c.rotation || 0;
    const r = (angle * Math.PI) / 180;
    const bw =
      Math.abs(native.width * Math.cos(r)) +
      Math.abs(native.height * Math.sin(r));
    const bh =
      Math.abs(native.width * Math.sin(r)) +
      Math.abs(native.height * Math.cos(r));
    const fit =
      c.fit === "cover" ? Math.max(w / bw, h / bh) : Math.min(w / bw, h / bh);
    const motion = motionAt(c, entry.elapsed);
    const fx = effectFrame(
      c.effect,
      w,
      h,
      entry.elapsed,
      entry.elapsed / ((c.end - c.start) / c.speed),
      c.effectIntensity ?? 1,
      c.effectSpeed ?? 1,
    );
    const scale = fit * (c.zoom ?? 1) * motion.scale * (fx.camera.zoom ?? 1);
    const cx = w / 2 + ((motion.x + (c.x || 0)) * w) / 100 + (fx.camera.x || 0),
      cy = h / 2 + ((motion.y + (c.y || 0)) * h) / 100 + (fx.camera.y || 0);
    if (l) {
      const original = p.overlays?.find((x) => x.id === l.id)!;
      boxes.push({
        kind: "overlay",
        id: l.id,
        cx: (w * l.x) / 100 + ((cx - w / 2) * l.width) / 100,
        cy: (h * l.y) / 100 + ((cy - h / 2) * l.width) / 100,
        width: (native.width * scale * l.width) / 100,
        height: (native.height * scale * l.width) / 100,
        angle,
        locked: !!(l.locked || p.tracks?.[l.id]?.locked),
        hidden: !!(original.hidden || p.tracks?.[l.id]?.hidden),
        label: "طبقة صورة / فيديو",
      });
    } else
      boxes.push({
        kind: "clip",
        id: c.id,
        cx: w / 2 + entry.shift * w + (cx - w / 2) * entry.scale,
        cy: h / 2 + (cy - h / 2) * entry.scale,
        width: native.width * scale * entry.scale,
        height: native.height * scale * entry.scale,
        angle: angle + ((fx.camera.rotate || 0) * 180) / Math.PI,
        locked: !!(c.locked || p.tracks?.video?.locked),
        hidden: !!(
          p.tracks?.video?.hidden || p.clips.find((x) => x.id === c.id)?.hidden
        ),
        label: "المقطع الأساسي",
      });
  }
  for (const t of p.texts) {
    if (time < t.start || time >= t.end) continue;
    const a = textAt(t, time),
      layout = textLayout(ctx, t, w);
    const r = ((t.rotation || 0) * Math.PI) / 180;
    boxes.push({
      kind: "text",
      id: t.id,
      cx: (w * t.x) / 100 - Math.sin(r) * layout.offsetY * a.scale,
      cy: (h * (t.y + a.y)) / 100 + Math.cos(r) * layout.offsetY * a.scale,
      width: layout.width * a.scale,
      height: layout.height * a.scale,
      angle: t.rotation || 0,
      locked: !!(t.locked || p.tracks?.text?.locked),
      hidden: !!(t.hidden || p.tracks?.text?.hidden),
      label: t.text.slice(0, 40) || "نص فارغ",
    });
  }
  return boxes;
}
export function hitBox(box: Box, x: number, y: number, padding = 0) {
  const r = (-box.angle * Math.PI) / 180,
    dx = x - box.cx,
    dy = y - box.cy;
  const localX = dx * Math.cos(r) - dy * Math.sin(r),
    localY = dx * Math.sin(r) + dy * Math.cos(r);
  return (
    Math.abs(localX) <= box.width / 2 + padding &&
    Math.abs(localY) <= box.height / 2 + padding
  );
}
/** Move in output-space pixels, preserving any existing animation/keyframe offsets. */
export function moveObject(
  p: Project,
  s: Selection,
  dx: number,
  dy: number,
): Project {
  const o = selectedObject(p, s);
  if (!o || o.locked) return p;
  const [rw, rh] = p.ratio.split(":").map(Number),
    h = (960 * rh) / rw;
  const min = s.kind === "clip" ? -100 : 0,
    max = 100;
  return patchObject(p, s, {
    x: clamp(
      (o.x ?? (s.kind === "clip" ? 0 : 50)) + (dx / 960) * 100,
      min,
      max,
    ),
    y: clamp((o.y ?? (s.kind === "clip" ? 0 : 50)) + (dy / h) * 100, min, max),
  });
}
export function scaleObject(p: Project, s: Selection, factor: number): Project {
  const o = selectedObject(p, s);
  if (!o || o.locked) return p;
  if (s.kind === "text")
    return patchObject(p, s, {
      size: clamp((o as TextLayer).size * factor, 12, 180),
    });
  if (s.kind === "overlay")
    return patchObject(p, s, {
      width: clamp((o as OverlayLayer).width * factor, 10, 150),
    });
  return patchObject(p, s, {
    zoom: clamp(((o as Clip).zoom ?? 1) * factor, 0.25, 3),
  });
}
