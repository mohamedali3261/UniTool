import {counterText} from "./layerFrames";
import { motionById } from "./motions";
import type { Clip, TextLayer } from "../types";
export const unit = (n: number) => Math.max(0, Math.min(1, n));
export function ease(t: number, kind?: string) {
  if (kind === "ease-in") return t * t;
  if (kind === "ease-out") return 1 - (1 - t) * (1 - t);
  if (kind === "ease-in-out")
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return t;
}
export function motionAt(clip: Clip, elapsed: number) {
  const p = unit(elapsed / ((clip.end - clip.start) / clip.speed));
  let x = 0,
    y = 0,
    scale = 1,
    opacity = 1;
  const preset = motionById.get(clip.motion || "none")?.sample(p);
  if (preset) {
    x = preset.x;
    y = preset.y;
    scale = preset.scale;
    opacity = preset.opacity;
  }
  const frames = clip.keyframes;
  if (frames?.length) {
    const ordered = [...frames].sort((a, b) => a.t - b.t);
    const right = ordered.findIndex((f) => f.t >= elapsed);
    const a = right < 0 ? ordered.at(-1)! : ordered[Math.max(0, right - 1)],
      b = right < 0 ? a : ordered[right];
    const raw =
      a === b ? 0 : unit((elapsed - a.t) / Math.max(0.0001, b.t - a.t));
    const from = b.easeFrom ?? 0,
      to = b.easeTo ?? 1;
    const start = ease(from, b.easing),
      end = ease(to, b.easing);
    const t =
      a === b
        ? 0
        : (ease(from + raw * (to - from), b.easing) - start) /
          Math.max(0.0000001, end - start);
    x += a.x + (b.x - a.x) * t;
    y += a.y + (b.y - a.y) * t;
    scale *= a.scale + (b.scale - a.scale) * t;
    opacity *= a.opacity + (b.opacity - a.opacity) * t;
  }
  return { x, y, scale, opacity };
}
export function textAt(layer: TextLayer, time: number) {
  const duration = Math.max(
    0.05,
    Math.min(layer.animationDuration ?? 0.5, (layer.end - layer.start) / 2),
  );
  const enter = unit((time - layer.start) / duration),
    exit = unit((layer.end - time) / duration);
  let opacity = 1,
    y = 0,
    scale = 1,
    text = counterText(layer,time);
  const apply = (kind: string | undefined, p: number) => {
    if (kind && kind !== "none" && kind !== "typewriter") opacity *= p;
    if (kind === "slide") y += (1 - p) * 8;
    if (kind === "pop") scale *= 0.75 + 0.25 * p;
  };
  apply(layer.animationIn, enter);
  apply(layer.animationOut, exit);
  if (layer.animationIn === "typewriter") {
    const segments =
      typeof Intl.Segmenter === "function"
        ? Array.from(
            new Intl.Segmenter("ar", { granularity: "grapheme" }).segment(text),
            (s) => s.segment,
          )
        : Array.from(text);
    text = segments.slice(0, Math.floor(segments.length * enter)).join("");
  }
  return { opacity, y, scale, text };
}

/** Splitting a clip keeps its keyframe curve continuous in each new local clock. */
export function splitKeyframes(clip: Clip, at: number) {
  if (!clip.keyframes?.length) return { head: undefined, tail: undefined };
  const ordered = [...clip.keyframes].sort((a, b) => a.t - b.t);
  const value = motionAt({ ...clip, motion: "none" }, at);
  const before = ordered.filter((f) => f.t <= at),
    after = ordered.filter((f) => f.t > at);
  const point = (t: number) => ({ id: crypto.randomUUID(), t, ...value });
  const head = before.length ? [...before] : [point(0)];
  if (before.length && after.length && before.at(-1)!.t < at) {
    const a = before.at(-1)!,
      b = after[0],
      from = b.easeFrom ?? 0,
      to = b.easeTo ?? 1;
    const split = from + ((to - from) * (at - a.t)) / (b.t - a.t);
    head.push({
      ...point(at),
      easing: b.easing,
      easeFrom: from,
      easeTo: split,
    });
  }
  const tail = after.map((f) => ({ ...f, t: f.t - at }));
  if (before.length && after.length && before.at(-1)!.t < at) {
    const a = before.at(-1)!,
      b = after[0];
    tail[0] = {
      ...tail[0],
      easeFrom:
        (b.easeFrom ?? 0) +
        (((b.easeTo ?? 1) - (b.easeFrom ?? 0)) * (at - a.t)) / (b.t - a.t),
    };
  }
  if (before.length || !tail.length) tail.unshift(point(0));
  return { head, tail };
}
