import { useEffect, useRef, useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { timeLabel } from "../types";
import { stockSource } from "./mediaSource";
import type { StockItem, StockQuality } from "./types";
export function StockPreview({
  item,
  quality,
  onClose,
  onAdd,
  disabled,
  progress,
  onCancel,
  isImporting,
  imported,
}: {
  item: StockItem;
  quality: StockQuality;
  onClose: () => void;
  onAdd: () => void;
  disabled: boolean;
  progress: number | null;
  onCancel: () => void;
  isImporting: boolean;
  imported: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const source = stockSource(item, quality);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="stock-preview-dialog"
      ref={ref}
      aria-labelledby="stock-preview-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const box = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom
        )
          onClose();
      }}
    >
      <header>
        <div>
          <span className="stock-eyebrow">PEXELS • معاينة</span>
          <h3 id="stock-preview-title">{item.title}</h3>
        </div>
        <button autoFocus aria-label="إغلاق المعاينة" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="stock-preview-media">
        {failed ? (
          <p role="status">
            تعذّرت المعاينة. ممكن تجرب الإضافة أو تختار نتيجة أخرى.
          </p>
        ) : item.kind === "video" ? (
          <video
            src={source.url}
            poster={item.thumbnail}
            crossOrigin="anonymous"
            controls
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={source.url}
            alt={item.title}
            crossOrigin="anonymous"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="stock-preview-meta">
        <span dir="ltr">
          {source.width} × {source.height}
          {item.kind === "video" ? ` • ${timeLabel(item.duration)}` : " • صورة"}
        </span>
        <a href={item.authorUrl} target="_blank" rel="noopener noreferrer">
          {item.author} <ExternalLink size={13} />
        </a>
      </div>
      <p className="stock-preview-note">
        {imported
          ? "موجود في ملفاتك — هنستخدم النسخة المحلية بدون تنزيل جديد."
          : "هتتنزّل نسخة على جهازك وتُضاف للخط الزمني. تقدر تقصّها وتضيف نصوص وتأثيرات عليها."}
      </p>
      <footer>
        <a href={item.pageUrl} target="_blank" rel="noopener noreferrer">
          عرض على Pexels <ExternalLink size={14} />
        </a>
        {isImporting ? (
          <button className="secondary" onClick={onCancel}>
            إلغاء التنزيل{" "}
            {progress !== null ? `${Math.round(progress * 100)}%` : "…"}
          </button>
        ) : (
          <button className="primary" disabled={disabled} onClick={onAdd}>
            <Plus size={17} />
            إضافة للخط الزمني
          </button>
        )}
      </footer>
    </dialog>
  );
}
