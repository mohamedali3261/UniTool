import { useRef, useState, useEffect } from "react";
import {
  Plus,
  Scissors,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Film,
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
} from "lucide-react";
import {
  Asset,
  Project,
  clipDuration,
  durationOf,
  timeLabel,
} from "../../types";
import {
  boundaries,
  clamp,
  clipStart,
  reorderClips,
  snapTime,
  textLanes,
  trimClip,
} from "../../lib/timeline";
import { IconButton } from "../../components/IconButton";
import { Waveform } from "./Waveform";
import type { PointerEvent as ReactPointerEvent } from "react";
type Drag =
  | { mode: "scrub" }
  | { mode: "trim"; id: string; edge: "start" | "end"; x: number; p: Project }
  | { mode: "reorder"; id: string; x: number; p: Project }
  | {
      mode: "text";
      id: string;
      edge: "move" | "start" | "end";
      x: number;
      p: Project;
    }
  | { mode: "audio"; x: number; p: Project };
type Props = {
  project: Project;
  assets: Asset[];
  time: number;
  setTime: (t: number) => void;
  selected: string | null;
  select: (s: string) => void;
  onImport: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onText: () => void;
  onAudio: () => void;
  onTrimStart: () => void;
  onTrimEnd: () => void;
  onChange: (p: Project) => void;
};
export function Timeline({
  project,
  assets,
  time,
  setTime,
  selected,
  select,
  onImport,
  onSplit,
  onDelete,
  onDuplicate,
  onText,
  onAudio,
  onChange,
  onTrimStart,
  onTrimEnd,
}: Props) {
  const [zoom, setZoom] = useState(55);
  const [snap, setSnap] = useState(true);
  const [height, setHeight] = useState(300);
  const [draft, setDraft] = useState<Project | null>(null);
  const draftRef = useRef<Project | null>(null);
  const drag = useRef<Drag | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => clamp(z * (e.deltaY > 0 ? 0.9 : 1.1), 5, 240));
      }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  const p = draft || project;
  const duration = durationOf(p);
  const width = Math.max(560, (duration + 2) * zoom);
  const lanes = textLanes(p.texts);
  const textHeight = Math.max(40, lanes.count * 31 + 8);
  const music = assets.find((a) => a.id === p.audioId);
  const audioStart = p.audioStart || 0;
  const audioWidth = music
    ? Math.max(
        0,
        Math.min(
          duration - audioStart,
          p.audioLoop === false
            ? music.duration - (p.audioOffset || 0)
            : duration - audioStart,
        ),
      ) * zoom
    : 0;
  function show(next: Project) {
    draftRef.current = next;
    setDraft(next);
  }
  function start(e: ReactPointerEvent, d: Drag) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current = d;
    draftRef.current = null;
    track.current?.setPointerCapture(e.pointerId);
    if (d.mode === "reorder") setMoving(d.id);
    if (d.mode === "scrub") move(e);
  }
  function move(e: ReactPointerEvent) {
    const d = drag.current;
    if (!d || !track.current) return;
    const rect = track.current.getBoundingClientRect();
    const raw = (e.clientX - rect.left) / zoom;
    const points = [
      ...boundaries(project),
      time,
      ...project.texts.flatMap((t) => [t.start, t.end]),
    ];
    const snapTo = (n: number) => (snap ? snapTime(n, points, 8 / zoom) : n);
    if (d.mode === "scrub") {
      setTime(clamp(snapTo(raw), 0, durationOf(project)));
      return;
    }
    const dx = (e.clientX - d.x) / zoom;
    if (d.mode === "trim") {
      const c = d.p.clips.find((c) => c.id === d.id)!;
      const a = assets.find((a) => a.id === c.assetId);
      const base = clipStart(d.p, c.id);
      let delta = (snapTo(base + dx) - base) * c.speed;
      if (d.edge === "end")
        delta =
          (snapTo(base + clipDuration(c) + dx) - base - clipDuration(c)) *
          c.speed;
      const next = trimClip(
        c,
        d.edge,
        delta,
        a?.type === "image" ? 3600 : a?.duration || c.end,
      );
      show({ ...d.p, clips: d.p.clips.map((c) => (c.id === d.id ? next : c)) });
    }
    if (d.mode === "reorder" && Math.abs(e.clientX - d.x) > 5) {
      let before: string | null = null;
      let pos = 0;
      for (const c of d.p.clips) {
        const end = pos + clipDuration(c);
        if (raw < (pos + end) / 2) {
          before = c.id;
          break;
        }
        pos = end;
      }
      show({ ...d.p, clips: reorderClips(d.p.clips, d.id, before) });
    }
    if (d.mode === "text") {
      const t = d.p.texts.find((t) => t.id === d.id)!;
      const total = durationOf(d.p);
      const endLimit = Math.max(total, t.end);
      let start = t.start,
        end = t.end;
      if (d.edge === "move") {
        start = clamp(
          snapTo(t.start + dx),
          0,
          Math.max(0, endLimit - (t.end - t.start)),
        );
        end = start + t.end - t.start;
      } else if (d.edge === "start")
        start = clamp(snapTo(t.start + dx), 0, t.end - 0.1);
      else
        end = clamp(
          snapTo(t.end + dx),
          t.start + 0.1,
          Math.max(t.start + 0.1, endLimit),
        );
      show({
        ...d.p,
        texts: d.p.texts.map((layer) =>
          layer.id === t.id ? { ...t, start, end } : layer,
        ),
      });
    }
    if (d.mode === "audio")
      show({
        ...d.p,
        audioStart: clamp(
          snapTo((d.p.audioStart || 0) + dx),
          0,
          Math.max(0, durationOf(d.p) - 0.1),
        ),
      });
    const view = scroll.current?.getBoundingClientRect();
    if (view) {
      if (e.clientX > view.right - 24) scroll.current?.scrollBy({ left: 12 });
      else if (e.clientX < view.left + 24)
        scroll.current?.scrollBy({ left: -12 });
    }
  }
  function finish(e: ReactPointerEvent, cancel = false) {
    if (!drag.current) return;
    if (!cancel && draftRef.current) onChange(draftRef.current);
    drag.current = null;
    draftRef.current = null;
    setDraft(null);
    setMoving(null);
    if (track.current?.hasPointerCapture(e.pointerId))
      track.current.releasePointerCapture(e.pointerId);
  }
  const selectedClip = project.clips.find((c) => c.id === selected);
  const boundary = boundaries(project);
  const tickStep = zoom < 25 ? 5 : zoom < 55 ? 2 : 1;
  function jump(dir: number) {
    const t =
      dir < 0
        ? [...boundary].reverse().find((t) => t < time - 0.02)
        : boundary.find((t) => t > time + 0.02);
    setTime(t ?? (dir < 0 ? 0 : duration));
  }
  return (
    <section className="timeline timeline-enhanced" style={{ height }}>
      <div
        className="timeline-resize"
        title="اسحب لتغيير ارتفاع الخط الزمني"
        onPointerDown={(e) => {
          const el = e.currentTarget;
          const y = e.clientY;
          const h = height;
          el.setPointerCapture(e.pointerId);
          const move = (ev: PointerEvent) =>
            setHeight(
              clamp(
                h + y - ev.clientY,
                210,
                Math.min(500, window.innerHeight * 0.6),
              ),
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
        <div>
          <IconButton
            icon={Scissors}
            label="تقسيم عند المؤشر"
            onClick={onSplit}
          />
          <IconButton
            icon={PanelLeftClose}
            label="حذف ما قبل المؤشر من المقطع"
            onClick={onTrimStart}
          />
          <IconButton
            icon={PanelRightClose}
            label="حذف ما بعد المؤشر من المقطع"
            onClick={onTrimEnd}
          />
          <IconButton
            icon={Copy}
            label="نسخ المقطع"
            disabled={!selectedClip}
            onClick={onDuplicate}
          />
          <IconButton
            icon={Trash2}
            label="حذف المقطع"
            disabled={!selectedClip}
            onClick={onDelete}
          />
          <IconButton
            icon={selectedClip?.volume === 0 ? VolumeX : Volume2}
            label="كتم / استعادة صوت المقطع"
            disabled={!selectedClip}
            onClick={() =>
              onChange({
                ...project,
                clips: project.clips.map((c) =>
                  c.id === selected ? { ...c, volume: c.volume ? 0 : 1 } : c,
                ),
              })
            }
          />
          <span className="toolbar-divider" />
          <button
            className={`snap-toggle ${snap ? "active" : ""}`}
            aria-label="الجذب المغناطيسي"
            aria-pressed={snap}
            onClick={() => setSnap((s) => !s)}
            title="جذب المؤشر والحواف لحدود المقاطع"
          >
            <Magnet size={16} />
            <span>جذب</span>
          </button>
          <span className="timeline-hint">
            {project.clips.length} مقاطع · قص متتابع
          </span>
        </div>
        <div>
          <IconButton
            icon={ScanLine}
            label="ملاءمة المشروع للعرض"
            onClick={() =>
              setZoom(
                clamp(
                  ((scroll.current?.clientWidth || 700) - 45) /
                    Math.max(duration, 0.5),
                  5,
                  240,
                ),
              )
            }
          />
          <IconButton
            icon={ZoomOut}
            label="تصغير الخط الزمني"
            onClick={() => setZoom((z) => Math.max(5, z / 1.3))}
          />
          <input
            aria-label="تكبير الخط الزمني"
            type="range"
            min="5"
            max="240"
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
          />
          <IconButton
            icon={ZoomIn}
            label="تكبير الخط الزمني"
            onClick={() => setZoom((z) => Math.min(240, z * 1.3))}
          />
        </div>
      </div>
      <div className="timeline-meta">
        <span>
          اسحب وسط المقطع للترتيب • اسحب الحواف للقص • النصوص والصوت قابلين
          للتحريك
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
      <div className="timeline-body" dir="ltr">
        <div className="track-labels" ref={labels}>
          <span />
          <span>
            <Film size={16} /> الفيديو
          </span>
          <span style={{ height: textHeight }}>
            <Type size={16} /> النصوص
          </span>
          <span>
            <Music2 size={16} /> الصوت
          </span>
          {(p.overlays || []).map((l, i) => (
            <span key={l.id} style={{ height: 44 }}>
              طبقة {i + 1}
            </span>
          ))}
        </div>
        <div
          className="timeline-scroll"
          ref={scroll}
          onScroll={(e) => {
            if (labels.current)
              labels.current.scrollTop = e.currentTarget.scrollTop;
          }}
        >
          <div
            className="tracks"
            ref={track}
            style={{
              width,
              minHeight: 145 + textHeight + (p.overlays?.length || 0) * 44,
            }}
            onPointerMove={move}
            onPointerUp={(e) => finish(e)}
            onPointerCancel={(e) => finish(e, true)}
          >
            <div
              className="ruler"
              onPointerDown={(e) => start(e, { mode: "scrub" })}
            >
              {Array.from(
                { length: Math.ceil(width / zoom / tickStep) + 1 },
                (_, i) => (
                  <span key={i} style={{ left: i * tickStep * zoom }}>
                    {timeLabel(i * tickStep)}
                  </span>
                ),
              )}
            </div>
            <div className="video-track">
              {p.clips.map((c) => {
                const a = assets.find((a) => a.id === c.assetId);
                return (
                  <div
                    role="button"
                    aria-label={`مقطع ${a?.name}`}
                    tabIndex={0}
                    key={c.id}
                    className={`timeline-clip ${selected === c.id ? "selected" : ""} ${moving === c.id ? "moving" : ""}`}
                    style={{ width: Math.max(5, clipDuration(c) * zoom) }}
                    onPointerDown={(e) => {
                      select(c.id);
                      start(e, {
                        mode: "reorder",
                        id: c.id,
                        x: e.clientX,
                        p: project,
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") select(c.id);
                    }}
                  >
                    <span
                      role="slider"
                      tabIndex={0}
                      aria-label={`قص بداية ${a?.name}`}
                      aria-valuenow={c.start}
                      aria-valuemin={0}
                      aria-valuemax={c.end - 0.1}
                      className="trim-handle start"
                      onPointerDown={(e) => {
                        select(c.id);
                        start(e, {
                          mode: "trim",
                          id: c.id,
                          edge: "start",
                          x: e.clientX,
                          p: project,
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                          e.preventDefault();
                          const next = trimClip(
                            c,
                            "start",
                            (e.key === "ArrowRight" ? 1 : -1) * 0.1,
                            a?.duration || c.end,
                          );
                          onChange({
                            ...project,
                            clips: project.clips.map((x) =>
                              x.id === c.id ? next : x,
                            ),
                          });
                        }
                      }}
                    />
                    {a?.type === "image" ? (
                      <img src={a.url} alt="" draggable={false} />
                    ) : (
                      <Film size={21} />
                    )}
                    {c.transition && c.transition.kind !== "none" && (
                      <span
                        className="transition-marker"
                        title={`${c.transition.kind} ${c.transition.duration}s`}
                      >
                        ◇
                      </span>
                    )}
                    <span className="clip-caption">{a?.name}</span>
                    <small>
                      {c.volume === 0 && <VolumeX size={10} />}{" "}
                      {clipDuration(c).toFixed(2)}s{" "}
                      {c.speed !== 1 && `· ${c.speed}×`}
                    </small>
                    <span
                      role="slider"
                      tabIndex={0}
                      aria-label={`قص نهاية ${a?.name}`}
                      aria-valuenow={c.end}
                      aria-valuemin={c.start + 0.1}
                      aria-valuemax={
                        a?.type === "image" ? 3600 : a?.duration || c.end
                      }
                      className="trim-handle end"
                      onPointerDown={(e) => {
                        select(c.id);
                        start(e, {
                          mode: "trim",
                          id: c.id,
                          edge: "end",
                          x: e.clientX,
                          p: project,
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                          e.preventDefault();
                          const next = trimClip(
                            c,
                            "end",
                            (e.key === "ArrowRight" ? 1 : -1) * 0.1,
                            a?.type === "image" ? 3600 : a?.duration || c.end,
                          );
                          onChange({
                            ...project,
                            clips: project.clips.map((x) =>
                              x.id === c.id ? next : x,
                            ),
                          });
                        }
                      }}
                    />
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
            <div className="text-track" style={{ height: textHeight }}>
              {p.texts.map((t) => (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`توقيت النص ${t.text}`}
                  key={t.id}
                  className="timeline-text"
                  style={{
                    left: t.start * zoom,
                    width: Math.max(8, (t.end - t.start) * zoom),
                    top: 5 + (lanes.lanes.get(t.id) || 0) * 31,
                  }}
                  onDoubleClick={onText}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onText();
                  }}
                  onPointerDown={(e) =>
                    start(e, {
                      mode: "text",
                      id: t.id,
                      edge: "move",
                      x: e.clientX,
                      p: project,
                    })
                  }
                >
                  <span
                    className="trim-handle start"
                    title="بداية النص"
                    onPointerDown={(e) =>
                      start(e, {
                        mode: "text",
                        id: t.id,
                        edge: "start",
                        x: e.clientX,
                        p: project,
                      })
                    }
                  />
                  <Type size={13} />
                  <span>{t.text}</span>
                  <span
                    className="trim-handle end"
                    title="نهاية النص"
                    onPointerDown={(e) =>
                      start(e, {
                        mode: "text",
                        id: t.id,
                        edge: "end",
                        x: e.clientX,
                        p: project,
                      })
                    }
                  />
                </div>
              ))}
              {!p.texts.length && (
                <button className="empty-track" onClick={onText}>
                  <Plus size={14} /> إضافة نص أو ملصق
                </button>
              )}
            </div>
            <div className="audio-track">
              {music ? (
                <div
                  className="audio-wave draggable-audio"
                  role="button"
                  tabIndex={0}
                  aria-label="تحريك مسار الموسيقى"
                  style={{
                    left: audioStart * zoom,
                    width: Math.max(8, audioWidth),
                  }}
                  onPointerDown={(e) =>
                    start(e, { mode: "audio", x: e.clientX, p: project })
                  }
                  onDoubleClick={onAudio}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onAudio();
                  }}
                >
                  <span className="audio-track-name">
                    <Music2 size={13} />
                    {music.name} {p.audioLoop !== false ? "↻" : ""}
                  </span>
                  <Waveform
                    url={music.url}
                    duration={music.duration}
                    offset={p.audioOffset || 0}
                    span={audioWidth / zoom}
                    loop={p.audioLoop !== false}
                  />
                </div>
              ) : (
                <button className="empty-track" onClick={onAudio}>
                  <Plus size={14} /> إضافة موسيقى
                </button>
              )}
            </div>
            {(p.overlays || []).map((layer, i) => (
              <div className="overlay-timeline-track" key={layer.id}>
                <button
                  aria-label={`عرض الطبقة ${i + 1}`}
                  title="تعديل الموضع والمدة من طبقات إضافية في الخصائص"
                  style={{
                    left: layer.at * zoom,
                    width: Math.max(44, (layer.end - layer.start) * zoom),
                  }}
                  onClick={() => {
                    setTime(layer.at);
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
                  {i + 1} · {assets.find((a) => a.id === layer.assetId)?.name}
                </button>
              </div>
            ))}
            <div
              className="playhead"
              style={{ left: time * zoom }}
              onPointerDown={(e) => start(e, { mode: "scrub" })}
            >
              <i />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
