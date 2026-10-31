import { clipDuration, type Project } from "../../../types";
import { boundaries, clamp } from "../../../lib/timeline";

/** Cut points, markers and keyframes share one sorted, duplicate-free navigation rail. */
export function navigationPoints(p: Project) {
  const points = [...boundaries(p), ...(p.markers || []).map((m) => m.time)];
  let start = 0;
  for (const c of p.clips) {
    for (const f of c.keyframes || []) points.push(start + f.t);
    start += clipDuration(c);
  }
  return [...new Set(points.map((t) => Math.round(t * 1e6) / 1e6))].sort(
    (a, b) => a - b,
  );
}
export function adjacentPoint(points: number[], time: number, direction: number) {
  const sorted = [...points].sort((a, b) => a - b);
  return (
    (direction < 0
      ? [...sorted].reverse().find((t) => t < time - 0.02)
      : sorted.find((t) => t > time + 0.02)) ?? (direction < 0 ? 0 : time)
  );
}
/** Keep a comfortable margin without scrolling on every playback tick. */
export function followOffset(
  time: number,
  zoom: number,
  scrollLeft: number,
  viewport: number,
) {
  const x = time * zoom;
  const margin = Math.min(48, viewport * 0.15);
  if (x >= scrollLeft + margin && x <= scrollLeft + viewport - margin)
    return null;
  return Math.max(0, x - viewport * 0.35);
}
export function overviewTime(x: number, left: number, width: number, duration: number) {
  return clamp(((x - left) / Math.max(1, width)) * duration, 0, duration);
}
