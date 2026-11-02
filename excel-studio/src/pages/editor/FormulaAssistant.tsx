import { useState } from "react";
import { Sparkles, ArrowLeft, Check, Copy } from "lucide-react";
import { Modal } from "../../components/Modal";
import { useStudio } from "../../app/context";
import type { Sheet, Workbook } from "../../core/types";
import { calculator } from "../../core/calculate";
export function FormulaAssistant({
  sheet,
  target,
  onClose,
  onApply,
}: {
  sheet: Sheet;
  target: string;
  onClose: () => void;
  onApply: (formula: string) => void;
}) {
  const { t, book, notice } = useStudio(),
    [goal, setGoal] = useState("sum"),
    [range, setRange] = useState("B2:B5"),
    [other, setOther] = useState("C2:C5"),
    [condition, setCondition] = useState(">100"),
    [yes, setYes] = useState("ناجح"),
    [no, setNo] = useState("راجع"),
    [digits, setDigits] = useState("2");
  const quote = (s: string) => '"' + s.replace(/"/g, '""') + '"';
  const formula =
    goal === "sum"
      ? `=SUM(${range})`
      : goal === "average"
        ? `=AVERAGE(${range})`
        : goal === "count"
          ? `=COUNTIF(${range},${quote(condition)})`
          : goal === "sumif"
            ? `=SUMIF(${range},${quote(condition)},${other})`
            : goal === "if"
              ? `=IF(${range}${condition},${quote(yes)},${quote(no)})`
              : goal === "percent"
                ? `=IFERROR(${range}/${other},0)`
                : goal === "multiply"
                  ? `=${range}*${other}`
                  : goal === "round"
                    ? `=ROUND(${range},${digits})`
                    : `=VLOOKUP(${range},${other},${digits},FALSE)`;
  const example: Workbook = structuredClone(book);
  example.sheets.find((s) => s.id === sheet.id)!.cells[target] = {
    raw: formula,
  };
  const res = calculator(example).cell(sheet.id, target);
  return (
    <Modal title={t("مساعد المعادلات", "Formula assistant")} onClose={onClose}>
      <div className="xs-assistant-intro">
        <span>✦</span>
        <div>
          <b>
            {t("قول لنا محتاج تحسب إيه", "What would you like to calculate?")}
          </b>
          <p>
            {t(
              "من غير حفظ صيغ. اختار العملية وحدد الخلايا.",
              "No memorizing syntax. Choose a task and your cells.",
            )}
          </p>
        </div>
      </div>
      <label>
        {t("١. اختار المهمة", "1. Choose a task")}
        <select
          value={goal}
          onChange={(e) => {
            setGoal(e.target.value);
            setRange(
              ["if", "percent", "multiply", "round", "lookup"].includes(
                e.target.value,
              )
                ? "B2"
                : "B2:B5",
            );
            setOther(
              e.target.value === "lookup"
                ? "A2:C5"
                : e.target.value === "percent" || e.target.value === "multiply"
                  ? "C2"
                  : "C2:C5",
            );
          }}
        >
          {[
            ["sum", "جمع أرقام", "Sum numbers"],
            ["average", "متوسط", "Average"],
            ["count", "عدّ بشرط", "Count with a condition"],
            ["sumif", "جمع بشرط", "Conditional sum"],
            ["if", "لو الشرط تحقق", "If / otherwise"],
            ["percent", "نسبة من الإجمالي", "Share of total"],
            ["multiply", "ضرب قيمتين", "Multiply two values"],
            ["round", "تقريب رقم", "Round a number"],
            ["lookup", "بحث مطابق تمامًا", "Exact lookup"],
          ].map(([v, ar, en]) => (
            <option key={v} value={v}>
              {t(ar, en)}
            </option>
          ))}
        </select>
      </label>
      <div className="xs-form-grid">
        <label>
          {t("٢. الخلية أو النطاق", "2. Cell or range")}
          <input
            dir="ltr"
            value={range}
            onChange={(e) => setRange(e.target.value.toUpperCase())}
          />
        </label>
        {["sumif", "percent", "multiply", "lookup"].includes(goal) && (
          <label>
            {t(
              goal === "sumif"
                ? "نطاق الجمع"
                : goal === "lookup"
                  ? "جدول البحث"
                  : "القيمة الثانية",
              goal === "sumif"
                ? "Sum range"
                : goal === "lookup"
                  ? "Lookup table"
                  : "Second value",
            )}
            <input
              dir="ltr"
              value={other}
              onChange={(e) => setOther(e.target.value.toUpperCase())}
            />
          </label>
        )}
        {["if", "count", "sumif"].includes(goal) && (
          <label>
            {t("الشرط (مثال: >100)", "Condition (e.g. >100)")}
            <input
              dir="ltr"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </label>
        )}
        {goal === "if" && (
          <>
            <label>
              {t("عند التحقق", "When true")}
              <input value={yes} onChange={(e) => setYes(e.target.value)} />
            </label>
            <label>
              {t("عند عدم التحقق", "When false")}
              <input value={no} onChange={(e) => setNo(e.target.value)} />
            </label>
          </>
        )}
        {["round", "lookup"].includes(goal) && (
          <label>
            {t(
              goal === "round" ? "المنازل العشرية" : "رقم عمود النتيجة",
              goal === "round" ? "Decimal places" : "Result column number",
            )}
            <input
              type="number"
              min={0}
              max={30}
              value={digits}
              onChange={(e) => setDigits(e.target.value)}
            />
          </label>
        )}
      </div>
      <div className="xs-formula-preview">
        <small>{t("المعادلة الجاهزة", "YOUR FORMULA")}</small>
        <code dir="ltr">{formula}</code>
        <p>
          {t("الخلية المستهدفة", "Target cell")}: <b dir="ltr">{target}</b> ·{" "}
          {t("النتيجة المتوقعة", "Preview")}:{" "}
          <b>{res.error || String(res.value ?? "")}</b>
        </p>
      </div>
      {res.error && (
        <p className="xs-hint danger">
          {t(
            "راجع النطاقات. لا تضع خلية النتيجة ضمن نطاق جمعها.",
            "Check ranges. Do not include the target cell in its own sum range.",
          )}
        </p>
      )}
      <div className="xs-modal-actions">
        <button
          className="xs-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(formula);
              notice(t("تم نسخ المعادلة", "Formula copied"));
            } catch {
              notice(
                t(
                  "النسخ غير متاح. حدد المعادلة وانسخها يدويًا.",
                  "Clipboard unavailable. Copy the formula manually.",
                ),
              );
            }
          }}
        >
          <Copy size={15} />
          {t("نسخ", "Copy")}
        </button>
        <button
          className="xs-button primary"
          disabled={!!res.error}
          onClick={() => {
            onApply(formula);
            onClose();
          }}
        >
          <Check size={16} />
          {t("طبّق على الخلية", "Apply to cell")}
        </button>
      </div>
    </Modal>
  );
}
