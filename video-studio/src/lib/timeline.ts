import { Clip, Project, TextLayer, clipDuration } from "../types";
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function clipStart(project: Project, id: string) {
  let t = 0;
  for (const c of project.clips) {
    if (c.id === id) return t;
    t += clipDuration(c);
  }
  return t;
}
export function boundaries(project: Project) {
  const points = [0];
  project.clips.forEach((c) => points.push(points.at(-1)! + clipDuration(c)));
  return points;
}
export function snapTime(time: number, points: number[], threshold: number) {
  let best = time;
  let delta = threshold;
  for (const p of points) {
    const d = Math.abs(p - time);
    if (d < delta) {
      best = p;
      delta = d;
    }
  }
  return best;
}
export function trimClip(
  c: Clip,
  edge: "start" | "end",
  sourceDelta: number,
  maxDuration: number,
): Clip {
  return edge === "start"
    ? { ...c, start: clamp(c.start + sourceDelta, 0, Math.max(0, c.end - 0.1)) }
    : {
        ...c,
        end: clamp(
          c.end + sourceDelta,
          c.start + 0.1,
          Math.max(c.start + 0.1, maxDuration),
        ),
      };
}
/** Move before an existing clip (or to the end) without modifying media trims. */
export function reorderClips(clips: Clip[], id: string, before: string | null) {
  if (id === before) return clips;
  const c = clips.find((c) => c.id === id);
  if (!c) return clips;
  const next = clips.filter((c) => c.id !== id);
  const index = before ? next.findIndex((c) => c.id === before) : next.length;
  if (index < 0) return clips;
  next.splice(index, 0, c);
  return next.every((c, i) => c === clips[i]) ? clips : next;
}
export function textLanes(texts: TextLayer[]) {
  const ends: number[] = [];
  const result = new Map<string, number>();
  for (const t of [...texts].sort((a, b) => a.start - b.start)) {
    let lane = ends.findIndex((end) => end <= t.start);
    if (lane === -1) lane = ends.length;
    ends[lane] = t.end;
    result.set(t.id, lane);
  }
  return { lanes: result, count: Math.max(1, ends.length) };
}
export function clipOpacity(clip: Clip, localTime: number) {
  const rel = (localTime - clip.start) / clip.speed;
  const remaining = (clip.end - localTime) / clip.speed;
  return clamp(
    Math.min(
      clip.fadeIn ? rel / clip.fadeIn : 1,
      clip.fadeOut ? remaining / clip.fadeOut : 1,
    ),
    0,
    1,
  );
}
export function musicTime(
  p: Project,
  sourceDuration: number,
  time: number,
): number | null {
  const relative = time - (p.audioStart || 0);
  const offset = clamp(
    p.audioOffset || 0,
    0,
    Math.max(0, sourceDuration - 0.01),
  );
  const available = sourceDuration - offset;
  if (
    relative < 0 ||
    available <= 0 ||
    (p.audioLoop === false && relative >= available)
  )
    return null;
  return offset + (p.audioLoop === false ? relative : relative % available);
}
