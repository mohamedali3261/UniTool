import { useState } from "react";
import { Modal } from "../../components/Modal";
import { useStudio } from "../../app/context";
import type { BIWidget } from "../../core/analyticsTypes";
import type { BIField } from "../../core/analytics";
export function WidgetEditor({
  initial,
  fields,
  onClose,
  onSave,
}: {
  initial: BIWidget;
  fields: BIField[];
  onClose: () => void;
  onSave: (w: BIWidget) => void;
}) {
  const { t } = useStudio(),
    [w, setW] = useState(initial),
    set = (patch: Partial<BIWidget>) => setW((v) => ({ ...v, ...patch }));
  return (
    <Modal
      title={t("صمّم عنصر التحليل", "Design your visual")}
      onClose={onClose}
    >
      <label>
        {t("العنوان", "Title")}
        <input
          maxLength={100}
          value={w.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </label>
      <div className="xs-form-grid">
        <label>
          {t("نوع العنصر", "Visual type")}
          <select
            value={w.type}
            onChange={(e) => set({ type: e.target.value as BIWidget["type"] })}
          >
            {[
              ["kpi", "مؤشر رقمي", "KPI"],
              ["bar", "أعمدة", "Bars"],
              ["line", "خطي", "Line"],
              ["area", "مساحة", "Area"],
              ["donut", "دائري", "Donut"],
              ["scatter", "انتشار / ارتباط", "Scatter"],
              ["table", "جدول محوري مبسط", "Pivot summary"],
            ].map(([id, ar, en]) => (
              <option key={id} value={id}>
                {t(ar, en)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("القيمة المراد قياسها", "Measure")}
          <select
            value={w.metric}
            onChange={(e) => set({ metric: e.target.value })}
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} ({f.id}){f.numeric ? " #" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("طريقة الحساب", "Aggregation")}
          <select
            value={w.aggregation}
            onChange={(e) =>
              set({ aggregation: e.target.value as BIWidget["aggregation"] })
            }
          >
            {[
              ["sum", "مجموع", "Sum"],
              ["average", "متوسط", "Average"],
              ["count", "عدّ القيم غير الفارغة", "Count non-empty"],
              ["distinct", "عدّ القيم المختلفة", "Distinct count"],
              ["min", "أصغر قيمة", "Minimum"],
              ["max", "أكبر قيمة", "Maximum"],
            ].map(([v, ar, en]) => (
              <option key={v} value={v}>
                {t(ar, en)}
              </option>
            ))}
          </select>
        </label>
        {w.type !== "kpi" && (
          <label>
            {t("تجميع حسب", "Group by")}
            <select
              value={w.dimension}
              onChange={(e) => set({ dimension: e.target.value })}
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.id})
                </option>
              ))}
            </select>
          </label>
        )}
        {w.type === "scatter" && (
          <label>
            {t("المحور Y", "Y measure")}
            <select
              value={w.secondary || w.metric}
              onChange={(e) => set({ secondary: e.target.value })}
            >
              {fields
                .filter((f) => f.numeric)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
            </select>
          </label>
        )}
        {w.type === "kpi" ? (
          <label>
            {t("هدف اختياري (رقم موجب)", "Optional positive goal")}
            <input
              type="number"
              min={0}
              value={w.target ?? ""}
              onChange={(e) =>
                set({
                  target:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
        ) : (
          <>
            <label>
              {t("تجميع التاريخ", "Date grouping")}
              <select
                value={w.bucket}
                onChange={(e) =>
                  set({ bucket: e.target.value as BIWidget["bucket"] })
                }
              >
                <option value="none">{t("بدون", "None")}</option>
                <option value="month">{t("بالشهر", "By month")}</option>
                <option value="year">{t("بالسنة", "By year")}</option>
              </select>
            </label>
            <label>
              {t("عدد الفئات المعروضة", "Visible categories")}
              <input
                type="number"
                min={1}
                max={50}
                value={w.limit}
                onChange={(e) =>
                  set({
                    limit: Math.max(1, Math.min(50, Number(e.target.value))),
                  })
                }
              />
            </label>
            <label>
              {t("الترتيب", "Sort")}
              <select
                value={w.sort}
                onChange={(e) =>
                  set({ sort: e.target.value as BIWidget["sort"] })
                }
              >
                <option value="value-desc">
                  {t("القيمة تنازليًا", "Value descending")}
                </option>
                <option value="value-asc">
                  {t("القيمة تصاعديًا", "Value ascending")}
                </option>
                <option value="label">
                  {t("حسب اسم الفئة", "Category label")}
                </option>
              </select>
            </label>
          </>
        )}
        <label>
          {t("اللون", "Color")}
          <input
            type="color"
            value={w.color}
            onChange={(e) => set({ color: e.target.value })}
          />
        </label>
      </div>
      <label className="bi-inline-check">
        <input
          type="checkbox"
          checked={w.wide}
          onChange={(e) => set({ wide: e.target.checked })}
        />
        {t("عنصر بعرض كامل", "Full-width visual")}
      </label>
      <p className="xs-hint">
        {t(
          "المجاميع تتجاهل النص والفراغات وأخطاء المعادلات. الدائري يعرض القيم الموجبة فقط. التواريخ تقبل تسلسل Excel أو YYYY-MM-DD.",
          "Numeric aggregations ignore text, blanks and errors. Donuts show positive values only. Dates accept Excel serials or YYYY-MM-DD.",
        )}
      </p>
      {w.type === "scatter" && (
        <p className="xs-hint">
          {t(
            "الانتشار يعرض الأزواج الرقمية من الصفوف الأصلية، بدون تجميع أو ترتيب أو حد فئات، بحد أقصى 300 نقطة.",
            "Scatter shows raw numeric pairs without aggregation, sorting or category limits, up to 300 points.",
          )}
        </p>
      )}
      <div className="xs-modal-actions">
        <button
          className="xs-button primary"
          disabled={!w.title.trim()}
          onClick={() => {
            onSave(w);
            onClose();
          }}
        >
          {t("حفظ العنصر", "Save visual")}
        </button>
      </div>
    </Modal>
  );
}
