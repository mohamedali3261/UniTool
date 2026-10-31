import { rulerTicks } from "./timeline/ruler";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useId } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  Plus,
  MoreHorizontal,
  Scissors,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Type,
  Music2,
  Magnet,
  ScanLine,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
  Flag,
  Link,
  Unlink,
  MousePointer2,
  Focus,
  Play,
  Pause,
  LocateFixed,
  Rows3,
  X,
  Diamond,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  uid,
  clipDuration,
  durationOf,
  timeLabel,
  type Asset,
  type Project,
  type TrackSettings,
  type MotionKeyframe,
} from "../../types";
import {
  boundaries,
  clamp,
  clipStart,
  snapTime,
  textLanes,
} from "../../lib/timeline";
import { motionAt } from "../../animation/evaluate";
import { selectedObject, patchObject } from "../../preview/model";
import { IconButton } from "../../components/IconButton";
import { StudioSelect } from "../../components/StudioSelect";
import { Waveform } from "./Waveform";
import { ThumbnailStrip } from "./timeline/ThumbnailStrip";
import { TrackControls } from "./timeline/TrackControls";
import { ContextMenu } from "./timeline/ContextMenu";
import { TimelineOverview } from "./timeline/TimelineOverview";
import { adjacentPoint, followOffset, navigationPoints } from "./timeline/navigation";
import { readTimelineView, writeTimelineView } from "./timeline/view";
import {
  allPoints,
  closeGaps,
  duplicateItems,
  expand,
  groupItems,
  key,
  locked,
  removeItems,
  reorderItems,
  shiftItems,
  trimBase,
  trimOverlay,
  type Item,
} from "./timeline/editing";
type Drag = {
  mode:
    | "scrub"
    | "trim"
    | "reorder"
    | "text"
    | "overlay"
    | "audio"
    | "marker"
    | "keyframe";
  id?: string;
  clipId?: string;
  edge?: "start" | "end" | "move";
  x: number;
  scroll: number;
  p: Project;
  items: Item[];
  pointer: number;
};
type Props = {
  compact?: boolean;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  selection?: Item | null;
  project: Project;
  assets: Asset[];
  time: number;
  setTime: (t: number) => void;
  selected: string | null;
  select: (id: string) => void;
  onImport: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onText: () => void;
  onAudio: () => void;
  onTrimStart: () => void;
  onTrimEnd: () => void;
  onChange: (p: Project) => void;
  onSelectItem?: (s: Item) => void;
  onFreeze?: (id: string) => void;
  onInspectOverlay?: () => void;
  onInspectItem?: (s: Item) => void;
};
export function Timeline({
  compact = false,
  playing,
  onPlayingChange,
  selection,
  project,
  assets,
  time,
  setTime,
  selected,
  select,
  onImport,
  onSplit,
  onText,
  onAudio,
  onChange,
  onSelectItem,
  onFreeze,
  onInspectOverlay,
  onInspectItem,
}: Props) {
  const [mobileOptions, setMobileOptions] = useState(false);
  const [view, setView] = useState(readTimelineView);
  const { snap, ripple, follow, roomy, height } = view;
  const patchView = (patch: Partial<typeof view>) =>
    setView((old) => ({ ...old, ...patch }));
  const optionsRef = useRef<HTMLDivElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const optionsId = useId();
  const [viewport, setViewport] = useState({ left: 0, width: 0, total: 0 });
  const [rulerBucket, setRulerBucket] = useState(0);
  const [zoom, setZoom] = useState(55),
    [multiple, setMultiple] = useState(false),
    [precise, setPrecise] = useState(false);
  const [items, setItems] = useState<Item[]>([]),
    [draft, setDraft] = useState<Project | null>(null),
    [guide, setGuide] = useState<number | null>(null),
    [marker, setMarker] = useState<string | null>(null),
    [kf, setKf] = useState<{ clipId: string; id: string } | null>(null),
    [menu, setMenu] = useState<{
      x: number;
      y: number;
      items: Item[];
      touch?: boolean;
    } | null>(null);
  const track = useRef<HTMLDivElement>(null),
    scroll = useRef<HTMLDivElement>(null),
    labels = useRef<HTMLDivElement>(null),
    drag = useRef<Drag | null>(null),
    draftRef = useRef<Project | null>(null),
    long = useRef<ReturnType<typeof setTimeout> | null>(null),
    lastX = useRef(0),
    anchor = useRef<{ time: number; offset: number } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
    time: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const p = draft || project,
    duration = durationOf(p),
    width = Math.max(560, (duration + 2) * zoom),
    lanes = textLanes(p.texts);
  const active = items.filter((s) => selectedObject(project, s));
  const fallback: Item[] = active.length
    ? active
    : selected
      ? [{ kind: "clip", id: selected }]
      : [];
  const music = assets.find((a) => a.id === p.audioId),
    audioStart = p.audioStart || 0;
  const audioSpan = music
    ? Math.max(
        0,
        Math.min(
          duration - audioStart,
          p.audioLoop === false
            ? (Math.min(music.duration, p.audioEnd ?? music.duration) -
                (p.audioOffset || 0)) /
                (p.audioSpeed || 1)
            : duration - audioStart,
        ),
      )
    : 0;
  const selectedClip = project.clips.find((c) => c.id === selected),
    selectedMarker = p.markers?.find((m) => m.id === marker),
    keyClip = kf ? p.clips.find((c) => c.id === kf.clipId) : undefined,
    keyframe = keyClip?.keyframes?.find((f) => f.id === kf?.id);
  const rulerHeight = compact ? 30 : roomy ? 40 : 26,
    laneHeight = compact || !roomy ? 24 : 34;
  const rowHeight = (id: string, normal: number) =>
    p.tracks?.[id]?.collapsed
      ? compact || !roomy
        ? 24
        : 32
      : p.tracks?.[id]?.height
        ? compact || !roomy
          ? clamp(p.tracks[id].height! * 0.7, 32, 98)
          : p.tracks[id].height!
        : normal;
  const videoHeight = rowHeight("video", compact ? 60 : roomy ? 88 : 52),
    textHeight = rowHeight(
      "text",
      Math.max(compact || !roomy ? 28 : 44, lanes.count * laneHeight + (compact || !roomy ? 4 : 8)),
    ),
    audioHeight = rowHeight("audio", compact ? 34 : roomy ? 54 : 32);
  const clearLong = () => {
    if (long.current) clearTimeout(long.current);
    long.current = null;
  };
  function cancel() {
    clearLong();
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    draftRef.current = null;
    setDraft(null);
    setGuide(null);
    if (d && track.current?.hasPointerCapture(d.pointer))
      track.current.releasePointerCapture(d.pointer);
  }
  useEffect(() => {
    if (drag.current && drag.current.p !== project) cancel();
  }, [project]);
  useEffect(() => writeTimelineView(view), [view]);
  useEffect(() => {
    setItems((old) => old.filter((s) => selectedObject(project, s)));
    setMarker((old) => (project.markers?.some((m) => m.id === old) ? old : null));
    setKf((old) =>
      old && project.clips.find((c) => c.id === old.clipId)?.keyframes?.some((f) => f.id === old.id)
        ? old
        : null,
    );
  }, [project]);
  useEffect(() => {
    if (!multiple) setItems(selection ? [selection] : []);
  }, [selection?.kind, selection?.id, multiple]);
  useEffect(() => {
    if (!mobileOptions) return;
    const outside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!optionsRef.current?.contains(target) && !optionsButton.current?.contains(target))
        setMobileOptions(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMobileOptions(false);
        optionsButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key, true);
    };
  }, [mobileOptions]);
  useEffect(
    () => () => {
      clearLong();
    },
    [],
  );
  useLayoutEffect(() => {
    if (anchor.current && scroll.current) {
      scroll.current.scrollLeft =
        anchor.current.time * zoom - anchor.current.offset;
      anchor.current = null;
    }
  }, [zoom]);
  useLayoutEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const measure = () =>
      setViewport({ left: el.scrollLeft, width: el.clientWidth, total: el.scrollWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width, height, mobileOptions]);
  useLayoutEffect(() => {
    const el = scroll.current,
      clip = project.clips.find((c) => c.id === selected);
    if (!el?.clientWidth || !clip || drag.current) return;
    const left = clipStart(project, clip.id) * zoom,
      right = left + clipDuration(clip) * zoom;
    if (right < el.scrollLeft || left > el.scrollLeft + el.clientWidth - 30)
      el.scrollLeft = Math.max(0, left - 32);
  }, [selected, project.clips.length]);
  useEffect(() => {
    const el = scroll.current;
    if (!el || !playing || !follow || drag.current) return;
    const next = followOffset(time, zoom, el.scrollLeft, el.clientWidth);
    if (next !== null) el.scrollLeft = next;
  }, [time, playing, follow, zoom]);
  function seek(next: number, center = false) {
    const t = clamp(next, 0, duration);
    setTime(t);
    const el = scroll.current;
    if (el) {
      const x = t * zoom;
      if (center) el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
      else {
        const offset = followOffset(t, zoom, el.scrollLeft, el.clientWidth);
        if (offset !== null) el.scrollLeft = offset;
      }
    }
  }
  function fit() {
    cancel();
    setZoom(clamp(((scroll.current?.clientWidth || 700) - 45) / Math.max(duration, 0.5), 5, 720));
  }
  function zoomAt(next: number, clientX?: number) {
    cancel();
    const el = scroll.current;
    if (el) {
      const offset =
        clientX === undefined
          ? el.clientWidth / 2
          : clientX - el.getBoundingClientRect().left;
      anchor.current = { time: (el.scrollLeft + offset) / zoom, offset };
    }
    setZoom(clamp(next, 5, 720));
  }
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const pinch = pinchRef;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(zoom * (e.deltaY > 0 ? 0.9 : 1.1), e.clientX);
      }
    };
    const distance = (e: TouchEvent) =>
      Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        cancel();
        const middle =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 -
          el.getBoundingClientRect().left;
        pinch.current = {
          distance: Math.max(1, distance(e)),
          zoom,
          time: (el.scrollLeft + middle) / zoom,
        };
      }
    };
    const move = (e: TouchEvent) => {
      if (pinch.current && e.touches.length === 2) {
        e.preventDefault();
        const offset =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 -
          el.getBoundingClientRect().left;
        anchor.current = { time: pinch.current.time, offset };
        setZoom(
          clamp(
            (pinch.current.zoom * distance(e)) / pinch.current.distance,
            5,
            720,
          ),
        );
      }
    };
    const end = () => {
      pinch.current = null;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [zoom]);
  function choose(s: Item, toggle = false) {
    let next = toggle
      ? active.some((i) => key(i) === key(s))
        ? active.filter((i) => key(i) !== key(s))
        : [...active, s]
      : active.some((i) => key(i) === key(s))
        ? active
        : [s];
    setItems(next);
    if (s.kind === "clip") select(s.id);
    else onSelectItem?.(s);
    return next;
  }
  function show(next: Project) {
    draftRef.current = next;
    setDraft(next);
  }
  function start(
    e: ReactPointerEvent,
    mode: Drag["mode"],
    s?: Item,
    edge: Drag["edge"] = "move",
    id?: string,
  ) {
    if (e.button !== 0 || drag.current) return;
    e.preventDefault();
    e.stopPropagation();
    track.current?.focus({ preventScroll: true });
    const chosen = s
      ? choose(s, e.shiftKey || e.ctrlKey || e.metaKey || multiple)
      : active;
    if (
      (s && locked(project, s)) ||
      (mode === "audio" && project.tracks?.audio?.locked) ||
      (s && (multiple || e.shiftKey || e.ctrlKey || e.metaKey))
    )
      return;
    const d: Drag = {
      mode,
      id: id || s?.id,
      clipId: mode === "keyframe" ? s?.id : undefined,
      edge,
      x: e.clientX,
      scroll: scroll.current?.scrollLeft || 0,
      p: project,
      items: chosen,
      pointer: e.pointerId,
    };
    drag.current = d;
    setDragging(true);
    lastX.current = e.clientX;
    draftRef.current = null;
    track.current?.setPointerCapture(e.pointerId);
    if (s && mode !== "keyframe" && mode !== "trim" && edge === "move") {
      const x = e.clientX,
        y = e.clientY;
      long.current = setTimeout(() => {
        cancel();
        setMenu({ x, y, items: chosen, touch: e.pointerType === "touch" });
      }, 550);
    }
    if (mode === "scrub") moveAt(e.clientX);
  }
  function moveAt(clientX: number) {
    const d = drag.current;
    if (!d || !track.current) return;
    lastX.current = clientX;
    if (Math.abs(clientX - d.x) > 4) clearLong();
    const raw = (clientX - track.current.getBoundingClientRect().left) / zoom;
    const dx =
      (clientX - d.x + (scroll.current?.scrollLeft || 0) - d.scroll) / zoom;
    const points = [...allPoints(d.p), time];
    const snapTo = (n: number, exclude: number[] = []) => {
      const value = snap
        ? snapTime(
            n,
            points.filter(
              (v) => !exclude.some((x) => Math.abs(x - v) < 0.00001),
            ),
            8 / zoom,
          )
        : n;
      setGuide(Math.abs(value - n) > 0.00001 ? value : null);
      return precise ? Math.round(value * 30) / 30 : value;
    };
    if (d.mode === "scrub") {
      setTime(clamp(snapTo(raw), 0, durationOf(d.p)));
      return;
    }
    if (d.mode === "trim") {
      const c = d.p.clips.find((c) => c.id === d.id)!;
      const base = clipStart(d.p, c.id),
        old = base + (d.edge === "end" ? clipDuration(c) : 0);
      const delta = (snapTo(old + dx, [old]) - old) * c.speed;
      const asset = assets.find((a) => a.id === c.assetId);
      show(
        trimBase(
          d.p,
          c.id,
          d.edge as "start" | "end",
          delta,
          asset?.type === "image" || c.gap ? 3600 : asset?.duration || c.end,
          ripple,
        ),
      );
    } else if (d.mode === "reorder" && Math.abs(clientX - d.x) > 5) {
      let before: string | null = null,
        pos = 0;
      for (const c of d.p.clips) {
        if (raw < pos + clipDuration(c) / 2) {
          before = c.id;
          break;
        }
        pos += clipDuration(c);
      }
      show(reorderItems(d.p, d.items, before));
    } else if (d.mode === "text") {
      const t = d.p.texts.find((t) => t.id === d.id)!;
      if (d.edge === "move")
        show(
          shiftItems(
            d.p,
            d.items,
            snapTo(t.start + dx, [t.start, t.end]) - t.start,
          ),
        );
      else {
        const start =
          d.edge === "start"
            ? clamp(snapTo(t.start + dx, [t.start]), 0, t.end - 0.1)
            : t.start;
        const end =
          d.edge === "end"
            ? clamp(snapTo(t.end + dx, [t.end]), t.start + 0.1, 3600)
            : t.end;
        show(patchObject(d.p, { kind: "text", id: t.id }, { start, end }));
      }
    } else if (d.mode === "overlay") {
      const l = d.p.overlays!.find((l) => l.id === d.id)!;
      if (d.edge === "move")
        show(
          shiftItems(
            d.p,
            d.items,
            snapTo(l.at + dx, [l.at, l.at + l.end - l.start]) - l.at,
          ),
        );
      else {
        const old = d.edge === "start" ? l.at : l.at + l.end - l.start;
        show(
          trimOverlay(
            d.p,
            l.id,
            d.edge as "start" | "end",
            snapTo(old + dx, [old]) - old,
            assets,
          ),
        );
      }
    } else if (d.mode === "audio")
      show({
        ...d.p,
        audioStart: clamp(
          snapTo((d.p.audioStart || 0) + dx, [d.p.audioStart || 0]),
          0,
          Math.max(0, durationOf(d.p) - 0.1),
        ),
      });
    else if (d.mode === "marker")
      show({
        ...d.p,
        markers: d.p.markers?.map((m) =>
          m.id === d.id
            ? {
                ...m,
                time: clamp(snapTo(m.time + dx, [m.time]), 0, durationOf(d.p)),
              }
            : m,
        ),
      });
    else if (d.mode === "keyframe") {
      const c = d.p.clips.find((c) => c.id === d.clipId)!;
      const f = c.keyframes!.find((f) => f.id === d.id)!;
      const base = clipStart(d.p, c.id);
      let t = clamp(
        snapTo(base + f.t + dx, [base + f.t]) - base,
        0,
        clipDuration(c),
      );
      if (c.keyframes!.some((k) => k.id !== f.id && Math.abs(k.t - t) < 0.01))
        return;
      show({
        ...d.p,
        clips: d.p.clips.map((x) =>
          x.id !== c.id
            ? x
            : {
                ...x,
                keyframes: x.keyframes?.map((k) =>
                  k.id === f.id ? { ...k, t } : k,
                ),
              },
        ),
      });
    }
  }
  useEffect(() => {
    if (!dragging) return;
    let frame = 0;
    const tick = () => {
      const d = drag.current,
        el = scroll.current;
      if (d && el && d.mode !== "scrub") {
        const r = el.getBoundingClientRect(),
          x = lastX.current;
        const amount =
          x > r.right - 36
            ? Math.min(20, (x - r.right + 36) * 0.5)
            : x < r.left + 36
              ? -Math.min(20, (r.left + 36 - x) * 0.5)
              : 0;
        if (amount) {
          const before = el.scrollLeft;
          el.scrollLeft += amount;
          if (el.scrollLeft !== before) moveAt(x);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [zoom, snap, precise, ripple, time, dragging]);
  function finish(e: ReactPointerEvent, cancelled = false) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const next = draftRef.current;
    cancel();
    if (!cancelled && next && next !== project) onChange(next);
  }
  function changeTrack(id: string, patch: TrackSettings) {
    onChange({
      ...project,
      tracks: {
        ...project.tracks,
        [id]: { ...project.tracks?.[id], ...patch },
      },
    });
  }
  const isSelected = (s: Item) => active.some((i) => key(i) === key(s));
  const attributes = (s: Item) => ({
    "data-timeline-kind": s.kind,
    "data-timeline-id": s.id,
    "aria-pressed": isSelected(s),
  });
  const erase = (selection = fallback) => {
    onChange(removeItems(project, selection, ripple));
    setItems([]);
  };
  const copy = (selection = fallback) =>
    onChange(duplicateItems(project, selection));
  function addMarker() {
    if ((project.markers?.length || 0) >= 500) return;
    const id = uid();
    onChange({
      ...project,
      markers: [
        ...(project.markers || []),
        {
          id,
          time,
          label: `علامة ${(project.markers?.length || 0) + 1}`,
          color: "#b7f568",
        },
      ],
    });
    setMarker(id);
  }
  function addKeyframe(cId: string, t: number) {
    const c = project.clips.find((c) => c.id === cId);
    if (
      !c ||
      c.gap ||
      locked(project, { kind: "clip", id: cId }) ||
      (c.keyframes?.length || 0) >= 20
    )
      return;
    t = clamp(t, 0, clipDuration(c));
    const existing = c.keyframes?.find((f) => Math.abs(f.t - t) < 0.01);
    if (existing) {
      setKf({ clipId: cId, id: existing.id });
      return;
    }
    const id = uid();
    onChange({
      ...project,
      clips: project.clips.map((x) =>
        x.id !== cId
          ? x
          : {
              ...x,
              keyframes: [
                ...(x.keyframes || []),
                {
                  id,
                  t,
                  ...motionAt({ ...c, motion: "none" }, t),
                  easing: "linear",
                },
              ],
            },
      ),
    });
    setKf({ clipId: cId, id });
  }
  function patchKeyframe(patch: Partial<MotionKeyframe>) {
    if (!kf || locked(project, { kind: "clip", id: kf.clipId })) return;
    onChange({
      ...project,
      clips: project.clips.map((c) =>
        c.id !== kf.clipId
          ? c
          : {
              ...c,
              keyframes: c.keyframes?.map((f) =>
                f.id === kf.id
                  ? {
                      ...f,
                      ...patch,
                      ...(patch.easing
                        ? { easeFrom: undefined, easeTo: undefined }
                        : {}),
                    }
                  : f,
              ),
            },
      ),
    });
  }
  function trimCursor(edge: "start" | "end") {
    const c = project.clips.find(
      (c) =>
        time >= clipStart(project, c.id) &&
        time < clipStart(project, c.id) + clipDuration(c),
    );
    if (!c) return;
    const asset = assets.find((a) => a.id === c.assetId),
      local = c.start + (time - clipStart(project, c.id)) * c.speed;
    if (local - c.start < 0.1 || c.end - local < 0.1) return;
    onChange(
      trimBase(
        project,
        c.id,
        edge,
        local - c[edge],
        asset?.type === "image" || c.gap ? 3600 : asset?.duration || c.end,
        ripple,
      ),
    );
  }
  function jump(dir: number) {
    seek(adjacentPoint(navigationPoints(project), time, dir));
  }
  function moveSelection(dir: number) {
    const selection = active.length ? active : fallback;
    const clips = selection.filter((s) => s.kind === "clip");
    if (!clips.length || clips.some((s) => locked(project, s))) return;
    const indexes = clips.map((s) => project.clips.findIndex((c) => c.id === s.id));
    const first = Math.min(...indexes), last = Math.max(...indexes);
    const before = dir < 0 ? project.clips[first - 1]?.id : project.clips[last + 2]?.id ?? null;
    if (dir < 0 && first === 0) return;
    if (dir > 0 && last === project.clips.length - 1) return;
    onChange(reorderItems(project, selection, before));
  }
  const cursorClip = project.clips.find(
    (c) => time >= clipStart(project, c.id) && time < clipStart(project, c.id) + clipDuration(c),
  );
  const canSplit = !!cursorClip && !cursorClip.gap && !locked(project, { kind: "clip", id: cursorClip.id }) &&
    time > clipStart(project, cursorClip.id) + 0.1 / cursorClip.speed && time < clipStart(project, cursorClip.id) + clipDuration(cursorClip) - 0.1 / cursorClip.speed;
  const contextItems = menu?.items || fallback,
    contextClip =
      contextItems.length === 1 && contextItems[0].kind === "clip"
        ? project.clips.find((c) => c.id === contextItems[0].id)
        : undefined;
  const detach = () => {
    if (
      !contextClip ||
      assets.find((a) => a.id === contextClip.assetId)?.type !== "video" ||
      locked(project, { kind: "clip", id: contextClip.id })
    )
      return;
    if (
      project.audioId &&
      !window.confirm("استبدال الموسيقى الحالية بصوت المقطع؟")
    )
      return;
    onChange({
      ...project,
      audioId: contextClip.assetId,
      audioStart: clipStart(project, contextClip.id),
      audioOffset: contextClip.start,
      audioEnd: contextClip.end,
      audioSpeed: contextClip.speed,
      audioLoop: false,
      audioVolume: contextClip.volume,
      clips: project.clips.map((c) =>
        c.id === contextClip.id ? { ...c, volume: 0 } : c,
      ),
    });
  };
  return (
    <section
      className={`timeline timeline-enhanced timeline-pro ${compact ? "is-compact" : ""} ${roomy ? "is-roomy" : "is-dense"} ${mobileOptions ? "show-options" : ""}`}
      style={{ height }}
      aria-label="الخط الزمني للمشروع"
      onKeyDown={(e) => {
        if (
          (e.target as HTMLElement).closest(
            "input,textarea,select,[role=combobox],[role=dialog],dialog",
          )
        )
          return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancel();
          setMenu(null);
          setMobileOptions(false);
          setItems([]);
        }
        if ((e.key === "Delete" || e.key === "Backspace") && active.length) {
          e.preventDefault();
          e.stopPropagation();
          erase();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && active.length) {
          e.preventDefault();
          e.stopPropagation();
          copy();
        }
        if (e.code === "Space" && (e.target as HTMLElement).closest(".tracks")) {
          e.preventDefault();
          e.stopPropagation();
          if (duration) {
            if (time >= duration) setTime(0);
            onPlayingChange(!playing);
          }
        }
        if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          e.preventDefault();
          e.stopPropagation();
          moveSelection(e.key === "ArrowLeft" ? -1 : 1);
        }
        if (e.shiftKey && e.key.toLowerCase() === "m") {
          e.preventDefault();
          e.stopPropagation();
          addMarker();
        }
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          zoomAt(zoom * 1.3);
        }
        if (e.key === "-") {
          e.preventDefault();
          zoomAt(zoom / 1.3);
        }
        if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          fit();
        }
      }}
    >
      <div
        className="timeline-resize"
        role="separator"
        tabIndex={compact ? -1 : 0}
        aria-label="تغيير ارتفاع التايم لاين"
        aria-orientation="horizontal"
        aria-valuemin={180}
        aria-valuemax={540}
        aria-valuenow={height}
        title="اسحب لتغيير الارتفاع • الأسهم للتحكم • نقرتان لإعادة الضبط"
        onDoubleClick={() => patchView({ height: 248 })}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            patchView({ height: clamp(height + (e.key === "ArrowUp" ? 16 : -16), 180, 540) });
          }
          if (e.key === "Home") {
            e.preventDefault();
            patchView({ height: 248 });
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const el = e.currentTarget, y = e.clientY, h = height;
          el.setPointerCapture(e.pointerId);
          const move = (ev: PointerEvent) =>
            patchView({ height: clamp(h + y - ev.clientY, 180, Math.min(540, innerHeight * 0.65)) });
          const up = () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerup", up);
            el.removeEventListener("pointercancel", up);
            el.removeEventListener("lostpointercapture", up);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerup", up);
          el.addEventListener("pointercancel", up);
          el.addEventListener("lostpointercapture", up);
        }}
      >
        <i />
      </div>
      <div className="timeline-toolbar">
        <button
          ref={optionsButton}
          className="timeline-options-toggle"
          aria-label="خيارات التايم لاين"
          aria-expanded={mobileOptions}
          aria-controls={optionsId}
          onClick={() => setMobileOptions((v) => !v)}
        >
          <MoreHorizontal size={18} />
          <span>أدوات</span>
        </button>
        <div className="timeline-primary-tools">
          <IconButton icon={Scissors} label="تقسيم عند المؤشر" disabled={!canSplit} onClick={onSplit} />
          <IconButton icon={Copy} label="نسخ المقطع" disabled={!fallback.length || fallback.every((s) => locked(project, s))} onClick={() => copy()} />
          <IconButton icon={Trash2} label="حذف المقطع" disabled={!fallback.length || fallback.every((s) => locked(project, s))} onClick={() => erase()} />
          <IconButton icon={Flag} label="إضافة علامة عند المؤشر" onClick={addMarker} />
          <button aria-label="الجذب المغناطيسي" aria-pressed={snap} title="الجذب المغناطيسي" onClick={() => patchView({ snap: !snap })}>
            <Magnet size={16} />
          </button>
        </div>
        <div className="timeline-zoom-tools">
          <IconButton icon={ScanLine} label="ملاءمة المشروع للعرض" onClick={fit} />
          <IconButton icon={Focus} label="تكبير عند المؤشر" onClick={() => {
            anchor.current = { time, offset: (scroll.current?.clientWidth || 700) / 2 };
            setZoom(240);
          }} />
          <IconButton icon={ZoomOut} label="تصغير الخط الزمني" onClick={() => zoomAt(zoom / 1.3)} />
          <input aria-label="تكبير الخط الزمني" type="range" min="5" max="720" value={zoom} onChange={(e) => zoomAt(+e.target.value)} />
          <IconButton icon={ZoomIn} label="تكبير الخط الزمني" onClick={() => zoomAt(zoom * 1.3)} />
        </div>
        {mobileOptions && (
          <div ref={optionsRef} id={optionsId} className="timeline-options-panel" role="group" aria-label="أدوات التايم لاين المتقدمة" dir="rtl">
            <div className="timeline-options-heading">
              <b>أدوات المونتاج</b>
              <button aria-label="إغلاق أدوات التايم لاين" onClick={() => { setMobileOptions(false); optionsButton.current?.focus(); }}><X size={15} /></button>
            </div>
            <section>
              <h4>القص والتوقيت</h4>
              <div>
                <IconButton icon={PanelLeftClose} label="حذف ما قبل المؤشر من المقطع" disabled={!cursorClip || locked(project, { kind: "clip", id: cursorClip.id })} onClick={() => trimCursor("start")} />
                <IconButton icon={PanelRightClose} label="حذف ما بعد المؤشر من المقطع" disabled={!cursorClip || locked(project, { kind: "clip", id: cursorClip.id })} onClick={() => trimCursor("end")} />
                <button aria-label="القص المتتابع Ripple" aria-pressed={ripple} onClick={() => patchView({ ripple: !ripple })}>Ripple {ripple ? "✓" : "—"}</button>
                <button aria-label="وضع القص الدقيق" aria-pressed={precise} onClick={() => {
                  setPrecise(!precise);
                  if (!precise) {
                    anchor.current = { time, offset: (scroll.current?.clientWidth || 700) / 2 };
                    setZoom(720);
                  }
                }}>قص دقيق</button>
                <button onClick={() => onChange(closeGaps(project))} disabled={!project.clips.some((c) => c.gap)}>حذف الفراغات</button>
              </div>
            </section>
            <section>
              <h4>التحديد والترتيب</h4>
              <div>
                <button aria-label="تحديد متعدد" aria-pressed={multiple} onClick={() => setMultiple(!multiple)}><MousePointer2 size={15} /> تحديد {active.length || ""}</button>
                <IconButton icon={Link} label="تجميع وربط التحديد" disabled={active.length < 2 || active.some((s) => locked(project, s))} onClick={() => onChange(groupItems(project, active))} />
                <IconButton icon={Unlink} label="فك ارتباط التحديد" disabled={!active.length} onClick={() => onChange(groupItems(project, expand(project, active), true))} />
                <IconButton icon={ArrowRight} label="تقديم العنصر المحدد" disabled={!fallback.some((s) => s.kind === "clip") || fallback.every((s) => locked(project, s))} onClick={() => moveSelection(-1)} />
                <IconButton icon={ArrowLeft} label="تأخير العنصر المحدد" disabled={!fallback.some((s) => s.kind === "clip") || fallback.every((s) => locked(project, s))} onClick={() => moveSelection(1)} />
              </div>
            </section>
            <section>
              <h4>الصوت والحركة</h4>
              <div>
                <IconButton icon={selectedClip?.volume === 0 ? VolumeX : Volume2} label="كتم / استعادة صوت المقطع" disabled={!selectedClip || locked(project, { kind: "clip", id: selectedClip.id })} onClick={() => selectedClip && onChange(patchObject(project, { kind: "clip", id: selectedClip.id }, { volume: selectedClip.volume ? 0 : 1 }))} />
                <button disabled={!selectedClip || selectedClip.gap || locked(project, { kind: "clip", id: selectedClip.id })} onClick={() => selectedClip && addKeyframe(selectedClip.id, time - clipStart(project, selectedClip.id))}><Diamond size={14} /> Keyframe</button>
              </div>
            </section>
            <p className="timeline-options-hint">Shift + M علامة • Alt + الأسهم ترتيب • F ملاءمة • + / − تكبير</p>
          </div>
        )}
      </div>
      <div className="timeline-meta">
        <div className="timeline-transport" dir="ltr">
          <IconButton icon={ChevronLeft} label="حد المقطع السابق" onClick={() => jump(-1)} />
          <button
            className="timeline-play"
            aria-label={playing ? "إيقاف المعاينة من التايم لاين" : "تشغيل المعاينة من التايم لاين"}
            disabled={!duration}
            onClick={() => {
              if (time >= duration) setTime(0);
              onPlayingChange(!playing);
            }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <IconButton icon={ChevronRight} label="حد المقطع التالي" onClick={() => jump(1)} />
          <label className="timeline-timecode">
            <input aria-label="الانتقال إلى ثانية" type="number" min="0" max={duration} step={1 / 30} value={Number(time.toFixed(3))} onChange={(e) => seek(+e.target.value)} />
            <span>/ {timeLabel(duration)}</span>
          </label>
        </div>
        <div className="timeline-view-tools">
          <span className="timeline-selection-status" role="status">
            {active.length > 1 ? `${active.length} عناصر محددة` : selectedClip ? (selectedClip.gap ? "فراغ" : assets.find((a) => a.id === selectedClip.assetId)?.name) : "اختار عنصر من المسار"}
          </span>
          <button aria-label="تتبع المؤشر أثناء التشغيل" aria-pressed={follow} title="تتبع المؤشر أثناء التشغيل" onClick={() => patchView({ follow: !follow })}><LocateFixed size={15} /></button>
          <button aria-label="تبديل عرض المسارات المدمج والواسع" aria-pressed={roomy} title={roomy ? "عرض مدمج" : "عرض واسع"} onClick={() => patchView({ roomy: !roomy, height: roomy ? 248 : 320 })}><Rows3 size={15} /></button>
        </div>
      </div>
      {selectedMarker && (
        <div className="timeline-detail-bar" dir="rtl">
          <b>علامة</b>
          <input
            aria-label="اسم علامة التوقيت"
            maxLength={100}
            value={selectedMarker.label}
            onChange={(e) =>
              onChange({
                ...project,
                markers: project.markers?.map((m) =>
                  m.id === marker ? { ...m, label: e.target.value } : m,
                ),
              })
            }
          />
          <input
            aria-label="لون علامة التوقيت"
            type="color"
            value={selectedMarker.color}
            onChange={(e) =>
              onChange({
                ...project,
                markers: project.markers?.map((m) =>
                  m.id === marker ? { ...m, color: e.target.value } : m,
                ),
              })
            }
          />
          <button
            onClick={() => {
              setTime(selectedMarker.time);
            }}
          >
            انتقل للعلامة
          </button>
          <button
            onClick={() => {
              onChange({
                ...project,
                markers: project.markers?.filter((m) => m.id !== marker),
              });
              setMarker(null);
            }}
          >
            حذف العلامة
          </button>
          <button onClick={() => setMarker(null)}>إغلاق</button>
        </div>
      )}
      {keyframe && (
        <div className="timeline-detail-bar" dir="rtl">
          <b>◇ {keyframe.t.toFixed(2)}s</b>
          <StudioSelect
            label="انسيابية نقطة الحركة"
            value={keyframe.easing || "linear"}
            onValueChange={(easing) =>
              patchKeyframe({ easing: easing as MotionKeyframe["easing"] })
            }
            options={[
              { value: "linear", label: "خطية" },
              { value: "ease-in", label: "بداية هادية" },
              { value: "ease-out", label: "نهاية هادية" },
              { value: "ease-in-out", label: "ناعمة" },
            ]}
          />
          <button
            onClick={() => {
              if (!kf) return;
              onChange({
                ...project,
                clips: project.clips.map((c) =>
                  c.id !== kf.clipId
                    ? c
                    : {
                        ...c,
                        keyframes: c.keyframes?.filter((f) => f.id !== kf.id),
                      },
                ),
              });
              setKf(null);
            }}
          >
            حذف النقطة
          </button>
          <button onClick={() => setKf(null)}>إغلاق</button>
        </div>
      )}
      <div className="timeline-body" dir="ltr">
        <div className="track-labels" ref={labels}>
          <span style={{ height: rulerHeight }} />
          {[
            ["video", "الفيديو", videoHeight, true],
            ["text", "النصوص", textHeight, false],
            ["audio", "الصوت", audioHeight, true],
            ...(p.overlays || []).map((l, i) => [
              l.id,
              `طبقة ${i + 1}`,
              rowHeight(l.id, compact ? 32 : 50),
              true,
            ]),
          ].map(([id, name, h, audio]) => (
            <span key={String(id)} style={{ height: Number(h) }}>
              <TrackControls
                name={String(name)}
                settings={p.tracks?.[String(id)]}
                audio={!!audio}
                onChange={(patch) => changeTrack(String(id), patch)}
              />
            </span>
          ))}
        </div>
        <div
          className="timeline-scroll"
          ref={scroll}
          onScroll={(e) => {
            const el = e.currentTarget;
            setViewport({ left: el.scrollLeft, width: el.clientWidth, total: el.scrollWidth });
            const bucket = Math.floor(el.scrollLeft / 600);
            if (bucket !== rulerBucket) setRulerBucket(bucket);
            if (labels.current)
              labels.current.scrollTop = e.currentTarget.scrollTop;
          }}
        >
          <div
            className="tracks"
            ref={track}
            tabIndex={0}
            style={{
              width,
              minHeight:
                rulerHeight +
                videoHeight +
                textHeight +
                audioHeight +
                (p.overlays || []).reduce(
                  (n, l) => n + rowHeight(l.id, compact ? 32 : 50),
                  0,
                ),
            }}
            onPointerMove={(e) => {
              if (e.pointerId === drag.current?.pointer) moveAt(e.clientX);
            }}
            onPointerUp={(e) => finish(e)}
            onPointerCancel={(e) => finish(e, true)}
            onLostPointerCapture={() => {
              if (drag.current) cancel();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              cancel();
              const el = (e.target as HTMLElement).closest<HTMLElement>(
                "[data-timeline-id]",
              );
              const s = el
                ? {
                    kind: el.dataset.timelineKind as Item["kind"],
                    id: el.dataset.timelineId!,
                  }
                : null;
              const selection = s
                ? active.some((i) => key(i) === key(s))
                  ? active
                  : [s]
                : fallback;
              if (s) setItems(selection);
              setMenu({ x: e.clientX, y: e.clientY, items: selection });
            }}
          >
            <div
              className="ruler"
              style={{
                height: rulerHeight,
                backgroundImage: precise
                  ? "linear-gradient(to right,#b7f56822 1px,transparent 1px)"
                  : undefined,
                backgroundSize: precise ? `${zoom / 30}px 100%` : undefined,
              }}
              onPointerDown={(e) => start(e, "scrub")}
              onDoubleClick={addMarker}
            >
              {rulerTicks(width, zoom, rulerBucket, window.innerWidth).map(
                (t) => (
                  <span key={t} style={{ left: t * zoom }}>
                    {timeLabel(t)}
                  </span>
                ),
              )}
              {p.markers?.map((m) => (
                <button
                  key={m.id}
                  className="timeline-marker"
                  style={{ left: m.time * zoom, color: m.color }}
                  title={`${m.label} · ${m.time.toFixed(2)}s`}
                  aria-label={`علامة ${m.label}`}
                  onPointerDown={(e) => {
                    setMarker(m.id);
                    start(e, "marker", undefined, "move", m.id);
                  }}
                  onClick={() => setMarker(m.id)}
                >
                  <Flag size={13} />
                  <small>{m.label}</small>
                </button>
              ))}
            </div>
            <div
              className={`video-track ${p.tracks?.video?.hidden ? "track-hidden" : ""}`}
              style={{ height: videoHeight }}
            >
              {p.clips.map((c) => {
                const a = assets.find((a) => a.id === c.assetId),
                  s: Item = { kind: "clip", id: c.id };
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`مقطع ${c.gap ? "فراغ" : a?.name}`}
                    {...attributes(s)}
                    className={`timeline-clip ${isSelected(s) || (!active.length && selected === c.id) ? "selected" : ""} ${c.gap ? "timeline-gap" : ""} ${locked(p, s) ? "item-locked" : ""}`}
                    style={{
                      width: Math.max(5, clipDuration(c) * zoom),
                      height: Math.max(24, videoHeight - 12),
                    }}
                    onPointerDown={(e) => start(e, "reorder", s)}
                    onDoubleClick={() => onInspectItem?.(s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        choose(s, e.shiftKey || multiple);
                      }
                    }}
                  >
                    {(["start", "end"] as const).map((edge) => (
                      <span
                        key={edge}
                        role="slider"
                        tabIndex={0}
                        aria-label={`قص ${edge === "start" ? "بداية" : "نهاية"} ${a?.name}`}
                        aria-valuenow={c[edge]}
                        aria-valuemin={edge === "start" ? 0 : c.start + 0.1}
                        aria-valuemax={
                          edge === "start"
                            ? c.end - 0.1
                            : a?.type === "image"
                              ? 3600
                              : a?.duration || c.end
                        }
                        className={`trim-handle ${edge}`}
                        onPointerDown={(e) => start(e, "trim", s, edge)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            e.preventDefault();
                            e.stopPropagation();
                            onChange(
                              trimBase(
                                project,
                                c.id,
                                edge,
                                (e.key === "ArrowRight" ? 1 : -1) *
                                  (precise ? c.speed / 30 : 0.1),
                                a?.type === "image" || c.gap
                                  ? 3600
                                  : a?.duration || c.end,
                                ripple,
                              ),
                            );
                          }
                        }}
                      />
                    ))}
                    {!c.gap && a && (
                      <ThumbnailStrip asset={a} start={c.start} end={c.end} />
                    )}
                    {!c.gap && a?.type === "video" && videoHeight > 60 && (
                      <div className="clip-waveform">
                        <Waveform
                          url={a.url}
                          duration={a.duration}
                          offset={c.start}
                          span={c.end - c.start}
                          loop={false}
                        />
                      </div>
                    )}
                    <span className="clip-caption">
                      {c.gap ? "فراغ" : a?.name}
                      {c.groupId ? " ⛓" : ""}
                    </span>
                    <small>
                      {c.volume === 0 && <VolumeX size={10} />}{" "}
                      {clipDuration(c).toFixed(2)}s{" "}
                      {c.speed !== 1 && `· ${c.speed}×`}
                    </small>
                    {c.transition && c.transition.kind !== "none" && (
                      <span className="transition-marker">◇</span>
                    )}
                    {!c.gap && !p.tracks?.video?.collapsed && (
                      <div
                        className="clip-keyframes"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          addKeyframe(
                            c.id,
                            (e.clientX -
                              e.currentTarget.getBoundingClientRect().left) /
                              zoom,
                          );
                        }}
                      >
                        {c.keyframes
                          ?.filter((f) => f.t <= clipDuration(c))
                          .map((f) => (
                            <button
                              key={f.id}
                              className="timeline-keyframe"
                              aria-label={`نقطة حركة ${f.t.toFixed(2)}`}
                              style={{ left: f.t * zoom }}
                              title="اسحب لتعديل وقت النقطة"
                              onPointerDown={(e) => {
                                setKf({ clipId: c.id, id: f.id });
                                start(e, "keyframe", s, "move", f.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation();
                                  setKf({ clipId: c.id, id: f.id });
                                }
                              }}
                            >
                              ◆
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                className="track-add"
                onClick={onImport}
                aria-label="إضافة مقطع"
              >
                <Plus size={20} />
              </button>
            </div>
            <div
              className={`text-track ${p.tracks?.text?.hidden ? "track-hidden" : ""}`}
              style={{
                height: textHeight,
                overflow: p.tracks?.text?.collapsed ? "hidden" : undefined,
              }}
            >
              {p.texts.map((t) => {
                const s: Item = { kind: "text", id: t.id };
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`توقيت النص ${t.text}`}
                    {...attributes(s)}
                    className={`timeline-text ${isSelected(s) ? "selected" : ""} ${locked(p, s) ? "item-locked" : ""}`}
                    style={{
                      left: t.start * zoom,
                      width: Math.max(8, (t.end - t.start) * zoom),
                      top:
                        (compact ? 3 : 5) +
                        (lanes.lanes.get(t.id) || 0) * laneHeight,
                    }}
                    onDoubleClick={onText}
                    onPointerDown={(e) => start(e, "text", s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onText();
                    }}
                  >
                    <span
                      className="trim-handle start"
                      title="بداية النص"
                      onPointerDown={(e) => start(e, "text", s, "start")}
                    />
                    <Type size={13} />
                    <span>
                      {t.text}
                      {t.groupId ? " ⛓" : ""}
                    </span>
                    <span
                      className="trim-handle end"
                      title="نهاية النص"
                      onPointerDown={(e) => start(e, "text", s, "end")}
                    />
                  </div>
                );
              })}
              {!p.texts.length && (
                <button className="empty-track" onClick={onText}>
                  <Plus size={14} /> إضافة نص أو ملصق
                </button>
              )}
            </div>
            <div
              className={`audio-track ${p.tracks?.audio?.muted ? "track-hidden" : ""}`}
              style={{ height: audioHeight }}
            >
              {music ? (
                <div
                  className="audio-wave draggable-audio"
                  role="button"
                  tabIndex={0}
                  aria-label="تحريك مسار الموسيقى"
                  style={{
                    left: audioStart * zoom,
                    width: Math.max(8, audioSpan * zoom),
                    height: Math.max(24, audioHeight - 10),
                  }}
                  onPointerDown={(e) => start(e, "audio")}
                  onDoubleClick={onAudio}
                >
                  <span className="audio-track-name">
                    <Music2 size={13} />
                    {music.name}
                    {p.audioLoop !== false ? " ↻" : ""}
                  </span>
                  <Waveform
                    url={music.url}
                    duration={music.duration}
                    offset={p.audioOffset || 0}
                    span={audioSpan * (p.audioSpeed || 1)}
                    loop={p.audioLoop !== false}
                  />
                </div>
              ) : (
                <button className="empty-track" onClick={onAudio}>
                  <Plus size={14} /> إضافة موسيقى
                </button>
              )}
            </div>
            {(p.overlays || []).map((l, i) => {
              const s: Item = { kind: "overlay", id: l.id };
              return (
                <div
                  className={`overlay-timeline-track ${p.tracks?.[l.id]?.hidden ? "track-hidden" : ""}`}
                  key={l.id}
                  style={{ height: rowHeight(l.id, compact ? 32 : 50) }}
                >
                  <button
                    {...attributes(s)}
                    className={`${isSelected(s) ? "selected" : ""} ${locked(p, s) ? "item-locked" : ""}`}
                    aria-label={`عرض الطبقة ${i + 1}`}
                    title="اسحب الطبقة أو حوافها لتعديل التوقيت"
                    style={{
                      left: l.at * zoom,
                      width: Math.max(8, (l.end - l.start) * zoom),
                      height: Math.max(
                        24,
                        rowHeight(l.id, compact ? 32 : 50) - 10,
                      ),
                    }}
                    onPointerDown={(e) => start(e, "overlay", s)}
                    onDoubleClick={() => {
                      setTime(l.at);
                      if (onInspectItem) onInspectItem(s);
                      else {
                        onInspectOverlay?.();
                        document.getElementById("studio-layers")?.setAttribute("open", "");
                      }
                    }}
                  >
                    <span
                      className="trim-handle start"
                      title={`بداية الطبقة ${i + 1}`}
                      onPointerDown={(e) => start(e, "overlay", s, "start")}
                    />
                    {i + 1} · {assets.find((a) => a.id === l.assetId)?.name}
                    {l.groupId ? " ⛓" : ""}
                    <span
                      className="trim-handle end"
                      title={`نهاية الطبقة ${i + 1}`}
                      onPointerDown={(e) => start(e, "overlay", s, "end")}
                    />
                  </button>
                </div>
              );
            })}
            {guide !== null && (
              <div
                className="timeline-snap-guide"
                style={{ left: guide * zoom }}
              />
            )}
            <div
              className="playhead"
              style={{ left: time * zoom }}
              onPointerDown={(e) => start(e, "scrub")}
            >
              <i />
            </div>
          </div>
        </div>
      </div>
      <TimelineOverview project={p} duration={duration} time={time} viewport={viewport} onSeek={(t) => seek(t, true)} />
      {menu && (
        <ContextMenu
          touchOpening={menu.touch}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          actions={[
            {
              label: "تقسيم عند المؤشر",
              disabled:
                !contextClip ||
                !!contextClip.gap ||
                time < clipStart(project, contextClip?.id || "") + 0.1 ||
                time >
                  clipStart(project, contextClip?.id || "") +
                    (contextClip ? clipDuration(contextClip) : 0) -
                    0.1 ||
                locked(project, { kind: "clip", id: contextClip?.id || "" }),
              run: () => {
                onSplit();
              },
            },
            {
              label: "فتح خصائص العنصر",
              disabled: contextItems.length !== 1 || !onInspectItem,
              run: () => contextItems[0] && onInspectItem?.(contextItems[0]),
            },
            {
              label: "نسخ التحديد",
              disabled: !contextItems.length,
              run: () => copy(contextItems),
            },
            {
              label: ripple ? "حذف وإغلاق الفراغ" : "حذف مع الاحتفاظ بالفراغ",
              disabled: !contextItems.length,
              run: () => erase(contextItems),
            },
            {
              label: "ربط العناصر",
              disabled: contextItems.length < 2,
              run: () => onChange(groupItems(project, contextItems)),
            },
            {
              label: "فك الارتباط",
              disabled: !contextItems.length,
              run: () =>
                onChange(
                  groupItems(project, expand(project, contextItems), true),
                ),
            },
            {
              label: "فصل صوت المقطع",
              disabled:
                !contextClip ||
                assets.find((a) => a.id === contextClip.assetId)?.type !==
                  "video" ||
                !!project.tracks?.audio?.locked,
              run: detach,
            },
            {
              label: "تجميد إطار لمدة ثانيتين",
              disabled:
                !contextClip ||
                !!contextClip.gap ||
                !onFreeze ||
                locked(project, { kind: "clip", id: contextClip?.id || "" }),
              run: () => contextClip && onFreeze?.(contextClip.id),
            },
            ...[0.5, 1, 2].map((speed) => ({
              label: `سرعة ${speed}×`,
              disabled:
                !contextClip ||
                !!contextClip.gap ||
                !!contextClip.locked ||
                !!project.tracks?.video?.locked,
              run: () =>
                contextClip &&
                onChange(
                  patchObject(
                    project,
                    { kind: "clip", id: contextClip.id },
                    { speed },
                  ),
                ),
            })),
            { label: "إضافة علامة عند المؤشر", run: addMarker },
          ]}
        />
      )}
    </section>
  );
}
