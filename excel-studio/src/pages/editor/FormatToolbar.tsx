import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PaintBucket,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Copy,
  Clipboard,
  Trash2,
  ArrowDownToLine,
  Plus,
} from "lucide-react";
import { useStudio } from "../../app/context";
import { themes, type Sheet, type Cell } from "../../core/types";
export function FormatToolbar({
  sheet,
  cell,
  format,
  onSheet,
  sort,
  copy,
  clear,
  fill,
  addRows,
  addCols,
}: {
  sheet: Sheet;
  cell?: Cell;
  format: (patch: Partial<Cell>) => void;
  onSheet: (patch: Partial<Sheet>) => void;
  sort: (desc: boolean) => void;
  copy: () => void;
  clear: () => void;
  fill: () => void;
  addRows: () => void;
  addCols: () => void;
}) {
  const { t } = useStudio();
  return (
    <div
      className="xs-toolbar"
      role="toolbar"
      aria-label={t("تنسيق الجدول", "Table formatting")}
    >
      <div className="xs-tool-group">
        <button
          className={"xs-icon " + (cell?.bold ? "pressed" : "")}
          aria-label={t("عريض", "Bold")}
          aria-pressed={!!cell?.bold}
          onClick={() => format({ bold: !cell?.bold })}
        >
          <Bold size={16} />
        </button>
        <button
          className={"xs-icon " + (cell?.italic ? "pressed" : "")}
          aria-label={t("مائل", "Italic")}
          aria-pressed={!!cell?.italic}
          onClick={() => format({ italic: !cell?.italic })}
        >
          <Italic size={16} />
        </button>
        <label className="xs-color" title={t("لون الخلية", "Cell fill")}>
          <PaintBucket size={16} />
          <input
            type="color"
            aria-label={t("لون الخلية", "Cell fill")}
            value={cell?.fill || "#e6f4ed"}
            onChange={(e) => format({ fill: e.target.value })}
          />
        </label>
        <label className="xs-color" title={t("لون النص", "Text color")}>
          <span className="xs-text-color">A</span>
          <input
            type="color"
            aria-label={t("لون النص", "Text color")}
            value={cell?.color || "#273a35"}
            onChange={(e) => format({ color: e.target.value })}
          />
        </label>
      </div>
      <div className="xs-tool-group">
        {(
          [
            { id: "left", icon: AlignLeft },
            { id: "center", icon: AlignCenter },
            { id: "right", icon: AlignRight },
          ] as const
        ).map((a) => (
          <button
            key={a.id}
            className={"xs-icon " + (cell?.align === a.id ? "pressed" : "")}
            onClick={() => format({ align: a.id })}
            aria-label={t("محاذاة", "Align") + " " + a.id}
          >
            <a.icon size={15} />
          </button>
        ))}
      </div>
      <select
        aria-label={t("تنسيق الرقم", "Number format")}
        value={cell?.format || "auto"}
        onChange={(e) => format({ format: e.target.value as Cell["format"] })}
      >
        <option value="auto">{t("تلقائي", "General")}</option>
        <option value="number">{t("رقم", "Number")}</option>
        <option value="currency">{t("عملة", "Currency")}</option>
        <option value="percent">{t("نسبة مئوية", "Percentage")}</option>
        <option value="date">{t("تاريخ", "Date")}</option>
      </select>
      <select
        aria-label={t("مظهر الجدول", "Table theme")}
        value={sheet.theme}
        onChange={(e) => onSheet({ theme: e.target.value })}
      >
        {Object.entries(themes).map(([id, v]) => (
          <option key={id} value={id}>
            {v.name}
          </option>
        ))}
      </select>
      <div className="xs-tool-group">
        <button
          className="xs-icon"
          onClick={() => sort(false)}
          title={t(
            "ترتيب تصاعدي بالعمود المحدد",
            "Sort selected column ascending",
          )}
          aria-label={t("ترتيب تصاعدي", "Sort ascending")}
        >
          <ArrowDownWideNarrow size={17} />
        </button>
        <button
          className="xs-icon"
          onClick={() => sort(true)}
          aria-label={t("ترتيب تنازلي", "Sort descending")}
        >
          <ArrowUpWideNarrow size={17} />
        </button>
        <button
          className="xs-icon"
          onClick={fill}
          title={t(
            "حدد عدة صفوف لتعبئة أول صف لأسفل",
            "Select rows to fill down",
          )}
          aria-label={t("تعبئة لأسفل", "Fill down")}
        >
          <ArrowDownToLine size={16} />
        </button>
        <button
          className="xs-icon"
          onClick={copy}
          aria-label={t("نسخ النطاق", "Copy range")}
        >
          <Copy size={15} />
        </button>
        <button
          className="xs-icon"
          onClick={clear}
          aria-label={t("مسح النطاق", "Clear range")}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <button className="xs-tool-text" onClick={addRows}>
        <Plus size={14} />
        {t("صفوف", "Rows")}
      </button>
      <button className="xs-tool-text" onClick={addCols}>
        <Plus size={14} />
        {t("عمود", "Column")}
      </button>
    </div>
  );
}
