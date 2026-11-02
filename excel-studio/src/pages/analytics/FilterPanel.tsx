import { useState } from "react";
import { Plus, X, Filter, RotateCcw } from "lucide-react";
import { useStudio } from "../../app/context";
import type { BIFilter } from "../../core/analyticsTypes";
import type { BIField, BIRow } from "../../core/analytics";
import { uid } from "../../core/workbook";
export function FilterPanel({
  fields,
  rows,
  filters,
  onChange,
}: {
  fields: BIField[];
  rows: BIRow[];
  filters: BIFilter[];
  onChange: (f: BIFilter[]) => void;
}) {
  const { t } = useStudio(),
    [field, setField] = useState(fields[0]?.id || "A"),
    [op, setOp] = useState<BIFilter["op"]>("eq"),
    [value, setValue] = useState(""),
    [second, setSecond] = useState(""),
    [expanded, setExpanded] = useState(false);
  const values = [...new Set(rows.map((r) => String(r.values[field] ?? "")))]
    .filter(Boolean)
    .slice(0, 300);
  return (
    <section className="bi-filters">
      <div className="bi-filter-top">
        <span>
          <Filter size={16} />
          {t("فلاتر التقرير", "Report filters")}
          <b>{filters.length}</b>
        </span>
        <button className="xs-button" onClick={() => setExpanded(!expanded)}>
          {expanded ? t("إخفاء", "Hide") : t("إضافة فلتر", "Add filter")}
          <Plus size={14} />
        </button>
        {filters.length > 0 && (
          <button
            className="xs-icon"
            onClick={() => onChange([])}
            aria-label={t("مسح كل الفلاتر", "Clear all filters")}
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="bi-filter-builder">
          <select
            aria-label={t("عمود الفلتر", "Filter field")}
            value={field}
            onChange={(e) => {
              setField(e.target.value);
              setValue("");
            }}
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} ({f.id})
              </option>
            ))}
          </select>
          <select
            aria-label={t("شرط الفلتر", "Filter condition")}
            value={op}
            onChange={(e) => {
              setOp(e.target.value as BIFilter["op"]);
              setValue("");
            }}
          >
            {[
              ["eq", "يساوي", "Equals"],
              ["contains", "يحتوي", "Contains"],
              ["gt", "أكبر من", "Greater than"],
              ["lt", "أقل من", "Less than"],
              ["between", "بين رقمين", "Numeric range"],
              ["empty", "فارغ", "Empty"],
              ["notempty", "غير فارغ", "Not empty"],
            ].map(([v, ar, en]) => (
              <option key={v} value={v}>
                {t(ar, en)}
              </option>
            ))}
          </select>
          {op === "eq" ? (
            <select
              value={value}
              aria-label={t("قيمة الفلتر", "Filter value")}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">{t("اختار قيمة", "Choose a value")}</option>
              {values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            !["empty", "notempty"].includes(op) && (
              <input
                aria-label={t("قيمة الفلتر", "Filter value")}
                value={value}
                type={["gt", "lt", "between"].includes(op) ? "number" : "text"}
                onChange={(e) => setValue(e.target.value)}
              />
            )
          )}{" "}
          {op === "between" && (
            <input
              aria-label={t("نهاية النطاق", "Range end")}
              type="number"
              value={second}
              onChange={(e) => setSecond(e.target.value)}
            />
          )}
          <button
            className="xs-button primary"
            disabled={
              filters.length >= 8 ||
              (!["empty", "notempty"].includes(op) && value === "") ||
              (op === "between" &&
                (second === "" || Number(second) < Number(value)))
            }
            onClick={() => {
              onChange([
                ...filters,
                { id: uid(), field, op, value, value2: second },
              ]);
              setExpanded(false);
            }}
          >
            {t("تطبيق", "Apply")}
          </button>
        </div>
      )}
      <div className="bi-filter-chips">
        {filters.length ? (
          filters.map((f) => (
            <button
              key={f.id}
              onClick={() => onChange(filters.filter((v) => v.id !== f.id))}
            >
              {fields.find((v) => v.id === f.field)?.label || f.field}: {f.op}{" "}
              {f.value}
              {f.op === "between" ? " → " + f.value2 : ""}
              <X size={12} />
            </button>
          ))
        ) : (
          <small>
            {t(
              "كل البيانات معروضة. اضغط أي فئة في رسم لتصفية التقرير كله.",
              "Showing all data. Click a chart category to filter the entire report.",
            )}
          </small>
        )}
      </div>
    </section>
  );
}
