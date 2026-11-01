import { useMemo, useState } from "react";
import {
  Sparkles,
  Settings2,
  Plus,
  Search,
  BarChart3,
  Printer,
  HelpCircle,
  Table2,
  X,
} from "lucide-react";
import { useStudio } from "../../app/context";
import {
  LIMITS,
  type Sheet,
  type Selection,
  type Cell,
} from "../../core/types";
import { calculator, errorHelp } from "../../core/calculate";
import {
  applyCells,
  fillDown,
  paste,
  sortSheet,
  uid,
} from "../../core/workbook";
import { address, position, refs } from "../../core/address";
import { parseDelimited } from "../../core/io";
import { SheetGrid } from "./SheetGrid";
import { FormulaBar } from "./FormulaBar";
import { FormatToolbar } from "./FormatToolbar";
import { FormulaAssistant } from "./FormulaAssistant";
import { TableDesigner } from "./TableDesigner";
import { Chart } from "./Chart";
import { Modal } from "../../components/Modal";
import "./editor.css";
export default function EditorPage({
  selection,
  setSelection,
}: {
  selection: Selection;
  setSelection: (s: Selection) => void;
}) {
  const { t, lang, book, update, notice, navigate } = useStudio(),
    sheet = book.sheets.find((s) => s.id === book.active)!,
    calc = useMemo(() => calculator(book), [book]),
    result = useMemo(
      () => (ref: string) => calc.cell(sheet.id, ref),
      [calc, sheet.id],
    ),
    [filter, setFilter] = useState(""),
    [assistant, setAssistant] = useState(false),
    [designer, setDesigner] = useState<"new" | "edit" | null>(null),
    [chart, setChart] = useState(false),
    [help, setHelp] = useState(false),
    [remove, setRemove] = useState(false),
    [clear, setClear] = useState(false);
  const selected = selection.end,
    active = sheet.cells[selected],
    selectedResults = refs(selection.anchor, selection.end).map(result),
    numeric = selectedResults
      .map((r) => r.value)
      .filter((v): v is number => typeof v === "number"),
    sum = numeric.reduce((a, b) => a + b, 0),
    errors = Object.keys(sheet.cells).filter((ref) => result(ref).error).length;
  const commit = (raw: string, ref = selected) =>
    update((b) => applyCells(b, sheet.id, { [ref]: { raw } }));
  const format = (patch: Partial<Cell>) =>
    update((b) =>
      applyCells(
        b,
        sheet.id,
        Object.fromEntries(
          refs(selection.anchor, selection.end).map((ref) => [ref, patch]),
        ),
      ),
    );
  const patchSheet = (patch: Partial<Sheet>) =>
    update((b) => ({
      ...b,
      sheets: b.sheets.map((s) => (s.id === sheet.id ? { ...s, ...patch } : s)),
    }));
  const changeSheet = (id: string) => {
    update({ ...book, active: id }, false);
    setSelection({ anchor: "A1", end: "A1" });
    setFilter("");
  };
  const copy = async () => {
    const p = position(selection.anchor),
      q = position(selection.end),
      rows = [];
    for (let r = Math.min(p.row, q.row); r <= Math.max(p.row, q.row); r++) {
      const values = [];
      for (let c = Math.min(p.col, q.col); c <= Math.max(p.col, q.col); c++)
        values.push(sheet.cells[address(r, c)]?.raw || "");
      rows.push(values.join("\t"));
    }
    try {
      await navigator.clipboard.writeText(rows.join("\n"));
      notice(
        t("اتنسخ النطاق. الصقه بـ Ctrl+V.", "Range copied. Paste with Ctrl+V."),
      );
    } catch {
      notice(
        t(
          "النسخ غير متاح في المتصفح ده. استخدم التصدير.",
          "Clipboard unavailable. Use export instead.",
        ),
      );
    }
  };
  return (
    <div className="xs-editor-page">
      <section className="xs-page-heading">
        <div>
          <div className="xs-breadcrumb">
            {t("مساحة العمل", "Workspace")} <span>/</span>{" "}
            {t("محرر الجداول", "Spreadsheet editor")}
          </div>
          <h1>
            {t("شغلك، بشكل أرتب.", "Make room for clarity.")} <span>✦</span>
          </h1>
          <p>
            {t(
              "بياناتك، معادلاتك، ولمستك الخاصة. كل ده من غير تعقيد.",
              "Your data, your formulas, your own style. Without the complexity.",
            )}
          </p>
        </div>
        <button
          className="xs-button"
          onClick={() => setDesigner("new")}
          disabled={book.sheets.length >= LIMITS.sheets}
        >
          <Plus size={16} />
          {t("جدول جديد", "New table")}
        </button>
      </section>
      <div className="xs-editor-layout">
        <section className="xs-table-card">
          <div className="xs-table-top">
            <div className="xs-table-title">
              <span>
                <Table2 size={18} />
              </span>
              <b>{sheet.name}</b>
              <small>
                {sheet.rows} × {sheet.cols}
              </small>
            </div>
            <div className="xs-table-actions">
              <button
                className="xs-button xs-assistant-button"
                onClick={() => setAssistant(true)}
              >
                <Sparkles size={15} />
                {t("مساعد المعادلات", "Formula assistant")}
              </button>
              <button
                className="xs-icon"
                aria-label={t("إعدادات الجدول", "Table settings")}
                onClick={() => setDesigner("edit")}
              >
                <Settings2 size={17} />
              </button>
            </div>
          </div>
          <FormatToolbar
            sheet={sheet}
            cell={active}
            format={format}
            onSheet={patchSheet}
            sort={(desc) => {
              update((b) =>
                sortSheet(
                  b,
                  sheet.id,
                  position(selected).col,
                  desc,
                  (ref) => result(ref).value,
                ),
              );
              notice(
                t(
                  "تم ترتيب الصفوف؛ أول صف عنوان لا يتحرك.",
                  "Rows sorted; header row stays in place.",
                ),
              );
            }}
            copy={copy}
            clear={() => setClear(true)}
            fill={() => {
              if (selection.anchor === selection.end) {
                notice(
                  t(
                    "حدد نطاقًا من عدة صفوف بـ Shift+نقرة ثم استخدم التعبئة.",
                    "Select multiple rows with Shift+click, then fill down.",
                  ),
                );
                return;
              }
              update((b) => fillDown(b, sheet.id, selection));
            }}
            addRows={() =>
              patchSheet({ rows: Math.min(LIMITS.rows, sheet.rows + 10) })
            }
            addCols={() =>
              patchSheet({ cols: Math.min(LIMITS.cols, sheet.cols + 1) })
            }
          />
          <FormulaBar
            selected={selected}
            raw={active?.raw || ""}
            onCommit={commit}
            onAssistant={() => setAssistant(true)}
          />
          <SheetGrid
            sheet={sheet}
            selection={selection}
            setSelection={setSelection}
            result={result}
            onCommit={commit}
            filter={filter}
            onPaste={(text) => {
              try {
                const rows = parseDelimited(text, "\t");
                update((b) => paste(b, sheet.id, selected, rows));
              } catch (e: any) {
                notice(e.message);
              }
            }}
          />
          <div
            className="xs-sheet-tabs"
            role="tablist"
            aria-label={t("أوراق العمل", "Worksheets")}
          >
            {book.sheets.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={s.id === sheet.id}
                className={s.id === sheet.id ? "active" : ""}
                onClick={() => changeSheet(s.id)}
                onDoubleClick={() => setDesigner("edit")}
              >
                <Table2 size={13} />
                {s.name}
              </button>
            ))}
            <button
              aria-label={t("إضافة ورقة", "Add sheet")}
              onClick={() => setDesigner("new")}
              disabled={book.sheets.length >= LIMITS.sheets}
            >
              <Plus size={16} />
            </button>
            <button
              className="xs-delete-sheet"
              disabled={book.sheets.length <= 1}
              onClick={() => setRemove(true)}
              aria-label={t("حذف الورقة", "Delete sheet")}
            >
              <X size={14} />
            </button>
          </div>
          <div className="xs-grid-status">
            <span dir="ltr">
              {selection.anchor === selected
                ? selected
                : `${selection.anchor}:${selected}`}
            </span>
            <span>
              {t("عدد الأرقام", "Numbers")}: {numeric.length}
            </span>
            <span>
              {t("المجموع", "Sum")}:{" "}
              {sum.toLocaleString(lang, { maximumFractionDigits: 3 })}
            </span>
            {numeric.length > 0 && (
              <span>
                {t("المتوسط", "Average")}:{" "}
                {(sum / numeric.length).toLocaleString(lang, {
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
            <span className="xs-status-end">
              {errors
                ? `${errors} ${t("أخطاء", "errors")}`
                : t("✓ جاهز للحساب", "✓ Ready")}
            </span>
          </div>
        </section>
        <aside className="xs-insights">
          <div className="xs-assistant-card">
            <span className="xs-assistant-star">✦</span>
            <small>{t("حسابات أسهل", "LESS GUESSWORK")}</small>
            <h2>
              {t(
                "المعادلة الصح، من أول مرة.",
                "The right formula, without the guesswork.",
              )}
            </h2>
            <p>
              {t(
                "جمع؟ نسبة؟ شرط؟ اختار اللي تحتاجه وهنكتب الصيغة معاك خطوة بخطوة.",
                "Sum? Percentage? A condition? Build your formula step by step.",
              )}
            </p>
            <button className="xs-button" onClick={() => setAssistant(true)}>
              {t("افتح المساعد", "Open assistant")} ←
            </button>
          </div>
          <Chart sheet={sheet} result={result} compact />
          <div className="xs-quick-tools">
            <h3>{t("خلّي جدولك أذكى", "Make your table smarter")}</h3>
            <label className="xs-search">
              <Search size={15} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("تصفية الصفوف…", "Filter rows…")}
                aria-label={t("تصفية الصفوف", "Filter rows")}
              />
              {filter && (
                <button
                  className="xs-icon"
                  onClick={() => setFilter("")}
                  aria-label={t("مسح الفلتر", "Clear filter")}
                >
                  <X size={13} />
                </button>
              )}
            </label>
            <small>
              {t(
                "التصفية للعرض فقط؛ الحساب والتصدير يشملان كل البيانات.",
                "Filters affect display only. Calculations and exports use all rows.",
              )}
            </small>
            <button onClick={() => setChart(true)}>
              <BarChart3 size={16} />
              {t("رسم بياني قابل للتنزيل", "Downloadable chart")}
              <span>↗</span>
            </button>
            <button onClick={() => window.print()}>
              <Printer size={16} />
              {t("طباعة الجدول الظاهر / PDF", "Print visible table / PDF")}
              <span>↗</span>
            </button>
            <button onClick={() => setHelp(true)}>
              <HelpCircle size={16} />
              {t("إزاي أبدأ؟ والاختصارات", "Getting started & shortcuts")}
              <span>↗</span>
            </button>
          </div>
        </aside>
      </div>
      {result(selected).error && (
        <div className="xs-error-help" role="alert">
          <b dir="ltr">{result(selected).error}</b>{" "}
          {errorHelp[result(selected).error!]?.[lang === "ar" ? 0 : 1] ||
            t(
              "راجع نوع المدخلات والدالة؛ قد تكون غير مدعومة هنا.",
              "Check arguments; this function may not be supported here.",
            )}
        </div>
      )}
      <div className="xs-editor-footer">
        <span>
          ◉ {t("بياناتك مش بتتبعت لأي سيرفر", "Your data is never uploaded")}
        </span>
        <span>
          {t(
            "دبل كليك للتعديل · Shift+نقرة لتحديد نطاق · Ctrl+V للصق جدول",
            "Double-click to edit · Shift+click to select a range · Ctrl+V to paste a table",
          )}
        </span>
      </div>
      {assistant && (
        <FormulaAssistant
          sheet={sheet}
          target={selected}
          onClose={() => setAssistant(false)}
          onApply={commit}
        />
      )}{" "}
      {designer && (
        <TableDesigner
          sheet={designer === "edit" ? sheet : undefined}
          onClose={() => setDesigner(null)}
          onApply={(s) => {
            if (designer === "edit") patchSheet(s);
            else {
              update({ ...book, sheets: [...book.sheets, s], active: s.id });
              setSelection({ anchor: "A2", end: "A2" });
            }
          }}
        />
      )}{" "}
      {chart && (
        <Modal
          title={t("رسم بياني من بياناتك", "Chart your data")}
          onClose={() => setChart(false)}
          wide
        >
          <Chart sheet={sheet} result={result} />
        </Modal>
      )}
      {help && (
        <Modal
          title={t("جدولك الأول في ٣ خطوات", "Your first table in 3 steps")}
          onClose={() => setHelp(false)}
        >
          <ol className="xs-guide">
            <li>
              {t(
                "ابدأ بقالب أو اضغط جدول جديد واكتب عناوين أعمدتك.",
                "Start with a template or create a new table with your own headings.",
              )}
            </li>
            <li>
              {t(
                "دبل كليك على أي خلية واكتب. تقدر تلصق صفوفًا من Excel مباشرة.",
                "Double-click a cell to type. Paste rows directly from Excel.",
              )}
            </li>
            <li>
              {t(
                "حدد خلية فاضية وافتح مساعد المعادلات، ثم صدّر ملف XLSX.",
                "Select an empty cell, open the formula assistant and export an XLSX.",
              )}
            </li>
          </ol>
          <dl className="xs-shortcuts">
            <dt>Enter / F2</dt>
            <dd>{t("انتقال لأسفل / تعديل الخلية", "Move down / edit cell")}</dd>
            <dt>Tab / Shift+Tab</dt>
            <dd>{t("انتقال بين الأعمدة", "Move between columns")}</dd>
            <dt>Shift + Click</dt>
            <dd>
              {t(
                "تحديد نطاق للتنسيق أو التعبئة",
                "Select a range to format or fill",
              )}
            </dd>
            <dt>Ctrl / ⌘ + Z</dt>
            <dd>{t("تراجع · Shift+Z للإعادة", "Undo · Shift+Z to redo")}</dd>
          </dl>
          <p className="xs-hint">
            {t(
              "حدود النسخة: 8 أوراق، 300 صف و30 عمودًا لكل ورقة، و20 ألف خلية غير فارغة. المصفوفات المتدفقة والماكرو ليست مدعومة.",
              "Limits: 8 sheets, 300 rows and 30 columns per sheet, 20k stored cells. Spilling arrays and macros are not supported.",
            )}
          </p>
        </Modal>
      )}
      {remove && (
        <Modal
          title={t("حذف الورقة؟", "Delete this sheet?")}
          onClose={() => setRemove(false)}
        >
          <p>
            {t(
              "هيتم حذف الورقة بكل بياناتها. تقدر تتراجع بعد الحذف.",
              "The sheet and its data will be removed. You can undo this action.",
            )}
          </p>
          <button
            className="xs-button destructive"
            onClick={() => {
              const sheets = book.sheets.filter((s) => s.id !== sheet.id);
              update({ ...book, sheets, active: sheets[0].id });
              setSelection({ anchor: "A1", end: "A1" });
              setRemove(false);
            }}
          >
            {t("احذف الورقة", "Delete sheet")}
          </button>
        </Modal>
      )}
      {clear && (
        <Modal
          title={t("مسح قيم النطاق؟", "Clear range values?")}
          onClose={() => setClear(false)}
        >
          <p dir="ltr">
            {selection.anchor}:{selected}
          </p>
          <p>
            {t(
              "التنسيق هيفضل زي ما هو. العملية قابلة للتراجع.",
              "Formatting is preserved. This action can be undone.",
            )}
          </p>
          <button
            className="xs-button destructive"
            onClick={() => {
              format({ raw: "" });
              setClear(false);
            }}
          >
            {t("مسح القيم", "Clear values")}
          </button>
        </Modal>
      )}
    </div>
  );
}
