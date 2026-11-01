import type { Sheet, Value } from "./types";
import type { ConditionalRule, ValidationRule } from "./analyticsTypes";
import { literal } from "./calculate";
import { address, position } from "./address";
export function validationError(
  raw: string,
  rule: ValidationRule,
): string | null {
  if (raw.startsWith("=")) return null;
  const v = literal(raw);
  if (v === null || v === "")
    return rule.required ? "القيمة مطلوبة / A value is required" : null;
  if (rule.type === "list")
    return rule.options?.includes(String(v).trim())
      ? null
      : "اختار قيمة من القائمة / Choose an allowed value";
  if (rule.type === "number") {
    if (typeof v !== "number" || !Number.isFinite(v))
      return "الخلية تتطلب رقمًا / A number is required";
    if (rule.min !== undefined && v < rule.min)
      return "القيمة أقل من الحد الأدنى / Below minimum";
    if (rule.max !== undefined && v > rule.max)
      return "القيمة أكبر من الحد الأقصى / Above maximum";
  }
  if (rule.type === "date") {
    if (typeof v === "number")
      return v >= 0 && v <= 2958465 ? null : "تاريخ غير صالح / Invalid date";
    const s = String(v),
      d = new Date(s);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
      !Number.isFinite(d.getTime()) ||
      d.toISOString().slice(0, 10) !== s
    )
      return "اكتب التاريخ YYYY-MM-DD / Enter a valid YYYY-MM-DD date";
  }
  return null;
}
export function conditionalStyle(
  value: Value,
  column: number,
  rules: ConditionalRule[],
  counts: Map<string, number>,
) {
  for (const rule of rules) {
    if (rule.column !== column) continue;
    const n = typeof value === "number" ? value : NaN,
      s = String(value ?? "");
    const matches =
      rule.op === "empty"
        ? value === null || value === ""
        : rule.op === "contains"
          ? s.toLowerCase().includes(rule.value.toLowerCase())
          : rule.op === "duplicates"
            ? s !== "" &&
              (counts.get(column + ":" + typeof value + ":" + s) || 0) > 1
            : rule.op === "gt"
              ? n > Number(rule.value)
              : rule.op === "lt"
                ? n < Number(rule.value)
                : n >= Number(rule.value) && n <= Number(rule.value2);
    if (matches) return { fill: rule.fill, color: rule.color };
  }
  return null;
}
export function replaceCells(
  sheet: Sheet,
  find: string,
  replacement: string,
  caseSensitive: boolean,
  whole: boolean,
  selection?: string[],
): Record<string, { raw: string }> {
  if (!find) return {};
  const keys = selection || Object.keys(sheet.cells),
    patch: Record<string, { raw: string }> = {},
    escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    regex = new RegExp(
      whole ? "^" + escaped + "$" : escaped,
      caseSensitive ? "g" : "gi",
    );
  for (const key of keys) {
    const raw = sheet.cells[key]?.raw;
    if (!raw || raw.startsWith("=")) continue;
    const next = raw.replace(regex, () => replacement);
    if (next !== raw) patch[key] = { raw: next };
  }
  return patch;
}
export function sanitizeTableFeatures(sheet: Sheet) {
  sheet.columnWidths = Object.fromEntries(
    Object.entries(sheet.columnWidths || {})
      .filter(
        ([c, w]) =>
          /^\d+$/.test(c) && Number(c) < sheet.cols && Number.isFinite(w),
      )
      .map(([c, w]) => [c, Math.max(70, Math.min(400, w))]),
  );
  sheet.wrap = !!sheet.wrap;
  sheet.showFormulas = !!sheet.showFormulas;
  sheet.validation = (Array.isArray(sheet.validation) ? sheet.validation : [])
    .filter(
      (r) =>
        r &&
        Number.isInteger(r.column) &&
        r.column >= 0 &&
        r.column < sheet.cols &&
        ["number", "list", "date"].includes(r.type),
    )
    .slice(0, 30)
    .map((r) => ({
      ...r,
      min: Number.isFinite(r.min) ? r.min : undefined,
      max: Number.isFinite(r.max) ? r.max : undefined,
      required: !!r.required,
      options: Array.isArray(r.options)
        ? r.options
            .filter((v) => typeof v === "string")
            .slice(0, 100)
            .map((v) => v.slice(0, 100))
        : [],
    }));
  sheet.conditional = (
    Array.isArray(sheet.conditional) ? sheet.conditional : []
  )
    .filter(
      (r) =>
        r &&
        Number.isInteger(r.column) &&
        r.column >= 0 &&
        r.column < sheet.cols &&
        ["gt", "lt", "between", "duplicates", "empty", "contains"].includes(
          r.op,
        ),
    )
    .slice(0, 8)
    .map((r) => ({
      ...r,
      id: String(r.id || "rule"),
      value: String(r.value ?? "").slice(0, 100),
      value2: String(r.value2 ?? "").slice(0, 100),
      fill: /^#[\da-f]{6}$/i.test(r.fill) ? r.fill : "#fff1d7",
      color: /^#[\da-f]{6}$/i.test(r.color) ? r.color : "#8b631f",
    }));
}
