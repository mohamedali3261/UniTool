import { GeometryFields } from "./GeometryFields";
import { useEffect, useState } from "react";
import { Trash2, Layers, AlertTriangle } from "lucide-react";
import type { Annotation, Tool, Translate } from "../../core/types";
export function PropertiesPanel({
  tool,
  items,
  selected,
  setSelected,
  patch,
  remove,
  text,
  setText,
  fontSize,
  setFontSize,
  color,
  setColor,
  t,
}: {
  tool: Tool;
  items: Annotation[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  patch: (id: string, p: Partial<Annotation>) => void;
  remove: (id: string) => void;
  text: string;
  setText: (v: string) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  color: string;
  setColor: (v: string) => void;
  t: Translate;
}) {
  const item = items.find((a) => a.id === selected),
    [draft, setDraft] = useState("");
  useEffect(() => setDraft(item?.text || text), [item?.id, item?.text, text]);
  return (
    <section className="ps-properties">
      <header>
        <Layers size={15} />
        <b>{t("خصائص الإضافة", "Annotation properties")}</b>
      </header>
      {(tool === "cover" || item?.type === "cover") && (
        <div className="ps-warning">
          <AlertTriangle size={16} />
          {t(
            "الغطاء الأبيض يخفي الشكل فقط. النص تحته يظل قابلًا للاستخراج؛ ليس حجبًا أمنيًا للمعلومات.",
            "A white cover only hides visually. Underlying text can still be extracted. This is NOT secure redaction.",
          )}
        </div>
      )}
      <label>
        {t("لون الإضافة", "Annotation color")}
        <div className="ps-color-row">
          {["#b85d42", "#e7b52f", "#396e60", "#4673a6", "#303030"].map((c) => (
            <button
              key={c}
              style={{ background: c }}
              aria-label={c}
              aria-pressed={(item?.color || color) === c}
              onClick={() => {
                setColor(c);
                if (item) patch(item.id, { color: c });
              }}
            />
          ))}
        </div>
        <input
          type="color"
          aria-label={t("لون مخصص", "Custom color")}
          value={item?.color || color}
          onChange={(e) => {
            setColor(e.target.value);
            if (item) patch(item.id, { color: e.target.value });
          }}
        />
      </label>
      {(!item || item.type === "text") && (
        <>
          <label>
            {t("النص العربي أو الإنجليزي", "Arabic or English text")}
            <textarea
              dir="auto"
              maxLength={1000}
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <label>
            {t("حجم الخط", "Font size")}
            <input
              type="number"
              min={8}
              max={96}
              value={item?.fontSize || fontSize}
              onChange={(e) => {
                const size = Math.max(
                  8,
                  Math.min(96, Number(e.target.value) || 8),
                );
                setFontSize(size);
                if (item) patch(item.id, { fontSize: size, h: size * 3 });
              }}
            />
          </label>
          <button
            className="ps-button"
            onClick={() => {
              if (item) patch(item.id, { text: draft });
              else setText(draft);
            }}
          >
            {t("تطبيق النص", "Apply text")}
          </button>
          <p className="ps-hint">
            {t(
              "اضغط أداة النص ثم مكانه. النص المضاف يُصدّر كصورة شفافة لتطابق تشكيل العربي، وليس كنص قابل للبحث.",
              "Choose Add text, then click its position. Added text exports as a transparent image for consistent Arabic shaping, not searchable text.",
            )}
          </p>
        </>
      )}
      {item && <GeometryFields item={item} patch={patch} t={t} />}
      <div className="ps-layer-heading">
        {t("إضافات الصفحة", "Page additions")} <span>{items.length}</span>
      </div>
      {items.length ? (
        <div className="ps-layer-list">
          {items.map((a, i) => (
            <div key={a.id}>
              <button
                aria-pressed={a.id === selected}
                onClick={() => setSelected(a.id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {a.type === "text"
                  ? a.text?.slice(0, 24) || t("نص فارغ", "Empty text")
                  : {
                      highlight: t("تظليل", "Highlight"),
                      pen: t("رسم", "Drawing"),
                      rectangle: t("إطار", "Rectangle"),
                      cover: t("غطاء مرئي", "Visual cover"),
                    }[a.type]}
              </button>
              <button
                aria-label={t("حذف إضافة ", "Remove annotation ") + (i + 1)}
                onClick={() => remove(a.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="ps-empty-small">
          {t("لسه الصفحة زي أصلها.", "A clean page, just like the original.")}
        </div>
      )}
    </section>
  );
}
