import {
  Minus,
  Plus,
  Maximize,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import type { Translate } from "../../core/types";
export function CanvasToolbar({
  index,
  count,
  select,
  zoom,
  setZoom,
  rotate,
  panel,
  setPanel,
  t,
}: {
  index: number;
  count: number;
  select: (i: number) => void;
  zoom: number;
  setZoom: (n: number) => void;
  rotate: () => void;
  panel: string;
  setPanel: (p: string) => void;
  t: Translate;
}) {
  return (
    <div className="ps-canvas-toolbar">
      <div className="ps-mobile-panels">
        {[
          ["pages", t("الصفحات", "Pages")],
          ["tools", t("الأدوات", "Tools")],
          ["text", t("النص وOCR", "Text & OCR")],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={panel === id}
            onClick={() => setPanel(panel === id ? "" : id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="ps-canvas-controls">
        <div>
          <button
            aria-label={t("الصفحة السابقة", "Previous page")}
            disabled={index === 0}
            onClick={() => select(index - 1)}
          >
            <ChevronRight size={16} />
          </button>
          <span>
            {index + 1} <small>/ {count}</small>
          </span>
          <button
            aria-label={t("الصفحة التالية", "Next page")}
            disabled={index + 1 === count}
            onClick={() => select(index + 1)}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <i />
        <div>
          <button
            aria-label={t("تصغير", "Zoom out")}
            disabled={zoom <= 0.5}
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label={t("تكبير", "Zoom in")}
            disabled={zoom >= 2}
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            <Plus size={15} />
          </button>
          <button
            aria-label={t("ملاءمة العرض", "Fit width")}
            onClick={() => setZoom(1)}
          >
            <Maximize size={13} />
          </button>
        </div>
        <i />
        <button
          aria-label={t("تدوير الصفحة الحالية", "Rotate current page")}
          onClick={rotate}
        >
          <RotateCw size={14} />
        </button>
      </div>
      <span className="ps-live-chip">
        <i />
        {t("عرض الأصل", "ORIGINAL RENDER")}
      </span>
    </div>
  );
}
