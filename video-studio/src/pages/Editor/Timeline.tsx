import { rulerTicks } from "./timeline/ruler";
import { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react";
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
  playing?: boolean;
  clockRef?: React.MutableRefObject<number>;
  compact?: boolean;
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
};
export function Timeline({
  playing = false,
  clockRef,
  compact = false,
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
}: Props) {
  const [mobileOptions, setMobileOptions] = useState(false);
  const [rulerBucket, setRulerBucket] = useState(0);
  const [zoom, setZoom] = useState(55),
    [snap, setSnap] = useState(true),
    [ripple, setRipple] = useState(true),
    [height, setHeight] = useState(300),
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
  const head = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing || !clockRef) return;
    let raf: number;
    const paint = () => {
      if (head.current)
        head.current.style.transform = `translateX(${clockRef.current * zoom}px)`;
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [playing, clockRef, zoom]);
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
    lanes = useMemo(() => textLanes(p.texts), [p.texts]);
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
  const rulerHeight = compact ? 30 : 48,
    laneHeight = compact ? 24 : 34;
  const rowHeight = (id: string, normal: number) =>
    p.tracks?.[id]?.collapsed
      ? compact
        ? 24
        : 32
      : p.tracks?.[id]?.height
        ? compact
          ? clamp(p.tracks[id].height! * 0.7, 32, 98)
          : p.tracks[id].height!
        : normal;
  const videoHeight = rowHeight("video", compact ? 60 : 88),
    textHeight = rowHeight(
      "text",
      Math.max(compact ? 28 : 44, lanes.count * laneHeight + (compact ? 4 : 8)),
    ),
    audioHeight = rowHeight("audio", compact ? 34 : 54),
    sfxHeight = rowHeight("sfx", compact ? 34 : 48);
  const previousCueCount = useRef(p.sounds?.length || 0);
  useLayoutEffect(() => {
    const count = p.sounds?.length || 0,
      el = scroll.current;
    if (count > previousCueCount.current && el) {
      const bottom =
        rulerHeight + videoHeight + textHeight + audioHeight + sfxHeight;
      if (bottom > el.scrollTop + el.clientHeight)
        el.scrollTop = bottom - el.clientHeight;
      const x = p.sounds![count - 1].at * zoom;
      if (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth - 30)
        el.scrollLeft = Math.max(0, x - 80);
    }
    previousCueCount.current = count;
  }, [
    p.sounds?.length,
    rulerHeight,
    videoHeight,
    textHeight,
    audioHeight,
    sfxHeight,
    zoom,
  ]);
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
    const el = scroll.current,
      clip = project.clips.find((c) => c.id === selected);
    if (!el?.clientWidth || !clip || drag.current) return;
    const left = clipStart(project, clip.id) * zoom,
      right = left + clipDuration(clip) * zoom;
    if (right < el.scrollLeft || left > el.scrollLeft + el.clientWidth - 30)
      el.scrollLeft = Math.max(0, left - 32);
  }, [selected, project.clips.length]);
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
    const points = boundaries(project);
    setTime(
      (dir < 0
        ? [...points].reverse().find((t) => t < time - 0.02)
        : points.find((t) => t > time + 0.02)) ?? (dir < 0 ? 0 : duration),
    );
  }
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
      className={`timeline timeline-enhanced timeline-pro ${compact ? "is-compact" : ""} ${mobileOptions ? "show-options" : ""}`}
      style={{ height }}
      onKeyDown={(e) => {
        if (
          (e.target as HTMLElement).closest(
            "input,textarea,[role=combobox],[role=dialog],dialog",
          )
        )
          return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancel();
          setMenu(null);
          setItems([]);
        }
        if ((e.key === "Delete" || e.key === "Backspace") && active.length) {
          e.preventDefault();
          e.stopPropagation();
          erase();
        }
        if (
          (e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === "d" &&
          active.length
        ) {
          e.preventDefault();
          e.stopPropagation();
          copy();
        }
      }}
    >
      <div
        className="timeline-resize"
        title="اسحب لتغيير ارتفاع الخط الزمني"
        onPointerDown={(e) => {
          const el = e.currentTarget,
            y = e.clientY,
            h = height;
          el.setPointerCapture(e.pointerId);
          const move = (ev: PointerEvent) =>
            setHeight(
              clamp(h + y - ev.clientY, 210, Math.min(540, innerHeight * 0.65)),
            );
          const up = () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerup", up);
            el.removeEventListener("pointercancel", up);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerup", up);
          el.addEventListener("pointercancel", up);
        }}
      >
        <i />
      </div>
      <div className="timeline-toolbar">
        <button
          className="timeline-options-toggle"
          aria-label="خيارات التايم لاين"
          aria-expanded={mobileOptions}
          onClick={() => setMobileOptions((v) => !v)}
        >
          <MoreHorizontal size={18} />
        </button>
        <div>
          <IconButton
            icon={Scissors}
            label="تقسيم عند المؤشر"
            onClick={onSplit}
          />
          <IconButton
            icon={PanelLeftClose}
            label="حذف ما قبل المؤشر من المقطع"
            onClick={() => trimCursor("start")}
          />
          <IconButton
            icon={PanelRightClose}
            label="حذف ما بعد المؤشر من المقطع"
            onClick={() => trimCursor("end")}
          />
          <IconButton
            icon={Copy}
            label="نسخ المقطع"
            disabled={
              !fallback.length || fallback.every((s) => locked(project, s))
            }
            onClick={() => copy()}
          />
          <IconButton
            icon={Trash2}
            label="حذف المقطع"
            disabled={
              !fallback.length || fallback.every((s) => locked(project, s))
            }
            onClick={() => erase()}
          />
          <IconButton
            icon={selectedClip?.volume === 0 ? VolumeX : Volume2}
            label="كتم / استعادة صوت المقطع"
            disabled={
              !selectedClip ||
              !!selectedClip.locked ||
              !!project.tracks?.video?.locked
            }
            onClick={() =>
              selectedClip &&
              onChange(
                patchObject(
                  project,
                  { kind: "clip", id: selectedClip.id },
                  { volume: selectedClip.volume ? 0 : 1 },
                ),
              )
            }
          />
          <button
            aria-label="الجذب المغناطيسي"
            aria-pressed={snap}
            onClick={() => setSnap(!snap)}
          >
            <Magnet size={16} /> جذب
          </button>
          <button
            aria-label="القص المتتابع Ripple"
            aria-pressed={ripple}
            onClick={() => setRipple(!ripple)}
          >
            Ripple {ripple ? "✓" : "—"}
          </button>
          <button
            aria-label="تحديد متعدد"
            aria-pressed={multiple}
            onClick={() => setMultiple(!multiple)}
          >
            <MousePointer2 size={15} /> تحديد {active.length || ""}
          </button>
          <IconButton
            icon={Link}
            label="تجميع وربط التحديد"
            disabled={
              active.length < 2 || active.some((s) => locked(project, s))
            }
            onClick={() => onChange(groupItems(project, active))}
          />
          <IconButton
            icon={Unlink}
            label="فك ارتباط التحديد"
            disabled={!active.length}
            onClick={() =>
              onChange(groupItems(project, expand(project, active), true))
            }
          />
          <button
            onClick={() => onChange(closeGaps(project))}
            disabled={!project.clips.some((c) => c.gap)}
          >
            حذف الفراغات
          </button>
          <IconButton
            icon={Flag}
            label="إضافة علامة عند المؤشر"
            onClick={addMarker}
          />
          <button
            disabled={!selectedClip}
            onClick={() =>
              selectedClip &&
              addKeyframe(
                selectedClip.id,
                time - clipStart(project, selectedClip.id),
              )
            }
          >
            ◇ Keyframe
          </button>
        </div>
        <div>
          <IconButton
            icon={ScanLine}
            label="ملاءمة المشروع للعرض"
            onClick={() => {
              cancel();
              setZoom(
                clamp(
                  ((scroll.current?.clientWidth || 700) - 45) /
                    Math.max(duration, 0.5),
                  5,
                  720,
                ),
              );
            }}
          />
          <IconButton
            icon={Focus}
            label="تكبير عند المؤشر"
            onClick={() => {
              anchor.current = {
                time,
                offset: (scroll.current?.clientWidth || 700) / 2,
              };
              setZoom(240);
            }}
          />
          <button
            aria-label="وضع القص الدقيق"
            aria-pressed={precise}
            onClick={() => {
              setPrecise(!precise);
              if (!precise) {
                anchor.current = {
                  time,
                  offset: (scroll.current?.clientWidth || 700) / 2,
                };
                setZoom(720);
              }
            }}
          >
            قص دقيق
          </button>
          <IconButton
            icon={ZoomOut}
            label="تصغير الخط الزمني"
            onClick={() => zoomAt(zoom / 1.3)}
          />
          <input
            aria-label="تكبير الخط الزمني"
            type="range"
            min="5"
            max="720"
            value={zoom}
            onChange={(e) => zoomAt(+e.target.value)}
          />
          <IconButton
            icon={ZoomIn}
            label="تكبير الخط الزمني"
            onClick={() => zoomAt(zoom * 1.3)}
          />
        </div>
      </div>
      <div className="timeline-meta">
        <span>
          {precise
            ? `فريم ${Math.round(time * 30)} · شبكة 30 FPS`
            : "اسحب الحواف للقص • Shift أو وضع التحديد لاختيار مجموعة • ضغطة مطولة للإجراءات"}
        </span>
        <div dir="ltr">
          <IconButton
            icon={ChevronLeft}
            label="حد المقطع السابق"
            onClick={() => jump(-1)}
          />
          <label>
            الثانية{" "}
            <input
              aria-label="الانتقال إلى ثانية"
              type="number"
              min="0"
              max={duration}
              step={1 / 30}
              value={Number(time.toFixed(3))}
              onChange={(e) => setTime(clamp(+e.target.value, 0, duration))}
            />
          </label>
          <IconButton
            icon={ChevronRight}
            label="حد المقطع التالي"
            onClick={() => jump(1)}
          />
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
            ...(p.sounds?.length ? [["sfx", "المؤثرات", sfxHeight, true]] : []),
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
            const bucket = Math.floor(e.currentTarget.scrollLeft / 600);
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
                (p.sounds?.length ? sfxHeight : 0) +
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
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
                    aria-label={`توقيت النص ${t.name || t.text}`}
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
                      {t.name || t.text}
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
            {!!p.sounds?.length && (
              <div className="sfx-timeline-track" style={{ height: sfxHeight }}>
                {p.sounds.map((c) => (
                  <button
                    key={c.id}
                    className="sfx-timeline-cue"
                    title={assets.find((a) => a.id === c.assetId)?.name}
                    style={{
                      left: c.at * zoom,
                      width: Math.max(12, (c.end - c.start) * zoom),
                      height: Math.max(16, sfxHeight - 10),
                      opacity: p.tracks?.sfx?.muted ? 0.4 : 1,
                    }}
                    onClick={() => setTime(c.at)}
                    onDoubleClick={onAudio}
                  >
                    ♫ {assets.find((a) => a.id === c.assetId)?.name}
                  </button>
                ))}
              </div>
            )}
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
                      onInspectOverlay?.();
                      setTime(l.at);
                      document
                        .getElementById("studio-layers")
                        ?.setAttribute("open", "");
                      document
                        .getElementById("studio-inspector")
                        ?.querySelector<HTMLButtonElement>(
                          'button[aria-expanded="false"]',
                        )
                        ?.click();
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
              ref={head}
              className="playhead"
              style={{
                left: playing ? 0 : time * zoom,
                transform: playing ? undefined : "none",
              }}
              onPointerDown={(e) => start(e, "scrub")}
            >
              <i />
            </div>
          </div>
        </div>
      </div>
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
