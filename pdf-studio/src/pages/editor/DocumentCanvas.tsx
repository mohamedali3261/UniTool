import { useEffect, useRef, useState } from "react";
import { InlineTextEditor } from "./InlineTextEditor";
import { TextLayer } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import type { PdfDoc } from "../../core/pdf";
import { drawAnnotations, loadFonts } from "../../core/annotations";
import { hits } from "../../core/text";
import {
  uid,
  LIMITS,
  type Annotation,
  type PageState,
  type PageText,
  type Point,
  type Tool,
  type Translate,
} from "../../core/types";
interface Props {
  doc: PdfDoc;
  inlineEdit?: {
    bytes: Uint8Array;
    commit: (bytes: Uint8Array) => Promise<void>;
  };
  page: PageState;
  tool: Tool;
  zoom: number;
  text: string;
  fontSize: number;
  color: string;
  selected: string | null;
  setSelected: (id: string | null) => void;
  add: (a: Annotation) => void;
  patch: (id: string, a: Partial<Annotation>) => void;
  extracted?: PageText;
  query: string;
  t: Translate;
}
export function DocumentCanvas({
  doc,
  inlineEdit,
  page,
  tool,
  zoom,
  text,
  fontSize,
  color,
  selected,
  setSelected,
  add,
  patch,
  extracted,
  query,
  t,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    native = useRef<HTMLCanvasElement>(null),
    overlay = useRef<HTMLCanvasElement>(null),
    textLayer = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null),
    [available, setAvailable] = useState(700),
    [size, setSize] = useState({ w: 595, h: 842 }),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [draft, setDraft] = useState<Annotation | null>(null);
  const gesture = useRef<{
      start: Point;
      item: Annotation;
      move: boolean;
    } | null>(null),
    draftRef = useRef<Annotation | null>(null);
  const setLive = (a: Annotation | null) => {
    draftRef.current = a;
    setDraft(a);
  };
  const rotated = page.rotation % 180 !== 0,
    scale =
      Math.min(1.25, (available - 40) / (rotated ? size.h : size.w)) * zoom,
    displayW = size.w * scale,
    displayH = size.h * scale;
  useEffect(() => {
    const obs = new ResizeObserver((e) =>
      setAvailable(Math.max(160, e[0].contentRect.width)),
    );
    if (host.current) obs.observe(host.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    let dead = false,
      render:
        | ReturnType<Awaited<ReturnType<PdfDoc["getPage"]>>["render"]>
        | undefined,
      layer: TextLayer | undefined;
    setReady(false);
    setError("");
    gesture.current = null;
    setLive(null);
    (async () => {
      const proxy = await doc.getPage(page.source + 1);
      if (dead) return;
      const base = proxy.getViewport({ scale: 1 });
      setSize({ w: base.width, h: base.height });
      const view = proxy.getViewport({ scale }),
        dpr = Math.min(
          devicePixelRatio || 1,
          2,
          Math.sqrt(LIMITS.pixels / (view.width * view.height)),
        ),
        canvas = native.current!;
      canvas.width = Math.ceil(view.width * dpr);
      canvas.height = Math.ceil(view.height * dpr);
      render = proxy.render({
        canvasContext: canvas.getContext("2d")!,
        viewport: view,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        background: "#ffffff",
      });
      await render.promise;
      if (dead) return;
      const container = textLayer.current!;
      container.replaceChildren();
      container.style.setProperty("--scale-factor", String(view.scale));
      container.style.setProperty("--total-scale-factor", String(view.scale));
      layer = new TextLayer({
        textContentSource: await proxy.getTextContent(),
        container,
        viewport: view,
      });
      await layer.render();
      if (!dead) setReady(true);
    })().catch((e) => {
      if (!dead && e.name !== "RenderingCancelledException")
        setError(
          t(
            "تعذر عرض الصفحة. جرّب تكبيرًا أقل أو ملفًا آخر.",
            "Unable to render page. Try a lower zoom or another PDF.",
          ),
        );
    });
    return () => {
      dead = true;
      render?.cancel();
      layer?.cancel();
    };
  }, [doc, page.source, scale]);
  useEffect(() => {
    let dead = false;
    (async () => {
      await loadFonts();
      if (dead || !overlay.current) return;
      const canvas = overlay.current,
        dpr = Math.min(
          devicePixelRatio || 1,
          2,
          Math.sqrt(LIMITS.pixels / (displayW * displayH)),
        );
      canvas.width = Math.ceil(displayW * dpr);
      canvas.height = Math.ceil(displayH * dpr);
      const items = page.annotations.map((a) =>
        draft?.id === a.id ? draft : a,
      );
      if (draft && !items.some((a) => a.id === draft.id)) items.push(draft);
      drawAnnotations(canvas.getContext("2d")!, items, scale * dpr);
    })();
    return () => {
      dead = true;
    };
  }, [page.annotations, draft, displayW, displayH, scale]);
  const point = (e: React.PointerEvent) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    return {
      x: Math.max(0, Math.min(size.w, p.x)),
      y: Math.max(0, Math.min(size.h, p.y)),
    };
  };
  const begin = (e: React.PointerEvent, item?: Annotation) => {
    if (!ready || (tool === "select" && !item)) return;
    if (e.button !== 0) return;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    const p = point(e);
    if (item && tool === "select") {
      setSelected(item.id);
      gesture.current = { start: p, item, move: true };
      setLive(item);
      return;
    }
    setSelected(null);
    if (tool === "text") {
      const a: Annotation = {
        id: uid(),
        type: "text",
        ...p,
        w: Math.min(260, size.w - p.x),
        h: fontSize * 3,
        fontSize,
        color,
        text: text.slice(0, 1000),
      };
      add(a);
      return;
    }
    const a: Annotation = {
      id: uid(),
      type: tool as Annotation["type"],
      ...p,
      w: 0,
      h: 0,
      fontSize,
      color,
      points: tool === "pen" ? [p] : undefined,
    };
    gesture.current = { start: p, item: a, move: false };
    setLive(a);
  };
  return (
    <div className="ps-canvas-scroll" ref={host}>
      <div className="ps-paper-top">
        <span>{t("مساحة المستند", "DOCUMENT CANVAS")}</span>
        <span>
          {Math.round(size.w)} × {Math.round(size.h)} pt
        </span>
      </div>
      {error && (
        <div role="alert" className="ps-inline-error">
          {error}
        </div>
      )}
      <div
        className="ps-paper-frame"
        style={{
          width: rotated ? displayH : displayW,
          height: rotated ? displayW : displayH,
        }}
      >
        <div
          className="ps-paper"
          style={{
            width: displayW,
            height: displayH,
            transform: `translate(-50%,-50%) rotate(${page.rotation}deg)`,
          }}
          data-ready={ready}
        >
          <canvas ref={native} className="ps-native" />
          <div
            ref={textLayer}
            className="textLayer"
            style={{ width: displayW, height: displayH }}
          />
          <svg
            className="ps-search-layer"
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-hidden="true"
          >
            {extracted &&
              hits(extracted, query).map((r, i) => (
                <rect
                  key={i}
                  x={r.x}
                  y={r.y}
                  width={Math.max(r.w, 5)}
                  height={r.h * 1.3}
                  fill="#f5b831"
                  opacity=".4"
                />
              ))}
          </svg>
          <canvas ref={overlay} className="ps-annotation-canvas" />
          <svg
            ref={svg}
            className={"ps-interaction tool-" + tool}
            style={{
              pointerEvents: tool === "select" ? "none" : "auto",
              touchAction: tool === "select" ? "auto" : "none",
            }}
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-label={t("إضافات الصفحة", "Page annotations")}
            onPointerDown={(e) => begin(e)}
            onPointerMove={(e) => {
              const g = gesture.current;
              if (!g) return;
              const p = point(e),
                a = g.item;
              if (g.move) {
                const dx = Math.max(
                    -a.x,
                    Math.min(size.w - a.x - a.w, p.x - g.start.x),
                  ),
                  dy = Math.max(
                    -a.y,
                    Math.min(size.h - a.y - a.h, p.y - g.start.y),
                  );
                setLive({
                  ...a,
                  x: a.x + dx,
                  y: a.y + dy,
                  points: a.points?.map((q) => ({ x: q.x + dx, y: q.y + dy })),
                });
              } else if (a.type === "pen") {
                const points = [...(draftRef.current?.points || []), p].slice(
                    0,
                    1500,
                  ),
                  xs = points.map((p) => p.x),
                  ys = points.map((p) => p.y);
                setLive({
                  ...a,
                  points,
                  x: Math.min(...xs),
                  y: Math.min(...ys),
                  w: Math.max(...xs) - Math.min(...xs),
                  h: Math.max(...ys) - Math.min(...ys),
                });
              } else
                setLive({
                  ...a,
                  x: Math.min(p.x, g.start.x),
                  y: Math.min(p.y, g.start.y),
                  w: Math.abs(p.x - g.start.x),
                  h: Math.abs(p.y - g.start.y),
                });
            }}
            onPointerUp={() => {
              const g = gesture.current,
                a = draftRef.current;
              if (g && a) {
                if (g.move) {
                  if (a.x !== g.item.x || a.y !== g.item.y) patch(a.id, a);
                } else if (a.w > 2 || a.h > 2) add(a);
              }
              gesture.current = null;
              setLive(null);
            }}
            onPointerCancel={() => {
              gesture.current = null;
              setLive(null);
            }}
          >
            {page.annotations.map((a) => (
              <rect
                key={a.id}
                x={a.x}
                y={a.y}
                width={Math.max(8, a.w)}
                height={Math.max(8, a.h)}
                fill="transparent"
                stroke={a.id === selected ? "#bc7056" : "transparent"}
                strokeWidth={1 / scale}
                strokeDasharray="4 3"
                style={{
                  pointerEvents: tool === "select" ? "all" : "none",
                  cursor: "move",
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  begin(e, a);
                }}
              />
            ))}
          </svg>
          {ready && inlineEdit && (
            <InlineTextEditor
              bytes={inlineEdit.bytes}
              source={page.source}
              width={size.w}
              height={size.h}
              commit={inlineEdit.commit}
              t={t}
            />
          )}
          {!ready && !error && (
            <div className="ps-render-loading">
              {t("جاري عرض الأصل…", "Rendering original…")}
            </div>
          )}
        </div>
      </div>
      <p className="ps-canvas-caption">
        {tool === "select"
          ? t(
              "حدد النص الأصلي لنسخه، أو اسحب الإضافة لتحريكها.",
              "Select original text to copy it, or drag an annotation to move it.",
            )
          : tool === "text"
            ? t(
                "اضغط مكان إضافة النص. عدّل محتواه من الخصائص.",
                "Click to place text. Edit its content in properties.",
              )
            : t(
                "اسحب على الصفحة للرسم. يدعم الماوس واللمس.",
                "Drag on the page to draw. Mouse and touch supported.",
              )}
      </p>
    </div>
  );
}
