import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { X, Download, Copy, Play, Pause, RotateCcw } from "lucide-react";
import type { LibraryElement } from "../types";
import { ElementPreview } from "./ElementPreview";
import { download, elementProject, elementCode } from "../lib/export";
export function ElementInspector({
  item,
  onClose,
}: {
  item: LibraryElement;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    codeRef = useRef<HTMLTextAreaElement>(null);
  const [color, setColor] = useState<string | undefined>(),
    [time, setTime] = useState(1.2),
    [playing, setPlaying] = useState(false),
    [message, setMessage] = useState(""),
    [ready, setReady] = useState(false);
  const previewReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const el = dialog.current,
      previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    el?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = performance.now(),
      elapsed = time,
      published = last;
    const tick = (now: number) => {
      elapsed = (elapsed + (now - last) / 1000) % 7.5;
      last = now;
      if (now - published >= 1000 / 30) {
        setTime(elapsed);
        published = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const code = useMemo(() => elementCode(item, color), [item, color]);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("تم نسخ الكود");
    } catch {
      codeRef.current?.focus();
      codeRef.current?.select();
      setMessage("النسخ التلقائي مش متاح. الكود متحدد؛ استخدم Ctrl/Cmd+C.");
    }
  }
  async function png() {
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        if (!canvas.current) {
          reject(new Error());
          return;
        }
        canvas.current.toBlob(
          (b) => (b ? resolve(b) : reject(new Error())),
          "image/png",
        );
      });
      download(blob, `${item.id}.png`);
      setMessage("تم حفظ اللقطة PNG");
    } catch {
      setMessage("تعذّر حفظ اللقطة. انتظر تحميل المعاينة وحاول تاني.");
    }
  }
  return (
    <dialog
      ref={dialog}
      className="element-inspector"
      aria-label={`تفاصيل ${item.name}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <div>
          <small>{item.sourceName}</small>
          <h2>{item.name}</h2>
        </div>
        <button aria-label="إغلاق التفاصيل" onClick={onClose}>
          <X size={21} />
        </button>
      </header>
      <div className="element-inspector-layout">
        <div>
          <div className="inspector-stage">
            <ElementPreview
              item={item}
              time={time}
              color={color}
              canvasRef={canvas}
              onReady={previewReady}
            />
          </div>
          {item.animated && (
            <div className="element-time">
              <button
                aria-label={playing ? "إيقاف الحركة" : "تشغيل الحركة"}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <input
                type="range"
                min="0"
                max="7.49"
                step="0.01"
                aria-label="وقت معاينة العنصر"
                value={time}
                onChange={(e) => {
                  setPlaying(false);
                  setTime(+e.target.value);
                }}
              />
              <output>{time.toFixed(1)}s</output>
            </div>
          )}
          <p className="element-help">
            {item.kind === "layer"
              ? "طبقة أصلية من القالب، مع توسيطها وملاءمتها للمعاينة. JSON المشروع يفتح في استوديو الفيديو ويمكن تعديل الطبقة."
              : item.kind === "svg"
                ? "ملف SVG أصلي من القالب. قابل لتعديل كوده؛ مش مجموعة طبقات منفصلة."
                : "مشهد مركّب مرسوم بالكود من Interface Flow. تعديل أجزائه من كود المشهد، وليس كطبقات منفصلة."}
          </p>
        </div>
        <aside>
          <label className="element-color">
            لون التجربة
            <input
              aria-label="لون العنصر"
              type="color"
              disabled={item.kind === "svg"}
              value={
                color ||
                (/^#[0-9a-f]{6}$/i.test(item.layer?.color || "")
                  ? item.layer!.color
                  : "#4bdfc5")
              }
              onChange={(e) => setColor(e.target.value)}
            />
            <button
              aria-label="استعادة اللون"
              onClick={() => setColor(undefined)}
            >
              <RotateCcw size={16} />
            </button>
          </label>
          <a
            className="element-studio-link"
            target="_blank"
            rel="noopener noreferrer"
            href={`/video-studio.html?element=${encodeURIComponent(item.id)}${color ? "&color=" + encodeURIComponent(color) : ""}`}
          >
            ＋ إضافة للتايم لاين في الاستوديو ↗
          </a>
          <div className="element-export-actions">
            <button
              onClick={() =>
                download(
                  new Blob(
                    [JSON.stringify(elementProject(item, color), null, 2)],
                    { type: "application/json" },
                  ),
                  `${item.id}.unitool.json`,
                )
              }
            >
              <Download size={17} />
              تنزيل مشروع قابل للفتح
            </button>
            <button onClick={png} disabled={!ready}>
              <Download size={17} />
              حفظ PNG
            </button>
            {item.svg && (
              <button
                onClick={() =>
                  download(
                    new Blob([item.svg!], { type: "image/svg+xml" }),
                    `${item.id}.svg`,
                  )
                }
              >
                <Download size={17} />
                تنزيل SVG
              </button>
            )}
            <button onClick={copyCode}>
              <Copy size={17} />
              نسخ {item.kind === "layer" ? "JSON" : "الكود"}
            </button>
          </div>
          <p className="element-help">
            افتح ملف المشروع من «فتح مشروع» في استوديو الفيديو. تغيير اللون هنا
            لا يعدّل القالب الأصلي.
          </p>
          <a className="element-studio-link" href="/video-studio.html">
            افتح استوديو الفيديو ↖
          </a>
          <label className="element-code-label">
            {item.kind === "layer" ? "بيانات الطبقة" : "الكود"}
            <textarea
              ref={codeRef}
              value={code}
              readOnly
              dir="ltr"
              spellCheck={false}
            />
          </label>
          <p role="status" className="element-status">
            {message}
          </p>
        </aside>
      </div>
    </dialog>
  );
}
