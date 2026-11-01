import FormulaParser from "fast-formula-parser";
import { functionAdapters } from "./functions";
import { address, position, normalizeFormula } from "./address";
import {
  LIMITS,
  type Workbook,
  type Result,
  type Value,
  type Cell,
  type Sheet,
} from "./types";
export function literal(raw: string): Value {
  if (!raw) return null;
  if (raw.startsWith("'")) return raw.slice(1);
  const n = raw
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
  if (
    /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?$/.test(n) ||
    /^[+-]?\.\d+%?$/.test(n)
  ) {
    const value = Number(n.replace(/[, %]/g, ""));
    if (Number.isFinite(value)) return value / (n.endsWith("%") ? 100 : 1);
  }
  if (
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+$/.test(n) &&
    Number.isFinite(Number(n))
  )
    return Number(n);
  if (/^true$/i.test(n)) return true;
  if (/^false$/i.test(n)) return false;
  return raw;
}
export function calculator(book: Workbook) {
  const cache = new Map<string, Result>(),
    visiting = new Set<string>();
  let steps = 0;
  const cell = (sheetId: string, ref: string): Result => {
    const key = sheetId + "!" + ref;
    if (cache.has(key)) return cache.get(key)!;
    if (visiting.has(key)) return { value: "#CYCLE!", error: "#CYCLE!" };
    if (visiting.size > 150 || ++steps > 50000)
      return { value: "#LIMIT!", error: "#LIMIT!" };
    const sheet = book.sheets.find((s) => s.id === sheetId);
    if (!sheet) return { value: "#REF!", error: "#REF!" };
    let pos;
    try {
      pos = position(ref);
    } catch {
      return { value: "#REF!", error: "#REF!" };
    }
    if (
      pos.row < 0 ||
      pos.col < 0 ||
      pos.row >= LIMITS.rows ||
      pos.col >= LIMITS.cols
    )
      return { value: "#REF!", error: "#REF!" };
    const raw = sheet.cells[ref]?.raw || "";
    if (!raw.startsWith("=")) {
      const res = { value: literal(raw) };
      cache.set(key, res);
      return res;
    }
    visiting.add(key);
    let result: Result;
    try {
      if (raw.length > 2048) throw Error("#LIMIT!");
      let dependencyError: string | undefined;
      const resolve = (name?: string) => {
        if (!name) return sheet.id;
        const found = book.sheets.find((s) => s.name === name);
        if (!found) throw new FormulaParser.FormulaError("#REF!");
        return found.id;
      };
      const get = (sheet: string, ref: string) => {
        const r = cell(sheet, ref);
        if (r.error === "#CYCLE!" || r.error === "#LIMIT!") {
          dependencyError = r.error;
          return 0;
        }
        return r.error ? new FormulaParser.FormulaError(r.error) : r.value;
      };
      const parser = new FormulaParser({
        functions: {
          ...functionAdapters,
          WEBSERVICE: () => {
            throw Error("#BLOCKED!");
          },
        },
        onVariable: () => {
          throw Error("#NAME?");
        },
        onCell: ({ sheet: name, row, col }: any) =>
          get(resolve(name), address(row - 1, col - 1)),
        onRange: ({ sheet: name, from, to }: any) => {
          const endR = Math.min(to.row, LIMITS.rows),
            endC = Math.min(to.col, LIMITS.cols);
          if (from.row > LIMITS.rows || from.col > LIMITS.cols)
            throw new FormulaParser.FormulaError("#REF!");
          const arr: Value[][] = [];
          for (let r = from.row; r <= endR; r++) {
            const line: Value[] = [];
            for (let c = from.col; c <= endC; c++)
              line.push(get(resolve(name), address(r - 1, c - 1)));
            arr.push(line);
          }
          return arr;
        },
      });
      let value = parser.parse(
        normalizeFormula(raw.slice(1)),
        { row: pos.row + 1, col: pos.col + 1, sheet: sheet.name },
        true,
      );
      if (dependencyError)
        throw new FormulaParser.FormulaError(dependencyError);
      if (value instanceof Error || value?.error) throw value;
      if (Array.isArray(value)) throw Error("#ARRAY!");
      if (value instanceof Date)
        value = (value.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
      if (typeof value === "number" && !Number.isFinite(value))
        throw Error("#NUM!");
      result = { value: value as Value };
    } catch (e: any) {
      const code =
        String(
          e?.details?.error ||
            e?.details?.details?.error ||
            e?.error ||
            e?.message ||
            "#ERROR!",
        ).match(/#[A-Z0-9/]+[!?]?/)?.[0] || "#ERROR!";
      result = { value: code, error: code };
    } finally {
      visiting.delete(key);
    }
    cache.set(key, result!);
    return result!;
  };
  return { cell };
}
export const errorHelp: Record<string, [string, string]> = {
  "#DIV/0!": [
    "القسمة على صفر: غيّر المقسوم عليه أو استخدم IFERROR.",
    "Division by zero. Check the divisor or use IFERROR.",
  ],
  "#CYCLE!": [
    "مرجع دائري: المعادلة تشير لنفسها مباشرة أو عبر خلية أخرى.",
    "Circular reference: this formula refers back to itself.",
  ],
  "#NAME?": [
    "اسم دالة غير معروف أو نص بدون علامات اقتباس.",
    "Unknown function/name or unquoted text.",
  ],
  "#N/A": [
    "القيمة المطلوبة غير موجودة. راجع نطاق البحث.",
    "Value not found. Check the lookup range.",
  ],
  "#REF!": [
    "مرجع خلية أو ورقة غير موجود أو خارج حدود المحرر.",
    "Cell/sheet reference is missing or outside editor limits.",
  ],
  "#ARRAY!": [
    "نتائج المصفوفات المتدفقة غير معروضة في هذه النسخة.",
    "Spilling array results are not supported in this version.",
  ],
  "#LIMIT!": [
    "المعادلة أو سلسلة الحساب أطول من حدود الأمان.",
    "Calculation exceeds safety limits.",
  ],
  "#VALUE!": [
    "نوع بيانات غير مناسب. راجع الأرقام والنصوص.",
    "Invalid argument type. Check numbers and text.",
  ],
  "#ERROR!": [
    "راجع الأقواس والفواصل وتركيب المعادلة.",
    "Check formula syntax, parentheses and separators.",
  ],
};
export function display(
  value: Value,
  cell: Cell | undefined,
  sheet: Sheet,
  lang = "ar",
) {
  if (value === null) return "";
  if (typeof value !== "number") return String(value);
  const fmt = cell?.format;
  if (fmt === "date") {
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toISOString().slice(0, 10);
  }
  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: fmt === "auto" || !fmt ? 6 : sheet.decimals,
  };
  if (fmt === "currency") {
    options.style = "currency";
    options.currency = sheet.currency;
  }
  if (fmt === "percent") options.style = "percent";
  if (fmt === "number" || fmt === "currency" || fmt === "percent")
    options.minimumFractionDigits = sheet.decimals;
  return new Intl.NumberFormat(
    lang === "ar" ? "ar-EG" : "en-US",
    options,
  ).format(value);
}
