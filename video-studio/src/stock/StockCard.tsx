import { memo } from "react";
import { Eye, Film, Plus, Check } from "lucide-react";
import { timeLabel } from "../types";
import type { StockItem } from "./types";
export const StockCard = memo(function StockCard({
  item,
  onPreview,
  onAdd,
  disabled,
  imported,
}: {
  item: StockItem;
  onPreview: (item: StockItem) => void;
  onAdd: (item: StockItem) => void;
  disabled: boolean;
  imported: boolean;
}) {
  return (
    <article className="stock-card">
      <button
        className="stock-card-preview"
        onClick={() => onPreview(item)}
        aria-label={`معاينة ${item.title}`}
      >
        <img
          src={item.thumbnail}
          alt={item.title}
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
        />
        <span className="stock-preview-icon">
          <Eye size={18} />
        </span>
        {item.kind === "video" && (
          <span className="stock-duration">
            <Film size={12} />
            {timeLabel(item.duration)}
          </span>
        )}
        {imported && (
          <span className="stock-imported">
            <Check size={12} /> في ملفاتك
          </span>
        )}
      </button>
      <div className="stock-card-footer">
        <span title={item.author}>{item.author}</span>
        <button
          disabled={disabled}
          onClick={() => onAdd(item)}
          aria-label={`إضافة ${item.title} للخط الزمني`}
          title={
            imported
              ? "إضافة نسخة من الملف المحلي دون تنزيل جديد"
              : "إضافة للخط الزمني"
          }
        >
          <Plus size={17} />
        </button>
      </div>
    </article>
  );
});
