import { useEffect, useRef, useState } from "react";
import {
  editNativeText,
  isolateNativeText,
  type NativeTextItem,
} from "../../core/nativeText";
import { extractPage, openPdf, type PdfDoc } from "../../core/pdf";
import type { Translate } from "../../core/types";
type Box = { x: number; y: number; w: number; h: number };
type Viewport = ReturnType<
  Awaited<ReturnType<PdfDoc["getPage"]>>["getViewport"]
>;
interface Props {
  bytes: Uint8Array;
  pageIndex: number;
  items: NativeTextItem[];
  selected: number;
  dx: number;
  dy: number;
  disabled: boolean;
  text: string;
  setText: (text: string) => void;
  select: (index: number) => void;
  move: (dx: number, dy: number) => void;
  t: Translate;
}
export function NativeTextCanvas({
  bytes,
  pageIndex,
  items,
  selected,
  dx,
  dy,
  disabled,
  text,
  setText,
  select,
  move,
  t,
}: Props) {
  const background = useRef<HTMLCanvasElement>(null),
    floating = useRef<HTMLCanvasElement>(null),
    svg = useRef<SVGSVGElement>(null);
  const [boxes, setBoxes] = useState<(Box | null)[]>([]),
    [view, setView] = useState<Viewport | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [zoom, setZoom] = useState(1),
    [editing, setEditing] = useState(false),
    [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    nextX: number;
    nextY: number;
  } | null>(null);
  useEffect(() => {
    let dead = false;
    setBoxes([]);
    (async () => {
      const result: (Box | null)[] = [];
      // Bound work; unsupported/excess blocks remain editable through explicit controls.
      for (const item of items.slice(0, 100)) {
        let doc: PdfDoc | undefined;
        try {
          const isolated = await isolateNativeText(bytes, pageIndex, item);
          doc = (
            await openPdf(new File([isolated.slice().buffer], "block.pdf"))
          ).doc;
          if (dead) return;
          const runs = (await extractPage(doc, 0)).runs.filter(
            (r) => r.w > 0 && r.h > 0,
          );
          if (!runs.length) {
            result.push(null);
            continue;
          }
          const x = Math.min(...runs.map((r) => r.x)),
            y = Math.min(...runs.map((r) => r.y));
          result.push({
            x,
            y,
            w: Math.max(...runs.map((r) => r.x + r.w)) - x,
            h: Math.max(...runs.map((r) => r.y + r.h)) - y,
          });
        } catch {
          result.push(null);
        } finally {
          await doc?.destroy();
        }
        if (dead) return;
        setBoxes([...result]);
      }
    })();
    return () => {
      dead = true;
    };
  }, [bytes, pageIndex, items]);
  useEffect(() => {
    let dead = false;
    const docs: PdfDoc[] = [];
    const tasks: { cancel: () => void }[] = [];
    setEditing(false);
    setReady(false);
    setError("");
    setLive(null);
    gesture.current = null;
    (async () => {
      const item = items[selected];
      if (!item) return;
      const base = await editNativeText(bytes, pageIndex, item, {
        dx: 0,
        dy: 0,
        remove: true,
      });
      const layer = await isolateNativeText(bytes, pageIndex, item);
      for (const [data, index, canvas, transparent] of [
        [base, pageIndex, background.current!, false],
        [layer, 0, floating.current!, true],
      ] as const) {
        if (dead) return;
        const opened = await openPdf(
          new File([data.slice().buffer], "preview.pdf"),
        );
        docs.push(opened.doc);
        if (dead) return;
        const page = await opened.doc.getPage(index + 1),
          viewport = page.getViewport({ scale: 1 });
        const ratio = Math.min(
          2,
          Math.sqrt(8_000_000 / (viewport.width * viewport.height)),
        );
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        const task = page.render({
          canvasContext: canvas.getContext("2d")!,
          viewport,
          transform: [ratio, 0, 0, ratio, 0, 0],
          background: transparent ? "rgba(0,0,0,0)" : "white",
        });
        tasks.push(task);
        await task.promise;
        if (!dead) setView(viewport);
      }
      if (!dead) setReady(true);
    })()
      .catch((e) => {
        if (!dead) setError((e as Error).message);
      })
      .finally(async () => {
        for (const doc of docs) await doc.destroy();
      });
    return () => {
      dead = true;
      tasks.forEach((task) => task.cancel());
    };
  }, [bytes, pageIndex, items, selected]);
  const displacement = (x: number, y: number) => {
    if (!view) return { x: 0, y: 0 };
    const origin = view.convertToViewportPoint(0, 0),
      p = view.convertToViewportPoint(x, y);
    return { x: p[0] - origin[0], y: p[1] - origin[1] };
  };
  const offset = displacement(live?.x ?? dx, live?.y ?? dy);
  const point = (e: React.PointerEvent) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
      : null;
  };
  const cancel = () => {
    gesture.current = null;
    setLive(null);
  };
  return (
    <section className="ps-native-editor-preview">
      <p>
        {t(
          "اضغط على إطار النص لتحديده، ثم اسحبه. اللمس خارج الإطارات لتمرير الصفحة. الأسهم تحرك نقطة واحدة، وShift مع السهم 0.1 نقطة. التحريك لا يعيد تشكيل الحروف.",
          "Select a text frame, then drag it. Touch outside frames to scroll. Arrow keys move 1 pt; Shift+arrow moves 0.1 pt. Movement preserves original glyphs.",
        )}
      </p>
      <label>
        {t("تكبير معاينة التعديل", "Editing preview zoom")}
        <input
          type="range"
          min="1"
          max="3"
          step="0.25"
          value={zoom}
          onChange={(e) => {
            cancel();
            setZoom(Number(e.target.value));
          }}
        />
      </label>
      {items[selected]?.replaceable && (
        <button
          type="button"
          disabled={!ready || disabled}
          onClick={() => setEditing((v) => !v)}
        >
          {t("تعديل النص على الصفحة", "Edit text on page")}
        </button>
      )}
      {items.length > 100 && (
        <p>
          {t(
            "التحديد المرئي متاح لأول 100 كتلة مدعومة فقط.",
            "Visual selection is limited to the first 100 supported blocks.",
          )}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {!ready && (
        <p role="status">
          {t("تجهيز المعاينة الدقيقة…", "Preparing precise preview…")}
        </p>
      )}
      <div className="ps-native-preview-scroll">
        <div
          className="ps-native-preview-paper"
          style={{
            width: `${zoom * 100}%`,
            aspectRatio: view ? `${view.width}/${view.height}` : "595/842",
          }}
        >
          <canvas ref={background} />
          <canvas
            ref={floating}
            style={{
              transform: view
                ? `translate(${(offset.x / view.width) * 100}%, ${(offset.y / view.height) * 100}%)`
                : undefined,
            }}
          />
          <svg
            ref={svg}
            viewBox={view ? `0 0 ${view.width} ${view.height}` : "0 0 595 842"}
            onPointerMove={(e) => {
              const g = gesture.current,
                p = point(e);
              if (!g || e.pointerId !== g.id || !p || !view) return;
              const a = view.convertToPdfPoint(g.x, g.y),
                b = view.convertToPdfPoint(p.x, p.y);
              g.nextX = Math.round((g.dx + b[0] - a[0]) * 1000) / 1000;
              g.nextY = Math.round((g.dy + b[1] - a[1]) * 1000) / 1000;
              setLive({ x: g.nextX, y: g.nextY });
            }}
            onPointerUp={(e) => {
              const g = gesture.current;
              if (!g || g.id !== e.pointerId) return;
              move(g.nextX, g.nextY);
              cancel();
            }}
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
          >
            {boxes.map(
              (box, i) =>
                box && (
                  <rect
                    key={i}
                    data-native-block={i}
                    role="button"
                    tabIndex={ready && !disabled ? 0 : -1}
                    aria-label={
                      t("تحريك كتلة النص ", "Move text block ") + (i + 1)
                    }
                    aria-pressed={i === selected}
                    x={box.x + (i === selected ? offset.x : 0)}
                    y={box.y + (i === selected ? offset.y : 0)}
                    width={Math.max(box.w, 4)}
                    height={Math.max(box.h, 4)}
                    fill={i === selected ? "#1976d214" : "transparent"}
                    stroke={i === selected ? "#1976d2" : "#777"}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    style={{
                      pointerEvents: ready && !disabled ? "all" : "none",
                      touchAction: "none",
                      cursor: "move",
                    }}
                    onDoubleClick={() => {
                      if (i === selected && items[i].replaceable && !disabled)
                        setEditing(true);
                    }}
                    onPointerDown={(e) => {
                      if (
                        !ready ||
                        disabled ||
                        e.button !== 0 ||
                        gesture.current
                      )
                        return;
                      e.preventDefault();
                      e.stopPropagation();
                      if (i !== selected) {
                        select(i);
                        return;
                      }
                      const p = point(e);
                      if (!p) return;
                      e.currentTarget.focus();
                      svg.current?.setPointerCapture(e.pointerId);
                      gesture.current = {
                        id: e.pointerId,
                        x: p.x,
                        y: p.y,
                        dx,
                        dy,
                        nextX: dx,
                        nextY: dy,
                      };
                    }}
                    onKeyDown={(e) => {
                      if (!ready || disabled) return;
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        cancel();
                        return;
                      }
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (i === selected && items[i].replaceable)
                          setEditing(true);
                        else select(i);
                        return;
                      }
                      if (
                        i !== selected ||
                        ![
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                        ].includes(e.key) ||
                        !view
                      )
                        return;
                      e.preventDefault();
                      const step = e.shiftKey ? 0.1 : 1,
                        a = view.convertToPdfPoint(0, 0),
                        b = view.convertToPdfPoint(
                          e.key === "ArrowLeft"
                            ? -step
                            : e.key === "ArrowRight"
                              ? step
                              : 0,
                          e.key === "ArrowUp"
                            ? -step
                            : e.key === "ArrowDown"
                              ? step
                              : 0,
                        );
                      move(
                        Math.round((dx + b[0] - a[0]) * 1000) / 1000,
                        Math.round((dy + b[1] - a[1]) * 1000) / 1000,
                      );
                    }}
                  />
                ),
            )}
          </svg>
          {editing && ready && view && boxes[selected] && (
            <input
              autoFocus
              className="ps-native-inline-input"
              aria-label={t("تعديل النص داخل الصفحة", "Edit text inside page")}
              value={text}
              maxLength={1000}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" || e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              onBlur={() => setEditing(false)}
              style={{
                left: `${Math.max(0, Math.min(65, ((boxes[selected]!.x + offset.x) / view.width) * 100))}%`,
                top: `${Math.max(0, Math.min(95, ((boxes[selected]!.y + offset.y) / view.height) * 100))}%`,
                width: `${Math.min(95, Math.max(30, (boxes[selected]!.w / view.width) * 100))}%`,
              }}
            />
          )}
        </div>
      </div>
      {ready && (
        <output>
          {t("الإزاحة: ", "Offset: ")}
          {(live?.x ?? dx).toFixed(3)}, {(live?.y ?? dy).toFixed(3)} pt
        </output>
      )}
    </section>
  );
}
