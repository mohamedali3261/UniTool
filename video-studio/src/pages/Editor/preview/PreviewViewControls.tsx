import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  ScanLine,
  Hand,
  Grid3X3,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import type { usePreviewViewport } from "./usePreviewViewport";
export function PreviewViewControls({
  viewport: v,
  onSnapshot,
  onStep,
  disabled,
}: {
  viewport: ReturnType<typeof usePreviewViewport>;
  onSnapshot: () => Promise<void>;
  onStep: (direction: number) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false),
    [message, setMessage] = useState("");
  const button = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = button.current?.getBoundingClientRect(),
        el = panel.current;
      if (!r || !el) return;
      el.style.width = `${Math.min(290, innerWidth - 16)}px`;
      el.style.right = `${Math.max(8, Math.min(innerWidth - r.right, innerWidth - 298))}px`;
      el.style.bottom = `${innerHeight - r.top + 6}px`;
      el.style.maxHeight = `${Math.max(100, Math.min(380, r.top - 12))}px`;
    };
    place();
    panel.current?.focus({ preventScroll: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (
        !button.current?.contains(e.target as Node) &&
        !panel.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <>
      <button
        data-preview-tools
        ref={button}
        className="preview-view-toggle"
        aria-label="خيارات عرض المعاينة"
        aria-expanded={open}
        aria-controls="preview-view-panel"
        onClick={() => setOpen(!open)}
      >
        {v.panning && v.view.zoom > 1 ? <Hand size={14} /> : <ZoomIn size={14} />}
        <span dir="ltr">{Math.round(v.view.zoom * 100)}%</span>
      </button>
      {open &&
        createPortal(
          <div
            data-preview-tools
            id="preview-view-panel"
            className="preview-view-panel"
            ref={panel}
            role="region"
            tabIndex={-1}
            aria-label="خيارات عرض المعاينة"
            dir="rtl"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
              }
            }}
          >
            <header>
              <b>عرض المعاينة</b>
              <IconButton
                icon={X}
                label="إغلاق خيارات المعاينة"
                onClick={close}
              />
            </header>
            <div className="preview-view-row">
              <IconButton
                icon={ZoomOut}
                label="تصغير المعاينة"
                onClick={() => v.zoomTo(v.view.zoom / 1.25)}
              />
              <input
                type="range"
                min="25"
                max="400"
                step="5"
                aria-label="تكبير المعاينة"
                value={v.view.zoom * 100}
                onChange={(e) => v.zoomTo(+e.target.value / 100)}
              />
              <IconButton
                icon={ZoomIn}
                label="تكبير المعاينة"
                onClick={() => v.zoomTo(v.view.zoom * 1.25)}
              />
            </div>
            <div className="preview-view-row">
              {[0.5, 1, 2, 4].map((z) => (
                <button
                  key={z}
                  aria-label={`زوم المعاينة ${z * 100}%`}
                  aria-pressed={v.view.zoom === z}
                  onClick={() => v.zoomTo(z)}
                >
                  {z * 100}%
                </button>
              ))}
            </div>
            <div className="preview-view-actions">
              <button onClick={v.fit}>
                <ScanLine size={16} />
                ملاءمة وتوسيط
              </button>
              <button
                disabled={v.view.zoom <= 1}
                aria-pressed={v.panning}
                onClick={() => v.setPanning(!v.panning)}
              >
                <Hand size={16} />
                تحريك العرض
              </button>
              <button
                aria-pressed={v.guides}
                onClick={() => v.setGuides(!v.guides)}
              >
                <Grid3X3 size={16} />
                شبكة وهوامش آمنة
              </button>
              <button
                disabled={disabled}
                onClick={async () => {
                  try {
                    await onSnapshot();
                    setMessage("تم حفظ لقطة PNG بدون الزوم أو خطوط المساعدة");
                  } catch {
                    setMessage(
                      "تعذّر حفظ اللقطة؛ انتظر تحميل المشهد وحاول تاني",
                    );
                  }
                }}
              >
                <Camera size={16} />
                حفظ لقطة PNG
              </button>
            </div>
            <div className="preview-view-row">
              <IconButton
                icon={ChevronLeft}
                label="الفريم السابق"
                disabled={disabled}
                onClick={() => onStep(-1)}
              />
              <span>فريم واحد · 30 FPS</span>
              <IconButton
                icon={ChevronRight}
                label="الفريم التالي"
                disabled={disabled}
                onClick={() => onStep(1)}
              />
            </div>
            <p>
              100% = ملاءمة المساحة · Ctrl/⌘ + عجلة الماوس للزوم. الزوم والشبكة
              للمعاينة بس، مش للتصدير.
            </p>
            {message && <p role="status">{message}</p>}
          </div>,
          document.fullscreenElement || document.body,
        )}
    </>
  );
}
