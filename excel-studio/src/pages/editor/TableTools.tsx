import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  WrapText,
  Code2,
  BarChart3,
} from "lucide-react";
import { useStudio } from "../../app/context";
import { Modal } from "../../components/Modal";
import { colName, refs, position } from "../../core/address";
import { replaceCells } from "../../core/tableFeatures";
import { applyCells, uid } from "../../core/workbook";
import type { Sheet, Selection } from "../../core/types";
import type {
  ConditionalRule,
  ValidationRule,
} from "../../core/analyticsTypes";
export function TableTools({
  sheet,
  selection,
  patch,
}: {
  sheet: Sheet;
  selection: Selection;
  patch: (p: Partial<Sheet>) => void;
}) {
  const { t, update, navigate, notice } = useStudio(),
    [panel, setPanel] = useState<"replace" | "rules" | null>(null),
    [find, setFind] = useState(""),
    [replacement, setReplacement] = useState(""),
    [whole, setWhole] = useState(false),
    [sensitive, setSensitive] = useState(false),
    [selected, setSelected] = useState(false),
    [column, setColumn] = useState(position(selection.end).col),
    [type, setType] = useState<ValidationRule["type"]>("number"),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [required, setRequired] = useState(false),
    [options, setOptions] = useState(""),
    [op, setOp] = useState<ConditionalRule["op"]>("gt"),
    [value, setValue] = useState(""),
    [value2, setValue2] = useState(""),
    [fill, setFill] = useState("#fff1d7"),
    [color, setColor] = useState("#8b631f");
  const matches = replaceCells(
    sheet,
    find,
    replacement,
    sensitive,
    whole,
    selected ? refs(selection.anchor, selection.end) : undefined,
  );
  return (
    <>
      <div className="xs-table-tools">
        <button
          className={"xs-button " + (sheet.wrap ? "is-active" : "")}
          aria-pressed={!!sheet.wrap}
          onClick={() => patch({ wrap: !sheet.wrap })}
        >
          <WrapText size={14} />
          {t("التفاف النص", "Wrap text")}
        </button>
        <button
          className="xs-button"
          aria-pressed={!!sheet.showFormulas}
          onClick={() => patch({ showFormulas: !sheet.showFormulas })}
        >
          <Code2 size={14} />
          {t("إظهار المعادلات", "Show formulas")}
        </button>
        <button className="xs-button" onClick={() => setPanel("replace")}>
          <Search size={14} />
          {t("بحث واستبدال", "Find & replace")}
        </button>
        <button
          className="xs-button"
          onClick={() => {
            setColumn(position(selection.end).col);
            setPanel("rules");
          }}
        >
          <SlidersHorizontal size={14} />
          {t("قواعد وتنسيق شرطي", "Rules & conditional format")}
        </button>
        <button className="xs-button" onClick={() => navigate("analytics")}>
          <BarChart3 size={14} />
          {t("تحليل البيانات", "Analytics")}
        </button>
        <small>
          {t(
            "اسحب حافة عنوان العمود لتغيير عرضه",
            "Drag column-header edges to resize",
          )}
        </small>
      </div>
      {panel === "replace" && (
        <Modal
          title={t("بحث واستبدال آمن", "Safe find & replace")}
          onClose={() => setPanel(null)}
        >
          <div className="xs-form-grid">
            <label>
              {t("ابحث عن", "Find")}
              <input
                value={find}
                maxLength={500}
                onChange={(e) => setFind(e.target.value)}
              />
            </label>
            <label>
              {t("استبدل بـ", "Replace with")}
              <input
                value={replacement}
                maxLength={2000}
                onChange={(e) => setReplacement(e.target.value)}
              />
            </label>
          </div>
          <div className="xs-tools-checks">
            {[
              [whole, setWhole, t("خلية كاملة", "Whole cell")],
              [sensitive, setSensitive, t("حالة الحروف", "Case sensitive")],
              [selected, setSelected, t("النطاق المحدد فقط", "Selection only")],
            ].map(([v, set, label]) => (
              <label key={String(label)}>
                <input
                  type="checkbox"
                  checked={v as boolean}
                  onChange={(e) =>
                    (set as (v: boolean) => void)(e.target.checked)
                  }
                />
                {String(label)}
              </label>
            ))}
          </div>
          <p className="xs-hint">
            {t(
              "لا يتم تعديل المعادلات. الاستبدال عملية واحدة قابلة للتراجع، وتطبق قواعد التحقق.",
              "Formulas are never changed. Replacement is one undoable operation and respects validation rules.",
            )}
          </p>
          <p>
            {Object.keys(matches).length}{" "}
            {t("خلية ستتغير", "cells will change")}
          </p>
          <div className="xs-replace-preview">
            {Object.keys(matches)
              .slice(0, 8)
              .map((ref) => (
                <div key={ref}>
                  <b>{ref}</b>
                  <del>{sheet.cells[ref]?.raw}</del>
                  <span>→ {matches[ref].raw || "∅"}</span>
                </div>
              ))}
          </div>
          <button
            className="xs-button primary"
            disabled={!Object.keys(matches).length}
            onClick={() => {
              update((b) => applyCells(b, sheet.id, matches));
              setPanel(null);
            }}
          >
            {t("تطبيق الاستبدال", "Apply replacements")}
          </button>
        </Modal>
      )}
      {panel === "rules" && (
        <Modal
          title={t("قواعد الجدول", "Table rules")}
          onClose={() => setPanel(null)}
        >
          <label className="xs-rule-column">
            {t("العمود", "Column")}
            <select
              value={column}
              onChange={(e) => setColumn(Number(e.target.value))}
            >
              {Array.from({ length: sheet.cols }, (_, c) => (
                <option key={c} value={c}>
                  {colName(c)} ·{" "}
                  {sheet.cells[colName(c) + "1"]?.raw ||
                    t("بدون عنوان", "Untitled")}
                </option>
              ))}
            </select>
          </label>
          <h3>{t("التحقق من الإدخال", "Input validation")}</h3>
          <p className="xs-hint">
            {t(
              "تطبق على الإدخالات الجديدة واللصق، لا على صف العناوين. المعادلات مسموحة ولا يتم حظر ناتجها. لا تغيّر القيم الحالية.",
              "Applies to new entries and paste, excluding headers. Formulas are allowed without validating their results. Existing data is unchanged.",
            )}
          </p>
          <div className="xs-form-grid">
            <label>
              {t("نوع القاعدة", "Rule type")}
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as ValidationRule["type"])
                }
              >
                <option value="number">{t("رقم", "Number")}</option>
                <option value="list">{t("قائمة", "List")}</option>
                <option value="date">
                  {t("تاريخ YYYY-MM-DD", "Date YYYY-MM-DD")}
                </option>
              </select>
            </label>
            {type === "list" ? (
              <label>
                {t(
                  "القيم المسموحة (مفصولة بفاصلة)",
                  "Allowed values (comma-separated)",
                )}
                <input
                  value={options}
                  maxLength={3000}
                  onChange={(e) => setOptions(e.target.value)}
                />
              </label>
            ) : type === "number" ? (
              <>
                <label>
                  {t("الحد الأدنى (اختياري)", "Minimum (optional)")}
                  <input
                    type="number"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                  />
                </label>
                <label>
                  {t("الحد الأقصى (اختياري)", "Maximum (optional)")}
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                  />
                </label>
              </>
            ) : null}
          </div>
          <label className="xs-tools-checkbox">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            {t("القيمة مطلوبة", "Required value")}
          </label>
          <button
            className="xs-button"
            onClick={() => {
              if (
                type === "number" &&
                min !== "" &&
                max !== "" &&
                Number(min) > Number(max)
              ) {
                notice(
                  t("الحد الأدنى أكبر من الأقصى", "Minimum exceeds maximum"),
                );
                return;
              }
              const opts = options
                .split(/[,،]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 100);
              if (type === "list" && !opts.length) {
                notice(
                  t(
                    "اكتب قيمة واحدة على الأقل",
                    "Enter at least one allowed value",
                  ),
                );
                return;
              }
              patch({
                validation: [
                  ...(sheet.validation || []).filter(
                    (r) => r.column !== column,
                  ),
                  {
                    column,
                    type,
                    min: min === "" ? undefined : Number(min),
                    max: max === "" ? undefined : Number(max),
                    options: opts,
                    required,
                  },
                ],
              });
            }}
          >
            {t("حفظ قاعدة العمود", "Save column rule")}
          </button>
          <div className="xs-rule-list">
            {sheet.validation?.map((r) => (
              <div key={r.column}>
                <span>
                  {colName(r.column)} · {r.type} {r.required ? "*" : ""}{" "}
                  {r.options?.join(", ")}{" "}
                  {r.min !== undefined ? "≥" + r.min : ""}{" "}
                  {r.max !== undefined ? "≤" + r.max : ""}
                </span>
                <button
                  className="xs-button"
                  onClick={() =>
                    patch({
                      validation: sheet.validation?.filter(
                        (v) => v.column !== r.column,
                      ),
                    })
                  }
                >
                  {t("إزالة", "Remove")}
                </button>
              </div>
            ))}
          </div>
          <hr />
          <h3>{t("تنسيق شرطي", "Conditional formatting")}</h3>
          <p className="xs-hint">
            {t(
              "أول قاعدة مطابقة لها الأولوية، وتستبعد العناوين. حتى 8 قواعد.",
              "First matching rule wins, excluding headers. Up to 8 rules.",
            )}
          </p>
          <div className="xs-form-grid">
            <label>
              {t("الشرط", "Condition")}
              <select
                value={op}
                onChange={(e) => setOp(e.target.value as ConditionalRule["op"])}
              >
                <option value="gt">{t("أكبر من", "Greater than")}</option>
                <option value="lt">{t("أصغر من", "Less than")}</option>
                <option value="between">{t("بين قيمتين", "Between")}</option>
                <option value="duplicates">
                  {t("قيم مكررة", "Duplicate values")}
                </option>
                <option value="empty">{t("خلايا فارغة", "Empty cells")}</option>
                <option value="contains">
                  {t("نص يحتوي", "Text contains")}
                </option>
              </select>
            </label>
            {!["empty", "duplicates"].includes(op) && (
              <label>
                {t("القيمة", "Value")}
                <input
                  type={op === "contains" ? "text" : "number"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
            )}
            {op === "between" && (
              <label>
                {t("القيمة الثانية", "Second value")}
                <input
                  type="number"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                />
              </label>
            )}
            <label>
              {t("الخلفية", "Background")}
              <input
                type="color"
                value={fill}
                onChange={(e) => setFill(e.target.value)}
              />
            </label>
            <label>
              {t("النص", "Text")}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
          </div>
          <button
            className="xs-button"
            disabled={(sheet.conditional?.length || 0) >= 8}
            onClick={() => {
              if (
                (!["empty", "duplicates"].includes(op) && !value) ||
                (op === "between" &&
                  (!value2 || Number(value) > Number(value2)))
              ) {
                notice(t("راجع قيم الشرط", "Check the condition values"));
                return;
              }
              patch({
                conditional: [
                  ...(sheet.conditional || []),
                  { id: uid(), column, op, value, value2, fill, color },
                ],
              });
            }}
          >
            {t("إضافة التنسيق", "Add formatting")}
          </button>
          <div className="xs-rule-list">
            {sheet.conditional?.map((r) => (
              <div key={r.id}>
                <span style={{ background: r.fill, color: r.color }}>
                  {colName(r.column)} · {r.op} {r.value} {r.value2}
                </span>
                <button
                  className="xs-button"
                  onClick={() =>
                    patch({
                      conditional: sheet.conditional?.filter(
                        (v) => v.id !== r.id,
                      ),
                    })
                  }
                >
                  {t("إزالة", "Remove")}
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
