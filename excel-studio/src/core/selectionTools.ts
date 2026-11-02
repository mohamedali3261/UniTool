import { address, bounds, position, refs, shiftFormula } from "./address";
import { applyCells } from "./workbook";
import type { Sheet, Selection, Workbook, Cell } from "./types";
export function parseSelection(
  input: string,
  sheet: Pick<Sheet, "rows" | "cols">,
): Selection {
  const parts = input.trim().toUpperCase().split(":");
  if (
    parts.length > 2 ||
    !parts.every((s) => /^\$?[A-Z]{1,3}\$?[1-9]\d*$/.test(s))
  )
    throw Error("INVALID_RANGE");
  const ps = parts.map(position);
  if (ps.some((p) => p.row >= sheet.rows || p.col >= sheet.cols))
    throw Error("OUTSIDE_SHEET");
  return {
    anchor: address(ps[0].row, ps[0].col),
    end: address(ps.at(-1)!.row, ps.at(-1)!.col),
  };
}
export function wholeSelection(sheet: Pick<Sheet, "rows" | "cols">): Selection {
  return { anchor: "A1", end: address(sheet.rows - 1, sheet.cols - 1) };
}
export function fillRight(book: Workbook, id: string, selection: Selection) {
  const sheet = book.sheets.find((s) => s.id === id)!,
    b = bounds(selection.anchor, selection.end),
    patch: Record<string, Cell> = {};
  for (let r = b.r1; r <= b.r2; r++)
    for (let c = b.c1 + 1; c <= b.c2; c++) {
      const source = sheet.cells[address(r, b.c1)];
      patch[address(r, c)] = {
        ...source,
        raw: shiftFormula(source?.raw || "", 0, c - b.c1),
      };
    }
  return applyCells(book, id, patch);
}
export function clearFormatting(
  book: Workbook,
  id: string,
  selection: Selection,
) {
  const sheet = book.sheets.find((s) => s.id === id)!;
  return applyCells(
    book,
    id,
    Object.fromEntries(
      refs(selection.anchor, selection.end)
        .filter((ref) => !!sheet.cells[ref])
        .map((ref) => [
          ref,
          {
            format: undefined,
            bold: undefined,
            italic: undefined,
            fill: undefined,
            color: undefined,
            align: undefined,
          },
        ]),
    ),
  );
}
