import {
  Copy,
  Trash2,
  Paintbrush,
  ClipboardCheck,
  Maximize,
  Minimize,
} from "lucide-react";
import { useDesigner } from "./state";
import { fonts } from "./fonts";
/** شريط مختصر يعمل على الحالة الحقيقية، لا يكرر المشروع في حالة محلية. */
export default function QuickEdit() {
  const s = useDesigner(),
    n = s.doc.nodes.find((n) => s.selected.includes(n.id));
  return (
    <div className="ld-quick-edit" aria-label={s.t("تعديل سريع", "Quick edit")}>
      <button
        aria-label={s.t(
          s.previewOnly ? "إظهار الأدوات" : "معاينة ملء الشاشة",
          s.previewOnly ? "Show tools" : "Full screen preview",
        )}
        onClick={() => s.setPreviewOnly(!s.previewOnly)}
      >
        {s.previewOnly ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
      {n && !s.previewOnly && (
        <>
          {n.kind === "text" && (
            <button
              aria-label={s.t("تحرير النص مباشرة", "Edit text directly")}
              disabled={n.locked}
              onClick={() => s.setTextEditing(n.id)}
            >
              T
            </button>
          )}
          <input
            type="color"
            aria-label={s.t("لون سريع", "Quick color")}
            value={n.fill}
            disabled={n.locked}
            onChange={(e) => s.patch({ fill: e.target.value, recolor: true })}
          />
          {n.kind === "text" ? (
            <>
              <select
                aria-label={s.t("خط سريع", "Quick font")}
                value={n.font}
                disabled={n.locked}
                onChange={(e) => s.patch({ font: e.target.value })}
              >
                {fonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <input
                aria-label={s.t("حجم سريع", "Quick font size")}
                type="number"
                min={4}
                max={600}
                value={n.fontSize}
                disabled={n.locked}
                onChange={(e) => {
                  if (
                    e.target.valueAsNumber >= 4 &&
                    e.target.valueAsNumber <= 600
                  )
                    s.patch({ fontSize: e.target.valueAsNumber });
                }}
              />
            </>
          ) : (
            <input
              aria-label={s.t("دوران سريع", "Quick rotation")}
              type="number"
              min={-360}
              max={360}
              value={Math.round(n.rotation)}
              disabled={n.locked}
              onChange={(e) => {
                if (Number.isFinite(e.target.valueAsNumber))
                  s.patch({
                    rotation: Math.max(
                      -360,
                      Math.min(360, e.target.valueAsNumber),
                    ),
                  });
              }}
            />
          )}
          <button
            aria-label={s.t("نسخ الستايل", "Copy style")}
            onClick={s.copyStyle}
          >
            <Paintbrush size={16} />
          </button>
          <button
            aria-label={s.t("لصق الستايل", "Paste style")}
            disabled={!s.styleClipboard || n.locked}
            onClick={s.pasteStyle}
          >
            <ClipboardCheck size={16} />
          </button>
          <button
            aria-label={s.t("تكرار سريع", "Quick duplicate")}
            onClick={s.duplicate}
          >
            <Copy size={16} />
          </button>
          <button
            aria-label={s.t("حذف سريع", "Quick delete")}
            disabled={n.locked}
            onClick={s.remove}
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  );
}
