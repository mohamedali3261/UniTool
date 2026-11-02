import { LIMITS, themes, type Workbook, type Cell } from "./types";
import { newBook, newSheet, validateBook } from "./workbook";
import { address, position } from "./address";
import { calculator, display } from "./calculate";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseDelimited(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    part = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && (quoted || part === "")) {
      if (quoted && text[i + 1] === '"') {
        part += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(part);
      part = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(part);
      rows.push(row);
      row = [];
      part = "";
    } else part += c;
  }
  if (quoted) throw Error("علامات اقتباس غير مكتملة / Unclosed CSV quote");
  if (part || row.length) {
    row.push(part);
    rows.push(row);
  }
  return rows;
}
export function projectBlob(book: Workbook) {
  return new Blob([JSON.stringify(book, null, 2)], {
    type: "application/json",
  });
}
export function csvBlob(book: Workbook, sheetId: string) {
  const s = book.sheets.find((s) => s.id === sheetId)!,
    calc = calculator(book),
    used = Object.keys(s.cells).map(position),
    maxR = Math.max(0, ...used.map((p) => p.row)),
    maxC = Math.max(0, ...used.map((p) => p.col)),
    rows: string[] = [];
  for (let r = 0; r <= maxR; r++) {
    const row = [];
    for (let c = 0; c <= maxC; c++) {
      const v = calc.cell(s.id, address(r, c)).value;
      let value = v == null ? "" : String(v);
      /* منع حقن صيغ CSV عند فتح الملف في برامج أخرى. */ if (
        typeof v === "string" &&
        /^[\s]*[=+\-@\t\r]/.test(value)
      )
        value = "'" + value;
      row.push('"' + value.replace(/"/g, '""') + '"');
    }
    rows.push(row.join(","));
  }
  return new Blob(["\uFEFF" + rows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
}
export async function xlsxBlob(book: Workbook) {
  const { default: ExcelJS } = await import("exceljs");
  const out = new ExcelJS.Workbook(),
    calc = calculator(book);
  out.creator = "UniTool Sheet Studio";
  out.calcProperties.fullCalcOnLoad = true;
  for (const s of book.sheets) {
    const ws = out.addWorksheet(s.name, {
      views: [
        {
          state: s.freeze ? "frozen" : "normal",
          ySplit: s.freeze && s.header ? 1 : 0,
        },
      ],
      properties: { defaultRowHeight: 26 },
    });
    for (let c = 1; c <= s.cols; c++) ws.getColumn(c).width = c === 1 ? 24 : 18;
    const t = themes[s.theme as keyof typeof themes] || themes.emerald;
    for (const [ref, cell] of Object.entries(s.cells)) {
      const target = ws.getCell(ref),
        res = calc.cell(s.id, ref),
        p = position(ref);
      if (cell.raw.startsWith("="))
        target.value = {
          formula: cell.raw.slice(1),
          ...(res.error ? {} : { result: res.value ?? 0 }),
        } as any;
      else target.value = res.value;
      const header = s.header && p.row === 0,
        fill =
          cell.fill ||
          (header
            ? t.head
            : s.striped && p.row % 2 === 0
              ? t.stripe
              : "#ffffff");
      target.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF" + fill.slice(1) },
      };
      target.font = {
        name: "Arial",
        size: 11,
        bold: cell.bold || header,
        italic: cell.italic,
        color: {
          argb:
            "FF" + (cell.color || (header ? "#ffffff" : "#273744")).slice(1),
        },
      };
      target.alignment = {
        horizontal: cell.align || undefined,
        vertical: "middle",
        wrapText: true,
      };
      const f = cell.format;
      target.numFmt =
        f === "currency"
          ? `#,##0.${"0".repeat(s.decimals)} "${s.currency}"`
          : f === "percent"
            ? `0.${"0".repeat(s.decimals)}%`
            : f === "date"
              ? "yyyy-mm-dd"
              : f === "number"
                ? `#,##0${s.decimals ? "." + "0".repeat(s.decimals) : ""}`
                : "General";
      target.border = {
        bottom: { style: "hair", color: { argb: "FFE4E9E6" } },
      };
    }
    if (s.header && Object.keys(s.cells).length)
      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: {
          row: Math.max(
            1,
            ...Object.keys(s.cells).map((k) => position(k).row + 1),
          ),
          column: s.cols,
        },
      };
  }
  return new Blob([(await out.xlsx.writeBuffer()) as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
export async function importFile(
  file: File,
): Promise<{ book: Workbook; warnings: string[] }> {
  if (file.size > LIMITS.file)
    throw Error("الملف أكبر من 5 MB / File exceeds 5 MB");
  const warnings: string[] = [];
  if (/\.(json|unitool)$/i.test(file.name))
    return { book: validateBook(JSON.parse(await file.text())), warnings };
  if (/\.(csv|tsv|txt)$/i.test(file.name)) {
    const text = await file.text(),
      first = text.split(/\r?\n/)[0],
      delimiter =
        /\.tsv$/i.test(file.name) || first.includes("\t")
          ? "\t"
          : first.includes(";") && !first.includes(",")
            ? ";"
            : ",";
    const rows = parseDelimited(text, delimiter);
    if (rows.length > LIMITS.rows || rows.some((r) => r.length > LIMITS.cols))
      throw Error("الملف يتجاوز 300 صف × 30 عمود");
    const b = newBook(file.name.replace(/\.[^.]+$/, "")),
      s = b.sheets[0];
    s.rows = Math.max(24, rows.length);
    s.cols = Math.max(8, ...rows.map((r) => r.length));
    rows.forEach((row, r) =>
      row.forEach((raw, c) => {
        if (raw)
          s.cells[address(r, c)] = {
            raw: raw.startsWith("=") ? "'" + raw : raw,
          };
      }),
    );
    warnings.push(
      "CSV يُستورد كنص/قيم؛ لا ننفّذ معادلاته تلقائيًا. / CSV formulas are imported as text.",
    );
    return { book: validateBook(b), warnings };
  }
  if (!/\.xlsx$/i.test(file.name))
    throw Error(
      "ندعم XLSX وCSV وTSV وملفات المشروع فقط؛ حوّل XLS/XLSM إلى XLSX.",
    );
  const buffer = await file.arrayBuffer();
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const unpacked = Object.values(zip.files).reduce(
    (sum, f) => sum + ((f as any)._data?.uncompressedSize || 0),
    0,
  );
  if (unpacked > 25 * 1024 * 1024)
    throw Error("محتوى الملف بعد فك الضغط أكبر من الحد الآمن");
  const { default: ExcelJS } = await import("exceljs");
  const source = new ExcelJS.Workbook();
  await source.xlsx.load(buffer);
  if (source.worksheets.length > LIMITS.sheets)
    throw Error("الحد الأقصى 8 أوراق");
  const book = newBook(file.name.replace(/\.xlsx$/i, ""));
  book.sheets = [];
  let count = 0;
  for (const ws of source.worksheets) {
    if (
      ws.actualRowCount > LIMITS.rows ||
      ws.actualColumnCount > LIMITS.cols ||
      ws.rowCount > LIMITS.rows ||
      ws.columnCount > LIMITS.cols
    )
      throw Error("إحدى الأوراق تتجاوز 300 صف × 30 عمود");
    const s = newSheet(ws.name);
    s.rows = Math.max(24, ws.rowCount);
    s.cols = Math.max(8, ws.columnCount);
    ws.eachRow((row, r) =>
      row.eachCell((v, c) => {
        if (++count > LIMITS.cells) throw Error("أكثر من 20,000 خلية");
        const value = v.value;
        let raw = "";
        if (value instanceof Date)
          raw = String((value.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
        else if (value && typeof value === "object") {
          if ("formula" in value) raw = "=" + value.formula;
          else if ("sharedFormula" in value) {
            try {
              raw = "=" + v.formula;
            } catch {
              raw = String(v.result ?? "");
              warnings.push("بعض المعادلات المشتركة تم تحويلها لقيم.");
            }
          } else if ("richText" in value)
            raw = value.richText.map((t) => t.text).join("");
          else if ("text" in value) raw = String(value.text);
          else if ("error" in value) raw = "'" + value.error;
        } else raw = String(value ?? "");
        const fmt = v.numFmt || "";
        const cell: Cell = {
          raw,
          bold: v.font?.bold,
          italic: v.font?.italic,
          format: /%/.test(fmt)
            ? "percent"
            : value instanceof Date || /[ymd]{2}/i.test(fmt)
              ? "date"
              : /[$€£]|EGP|USD/.test(fmt)
                ? "currency"
                : "auto",
        };
        const color =
          v.fill && "fgColor" in v.fill ? v.fill.fgColor?.argb : undefined;
        if (color && /^[A-F\d]{8}$/i.test(color))
          cell.fill = "#" + color.slice(2);
        const fc = v.font?.color?.argb;
        if (fc && /^[A-F\d]{8}$/i.test(fc)) cell.color = "#" + fc.slice(2);
        s.cells[address(r - 1, c - 1)] = cell;
      }),
    );
    book.sheets.push(s);
  }
  if (!book.sheets.length) throw Error("لا توجد أوراق في الملف");
  book.active = book.sheets[0].id;
  warnings.push(
    "استوردنا الخلايا والمعادلات والتنسيق الأساسي. الرسوم والدمج والماكرو والتنسيق الشرطي غير مستوردة. / Advanced Excel features are not imported.",
  );
  return { book: validateBook(book), warnings };
}
