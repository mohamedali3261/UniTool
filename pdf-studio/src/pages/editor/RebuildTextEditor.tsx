import { useEffect, useRef, useState } from "react";
import { extractPage, openPdf, pageCanvas } from "../../core/pdf";
import { readableText } from "../../core/textEncoding";
import { rebuildTextRegion, type RebuildRegion } from "../../core/rebuild";
import type { Translate } from "../../core/types";
export function RebuildTextEditor({
  bytes,
  source,
  width,
  height,
  commit,
  t,
}: {
  bytes: Uint8Array;
  source: number;
  width: number;
  height: number;
  commit: (bytes: Uint8Array) => Promise<void>;
  t: Translate;
}) {
  const [runs, setRuns] = useState<(RebuildRegion & { str: string })[]>([]),
    [region, setRegion] = useState<RebuildRegion | null>(null),
    [text, setText] = useState(""),
    [size, setSize] = useState(14),
    [color, setColor] = useState("#000000"),
    [background, setBackground] = useState("#ffffff"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [candidate, setCandidate] = useState<{
      bytes: Uint8Array;
      preview: string;
    } | null>(null);
  const svg = useRef<SVGSVGElement>(null),
    start = useRef<{ x: number; y: number; id: number } | null>(null);
  useEffect(() => {
    let dead = false;
    let cleanup = () => {};
    (async () => {
      const { doc } = await openPdf(
        new File([bytes.slice().buffer], "page.pdf"),
      );
      cleanup = () => void doc.destroy();
      try {
        const data = await extractPage(doc, source);
        if (!dead)
          setRuns(data.runs.slice(0, 1000).filter((r) => r.w > 0 && r.h > 0));
      } finally {
        cleanup();
      }
    })().catch((e) => {
      if (!dead) setError((e as Error).message);
    });
    return () => {
      dead = true;
    };
  }, [bytes, source]);
  const point = (e: React.PointerEvent) => {
    const m = svg.current!.getScreenCTM()!,
      p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return {
      x: Math.max(0, Math.min(width, p.x)),
      y: Math.max(0, Math.min(height, p.y)),
    };
  };
  return (
    <div className="ps-rebuild-layer">
      <p className="ps-rebuild-warning">
        {t(
          "إعادة بناء: حدد نصًا أو اسحب مستطيلًا على أي منطقة، حتى الصفحة المصوّرة. ستتحول هذه الصفحة إلى صورة؛ قد يختلف الخط وتضيع قابلية البحث والروابط. الخلفية المختارة قد تخفي تفاصيل. ليست أداة حجب آمن.",
          "Rebuild: select text or drag a region, including scanned pages. This page becomes an image; fonts may differ and search/links are lost. The chosen background may hide details. Not secure redaction.",
        )}
      </p>
      <svg
        ref={svg}
        viewBox={`0 0 ${width} ${height}`}
        className="ps-rebuild-targets"
        onPointerDown={(e) => {
          if (busy || e.button !== 0 || e.target !== e.currentTarget) return;
          const p = point(e);
          start.current = { ...p, id: e.pointerId };
          svg.current!.setPointerCapture(e.pointerId);
          setRegion(null);
          setText("");
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s || s.id !== e.pointerId) return;
          const p = point(e);
          setRegion({
            x: Math.min(p.x, s.x),
            y: Math.min(p.y, s.y),
            w: Math.abs(p.x - s.x),
            h: Math.abs(p.y - s.y),
          });
        }}
        onPointerUp={() => {
          start.current = null;
        }}
        onLostPointerCapture={() => {
          if (start.current) {
            start.current = null;
            setRegion(null);
          }
        }}
        onPointerCancel={() => {
          start.current = null;
          setRegion(null);
        }}
      >
        {runs.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="transparent"
            stroke="#bf6a23"
            vectorEffect="non-scaling-stroke"
            role="button"
            tabIndex={candidate ? -1 : 0}
            aria-label={t("إعادة بناء النص ", "Rebuild text ") + (i + 1)}
            onClick={() => {
              if (busy || candidate) return;
              const h = r.h;
              setRegion({
                x: r.x,
                y: r.y,
                w: Math.min(width - r.x, r.w),
                h: Math.min(height - r.y, h),
              });
              setText(readableText(r.str));
              setSize(Math.max(6, Math.min(144, Math.round(r.h * 0.6))));
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                (e.currentTarget as SVGElement).dispatchEvent(
                  new MouseEvent("click", { bubbles: true }),
                );
            }}
          />
        ))}
        {region && (
          <rect
            x={region.x}
            y={region.y}
            width={region.w}
            height={region.h}
            fill="#ffae0022"
            stroke="#e58500"
            pointerEvents="none"
          />
        )}
      </svg>
      {region && region.w > 4 && region.h > 4 && (
        <form
          className="ps-rebuild-form"
          inert={!!candidate}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const rebuilt = await rebuildTextRegion(
                bytes,
                source,
                region,
                text,
                size,
                color,
                background,
              );
              const { doc } = await openPdf(
                new File([rebuilt.slice().buffer], "preview.pdf"),
              );
              try {
                const canvas = await pageCanvas(doc, source, 1500);
                setCandidate({
                  bytes: rebuilt,
                  preview: canvas.toDataURL("image/png"),
                });
              } finally {
                await doc.destroy();
              }
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            {t(
              "راجع حدود التغطية؛ قد تحتاج لتوسيعها لتشمل ذيول الحروف، دون مسح نص مجاور.",
              "Review coverage bounds, including descenders, without covering neighboring content.",
            )}
          </p>
          {(["x", "y", "w", "h"] as const).map((key) => (
            <label key={key}>
              {key}
              <input
                aria-label={`Rebuild region ${key}`}
                type="number"
                min={key === "w" || key === "h" ? 1 : 0}
                step="0.1"
                value={region[key]}
                disabled={busy}
                onChange={(e) =>
                  setRegion({ ...region, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <textarea
            aria-label={t("نص إعادة البناء", "Rebuild replacement text")}
            value={text}
            maxLength={3000}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
          />
          <label>
            {t("الحجم", "Size")}
            <input
              aria-label="Rebuild font size"
              type="number"
              min="6"
              max="144"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </label>
          <label>
            {t("النص", "Text")}
            <input
              aria-label="Rebuild text color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <label>
            {t("الخلفية", "Background")}
            <input
              aria-label="Rebuild background color"
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            {t("تطبيق إعادة البناء", "Apply rebuild")}
          </button>
          <button disabled={busy} type="button" onClick={() => setRegion(null)}>
            {t("إلغاء", "Cancel")}
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      {candidate && (
        <div
          className="ps-rebuild-review"
          role="region"
          aria-label={t("مراجعة إعادة البناء", "Rebuild preview")}
        >
          <p>
            {t(
              "راجع الصفحة الجديدة قبل الاعتماد: الخط والخلفية قد يختلفان، والصفحة ستصبح صورة غير قابلة للبحث. الإضافات الحالية تُعرض مجددًا بعد التطبيق.",
              "Review the rebuilt page before applying: font/background may differ, and this page becomes non-searchable. Existing annotations are shown again after applying.",
            )}
          </p>
          <img
            src={candidate.preview}
            alt={t("معاينة الصفحة المعاد بناؤها", "Rebuilt page preview")}
          />
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (
                !window.confirm(
                  t(
                    "تطبيق إعادة البناء؟ ستتحول هذه الصفحة إلى صورة. يمكنك التراجع عن تعديل النص.",
                    "Apply rebuild? This page becomes an image. Text undo is available.",
                  ),
                )
              )
                return;
              setBusy(true);
              setError("");
              try {
                await commit(candidate.bytes);
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          >
            {t("اعتماد إعادة البناء", "Confirm rebuild")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setCandidate(null)}
          >
            {t("رجوع دون تطبيق", "Back without applying")}
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
