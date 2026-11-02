import { useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Settings2,
  Trash2,
  Copy,
  Download,
  Maximize2,
  GripVertical,
} from "lucide-react";
import { useStudio } from "../../app/context";
import { aggregate, series, type BIRow } from "../../core/analytics";
import type { BIWidget } from "../../core/analyticsTypes";
import { download } from "../../core/io";
import { VisualChart } from "./VisualChart";
export function WidgetCard({
  widget,
  rows,
  edit,
  remove,
  duplicate,
  move,
  resize,
  select,
  draggable,
  onDragStart,
  onDrop,
}: {
  widget: BIWidget;
  rows: BIRow[];
  edit: () => void;
  remove: () => void;
  duplicate: () => void;
  move: (delta: number) => void;
  resize: () => void;
  select: (label: string) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const { t, lang, notice } = useStudio(),
    ref = useRef<HTMLElement>(null),
    [accessible, setAccessible] = useState(false),
    points = series(rows, widget),
    value = aggregate(
      rows.map((r) => r.values[widget.metric] ?? null),
      widget.aggregation,
    ),
    fmt = (v: number | null) =>
      v === null
        ? "—"
        : new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
            maximumFractionDigits: 2,
          }).format(v),
    target = widget.target,
    ratio =
      value !== null && target && target > 0 ? (value / target) * 100 : null;
  return (
    <article
      ref={ref}
      className={`bi-widget ${widget.type === "kpi" ? "bi-kpi" : ""} ${widget.wide ? "bi-wide" : ""}`}
      data-widget={widget.id}
      onDragOver={(e) => {
        if (draggable) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <header>
        <div className="bi-widget-name">
          <span
            draggable={draggable}
            onDragStart={onDragStart}
            title={t("اسحب المقبض لترتيب العنصر", "Drag handle to reorder")}
          >
            <GripVertical size={15} />
          </span>
          <h2>{widget.title}</h2>
        </div>
        <details className="bi-widget-menu">
          <summary aria-label={t("خيارات", "Options") + " " + widget.title}>
            •••
          </summary>
          <div
            onClick={(e) => {
              const d = e.currentTarget.closest("details");
              if (d) d.open = false;
            }}
          >
            <button onClick={edit}>
              <Settings2 size={13} />
              {t("تعديل", "Edit")}
            </button>
            <button onClick={() => move(-1)}>
              <ArrowUp size={13} />
              {t("نقل لأعلى", "Move earlier")}
            </button>
            <button onClick={() => move(1)}>
              <ArrowDown size={13} />
              {t("نقل لأسفل", "Move later")}
            </button>
            <button onClick={resize}>
              <Maximize2 size={13} />
              {t("تغيير الحجم", "Toggle width")}
            </button>
            <button onClick={duplicate}>
              <Copy size={13} />
              {t("نسخ", "Duplicate")}
            </button>
            {widget.type !== "kpi" && widget.type !== "table" && (
              <button
                onClick={() => {
                  const svg = ref.current?.querySelector('svg[role="img"]');
                  if (svg)
                    download(
                      new Blob([svg.outerHTML], { type: "image/svg+xml" }),
                      "chart-" + widget.id + ".svg",
                    );
                  else notice(t("لا يوجد رسم للتنزيل", "No chart to download"));
                }}
              >
                <Download size={13} />
                {t("تنزيل SVG", "Download SVG")}
              </button>
            )}
            <button className="danger" onClick={remove}>
              <Trash2 size={13} />
              {t("حذف", "Remove")}
            </button>
          </div>
        </details>
      </header>
      {widget.type === "kpi" ? (
        <div className="bi-kpi-body">
          <b>{fmt(value)}</b>
          <div>
            <span>
              {widget.aggregation.toUpperCase()} · {widget.metric}
            </span>
            {ratio !== null && (
              <strong className={ratio >= 100 ? "positive" : "warning"}>
                {ratio.toFixed(1)}% {t("من الهدف", "of target")}
              </strong>
            )}
          </div>
          {ratio !== null && (
            <progress max={100} value={Math.min(100, Math.max(0, ratio))} />
          )}
          <small>
            {t("الهدف", "Target")}: {target === undefined ? "—" : fmt(target)} ·{" "}
            {rows.length} {t("سجل مطابق", "matching rows")}
          </small>
        </div>
      ) : accessible && widget.type === "scatter" ? (
        <div className="bi-pivot-scroll">
          <table className="bi-pivot">
            <caption>
              {t(
                "أزواج رقمية من الصفوف الأصلية (حتى 300)",
                "Raw numeric pairs (up to 300)",
              )}
            </caption>
            <thead>
              <tr>
                <th>{widget.dimension}</th>
                <th>X · {widget.metric}</th>
                <th>Y · {widget.secondary || widget.metric}</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter(
                  (r) =>
                    typeof r.values[widget.metric] === "number" &&
                    typeof r.values[widget.secondary || widget.metric] ===
                      "number",
                )
                .slice(0, 300)
                .map((r) => (
                  <tr key={r.row}>
                    <td>{String(r.values[widget.dimension] ?? r.row)}</td>
                    <td>{fmt(r.values[widget.metric] as number)}</td>
                    <td>
                      {fmt(
                        r.values[widget.secondary || widget.metric] as number,
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : widget.type === "table" || accessible ? (
        <div className="bi-pivot-scroll">
          <table className="bi-pivot">
            <caption>
              {t("ملخص حسب الفئة", "Summary by group")} · {widget.aggregation}
            </caption>
            <thead>
              <tr>
                <th>{widget.dimension}</th>
                <th>{widget.metric}</th>
                <th>{t("القيم غير الفارغة", "Non-empty values")}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.label}>
                  <td>
                    <button onClick={() => select(p.label)}>{p.label}</button>
                  </td>
                  <td>{fmt(p.value)}</td>
                  <td>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!points.length && <p>{t("لا توجد نتائج", "No results")}</p>}
        </div>
      ) : (
        <VisualChart rows={rows} widget={widget} onSelect={select} />
      )}
      <footer>
        <span>
          {widget.type === "kpi"
            ? "LIVE METRIC"
            : widget.type === "scatter"
              ? `RAW PAIRS / ${widget.metric} × ${widget.secondary || widget.metric}`
              : `${widget.aggregation.toUpperCase()} / ${widget.dimension} → ${widget.metric}`}
        </span>
        {widget.type !== "kpi" && widget.type !== "table" && (
          <button onClick={() => setAccessible(!accessible)}>
            {accessible ? t("الرسم", "Chart") : t("عرض كجدول", "View as table")}
          </button>
        )}
      </footer>
    </article>
  );
}
