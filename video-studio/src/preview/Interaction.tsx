import {
  Move,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RotateCw,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Copy,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { StudioSelect } from "../components/StudioSelect";
import type { Project, TextLayer } from "../types";
import {
  boxesAt,
  deleteObject,
  duplicateObject,
  hitBox,
  moveObject,
  patchObject,
  rotation,
  scaleObject,
  selectedObject,
  selectionKey,
  type Selection,
  type Box,
  type Dimensions,
} from "./model";
type Props = {
  project: Project;
  displayProject: Project;
  toolbarHost: HTMLElement | null;
  time: number;
  playing: boolean;
  canvas: HTMLCanvasElement | null;
  dimensions: Dimensions;
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
  onChange: (p: Project) => void;
  onDraft: (p: Project | null) => void;
  onPause: () => void;
  onTextPanel: () => void;
  inlineRequest?: { id: string; nonce: number };
};
type Gesture = {
  pointer: number;
  mode: string;
  project: Project;
  selection: Selection;
  box: Box;
  x: number;
  y: number;
  distance: number;
  angle: number;
  draft: Project;
  moved: boolean;
};
export function Interaction(props: Props) {
  const {
    project,
    time,
    playing,
    canvas,
    dimensions,
    selection,
    onSelect,
    onChange,
    onDraft,
    onPause,
    onTextPanel,
    inlineRequest,
  } = props;
  const root = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null);
  const [rect, setRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [editing, setEditing] = useState(true),
    [guides, setGuides] = useState({ x: false, y: false });
  const [inline, setInline] = useState<{ id: string; value: string } | null>(
    null,
  );
  const field = useRef<HTMLTextAreaElement>(null);
  const ctx = canvas?.getContext("2d");
  const boxes = ctx ? boxesAt(props.displayProject, time, ctx, dimensions) : [];
  const box = boxes.find(
    (b) => selection && b.id === selection.id && b.kind === selection.kind,
  );
  const object = selectedObject(project, selection);
  const selectedTrack =
    selection?.kind === "clip"
      ? "video"
      : selection?.kind === "text"
        ? "text"
        : selection?.id || "";
  const [rw, rh] = project.ratio.split(":").map(Number),
    w = 960,
    h = (960 * rh) / rw;
  const cancel = () => {
    const active = gesture.current;
    gesture.current = null;
    if (active && root.current?.hasPointerCapture(active.pointer))
      root.current.releasePointerCapture(active.pointer);
    onDraft(null);
    setGuides({ x: false, y: false });
  };
  useEffect(() => {
    if (!canvas) return;
    const measure = () => {
      const c = canvas.getBoundingClientRect(),
        p = canvas.parentElement!.getBoundingClientRect();
      setRect({
        left: c.left - p.left,
        top: c.top - p.top,
        width: c.width,
        height: c.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, [canvas]);
  useEffect(() => {
    if (gesture.current && gesture.current.project !== project) cancel();
    // Keep inline typing transient, but rebase it on external style/timing edits.
    if (inline) {
      const t = project.texts.find((t) => t.id === inline.id);
      if (!t || t.locked || t.hidden || project.tracks?.text?.locked) {
        setInline(null);
        onDraft(null);
      } else
        onDraft(
          patchObject(
            project,
            { kind: "text", id: inline.id },
            { text: inline.value },
          ),
        );
    }
  }, [project]);
  useEffect(() => {
    if (playing) {
      cancel();
      setInline(null);
    }
  }, [playing]);
  useEffect(() => {
    const resize = () => cancel();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      onDraft(null);
    };
  }, []);
  useEffect(() => {
    if (inlineRequest) {
      const t = project.texts.find((t) => t.id === inlineRequest.id);
      if (t && !t.locked && !t.hidden) {
        onPause();
        setEditing(true);
        setInline({ id: t.id, value: t.text });
      }
    }
  }, [inlineRequest]);
  useEffect(() => {
    if (inline) field.current?.focus();
  }, [inline?.id]);
  const commitInline = () => {
    if (!inline) return;
    const t = project.texts.find((t) => t.id === inline.id);
    if (t && t.text !== inline.value)
      onChange(
        patchObject(
          project,
          { kind: "text", id: inline.id },
          { text: inline.value.slice(0, 5000) },
        ),
      );
    setInline(null);
    onDraft(null);
  };
  const point = (e: { clientX: number; clientY: number }) => {
    const r = root.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * w,
      y: ((e.clientY - r.top) / r.height) * h,
    };
  };
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!editing || playing || e.button !== 0 || gesture.current) return;
    if (inline) {
      commitInline();
      return;
    }
    e.preventDefault();
    onPause();
    root.current?.focus({ preventScroll: true });
    const p = point(e);
    const mode =
      (e.target as HTMLElement).closest<HTMLElement>("[data-transform]")
        ?.dataset.transform || "move";
    const hit =
      mode === "move"
        ? [...boxes]
            .reverse()
            .find(
              (b) =>
                !b.hidden &&
                !b.locked &&
                hitBox(b, p.x, p.y, (6 * w) / Math.max(1, rect.width)),
            )
        : box;
    if (!hit) {
      onSelect(null);
      return;
    }
    onSelect({ kind: hit.kind, id: hit.id });
    if (hit.locked) return;
    gesture.current = {
      pointer: e.pointerId,
      mode,
      project,
      selection: { kind: hit.kind, id: hit.id },
      box: hit,
      x: p.x,
      y: p.y,
      distance: Math.max(1, Math.hypot(p.x - hit.cx, p.y - hit.cy)),
      angle: Math.atan2(p.y - hit.cy, p.x - hit.cx),
      draft: project,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    const p = point(e);
    let next = g.project;
    if (g.mode === "move") {
      let dx = p.x - g.x,
        dy = p.y - g.y;
      const sx =
          Math.abs(g.box.cx + dx - w / 2) < (6 * w) / Math.max(1, rect.width),
        sy =
          Math.abs(g.box.cy + dy - h / 2) < (6 * h) / Math.max(1, rect.height);
      if (sx) dx = w / 2 - g.box.cx;
      if (sy) dy = h / 2 - g.box.cy;
      setGuides({ x: sx, y: sy });
      next = moveObject(g.project, g.selection, dx, dy);
    } else if (g.mode === "rotate") {
      let angle =
        g.box.angle +
        ((Math.atan2(p.y - g.box.cy, p.x - g.box.cx) - g.angle) * 180) /
          Math.PI;
      if (e.shiftKey) angle = Math.round(angle / 15) * 15;
      const original = selectedObject(g.project, g.selection)!;
      next = patchObject(g.project, g.selection, {
        rotation: rotation((original.rotation || 0) + angle - g.box.angle),
      });
    } else
      next = scaleObject(
        g.project,
        g.selection,
        Math.hypot(p.x - g.box.cx, p.y - g.box.cy) / g.distance,
      );
    if (
      Math.hypot(p.x - g.x, p.y - g.y) < (2 * w) / Math.max(1, rect.width) &&
      !g.moved
    )
      return;
    g.moved = true;
    g.draft = next;
    onDraft(next);
  };
  const finish = (e: ReactPointerEvent<HTMLDivElement>, aborted = false) => {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    gesture.current = null;
    onDraft(null);
    setGuides({ x: false, y: false });
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (!aborted && g.moved) onChange(g.draft);
  };
  const patch = (value: Record<string, unknown>) => {
    if (selection) onChange(patchObject(project, selection, value));
  };
  const duplicate = () => {
    if (!selection) return;
    const result = duplicateObject(project, selection);
    if (result) {
      onChange(result.project);
      onSelect(result.selection);
    }
  };
  const remove = () => {
    if (selection && !object?.locked) {
      onChange(deleteObject(project, selection));
      onSelect(null);
    }
  };
  const align = (axis: "x" | "y") => {
    if (!box || !selection || object?.locked) return;
    onChange(
      moveObject(
        project,
        selection,
        axis === "x" ? w / 2 - box.cx : 0,
        axis === "y" ? h / 2 - box.cy : 0,
      ),
    );
  };
  const editText = () => {
    if (selection?.kind === "text" && !object?.locked) {
      const t = object as TextLayer;
      setInline({ id: t.id, value: t.text });
    }
  };
  const disabled = !object || !!object.locked || playing || !!inline;
  return (
    <>
      {props.toolbarHost &&
        createPortal(
          <>
            <div
              className="preview-edit-toolbar"
              aria-label="أدوات التعديل داخل المعاينة"
            >
              <button
                aria-pressed={editing}
                onClick={() => {
                  onPause();
                  cancel();
                  setEditing(!editing);
                }}
              >
                <Move size={14} />
                {editing ? "تعديل" : "مشاهدة"}
              </button>
              <StudioSelect
                label="عناصر المعاينة"
                value={box ? selectionKey(box) : "none"}
                onValueChange={(key) => {
                  onPause();
                  const b = boxes.find((b) => selectionKey(b) === key);
                  onSelect(b ? { kind: b.kind, id: b.id } : null);
                }}
                disabled={!!inline}
                options={[
                  { value: "none", label: "اختار عنصرًا" },
                  ...boxes.map((b, i) => ({
                    value: selectionKey(b),
                    label: `${b.hidden ? "◌ " : b.locked ? "🔒 " : ""}${b.label} ${b.kind === "text" ? "" : i + 1}`,
                  })),
                ]}
              />
              <button
                title="تصغير"
                aria-label="تصغير العنصر"
                disabled={disabled}
                onClick={() =>
                  selection && onChange(scaleObject(project, selection, 0.9))
                }
              >
                <Minus size={16} />
              </button>
              <button
                title="تكبير"
                aria-label="تكبير العنصر"
                disabled={disabled}
                onClick={() =>
                  selection && onChange(scaleObject(project, selection, 1.1))
                }
              >
                <Plus size={16} />
              </button>
              <button
                title="تدوير ٩٠ درجة"
                aria-label="تدوير العنصر"
                disabled={disabled}
                onClick={() =>
                  patch({ rotation: rotation((object?.rotation || 0) + 90) })
                }
              >
                <RotateCw size={16} />
              </button>
              <button
                title="توسيط أفقي"
                aria-label="توسيط العنصر أفقيًا"
                disabled={disabled}
                onClick={() => align("x")}
              >
                <AlignHorizontalJustifyCenter size={16} />
              </button>
              <button
                title="توسيط رأسي"
                aria-label="توسيط العنصر رأسيًا"
                disabled={disabled}
                onClick={() => align("y")}
              >
                <AlignVerticalJustifyCenter size={16} />
              </button>
              {selection?.kind === "text" && (
                <>
                  <button disabled={disabled} onClick={editText}>
                    ✎ النص
                  </button>
                  <button disabled={!!inline} onClick={onTextPanel}>
                    تنسيق
                  </button>
                </>
              )}
              <button
                aria-label="نسخ العنصر"
                disabled={
                  disabled ||
                  (selection?.kind === "overlay" &&
                    (project.overlays?.length || 0) >= 6)
                }
                onClick={duplicate}
              >
                <Copy size={16} />
              </button>
              <button
                aria-label={object?.locked ? "فتح قفل العنصر" : "قفل العنصر"}
                disabled={!object || playing || !!inline}
                onClick={() =>
                  project.tracks?.[selectedTrack]?.locked
                    ? onChange({
                        ...project,
                        tracks: {
                          ...project.tracks,
                          [selectedTrack]: {
                            ...project.tracks[selectedTrack],
                            locked: false,
                          },
                        },
                      })
                    : patch({ locked: !object?.locked })
                }
              >
                {object?.locked ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
              {selection && selection.kind !== "clip" && (
                <button
                  aria-label={
                    (object as TextLayer)?.hidden
                      ? "إظهار العنصر"
                      : "إخفاء العنصر"
                  }
                  disabled={!object || playing || !!inline}
                  onClick={() =>
                    patch({ hidden: !(object as TextLayer)?.hidden })
                  }
                >
                  {(object as TextLayer)?.hidden ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              )}
              <button
                disabled={disabled}
                aria-label="إعادة ضبط مكان وحجم العنصر"
                onClick={() =>
                  patch(
                    selection?.kind === "clip"
                      ? { x: 0, y: 0, zoom: 1, rotation: 0 }
                      : selection?.kind === "text"
                        ? { x: 50, y: 50, size: 52, rotation: 0 }
                        : { x: 50, y: 50, width: 35, rotation: 0 },
                  )
                }
              >
                <RotateCcw size={16} />
              </button>
              <button
                aria-label="حذف العنصر المحدد"
                disabled={disabled}
                onClick={remove}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="preview-edit-hint">
              {playing
                ? "أوقف التشغيل للتعديل المباشر"
                : editing
                  ? "اسحب العنصر • المقابض للحجم والتدوير • ضغطتين على النص لتعديله • Esc للإلغاء"
                  : "وضع مشاهدة: تقدر تمرّر الصفحة فوق المعاينة بحرية"}
            </p>
          </>,
          props.toolbarHost,
        )}

      <div
        className="preview-interaction"
        data-preview-interaction=""
        ref={root}
        role="region"
        aria-label="مساحة التعديل المباشر"
        tabIndex={editing && !playing ? 0 : -1}
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          pointerEvents: editing && !playing ? "auto" : "none",
          touchAction: editing && !playing ? "none" : "auto",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(e) => finish(e)}
        onPointerCancel={(e) => finish(e, true)}
        onLostPointerCapture={() => {
          if (gesture.current) cancel();
        }}
        onDoubleClick={() => {
          if (selection?.kind === "text") editText();
        }}
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).matches("input,textarea,button"))
            return;
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            if (inline) {
              setInline(null);
              onDraft(null);
            } else {
              cancel();
              onSelect(null);
            }
            return;
          }
          if (gesture.current) {
            e.preventDefault();
            e.stopPropagation();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z")
              cancel();
            return;
          }
          if (!selection || disabled) {
            if (
              [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Delete",
                "Backspace",
              ].includes(e.key) ||
              ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d")
            ) {
              e.preventDefault();
              e.stopPropagation();
            }
            return;
          }
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            e.stopPropagation();
            const step = ((e.shiftKey ? 10 : 1) * w) / Math.max(1, rect.width);
            onChange(
              moveObject(
                project,
                selection,
                e.key === "ArrowLeft"
                  ? -step
                  : e.key === "ArrowRight"
                    ? step
                    : 0,
                e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0,
              ),
            );
          }
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            e.stopPropagation();
            remove();
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
            e.preventDefault();
            e.stopPropagation();
            duplicate();
          }
          if (e.key === "Enter" && selection.kind === "text") {
            e.preventDefault();
            e.stopPropagation();
            editText();
          }
        }}
      >
        {editing && !playing && box && !box.hidden && !inline && (
          <div
            className={`preview-selection ${box.locked ? "is-locked" : ""}`}
            style={{
              left: `${(box.cx / w) * 100}%`,
              top: `${(box.cy / h) * 100}%`,
              width: `${(box.width / w) * 100}%`,
              height: `${(box.height / h) * 100}%`,
              transform: `translate(-50%,-50%) rotate(${box.angle}deg)`,
            }}
          >
            <span className="selection-name">
              {box.locked ? "🔒 " : ""}
              {box.label}
            </span>
            {!box.locked && (
              <>
                <button
                  className="transform-handle resize-nw"
                  data-transform="resize"
                  aria-label="تغيير حجم العنصر من البداية"
                />
                <button
                  className="transform-handle resize-se"
                  data-transform="resize"
                  aria-label="تغيير حجم العنصر"
                />
                <button
                  className="transform-handle rotate-handle"
                  data-transform="rotate"
                  aria-label="مقبض تدوير العنصر"
                >
                  ↻
                </button>
              </>
            )}
          </div>
        )}
        {guides.x && <i className="snap-guide vertical" />}
        {guides.y && <i className="snap-guide horizontal" />}
        {inline && (
          <form
            className="preview-inline-editor"
            role="form"
            aria-label="تعديل النص داخل المعاينة"
            onPointerDown={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              commitInline();
            }}
          >
            <textarea
              ref={field}
              aria-label="النص داخل المعاينة"
              value={inline.value}
              maxLength={5000}
              onChange={(e) => {
                const next = { ...inline, value: e.target.value };
                setInline(next);
                onDraft(
                  patchObject(
                    project,
                    { kind: "text", id: inline.id },
                    { text: next.value },
                  ),
                );
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  e.preventDefault();
                  setInline(null);
                  onDraft(null);
                }
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  commitInline();
                }
              }}
            />
            <div>
              <button className="primary" type="submit">
                تم ✓
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setInline(null);
                  onDraft(null);
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
