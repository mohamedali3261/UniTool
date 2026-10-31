/** اللمس والسحب في وحدات اللوحة، والتغييرات الحية تُجمع في خطوة تراجع واحدة. */
import { useEffect, useRef, useState } from "react";
import {
  Minus,
  Plus,
  Maximize,
  Grid3X3,
  Magnet,
  Hand,
  MousePointer2,
  ScanLine,
} from "lucide-react";
import { useDesigner } from "./state";
import { ProjectGraphic } from "./render";
import type { Element } from "./types";
export default function Canvas() {
  const s = useDesigner(),
    wrap = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 700, h: 620 }),
    [snapped, setSnapped] = useState<{ x: number | null; y: number | null }>({
      x: null,
      y: null,
    });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    kind: "move" | "resize" | "pan" | "pinch";
    start: { x: number; y: number };
    nodes: Element[];
    id?: string;
    pan: { x: number; y: number };
    zoom: number;
    distance?: number;
  }>(undefined);
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);
  const fit = Math.min(
      (size.w - 70) / s.doc.width,
      (size.h - 100) / s.doc.height,
    ),
    scale = Math.max(0.03, fit) * s.zoom;
  const point = (x: number, y: number) => {
    const r = svg.current!.getBoundingClientRect();
    return {
      x: ((x - r.left) / r.width) * s.doc.width,
      y: ((y - r.top) / r.height) * s.doc.height,
    };
  };
  function start(e: React.PointerEvent, id?: string, resize = false) {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      s.dispatch({ type: "end" });
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        kind: "pinch",
        start: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        nodes: [],
        pan: s.pan,
        zoom: s.zoom,
        distance: Math.hypot(a.x - b.x, a.y - b.y),
      };
      return;
    }
    if (s.hand || e.button === 1 || !id) {
      if (!s.hand && !id && !e.shiftKey) s.setSelected([]);
      gesture.current = {
        kind: "pan",
        start: { x: e.clientX, y: e.clientY },
        nodes: [],
        pan: s.pan,
        zoom: s.zoom,
      };
      return;
    }
    const n = s.doc.nodes.find((n) => n.id === id)!;
    if (n.locked) return;
    let ids = s.selected;
    if (!ids.includes(id)) {
      ids = n.group
        ? s.doc.nodes
            .filter((v) => v.group === n.group && !v.locked)
            .map((v) => v.id)
        : [id];
      s.choose(id, e.shiftKey);
    } else if (e.shiftKey) {
      s.choose(id, true);
      return;
    }
    s.dispatch({ type: "begin" });
    gesture.current = {
      kind: resize ? "resize" : "move",
      start: point(e.clientX, e.clientY),
      nodes: s.doc.nodes
        .filter((n) => ids.includes(n.id) && !n.locked)
        .map((n) => ({ ...n })),
      id,
      pan: s.pan,
      zoom: s.zoom,
    };
  }
  function move(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!b) return;
      s.setZoom(
        Math.max(
          0.25,
          Math.min(
            4,
            (g.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / (g.distance || 1),
          ),
        ),
      );
      s.setPan({
        x: g.pan.x + (a.x + b.x) / 2 - g.start.x,
        y: g.pan.y + (a.y + b.y) / 2 - g.start.y,
      });
      return;
    }
    if (g.kind === "pan") {
      s.setPan({
        x: g.pan.x + e.clientX - g.start.x,
        y: g.pan.y + e.clientY - g.start.y,
      });
      return;
    }
    const p = point(e.clientX, e.clientY);
    let dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    const first = g.nodes.find((n) => n.id === g.id) || g.nodes[0];
    let snapX: number | null = null,
      snapY: number | null = null;
    if (g.kind === "move" && s.snap && first) {
      const others = s.doc.nodes.filter(
        (n) => !g.nodes.some((a) => a.id === n.id) && !n.hidden,
      );
      const xs = [s.doc.width / 2, ...others.map((n) => n.x)],
        ys = [s.doc.height / 2, ...others.map((n) => n.y)];
      const tx = xs.find((v) => Math.abs(first.x + dx - v) < 8 / scale),
        ty = ys.find((v) => Math.abs(first.y + dy - v) < 8 / scale);
      if (tx !== undefined) {
        dx = tx - first.x;
        snapX = tx;
      } else if (s.grid) dx = Math.round((first.x + dx) / 20) * 20 - first.x;
      if (ty !== undefined) {
        dy = ty - first.y;
        snapY = ty;
      } else if (s.grid) dy = Math.round((first.y + dy) / 20) * 20 - first.y;
    }
    setSnapped({ x: snapX, y: snapY });
    s.dispatch({
      type: "live",
      fn: (doc) => ({
        ...doc,
        nodes: doc.nodes.map((n) => {
          const initial = g.nodes.find((v) => v.id === n.id);
          if (!initial) return n;
          if (g.kind === "resize") {
            const ratio = Math.max(
              0.1,
              Math.max(
                (initial.w + dx * 2) / initial.w,
                (initial.h + dy * 2) / initial.h,
              ),
            );
            return {
              ...initial,
              w: Math.min(8000, initial.w * ratio),
              h: Math.min(8000, initial.h * ratio),
              fontSize: Math.min(600, Math.max(4, initial.fontSize * ratio)),
            };
          }
          return { ...initial, x: initial.x + dx, y: initial.y + dy };
        }),
      }),
    });
  }
  function end(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (gesture.current?.kind === "move" || gesture.current?.kind === "resize")
      s.dispatch({ type: "end" });
    gesture.current = undefined;
    setSnapped({ x: null, y: null });
  }
  const visible = s.doc.nodes.filter((n) => !n.hidden);
  return (
    <section
      className="ld-canvas-workspace"
      aria-label={s.t("لوحة التصميم", "Design canvas")}
    >
      <div className="ld-canvas-bar">
        <span>
          {s.doc.width} × {s.doc.height}
        </span>
        <div>
          {[
            [s.grid, s.setGrid, Grid3X3, s.t("شبكة", "Grid")],
            [s.guides, s.setGuides, ScanLine, s.t("خطوط إرشادية", "Guides")],
            [s.snap, s.setSnap, Magnet, s.t("محاذاة تلقائية", "Snap")],
            [
              s.hand,
              s.setHand,
              s.hand ? Hand : MousePointer2,
              s.t("أداة التحريك", "Pan tool"),
            ],
          ].map(([active, set, Icon, title]: any) => (
            <button
              key={title}
              aria-label={title}
              title={title}
              aria-pressed={active}
              onClick={() => set(!active)}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>
      </div>
      <div
        ref={wrap}
        className={`ld-canvas-viewport ${s.hand ? "is-hand" : ""}`}
        onPointerDown={(e) => start(e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            s.setZoom((z) => Math.max(0.25, Math.min(4, z - e.deltaY * 0.002)));
          } else s.setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }}
      >
        <div
          className="ld-artboard"
          style={{
            width: s.doc.width * scale,
            height: s.doc.height * scale,
            transform: `translate(${s.pan.x}px,${s.pan.y}px)`,
          }}
        >
          <svg
            ref={svg}
            viewBox={`0 0 ${s.doc.width} ${s.doc.height}`}
            width="100%"
            height="100%"
            role="img"
            aria-label={s.t("مساحة رسم الشعار", "Logo artboard")}
          >
            <ProjectGraphic project={s.doc} />
            {s.grid && (
              <>
                <defs>
                  <pattern
                    id="ld-grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M20 0H0V20"
                      fill="none"
                      stroke="#8096a4"
                      strokeOpacity=".25"
                      strokeWidth={1 / scale}
                    />
                  </pattern>
                </defs>
                <rect
                  width={s.doc.width}
                  height={s.doc.height}
                  fill="url(#ld-grid)"
                  pointerEvents="none"
                />
              </>
            )}
            {s.guides && (
              <g
                stroke="#a598e9"
                strokeWidth={1 / scale}
                strokeDasharray={`${4 / scale} ${6 / scale}`}
                opacity=".45"
                pointerEvents="none"
              >
                <path
                  d={`M${s.doc.width / 2} 0V${s.doc.height}M0 ${s.doc.height / 2}H${s.doc.width}`}
                />
              </g>
            )}
            {visible.map((n) => (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y}) rotate(${n.rotation})`}
              >
                <rect
                  tabIndex={n.locked ? -1 : 0}
                  role="button"
                  aria-label={s.t("اختيار ", "Select ") + n.name}
                  x={-n.w / 2}
                  y={-n.h / 2}
                  width={n.w}
                  height={n.h}
                  fill="transparent"
                  stroke={s.selected.includes(n.id) ? "#8a74ff" : "none"}
                  strokeWidth={2 / scale}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    start(e, n.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      s.choose(n.id, e.shiftKey);
                    }
                  }}
                  style={{
                    cursor: n.locked ? "not-allowed" : s.hand ? "grab" : "move",
                  }}
                />
                {s.selected.includes(n.id) &&
                  !n.locked &&
                  s.selected.length === 1 && (
                    <rect
                      x={n.w / 2 - 6 / scale}
                      y={n.h / 2 - 6 / scale}
                      width={12 / scale}
                      height={12 / scale}
                      fill="#fff"
                      stroke="#8a74ff"
                      strokeWidth={2 / scale}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        start(e, n.id, true);
                      }}
                      style={{ cursor: "nwse-resize" }}
                    />
                  )}
              </g>
            ))}
            {(snapped.x !== null || snapped.y !== null) && (
              <path
                d={`${snapped.x !== null ? `M${snapped.x} 0V${s.doc.height}` : ""}${snapped.y !== null ? `M0 ${snapped.y}H${s.doc.width}` : ""}`}
                stroke="#fa799f"
                strokeWidth={1 / scale}
                pointerEvents="none"
              />
            )}
          </svg>
          {!visible.length && (
            <div className="ld-canvas-empty">
              {s.t(
                "ابدأ بشكل، كلمة، أو فكرة.",
                "Start with a shape, a word, an idea.",
              )}
            </div>
          )}
        </div>
      </div>
      <div className="ld-canvas-footer">
        <span>
          {s.t(
            "SVG حي · كل تفصيلة قابلة للتعديل",
            "LIVE SVG · EVERY DETAIL EDITABLE",
          )}
        </span>
        <div>
          <button
            aria-label={s.t("تصغير", "Zoom out")}
            onClick={() => s.setZoom((z) => Math.max(0.25, z - 0.1))}
          >
            <Minus size={16} />
          </button>
          <output>{Math.round(s.zoom * 100)}%</output>
          <button
            aria-label={s.t("تكبير", "Zoom in")}
            onClick={() => s.setZoom((z) => Math.min(4, z + 0.1))}
          >
            <Plus size={16} />
          </button>
          <button
            aria-label={s.t("احتواء التصميم", "Fit artwork")}
            onClick={() => {
              s.setZoom(1);
              s.setPan({ x: 0, y: 0 });
            }}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
