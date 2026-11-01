import { calculator } from "./calculate";
import { address, colName } from "./address";
import type { Workbook, Sheet, Value } from "./types";
import type {
  Aggregate,
  BIWidget,
  BIFilter,
  Dashboard,
} from "./analyticsTypes";
export interface BIField {
  id: string;
  label: string;
  numeric: boolean;
  date: boolean;
}
export interface BIRow {
  row: number;
  values: Record<string, Value>;
}
export interface Dataset {
  fields: BIField[];
  rows: BIRow[];
  errors: number;
  empty: number;
  totals: number;
  sheet: Sheet | null;
}
export const isTotal = (v: unknown) =>
  /^(الإجمالي|الاجمالي|إجمالي|اجمالي|المجموع|total|totals|grand total)$/i.test(
    String(v ?? "").trim(),
  );
export function dataset(
  book: Workbook,
  sheetId: string,
  excludeTotals = true,
): Dataset {
  const sheet = book.sheets.find((s) => s.id === sheetId);
  if (!sheet)
    return {
      fields: [],
      rows: [],
      errors: 0,
      empty: 0,
      totals: 0,
      sheet: null,
    };
  const calc = calculator(book),
    fields: BIField[] = Array.from({ length: sheet.cols }, (_, c) => ({
      id: colName(c),
      label: sheet.header
        ? String(calc.cell(sheet.id, address(0, c)).value || colName(c))
        : colName(c),
      numeric: false,
      date: false,
    }));
  let errors = 0,
    empty = 0,
    totals = 0;
  const rows: BIRow[] = [];
  for (let r = sheet.header ? 1 : 0; r < sheet.rows; r++) {
    const values: Record<string, Value> = {};
    let filled = false;
    for (let c = 0; c < sheet.cols; c++) {
      const res = calc.cell(sheet.id, address(r, c));
      if (res.error) errors++;
      values[colName(c)] = res.error ? null : res.value;
      if (res.value !== null && res.value !== "") filled = true;
      if (typeof res.value === "number" && !res.error) fields[c].numeric = true;
      if (sheet.cells[address(r, c)]?.format === "date") fields[c].date = true;
    }
    if (!filled) {
      empty++;
      continue;
    }
    if (excludeTotals && isTotal(values.A)) {
      totals++;
      continue;
    }
    rows.push({ row: r + 1, values });
  }
  return { fields, rows, errors, empty, totals, sheet };
}
export function bucketValue(value: Value, bucket: BIWidget["bucket"] = "none") {
  if (bucket === "none" || value === null) return String(value ?? "");
  const date =
    typeof value === "number"
      ? new Date(Date.UTC(1899, 11, 30) + value * 86400000)
      : /^\d{4}-\d{2}-\d{2}/.test(String(value))
        ? new Date(String(value))
        : null;
  if (!date || !Number.isFinite(date.getTime())) return String(value);
  return date.toISOString().slice(0, bucket === "month" ? 7 : 4);
}
export function filterRows(rows: BIRow[], filters: BIFilter[]) {
  return rows.filter((row) =>
    filters.every((f) => {
      const v = row.values[f.field] ?? null,
        text = bucketValue(v, f.bucket),
        needle = f.value.trim(),
        n = typeof v === "number" ? v : Number(v);
      switch (f.op) {
        case "eq":
          return text === needle;
        case "contains":
          return text.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
        case "empty":
          return v === null || v === "";
        case "notempty":
          return v !== null && v !== "";
        case "gt":
          return (
            v !== null && v !== "" && Number.isFinite(n) && n > Number(needle)
          );
        case "lt":
          return (
            v !== null && v !== "" && Number.isFinite(n) && n < Number(needle)
          );
        case "between":
          return (
            v !== null &&
            v !== "" &&
            Number.isFinite(n) &&
            n >= Number(needle) &&
            n <= Number(f.value2)
          );
        default:
          return true;
      }
    }),
  );
}
export function aggregate(values: Value[], kind: Aggregate) {
  const nums = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  if (kind === "count")
    return values.filter((v) => v !== null && v !== "").length;
  if (kind === "distinct")
    return new Set(
      values
        .filter((v) => v !== null && v !== "")
        .map((v) => typeof v + ":" + String(v)),
    ).size;
  if (!nums.length) return null;
  if (kind === "sum") return nums.reduce((a, b) => a + b, 0);
  if (kind === "average") return nums.reduce((a, b) => a + b, 0) / nums.length;
  return kind === "min" ? Math.min(...nums) : Math.max(...nums);
}
export interface SeriesPoint {
  label: string;
  value: number;
  count: number;
}
export function series(rows: BIRow[], w: BIWidget) {
  const grouped = new Map<string, Value[]>();
  for (const row of rows) {
    const label = bucketValue(row.values[w.dimension], w.bucket) || "∅";
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push(row.values[w.metric] ?? null);
  }
  const points: SeriesPoint[] = [...grouped]
    .map(([label, values]) => ({
      label,
      value: aggregate(values, w.aggregation),
      count: values.filter((v) => v !== null && v !== "").length,
    }))
    .filter((p): p is SeriesPoint => p.value !== null);
  points.sort((a, b) =>
    w.sort === "label"
      ? a.label.localeCompare(b.label, undefined, { numeric: true })
      : w.sort === "value-asc"
        ? a.value - b.value
        : b.value - a.value,
  );
  return points.slice(0, Math.max(1, Math.min(50, w.limit)));
}
export function defaultDashboard(
  book: Workbook,
  source = book.active,
  ar = true,
): Dashboard {
  const d = dataset(book, source),
    numeric = d.fields.filter((f) => f.numeric && !f.date),
    metric =
      numeric.find((f) => /إيراد|revenue/i.test(f.label))?.id ||
      numeric.find((f) => /total|الإجمالي|مبلغ|cost|spend/i.test(f.label))
        ?.id ||
      numeric[0]?.id ||
      d.fields[0]?.id ||
      "A",
    dimension = d.fields.find((f) => !f.numeric)?.id || "A";
  const make = (
    type: BIWidget["type"],
    id: string,
    title: string,
    m = metric,
  ): BIWidget => ({
    id,
    title,
    type,
    metric: m,
    dimension,
    aggregation: "sum",
    bucket: "none",
    sort: "value-desc",
    limit: 8,
    wide: false,
    color: "#28816c",
  });
  return {
    version: 1,
    title: ar ? "لوحة أداء العمل" : "Business performance",
    source,
    excludeTotals: true,
    filters: [],
    widgets: [
      make("kpi", "kpi-total", ar ? "إجمالي القيمة" : "Total value"),
      {
        ...make(
          "kpi",
          "kpi-count",
          ar ? "عدد السجلات" : "Record count",
          dimension,
        ),
        aggregation: "count" as const,
      },
      make("kpi", "kpi-average", ar ? "متوسط القيمة" : "Average value"),
      make(
        "bar",
        "visual-category",
        ar ? "أداء حسب الفئة" : "Performance by category",
      ),
      {
        ...make(
          "donut",
          "visual-share",
          ar ? "توزيع المساهمة" : "Contribution share",
        ),
        color: "#b4914e",
      },
      {
        ...make(
          "line",
          "visual-trend",
          ar ? "مقارنة القيم" : "Value comparison",
        ),
        sort: "label" as const,
      },
      {
        ...make("table", "visual-pivot", ar ? "ملخص تجميعي" : "Pivot summary"),
        wide: true,
      },
    ].map((w) =>
      w.id === "kpi-average" ? { ...w, aggregation: "average" as const } : w,
    ),
  };
}
/** التحقق عند فتح ملف غير موثوق؛ لا نقبل حقولًا أو ألوانًا أو أحجامًا اعتباطية. */
export function sanitizeDashboard(input: unknown): Dashboard | undefined {
  const d = input as Dashboard;
  if (
    !d ||
    d.version !== 1 ||
    typeof d.source !== "string" ||
    !Array.isArray(d.widgets) ||
    !Array.isArray(d.filters)
  )
    return;
  const ids = new Set<string>();
  const field = (v: unknown) =>
    typeof v === "string" && /^[A-Z]{1,2}$/.test(v) ? v : "A";
  return {
    version: 1,
    title: String(d.title || "Dashboard").slice(0, 100),
    source: d.source,
    excludeTotals: d.excludeTotals !== false,
    widgets: d.widgets
      .slice(0, 20)
      .filter(
        (w) =>
          w && typeof w.id === "string" && !ids.has(w.id) && !!ids.add(w.id),
      )
      .map((w) => ({
        ...w,
        title: String(w.title || "Visual").slice(0, 100),
        type: [
          "kpi",
          "bar",
          "line",
          "area",
          "donut",
          "scatter",
          "table",
        ].includes(w.type)
          ? w.type
          : "bar",
        metric: field(w.metric),
        dimension: field(w.dimension),
        secondary: w.secondary ? field(w.secondary) : undefined,
        aggregation: [
          "sum",
          "average",
          "count",
          "distinct",
          "min",
          "max",
        ].includes(w.aggregation)
          ? w.aggregation
          : "sum",
        bucket: ["none", "month", "year"].includes(w.bucket)
          ? w.bucket
          : "none",
        sort: ["value-desc", "value-asc", "label"].includes(w.sort)
          ? w.sort
          : "value-desc",
        limit: Math.max(1, Math.min(50, Number(w.limit) || 8)),
        wide: !!w.wide,
        color: /^#[\da-f]{6}$/i.test(w.color) ? w.color : "#28816c",
        target:
          typeof w.target === "number" && Number.isFinite(w.target)
            ? w.target
            : undefined,
      })),
    filters: d.filters
      .slice(0, 8)
      .filter(
        (f) =>
          f &&
          typeof f.id === "string" &&
          [
            "eq",
            "contains",
            "gt",
            "lt",
            "between",
            "empty",
            "notempty",
          ].includes(f.op),
      )
      .map((f) => ({
        ...f,
        field: field(f.field),
        value: String(f.value ?? "").slice(0, 200),
        value2: String(f.value2 ?? "").slice(0, 200),
        bucket: ["month", "year"].includes(f.bucket || "") ? f.bucket : "none",
      })),
  };
}
