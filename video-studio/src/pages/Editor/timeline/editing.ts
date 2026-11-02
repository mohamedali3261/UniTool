import { splitKeyframes } from "../../../animation/evaluate";
import {
  uid,
  clipDuration,
  durationOf,
  type Project,
  type Clip,
  type Asset,
} from "../../../types";
import { clamp, clipStart, trimClip } from "../../../lib/timeline";
import {
  selectedObject,
  patchObject,
  type Selection,
} from "../../../preview/model";
export type Item = Selection;
export const key = (s: Item) => `${s.kind}:${s.id}`;
export const trackKey = (s: Item) =>
  s.kind === "clip" ? "video" : s.kind === "text" ? "text" : s.id;
export function locked(p: Project, s: Item) {
  return !!(selectedObject(p, s)?.locked || p.tracks?.[trackKey(s)]?.locked);
}
export function expand(p: Project, items: Item[]): Item[] {
  const groups = new Set(
    items.map((s) => selectedObject(p, s)?.groupId).filter(Boolean),
  );
  const all: Item[] = [
    ...p.clips.map((c) => ({ kind: "clip" as const, id: c.id })),
    ...p.texts.map((t) => ({ kind: "text" as const, id: t.id })),
    ...(p.overlays || []).map((l) => ({ kind: "overlay" as const, id: l.id })),
  ];
  return all.filter(
    (s) =>
      items.some((i) => key(i) === key(s)) ||
      groups.has(selectedObject(p, s)?.groupId),
  );
}
export function groupItems(p: Project, items: Item[], unlink = false) {
  const id = unlink ? undefined : uid();
  return items.reduce(
    (next, s) => (locked(p, s) ? next : patchObject(next, s, { groupId: id })),
    p,
  );
}
export function shiftItems(p: Project, items: Item[], delta: number) {
  const movable = expand(p, items).filter(
    (s) => s.kind !== "clip" && !locked(p, s),
  );
  const starts = movable.map((s) => {
    const o = selectedObject(p, s)!;
    return s.kind === "overlay"
      ? (o as { at: number }).at
      : (o as { start: number }).start;
  });
  const ends = movable.map((s) => {
    const o = selectedObject(p, s)!;
    return s.kind === "overlay"
      ? (o as { at: number; end: number; start: number }).at +
          (o as { end: number }).end -
          (o as { start: number }).start
      : (o as { end: number }).end;
  });
  if (starts.length)
    delta = clamp(
      delta,
      -Math.min(...starts),
      Math.max(0, 3600 - Math.max(...ends)),
    );
  return movable.reduce((next, s) => {
    const o = selectedObject(p, s)!;
    return s.kind === "overlay"
      ? patchObject(next, s, { at: (o as { at: number }).at + delta })
      : patchObject(next, s, {
          start: (o as { start: number }).start + delta,
          end: (o as { end: number }).end + delta,
        });
  }, p);
}
export function reorderItems(p: Project, items: Item[], before: string | null) {
  const expanded = expand(p, items);
  const ids = new Set(
    expanded.filter((s) => s.kind === "clip" && !locked(p, s)).map((s) => s.id),
  );
  if (!ids.size || (before && ids.has(before))) return p;
  // A locked base track is never reordered; individual locked clips are fixed barriers.

  const moving = p.clips.filter((c) => ids.has(c.id)),
    rest = p.clips.filter((c) => !ids.has(c.id));
  const at = before ? rest.findIndex((c) => c.id === before) : rest.length;
  if (at < 0) return p;
  rest.splice(at, 0, ...moving);
  let next = { ...p, clips: rest };
  if (
    p.clips.some(
      (c) =>
        c.locked &&
        Math.abs(clipStart(p, c.id) - clipStart(next, c.id)) > 0.00001,
    )
  )
    return p;
  const first = moving[0];
  const delta = clipStart(next, first.id) - clipStart(p, first.id);
  const timed = expanded.filter((s) => s.kind !== "clip");
  next = shiftItems(next, timed, delta);
  // Linked text/overlays follow their own base clip, including unselected clips pushed by a reorder.
  for (const c of p.clips) {
    if (!c.groupId) continue;
    const dt = clipStart(next, c.id) - clipStart(p, c.id);
    const linked = expand(p, [{ kind: "clip", id: c.id }]).filter(
      (s) => s.kind !== "clip" && !timed.some((i) => key(i) === key(s)),
    );
    next = shiftItems(next, linked, dt);
  }
  return next;
}
export function removeItems(
  p: Project,
  items: Item[],
  ripple: boolean,
): Project {
  const editable = expand(p, items).filter((s) => !locked(p, s));
  const ids = new Set(
    editable.filter((s) => s.kind === "clip").map((s) => s.id),
  );
  const removed = p.clips
    .filter((c) => ids.has(c.id))
    .map((c) => ({ start: clipStart(p, c.id), duration: clipDuration(c) }));
  const mapped = (t: number) =>
    ripple
      ? Math.max(
          0,
          t -
            removed.reduce((n, r) => n + clamp(t - r.start, 0, r.duration), 0),
        )
      : t;
  return {
    ...p,
    clips: p.clips.flatMap((c) =>
      !ids.has(c.id)
        ? [c]
        : ripple
          ? []
          : [
              {
                ...c,
                gap: true,
                volume: 0,
                keyframes: undefined,
                transition: undefined,
                groupId: undefined,
              },
            ],
    ),
    texts: p.texts
      .filter((t) => !editable.some((s) => s.kind === "text" && s.id === t.id))
      .map((t) =>
        locked(p, { kind: "text", id: t.id })
          ? t
          : {
              ...t,
              start: mapped(t.start),
              end: Math.max(mapped(t.start) + 0.1, mapped(t.end)),
            },
      ),
    overlays: p.overlays
      ?.filter(
        (l) => !editable.some((s) => s.kind === "overlay" && s.id === l.id),
      )
      .map((l) =>
        locked(p, { kind: "overlay", id: l.id })
          ? l
          : { ...l, at: mapped(l.at) },
      ),
    markers: p.markers?.map((m) => ({ ...m, time: mapped(m.time) })),
    sounds: p.sounds?.map((c) =>
      p.tracks?.sfx?.locked ? c : { ...c, at: mapped(c.at) },
    ),
    audioStart: p.tracks?.audio?.locked
      ? p.audioStart
      : mapped(p.audioStart || 0),
    tracks: p.tracks
      ? Object.fromEntries(
          Object.entries(p.tracks).filter(
            ([k]) =>
              ["video", "text", "audio"].includes(k) ||
              !editable.some((s) => s.kind === "overlay" && s.id === k),
          ),
        )
      : undefined,
  };
}
export function closeGaps(p: Project) {
  return removeItems(
    p,
    p.clips.filter((c) => c.gap).map((c) => ({ kind: "clip", id: c.id })),
    true,
  );
}
export function trimBase(
  p: Project,
  id: string,
  edge: "start" | "end",
  delta: number,
  max: number,
  ripple: boolean,
) {
  const c = p.clips.find((c) => c.id === id);
  if (!c || locked(p, { kind: "clip", id })) return p;
  const next = trimClip(c, edge, delta, max),
    difference = clipDuration(c) - clipDuration(next);
  if (!ripple && difference < -0.00001) return p;
  let out = {
    ...p,
    clips: p.clips.flatMap((x) =>
      x.id !== id
        ? [x]
        : !ripple && difference > 0.00001
          ? edge === "start"
            ? [
                {
                  ...c,
                  id: uid(),
                  gap: true,
                  start: 0,
                  end: difference,
                  speed: 1,
                  volume: 0,
                  groupId: undefined,
                },
                next,
              ]
            : [
                next,
                {
                  ...c,
                  id: uid(),
                  gap: true,
                  start: 0,
                  end: difference,
                  speed: 1,
                  volume: 0,
                  groupId: undefined,
                },
              ]
          : [next],
    ),
  };
  if (ripple && Math.abs(difference) > 0.00001) {
    const cut = clipStart(p, id) + (edge === "start" ? 0 : clipDuration(next));
    const shift = (t: number) => (t >= cut ? Math.max(cut, t - difference) : t);
    out = {
      ...out,
      texts: out.texts.map((t) =>
        locked(p, { kind: "text", id: t.id })
          ? t
          : {
              ...t,
              start: shift(t.start),
              end: Math.max(shift(t.start) + 0.1, shift(t.end)),
            },
      ),
      overlays: out.overlays?.map((l) =>
        locked(p, { kind: "overlay", id: l.id })
          ? l
          : { ...l, at: shift(l.at) },
      ),
      markers: out.markers?.map((m) => ({ ...m, time: shift(m.time) })),
      sounds: out.sounds?.map((c) =>
        p.tracks?.sfx?.locked ? c : { ...c, at: shift(c.at) },
      ),
      audioStart: p.tracks?.audio?.locked
        ? p.audioStart
        : shift(p.audioStart || 0),
    };
  }
  return out;
}
export function trimOverlay(
  p: Project,
  id: string,
  edge: "start" | "end",
  delta: number,
  assets: Asset[],
) {
  const l = p.overlays?.find((l) => l.id === id);
  if (!l || locked(p, { kind: "overlay", id })) return p;
  const asset = assets.find((a) => a.id === l.assetId);
  const max = asset?.type === "video" ? asset.duration : 3600;
  if (edge === "start") {
    const d = clamp(delta, Math.max(-l.start, -l.at), l.end - l.start - 0.1);
    return patchObject(
      p,
      { kind: "overlay", id },
      { at: l.at + d, start: l.start + d },
    );
  }
  return patchObject(
    p,
    { kind: "overlay", id },
    { end: clamp(l.end + delta, l.start + 0.1, max) },
  );
}
export function allPoints(p: Project) {
  let t = 0;
  return [
    0,
    ...p.clips.map((c) => (t += clipDuration(c))),
    ...p.texts.flatMap((t) => [t.start, t.end]),
    ...(p.overlays || []).flatMap((l) => [l.at, l.at + l.end - l.start]),
    ...(p.markers || []).map((m) => m.time),
    p.audioStart || 0,
  ];
}

export function duplicateItems(p: Project, items: Item[]): Project {
  const selected = expand(p, items).filter((s) => !locked(p, s));
  if (
    (p.overlays?.length || 0) +
      selected.filter((s) => s.kind === "overlay").length >
    6
  )
    return p;
  const groups = new Map<string, string>();
  const clone = <T extends { id: string; groupId?: string }>(o: T): T => {
    if (o.groupId && !groups.has(o.groupId)) groups.set(o.groupId, uid());
    return {
      ...o,
      id: uid(),
      groupId: o.groupId ? groups.get(o.groupId) : undefined,
    };
  };
  const copies = p.clips
    .filter((c) => selected.some((s) => s.kind === "clip" && s.id === c.id))
    .map(clone);
  let clips = [...p.clips];
  const last = p.clips.reduce(
    (index, c, i) =>
      selected.some((s) => s.kind === "clip" && s.id === c.id) ? i : index,
    -1,
  );
  clips.splice(last + 1, 0, ...copies);
  const delta = (group?: string) => {
    const c = group
      ? p.clips.find(
          (c) =>
            c.groupId === group &&
            selected.some((s) => s.kind === "clip" && s.id === c.id),
        )
      : undefined;
    const copy = c
      ? copies.find((x) => x.groupId === groups.get(group!))
      : undefined;
    return c && copy
      ? clipStart({ ...p, clips }, copy.id) - clipStart(p, c.id)
      : 0.5;
  };
  return {
    ...p,
    clips,
    texts: [
      ...p.texts,
      ...p.texts
        .filter((t) => selected.some((s) => s.kind === "text" && s.id === t.id))
        .map((t) => ({
          ...clone(t),
          start: t.start + delta(t.groupId),
          end: t.end + delta(t.groupId),
        })),
    ],
    overlays: [
      ...(p.overlays || []),
      ...(p.overlays || [])
        .filter((l) =>
          selected.some((s) => s.kind === "overlay" && s.id === l.id),
        )
        .map((l) => ({ ...clone(l), at: l.at + delta(l.groupId) })),
    ],
  };
}
/** Insert a frozen image at the cursor; source trims remain non-destructive. */
export function insertFrozen(
  p: Project,
  id: string,
  at: number,
  frozen: Clip,
): Project {
  const c = p.clips.find((c) => c.id === id);
  if (!c || locked(p, { kind: "clip", id })) return p;
  const start = clipStart(p, id),
    rel = clamp(at - start, 0, clipDuration(c)),
    local = c.start + rel * c.speed;
  const frames = splitKeyframes(c, rel);
  const clips = p.clips.flatMap((x) =>
    x.id !== id
      ? [x]
      : rel < 0.1
        ? [frozen, c]
        : clipDuration(c) - rel < 0.1
          ? [c, frozen]
          : [
              { ...c, end: local, fadeOut: 0, keyframes: frames.head },
              frozen,
              {
                ...c,
                id: uid(),
                start: local,
                transition: undefined,
                fadeIn: 0,
                keyframes: frames.tail,
              },
            ],
  );
  const duration = clipDuration(frozen),
    when = start + rel;
  return {
    ...p,
    clips,
    texts: p.texts.map((t) =>
      locked(p, { kind: "text", id: t.id })
        ? t
        : {
            ...t,
            start: t.start >= when ? t.start + duration : t.start,
            end: t.end > when ? t.end + duration : t.end,
          },
    ),
    overlays: p.overlays?.map((l) =>
      locked(p, { kind: "overlay", id: l.id })
        ? l
        : { ...l, at: l.at >= when ? l.at + duration : l.at },
    ),
    markers: p.markers?.map((m) => ({
      ...m,
      time: m.time >= when ? m.time + duration : m.time,
    })),
    sounds: p.sounds?.map((c) =>
      p.tracks?.sfx?.locked || c.at < when ? c : { ...c, at: c.at + duration },
    ),
    audioStart: p.tracks?.audio?.locked
      ? p.audioStart
      : (p.audioStart || 0) >= when
        ? (p.audioStart || 0) + duration
        : p.audioStart,
  };
}
