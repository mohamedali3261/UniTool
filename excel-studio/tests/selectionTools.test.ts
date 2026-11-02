import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSelection,
  wholeSelection,
  fillRight,
  clearFormatting,
} from "../src/core/selectionTools";
import { exampleBook } from "../src/pages/functions/catalog";
test("range parser validates bounds, reversed ranges and absolute/lowercase addresses", () => {
  const s = { rows: 20, cols: 8 };
  assert.deepEqual(parseSelection("$c$4:a2", s), { anchor: "C4", end: "A2" });
  assert.deepEqual(parseSelection("B3", s), { anchor: "B3", end: "B3" });
  assert.deepEqual(wholeSelection(s), { anchor: "A1", end: "H20" });
  for (const v of ["", "A0", "A21", "I1", "A1:B2:C3", "A1;B2", "A999999"])
    assert.throws(() => parseSelection(v, s));
});
test("fill right translates relative columns, preserves absolute references and does not mutate source", () => {
  const b = exampleBook(),
    s = b.sheets[0];
  s.cells.A4 = { raw: '=$A1+B$2+"A1"', bold: true };
  const next = fillRight(b, s.id, { anchor: "C4", end: "A4" });
  assert.equal(next.sheets[0].cells.B4.raw, '=$A1+C$2+"A1"');
  assert.equal(next.sheets[0].cells.C4.raw, '=$A1+D$2+"A1"');
  assert.equal(next.sheets[0].cells.C4.bold, true);
  assert.equal(b.sheets[0].cells.B4, undefined);
});
test("clear formatting retains formulas, other cells and does not materialize empty cells", () => {
  const b = exampleBook(),
    s = b.sheets[0];
  s.cells.A1 = {
    raw: "=SUM(B1:B3)",
    bold: true,
    format: "currency",
    fill: "#ff0000",
  };
  const n = clearFormatting(b, s.id, { anchor: "A1", end: "A5" });
  assert.equal(n.sheets[0].cells.A1.raw, "=SUM(B1:B3)");
  assert.equal(n.sheets[0].cells.A1.bold, undefined);
  assert.equal(n.sheets[0].cells.A1.fill, undefined);
  assert.equal(n.sheets[0].cells.A5, undefined);
  assert.equal(n.sheets[0].cells.B1.raw, "2");
  assert.equal(s.cells.A1.bold, true);
});
