import type { Element, Project } from "./types";
export const entrances = [
  ["fade", "ظهور", "Fade"],
  ["rise", "صعود", "Rise"],
  ["slide-left", "دخول جانبي", "Slide in"],
  ["pop", "تكبير مرن", "Pop"],
  ["spin", "دوران", "Turn"],
  ["draw", "رسم المسارات", "Draw paths"],
  ["type", "كتابة تدريجية", "Typewriter"],
  ["none", "بدون", "None"],
] as const;
export const holds = [
  ["none", "ثبات", "Still"],
  ["pulse", "تنفّس", "Breathe"],
  ["shine", "لمعة عابرة", "Shine"],
] as const;
export const exits = [
  ["fade", "اختفاء", "Fade"],
  ["slide-right", "خروج جانبي", "Slide out"],
  ["shrink", "تصغير", "Shrink"],
  ["none", "بدون", "None"],
] as const;
export type MotionTrack = {
  start: number;
  end: number;
  enterDuration: number;
  exitDuration: number;
  enter: (typeof entrances)[number][0];
  hold: (typeof holds)[number][0];
  exit: (typeof exits)[number][0];
};
export type FrameElement = Element & {
  motionVisual?: { draw?: number; shine?: number };
};
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export function validTrack(v: unknown, duration: number): v is MotionTrack {
  const t = v as MotionTrack;
  return (
    !!t &&
    [t.start, t.end, t.enterDuration, t.exitDuration].every(Number.isFinite) &&
    t.start >= 0 &&
    t.end <= duration + 0.00001 &&
    t.end - t.start >= 0.19999 &&
    t.enterDuration >= 0.05 &&
    t.exitDuration >= 0.05 &&
    t.enterDuration + t.exitDuration <= t.end - t.start + 0.00001 &&
    entrances.some((e) => e[0] === t.enter) &&
    holds.some((e) => e[0] === t.hold) &&
    exits.some((e) => e[0] === t.exit)
  );
}
export function normalizeTrack(t: MotionTrack, duration: number): MotionTrack {
  const start = clamp(t.start, 0, duration - 0.2),
    end = clamp(t.end, start + 0.2, duration),
    span = end - start;
  let a = clamp(t.enterDuration, 0.05, duration),
    b = clamp(t.exitDuration, 0.05, duration);
  if (a + b > span) {
    const k = span / (a + b);
    a *= k;
    b *= k;
  }
  // Avoid tiny transition values after repeated trimming.
  a = clamp(a, 0.05, span - 0.05);
  b = clamp(b, 0.05, span - a);
  return { ...t, start, end, enterDuration: a, exitDuration: b };
}
export function orderedElements(project: Project) {
  const main = project.nodes
    .filter((n) => n.kind === "text" && !n.hidden)
    .reduce<Element | undefined>(
      (best, n) => (!best || n.fontSize > best.fontSize ? n : best),
      undefined,
    );
  const rank = (n: Element) => (n.kind !== "text" ? 0 : n === main ? 1 : 2);
  return project.nodes
    .filter((n) => !n.hidden)
    .map((n, i) => ({ n, i }))
    .sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i)
    .map(({ n }) => n);
}
export function trackFor(project: Project, n: Element): MotionTrack {
  const m = project.motion,
    d = m?.duration || 3;
  if (m?.tracks?.[n.id]) return m.tracks[n.id];
  const preset = m?.preset || "reveal",
    ordered = preset === "assemble" ? orderedElements(project) : [],
    i = ordered.indexOf(n);
  const start =
    preset === "assemble"
      ? (Math.max(0, i) / Math.max(1, ordered.length - 1)) * d * 0.28
      : 0;
  return normalizeTrack(
    {
      start,
      end: d,
      enterDuration: d * 0.42,
      exitDuration: d * 0.18,
      enter:
        preset === "pulse"
          ? "none"
          : preset === "assemble"
            ? "rise"
            : preset === "reveal"
              ? "fade"
              : preset,
      hold: preset === "pulse" ? "pulse" : "none",
      exit: preset === "pulse" ? "none" : "fade",
    },
    d,
  );
}
export function setTrack(
  project: Project,
  id: string,
  patch: Partial<MotionTrack>,
): Project {
  const n = project.nodes.find((n) => n.id === id);
  if (!n) return project;
  const m = project.motion || { preset: "reveal" as const, duration: 3 };
  const tracks = Object.fromEntries(
    Object.entries(m.tracks || {}).filter(([id]) =>
      project.nodes.some((n) => n.id === id),
    ),
  );
  return {
    ...project,
    motion: {
      ...m,
      tracks: {
        ...tracks,
        [id]: normalizeTrack({ ...trackFor(project, n), ...patch }, m.duration),
      },
    },
  };
}
export function sequenceTracks(project: Project): Project {
  const m = project.motion || { preset: "assemble" as const, duration: 3 },
    elements = orderedElements(project);
  const tracks = Object.fromEntries(
    elements.map((n, i) => [
      n.id,
      normalizeTrack(
        {
          ...trackFor(project, n),
          start: (i / Math.max(1, elements.length - 1)) * m.duration * 0.35,
          end: m.duration,
          enterDuration: m.duration * 0.2,
          exitDuration: m.duration * 0.15,
        },
        m.duration,
      ),
    ]),
  );
  return { ...project, motion: { ...m, tracks } };
}
export function changeMotionDuration(
  project: Project,
  duration: number,
): Project {
  const m = project.motion || { preset: "reveal" as const, duration: 3 },
    ratio = duration / m.duration;
  return {
    ...project,
    motion: {
      ...m,
      duration,
      ...(m.tracks
        ? {
            tracks: Object.fromEntries(
              Object.entries(m.tracks).map(([id, t]) => [
                id,
                normalizeTrack(
                  {
                    ...t,
                    start: t.start * ratio,
                    end: t.end * ratio,
                    enterDuration: t.enterDuration * ratio,
                    exitDuration: t.exitDuration * ratio,
                  },
                  duration,
                ),
              ]),
            ),
          }
        : {}),
    },
  };
}
export function graphemes(text: string): string[] {
  if (typeof Intl.Segmenter === "function")
    return [
      ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
        text,
      ),
    ].map((s) => s.segment);
  return text.match(/\P{Mark}\p{Mark}*|\p{Mark}+/gu) || [];
}
/** Element-local transforms and visual metadata are temporary frame data only. */
export function trackFrame(
  n: Element,
  t: MotionTrack,
  seconds: number,
  project: Project,
): FrameElement {
  if (n.hidden) return { ...n };
  if (
    (t.enter === "draw" && !["shape", "icon", "vector"].includes(n.kind)) ||
    (t.enter === "type" && n.kind !== "text")
  )
    t = { ...t, enter: "fade" };
  if (seconds < t.start || seconds > t.end) return { ...n, opacity: 0 };
  const raw = clamp((seconds - t.start) / t.enterDuration),
    a = smooth(raw),
    b = smooth((seconds - (t.end - t.exitDuration)) / t.exitDuration);
  let scale = 1,
    rotation = n.rotation,
    x = n.x,
    y = n.y,
    opacity = n.opacity;
  if (t.enter !== "none")
    opacity *= t.enter === "type" || t.enter === "draw" ? 1 : a;
  if (t.enter === "draw" && raw === 0) opacity = 0;
  if (t.enter === "rise") y += (1 - a) * project.height * 0.12;
  if (t.enter === "slide-left") x -= (1 - a) * project.width * 0.15;
  if (t.enter === "pop") scale = 0.55 + 0.45 * a + Math.sin(a * Math.PI) * 0.16;
  if (t.enter === "spin") {
    scale = 0.7 + 0.3 * a;
    rotation -= (1 - a) * 55;
  }
  if (t.hold === "pulse")
    scale *=
      1 -
      (0.04 *
        (1 -
          Math.cos(
            clamp((seconds - t.start) / (t.end - t.start)) * Math.PI * 2,
          ))) /
        2;
  if (t.exit !== "none") opacity *= 1 - b;
  if (t.exit === "slide-right") x += b * project.width * 0.15;
  if (t.exit === "shrink") scale *= 1 - 0.4 * b;
  const characters =
    t.enter === "type" && n.kind === "text" ? graphemes(n.text) : undefined;
  const visual: FrameElement["motionVisual"] = {};
  if (
    t.enter === "draw" &&
    ["shape", "icon", "vector"].includes(n.kind) &&
    raw < 1
  )
    visual.draw = raw;
  if (
    t.hold === "shine" &&
    seconds >= t.start + t.enterDuration &&
    seconds <= t.end - t.exitDuration
  ) {
    const hold = t.end - t.exitDuration - t.start - t.enterDuration;
    if (hold > 0.01)
      visual.shine = clamp((seconds - t.start - t.enterDuration) / hold);
  }
  return {
    ...n,
    x,
    y,
    rotation,
    opacity,
    w: n.w * scale,
    h: n.h * scale,
    fontSize: n.fontSize * scale,
    spacing: n.spacing * scale,
    strokeWidth: n.strokeWidth * scale,
    radius: n.radius * scale,
    shadow: n.shadow * scale,
    blur: n.blur * scale,
    ...(characters
      ? {
          text: characters
            .slice(0, Math.ceil(raw * characters.length))
            .join(""),
        }
      : {}),
    ...(Object.keys(visual).length ? { motionVisual: visual } : {}),
  };
}
