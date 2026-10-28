import type { Clip, TextLayer } from "../types";
export const unit = (n: number) => Math.max(0, Math.min(1, n));
export function motionAt(clip: Clip, elapsed: number) {
  const p = unit(elapsed / ((clip.end - clip.start) / clip.speed));
  let x = 0,
    y = 0,
    scale = 1,
    opacity = 1;
  switch (clip.motion) {
    case "push-in":
      scale = 1 + p * 0.18;
      break;
    case "pull-out":
      scale = 1.18 - p * 0.18;
      break;
    case "pan-left":
      scale = 1.15;
      x = (0.5 - p) * 10;
      break;
    case "pan-right":
      scale = 1.15;
      x = (p - 0.5) * 10;
      break;
  }
  const frames = clip.keyframes;
  if (frames?.length) {
    const ordered = [...frames].sort((a, b) => a.t - b.t);
    const right = ordered.findIndex((f) => f.t >= elapsed);
    const a = right < 0 ? ordered.at(-1)! : ordered[Math.max(0, right - 1)],
      b = right < 0 ? a : ordered[right];
    const t = a === b ? 0 : unit((elapsed - a.t) / Math.max(0.0001, b.t - a.t));
    x += a.x + (b.x - a.x) * t;
    y += a.y + (b.y - a.y) * t;
    scale *= a.scale + (b.scale - a.scale) * t;
    opacity = a.opacity + (b.opacity - a.opacity) * t;
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
    text = layer.text;
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
  if (before.length && after.length && before.at(-1)!.t < at)
    head.push(point(at));
  const tail = after.map((f) => ({ ...f, t: f.t - at }));
  if (before.length || !tail.length) tail.unshift(point(0));
  return { head, tail };
}
