import { address, position, refs, shiftFormula } from "./address";
import {
  themes,
  LIMITS,
  type Sheet,
  type Workbook,
  type Cell,
  type Selection,
} from "./types";
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  Date.now().toString(36) + Math.random().toString(36).slice(2);
export function newSheet(name = "Sheet 1"): Sheet {
  return {
    id: uid(),
    name,
    rows: 24,
    cols: 8,
    cells: {},
    theme: "emerald",
    header: true,
    striped: true,
    freeze: true,
    decimals: 2,
    currency: "EGP",
    negative: true,
  };
}
export function newBook(name = "جدولي الجديد"): Workbook {
  const s = newSheet("الجدول 1");
  return {
    version: 1,
    id: uid(),
    name,
    active: s.id,
    sheets: [s],
    updated: Date.now(),
  };
}
export function applyCells(
  book: Workbook,
  sheetId: string,
  patch: Record<string, Partial<Cell> | null>,
) {
  const next = structuredClone(book),
    sheet = next.sheets.find((s) => s.id === sheetId)!;
  for (const [key, value] of Object.entries(patch)) {
    const p = position(key);
    if (p.row < 0 || p.col < 0 || p.row >= LIMITS.rows || p.col >= LIMITS.cols)
      throw Error("حدود الجدول 300 صف × 30 عمود");
    if (value === null) delete sheet.cells[key];
    else {
      if (
        value.raw !== undefined &&
        (typeof value.raw !== "string" || value.raw.length > 10000)
      )
        throw Error("الحد الأقصى 10,000 حرف في الخلية");
      sheet.cells[key] = {
        ...sheet.cells[key],
        raw: sheet.cells[key]?.raw || "",
        ...value,
      };
      sheet.rows = Math.max(sheet.rows, p.row + 1);
      sheet.cols = Math.max(sheet.cols, p.col + 1);
    }
  }
  if (
    next.sheets.reduce((n, s) => n + Object.keys(s.cells).length, 0) >
    LIMITS.cells
  )
    throw Error("الحد الأقصى 20,000 خلية");
  next.updated = Date.now();
  return next;
}
export function paste(
  book: Workbook,
  sheetId: string,
  start: string,
  rows: string[][],
) {
  const p = position(start),
    patch: Record<string, Partial<Cell>> = {};
  for (let r = 0; r < rows.length; r++)
    for (let c = 0; c < rows[r].length; c++)
      patch[address(p.row + r, p.col + c)] = { raw: rows[r][c] };
  return applyCells(book, sheetId, patch);
}
export function fillDown(
  book: Workbook,
  sheetId: string,
  selection: Selection,
) {
  const keys = refs(selection.anchor, selection.end),
    sheet = book.sheets.find((s) => s.id === sheetId)!,
    p = position(selection.anchor),
    q = position(selection.end),
    first = Math.min(p.row, q.row),
    patch: Record<string, Cell> = {};
  for (const key of keys) {
    const pos = position(key),
      source = sheet.cells[address(first, pos.col)];
    if (pos.row > first)
      patch[key] = {
        ...source,
        raw: shiftFormula(source?.raw || "", pos.row - first),
      };
  }
  return applyCells(book, sheetId, patch);
}
/** ترتيب الصفوف يضبط مراجع المعادلات النسبية المنقولة دون لمس التثبيت $. */
export function sortSheet(
  book: Workbook,
  sheetId: string,
  col: number,
  descending: boolean,
  value: (ref: string) => unknown,
) {
  const s = book.sheets.find((s) => s.id === sheetId)!,
    start = s.header ? 1 : 0,
    isTotal = (r: number) =>
      /^(الإجمالي|الاجمالي|إجمالي|اجمالي|المجموع|total|totals|grand total)$/i.test(
        s.cells[address(r, 0)]?.raw.trim() || "",
      ),
    targets = Array.from(
      { length: s.rows - start },
      (_, i) => start + i,
    ).filter((r) => !isTotal(r)),
    rows = targets.filter((r) =>
      Array.from(
        { length: s.cols },
        (_, c) => s.cells[address(r, c)]?.raw,
      ).some(Boolean),
    );
  rows.sort((a, b) => {
    const av = value(address(a, col)),
      bv = value(address(b, col));
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
            numeric: true,
          });
    return descending ? -cmp : cmp;
  });
  const patch: Record<string, Cell | null> = {};
  for (let index = 0; index < targets.length; index++)
    for (let c = 0; c < s.cols; c++) {
      const r = targets[index],
        from = rows[index],
        source = from === undefined ? undefined : s.cells[address(from, c)];
      patch[address(r, c)] = source
        ? { ...source, raw: shiftFormula(source.raw, r - from) }
        : null;
    }
  return applyCells(book, sheetId, patch);
}
export function validateBook(input: unknown): Workbook {
  const b = input as Workbook;
  if (
    !b ||
    b.version !== 1 ||
    !Array.isArray(b.sheets) ||
    !b.sheets.length ||
    b.sheets.length > LIMITS.sheets
  )
    throw Error("ملف مشروع غير صالح");
  const ids = new Set<string>(),
    names = new Set<string>();
  let count = 0;
  for (const s of b.sheets) {
    if (
      typeof s.id !== "string" ||
      ids.has(s.id) ||
      typeof s.name !== "string" ||
      !s.name.trim() ||
      names.has(s.name.toLowerCase()) ||
      !s.cells ||
      typeof s.cells !== "object" ||
      Array.isArray(s.cells) ||
      !Number.isInteger(s.rows) ||
      !Number.isInteger(s.cols) ||
      s.rows < 1 ||
      s.cols < 1 ||
      s.rows > LIMITS.rows ||
      s.cols > LIMITS.cols
    )
      throw Error("بيانات الجدول غير صالحة");
    ids.add(s.id);
    names.add(s.name.toLowerCase());
    if (s.name.length > 31 || /[\[\]:*?\/\\]/.test(s.name))
      throw Error("اسم ورقة غير صالح");
    if (!Object.hasOwn(themes, s.theme)) s.theme = "emerald";
    s.header = !!s.header;
    s.freeze = !!s.freeze;
    s.striped = !!s.striped;
    s.negative = !!s.negative;
    for (const [key, c] of Object.entries(s.cells)) {
      const p = position(key);
      if (
        p.row >= s.rows ||
        p.col >= s.cols ||
        !c ||
        typeof c.raw !== "string" ||
        c.raw.length > 10000
      )
        throw Error("خلية غير صالحة");
      if (c.align && !["left", "center", "right"].includes(c.align))
        delete c.align;
      if (
        c.format &&
        !["auto", "number", "currency", "percent", "date"].includes(c.format)
      )
        delete c.format;
      c.bold = !!c.bold;
      c.italic = !!c.italic;
      if (c.fill && !/^#[a-f\d]{6}$/i.test(c.fill)) delete c.fill;
      if (c.color && !/^#[a-f\d]{6}$/i.test(c.color)) delete c.color;
      if (++count > LIMITS.cells) throw Error("المشروع أكبر من الحد المسموح");
    }
    s.decimals = Math.max(0, Math.min(6, Number(s.decimals) || 0));
    s.currency = ["EGP", "USD", "EUR", "SAR", "AED"].includes(s.currency)
      ? s.currency
      : "EGP";
  }
  if (!ids.has(b.active)) b.active = b.sheets[0].id;
  b.name = String(b.name || "Workbook").slice(0, 100);
  return b;
}
