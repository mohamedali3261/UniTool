import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Plus,
  Download,
  Printer,
  RefreshCw,
  Link2,
  Settings2,
  Table2,
  Image,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { useStudio } from "../../app/context";
import {
  dataset,
  defaultDashboard,
  filterRows,
  aggregate,
} from "../../core/analytics";
import type { BIWidget, Dashboard } from "../../core/analyticsTypes";
import { uid } from "../../core/workbook";
import { download } from "../../core/io";
import { WidgetCard } from "./WidgetCard";
import { WidgetEditor } from "./WidgetEditor";
import { FilterPanel } from "./FilterPanel";
import { Modal } from "../../components/Modal";
import "./analytics.css";
export default function AnalyticsPage() {
  const { book, update, t, lang, notice, navigate } = useStudio(),
    [editor, setEditor] = useState<BIWidget | null>(null),
    [pendingRemove, setRemove] = useState<string | null>(null),
    [reset, setReset] = useState(false),
    [showData, setShowData] = useState(false),
    [info, setInfo] = useState(false),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0),
    drag = useRef<string | null>(null),
    board = useRef<HTMLDivElement>(null);
  const report = useMemo(
      () =>
        book.dashboard || defaultDashboard(book, book.active, lang === "ar"),
      [book, lang],
    ),
    source = useMemo(
      () => dataset(book, report.source, report.excludeTotals),
      [book, report.source, report.excludeTotals, tick],
    ),
    rows = useMemo(
      () => filterRows(source.rows, report.filters),
      [source, report.filters],
    );
  const save = (next: Dashboard) => update((b) => ({ ...b, dashboard: next }));
  useEffect(() => {
    const close = (e: PointerEvent) =>
      document
        .querySelectorAll<HTMLDetailsElement>(".bi-widget-menu[open]")
        .forEach((d) => {
          if (!d.contains(e.target as Node)) d.open = false;
        });
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        document
          .querySelectorAll<HTMLDetailsElement>(".bi-widget-menu[open]")
          .forEach((d) => {
            d.open = false;
            d.querySelector("summary")?.focus();
          });
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  useEffect(() => {
    if (!book.dashboard && source.sheet)
      update((b) => ({ ...b, dashboard: report }), false);
  }, [book.dashboard, report, update, source.sheet]);
  const add = () => {
    if (report.widgets.length >= 20) {
      notice(
        t("الحد الأقصى 20 عنصر في التقرير", "Maximum 20 visuals per report"),
      );
      return;
    }
    const base = defaultDashboard(book, report.source, lang === "ar")
      .widgets[3];
    setEditor({ ...base, id: uid(), title: t("تحليل جديد", "New visual") });
  };
  const reorder = (id: string, index: number) => {
    const widgets = [...report.widgets],
      old = widgets.findIndex((w) => w.id === id);
    if (old < 0) return;
    const [item] = widgets.splice(old, 1);
    widgets.splice(Math.max(0, Math.min(widgets.length, index)), 0, item);
    save({ ...report, widgets });
  };
  const exportCSV = () => {
    const escape = (v: unknown) => {
      let s = String(v ?? "");
      if (typeof v === "string" && /^\s*[=+\-@]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const content = [
      source.fields.map((f) => escape(f.label)).join(","),
      ...rows.map((r) =>
        source.fields.map((f) => escape(r.values[f.id])).join(","),
      ),
    ].join("\r\n");
    download(
      new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }),
      "report-data.csv",
    );
  };
  return (
    <div className="bi-page">
      <section className="xs-page-heading">
        <div>
          <div className="xs-breadcrumb">SHEET STUDIO / ANALYTICS</div>
          <h1>
            {t(
              "ورا كل رقم، قرار أذكى.",
              "Behind every number, a better decision.",
            )}{" "}
            <span>◈</span>
          </h1>
          <p>
            {t(
              "لوحة مؤشرات متصلة بجدولك. غيّر الأرقام في الشيت، وشوف الصورة كاملة هنا.",
              "A dashboard connected to your spreadsheet. Edit your cells and see the whole picture here.",
            )}
          </p>
        </div>
        <button className="xs-button" onClick={() => setInfo(true)}>
          <Info size={15} />
          {t("عن التحليل", "About analytics")}
        </button>
      </section>
      <div className="bi-report-toolbar">
        <div className="bi-source">
          <span>
            <Link2 size={16} />
            {t("مصدر البيانات", "Data source")}
          </span>
          <select
            aria-label={t("مصدر التقرير", "Report source")}
            value={report.source}
            onChange={(e) => {
              const next = defaultDashboard(
                book,
                e.target.value,
                lang === "ar",
              );
              save({ ...next, title: report.title });
            }}
          >
            {!source.sheet && (
              <option value={report.source}>
                {t(
                  "المصدر محذوف — اختار ورقة",
                  "Source removed — choose a sheet",
                )}
              </option>
            )}
            {book.sheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <small className={source.sheet ? "positive" : "danger"}>
            ●{" "}
            {source.sheet
              ? t("متصل محليًا", "Connected locally")
              : t("مصدر غير متاح", "Source unavailable")}
          </small>
        </div>
        <div className="bi-report-actions">
          <button
            className="xs-icon"
            aria-label={t("تحديث الحساب", "Recalculate report")}
            onClick={() => setTick((v) => v + 1)}
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="xs-button"
            onClick={exportCSV}
            disabled={!source.sheet}
          >
            <Download size={15} />
            CSV
          </button>
          <button
            className="xs-button"
            disabled={busy || !source.sheet}
            onClick={async () => {
              if (!board.current) return;
              setBusy(true);
              try {
                const { toPng } = await import("html-to-image");
                const url = await toPng(board.current, {
                  backgroundColor: "#f5f7f4",
                  pixelRatio: 1.5,
                  filter: (n) =>
                    !(
                      n instanceof HTMLElement &&
                      n.classList.contains("bi-widget-menu")
                    ),
                });
                const response = await fetch(url);
                download(await response.blob(), "dashboard.png");
              } catch {
                notice(
                  t(
                    "تعذر تصدير الصورة؛ جرّب الطباعة أو تنزيل الرسوم منفردة.",
                    "Image export failed. Try print or individual SVG exports.",
                  ),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Image size={15} />
            {busy ? t("جاري التصدير…", "Exporting…") : "PNG"}
          </button>
          <button
            className="xs-icon"
            aria-label={t("طباعة التقرير PDF", "Print report PDF")}
            onClick={() => window.print()}
          >
            <Printer size={16} />
          </button>
          <button
            className="xs-button primary"
            onClick={add}
            disabled={!source.sheet || report.widgets.length >= 20}
          >
            <Plus size={15} />
            {t("إضافة عنصر", "Add visual")}
          </button>
        </div>
      </div>
      {!source.sheet ? (
        <div className="xs-empty">
          <Link2 size={30} />
          <h2>
            {t("اربط التقرير بورقة موجودة", "Reconnect your report to a sheet")}
          </h2>
          <p>
            {t(
              "الورقة المصدر اتغيرت أو اتحذفت. اختار مصدرًا جديدًا من الأعلى.",
              "The source sheet was changed or removed. Choose another source above.",
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="bi-overview">
            <div>
              <small>YOUR WORK. IN FOCUS.</small>
              <h2>
                {t("من جدول بيانات…", "From a spreadsheet…")}
                <br />
                <em>{t("لرؤية أوضح.", "to a clearer view.")}</em>
              </h2>
              <p>
                {t(
                  "أرقام حقيقية من ملفك. مش مجرد شكل.",
                  "Real numbers from your workbook. Not just a pretty picture.",
                )}
              </p>
              <button
                onClick={() => {
                  update({ ...book, active: source.sheet!.id }, false);
                  navigate("editor");
                }}
              >
                {t("افتح الشيت المرتبط", "Open linked sheet")}
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="bi-overview-metrics">
              <span>
                <b>{rows.length}</b>
                {t("سجل مطابق", "matching records")}
              </span>
              <span>
                <b>{source.fields.filter((f) => f.numeric).length}</b>
                {t("حقول رقمية", "numeric fields")}
              </span>
              <span>
                <b>{report.widgets.length}</b>
                {t("مؤشرات ورسوم", "metrics & visuals")}
              </span>
            </div>
            <div className="bi-overview-spark" aria-hidden="true">
              {[25, 42, 31, 63, 55, 82, 70, 98, 86, 115].map((v, i) => (
                <i
                  key={i}
                  style={{ height: v, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>
          <FilterPanel
            key={report.source}
            fields={source.fields}
            rows={source.rows}
            filters={report.filters}
            onChange={(filters) => save({ ...report, filters })}
          />
          <div className="bi-board-heading">
            <input
              aria-label={t("عنوان التقرير", "Report title")}
              value={report.title}
              maxLength={100}
              onChange={(e) => save({ ...report, title: e.target.value })}
            />
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={report.excludeTotals}
                  onChange={(e) =>
                    save({ ...report, excludeTotals: e.target.checked })
                  }
                />
                {t("استبعاد صفوف الإجمالي المسماة", "Exclude named total rows")}
              </label>
              <button
                className="xs-icon"
                aria-label={t("إعادة بناء اللوحة", "Rebuild dashboard")}
                onClick={() => setReset(true)}
              >
                <Settings2 size={16} />
              </button>
            </div>
          </div>
          <div className="bi-board-capture" ref={board}>
            <h2 className="bi-print-title">{report.title}</h2>
            <p className="bi-print-title">
              {source.sheet.name} · {rows.length} rows ·{" "}
              {report.filters
                .map((f) => `${f.field} ${f.op} ${f.value}`)
                .join(" / ") || "All data"}
            </p>
            <div className="bi-board">
              {report.widgets.map((widget, index) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  rows={rows}
                  draggable
                  onDragStart={() => {
                    drag.current = widget.id;
                  }}
                  onDrop={() => {
                    if (drag.current) reorder(drag.current, index);
                    drag.current = null;
                  }}
                  move={(delta) => reorder(widget.id, index + delta)}
                  edit={() => setEditor(widget)}
                  remove={() => setRemove(widget.id)}
                  duplicate={() => {
                    if (report.widgets.length >= 20) return;
                    save({
                      ...report,
                      widgets: [
                        ...report.widgets.slice(0, index + 1),
                        { ...widget, id: uid(), title: widget.title + " (2)" },
                        ...report.widgets.slice(index + 1),
                      ],
                    });
                  }}
                  resize={() =>
                    save({
                      ...report,
                      widgets: report.widgets.map((w) =>
                        w.id === widget.id ? { ...w, wide: !w.wide } : w,
                      ),
                    })
                  }
                  select={(label) => {
                    if (label === "∅") return;
                    if (report.filters.length >= 8) {
                      notice(
                        t(
                          "امسح فلتر قبل إضافة آخر",
                          "Remove a filter before adding another",
                        ),
                      );
                      return;
                    }
                    save({
                      ...report,
                      filters: [
                        ...report.filters.filter((f) => f.id !== "drill"),
                        {
                          id: "drill",
                          field: widget.dimension,
                          op: "eq",
                          value: label,
                          bucket: widget.bucket,
                        },
                      ],
                    });
                  }}
                />
              ))}
            </div>
            {!report.widgets.length && (
              <div className="xs-empty">
                <BarChart3 size={35} />
                <h2>
                  {t("المساحة جاهزة لأرقامك", "Make space for your data")}
                </h2>
                <button className="xs-button primary" onClick={add}>
                  {t("أضف أول عنصر", "Add your first visual")}
                </button>
              </div>
            )}
          </div>
          <div className="bi-quality">
            <span>
              ✓ {source.rows.length} {t("سجل أصلي", "source rows")} ·{" "}
              {source.empty} {t("صف فارغ مستبعد", "empty rows excluded")} ·{" "}
              {source.totals} {t("إجمالي مستبعد", "total rows excluded")}
            </span>
            {source.errors > 0 && (
              <b className="danger">
                {source.errors}{" "}
                {t(
                  "خلية بها خطأ؛ لا تدخل في المقاييس الرقمية",
                  "error cells excluded from numeric metrics",
                )}
              </b>
            )}
            <button onClick={() => setShowData(!showData)}>
              <Table2 size={14} />
              {showData
                ? t("إخفاء البيانات", "Hide data")
                : t("فحص البيانات المصفاة", "Inspect filtered data")}
            </button>
          </div>
          {showData && (
            <div className="bi-data-preview">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {source.fields.map((f) => (
                      <th key={f.id}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row) => (
                    <tr key={row.row}>
                      <th>{row.row}</th>
                      {source.fields.map((f) => (
                        <td key={f.id}>{String(row.values[f.id] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <small>
                {t(
                  "معاينة أول 50 سجلًا. CSV يحتوي كل السجلات المصفاة.",
                  "Preview shows the first 50 records. CSV contains all filtered records.",
                )}
              </small>
            </div>
          )}
        </>
      )}
      {editor && (
        <WidgetEditor
          initial={editor}
          fields={source.fields}
          onClose={() => setEditor(null)}
          onSave={(w) =>
            save({
              ...report,
              widgets: report.widgets.some((v) => v.id === w.id)
                ? report.widgets.map((v) => (v.id === w.id ? w : v))
                : [...report.widgets, w],
            })
          }
        />
      )}{" "}
      {pendingRemove && (
        <Modal
          title={t("حذف العنصر؟", "Remove visual?")}
          onClose={() => setRemove(null)}
        >
          <p>
            {t(
              "بيانات الشيت مش هتتغير. تقدر تتراجع عن الحذف.",
              "Your source data will not change. This action can be undone.",
            )}
          </p>
          <button
            className="xs-button destructive"
            onClick={() => {
              save({
                ...report,
                widgets: report.widgets.filter((w) => w.id !== pendingRemove),
              });
              setRemove(null);
            }}
          >
            {t("حذف العنصر", "Remove visual")}
          </button>
        </Modal>
      )}
      {reset && (
        <Modal
          title={t("إعادة بناء التقرير؟", "Rebuild report?")}
          onClose={() => setReset(false)}
        >
          <p>
            {t(
              "هيتم استبدال ترتيب وعناصر وفلاتر اللوحة بقالب تلقائي من الشيت. البيانات الأصلية لا تتغير.",
              "This replaces visual configuration and filters with an auto-generated dashboard. Source data is unchanged.",
            )}
          </p>
          <button
            className="xs-button primary"
            onClick={() => {
              save(defaultDashboard(book, report.source, lang === "ar"));
              setReset(false);
            }}
          >
            {t("إعادة البناء", "Rebuild")}
          </button>
        </Modal>
      )}
      {info && (
        <Modal
          title={t("تحليل بياناتك، محليًا", "Analyze your data locally")}
          onClose={() => setInfo(false)}
        >
          <p>
            {t(
              "هذه لوحة مستوحاة من أدوات BI: مصادر شيتات، مؤشرات، تجميعات، رسوم، فلاتر وتصدير. كل تعديل في الشيت يعيد الحساب عند فتح التحليل. إعدادات اللوحة محفوظة مع المشروع وتدعم التراجع.",
              "A BI-inspired workspace: sheet sources, metrics, aggregations, visuals, filters and exports. Sheet edits recalculate the dashboard when you open analytics. Report settings are saved with the project and support undo.",
            )}
          </p>
          <p className="xs-callout">
            {t(
              "ليست Microsoft Power BI ولا تشمل DAX أو Power Query أو علاقات بين جداول متعددة أو قواعد صلاحيات وسحابة واتصال مباشر بقاعدة بيانات. المصدر ورقة واحدة من الملف المفتوح، بلا رفع بيانات.",
              "Not Microsoft Power BI. DAX, Power Query, multi-table relationships, cloud workspaces, access policies and database connectors are not included. Each report reads one sheet from the current local workbook.",
            )}
          </p>
          <p className="xs-hint">
            {t(
              "صفوف الإجمالي تُستبعد من اسم أول خلية، لا باستنتاج نوع الصيغة. عدّل هذا الخيار لو بياناتك مختلفة. الفلاتر هنا مستقلة عن فلاتر محرر الشيت ولا تغيّر البيانات.",
              "Total rows are identified by the first-cell label, not by formula detection. Change that setting as needed. Report filters are separate from editor filters and do not modify your data.",
            )}
          </p>
        </Modal>
      )}
    </div>
  );
}
