import { test } from "node:test";
import assert from "node:assert/strict";
import { calculator, literal, display } from "../src/core/calculate";
import {
  newBook,
  applyCells,
  paste,
  fillDown,
  sortSheet,
  validateBook,
} from "../src/core/workbook";
import {
  address,
  colName,
  position,
  shiftFormula,
  normalizeFormula,
} from "../src/core/address";
import { templateBook, templates } from "../src/data/templates";
import { exampleBook, catalog } from "../src/pages/functions/catalog";
import { parseDelimited, csvBlob, xlsxBlob, importFile } from "../src/core/io";
const formula = (raw: string) => {
  const b = exampleBook();
  b.sheets[0].cells.J10 = { raw };
  return calculator(b).cell(b.active, "J10");
};
test("cell addressing supports AA and roundtrips", () => {
  for (let c = 0; c < 100; c++)
    assert.deepEqual(position(address(32, c)), { row: 32, col: c });
  assert.equal(colName(26), "AA");
});
test("Arabic numbers, percentages, explicit text and booleans", () => {
  assert.equal(literal("١٬٢٣٤٫٥"), 1234.5);
  assert.equal(literal("20%"), 0.2);
  assert.equal(literal("'00123"), "00123");
  assert.equal(literal("FALSE"), false);
});
test("Excel arithmetic, semicolon support and native/extended functions", () => {
  for (const [f, expected] of [
    ["=SUM(A1:A3)", 60],
    ["=MAX(A1:A3)", 30],
    ["=MIN(A1:A3)", 10],
    ['=COUNTIFS(A1:A3,">15",B1:B3,">3")', 2],
    ['=SUMIFS(B1:B3,A1:A3,">15")', 10],
    ["=IFERROR(1/0;99)", 99],
    ['=LEN("العربية")', 7],
    ["=MEDIAN(1,3,100)", 3],
  ] as const)
    assert.equal(formula(f).value, expected, f);
});
test("references recalculate and circular references are visible", () => {
  let b = exampleBook();
  b = applyCells(b, b.active, { D1: { raw: "=A1*2" }, A1: { raw: "50" } });
  assert.equal(calculator(b).cell(b.active, "D1").value, 100);
  b = applyCells(b, b.active, { A1: { raw: "=D1" } });
  assert.equal(calculator(b).cell(b.active, "D1").error, "#CYCLE!");
});
test("dependent errors propagate and IFERROR can handle them", () => {
  let b = exampleBook();
  b = applyCells(b, b.active, {
    D1: { raw: "=1/0" },
    D2: { raw: "=IFERROR(D1,7)" },
    D3: { raw: "=D1+1" },
  });
  const c = calculator(b);
  assert.equal(c.cell(b.active, "D2").value, 7);
  assert.equal(c.cell(b.active, "D3").error, "#DIV/0!");
});
test("cross-sheet references and missing sheets", () => {
  const b = exampleBook();
  const second = structuredClone(b.sheets[0]);
  second.id = "second";
  second.name = "Other sheet";
  second.cells.A1 = { raw: "75" };
  b.sheets.push(second);
  b.sheets[0].cells.D1 = { raw: "='Other sheet'!A1+5" };
  b.sheets[0].cells.D2 = { raw: "=Missing!A1" };
  const c = calculator(b);
  assert.equal(c.cell(b.active, "D1").value, 80);
  assert.equal(c.cell(b.active, "D2").error, "#REF!");
});
test("formula copying respects absolute references and quoted strings", () => {
  assert.equal(
    shiftFormula('=A2*$B$1+C$3+$D4+"A2"', 2),
    '=A4*$B$1+C$3+$D6+"A2"',
  );
  assert.equal(shiftFormula("=A1", -1), "=#REF!");
  assert.equal(normalizeFormula('SUM(1;2)+LEN("a;b")'), 'SUM(1,2)+LEN("a;b")');
});
test("paste grows dimensions but cannot exceed safe bounds", () => {
  let b = newBook();
  b = paste(b, b.active, "H24", [
    ["1", "2"],
    ["3", "=I24*2"],
  ]);
  assert.equal(b.sheets[0].cols, 9);
  assert.equal(b.sheets[0].rows, 25);
  assert.equal(calculator(b).cell(b.active, "I25").value, 4);
  assert.throws(() => paste(b, b.active, "AD300", [["1", "2"]]));
});
test("fill down shifts formulas as one batch", () => {
  let b = exampleBook();
  b = applyCells(b, b.active, { D1: { raw: "=A1*B1", bold: true } });
  b = fillDown(b, b.active, { anchor: "D1", end: "D3" });
  assert.equal(b.sheets[0].cells.D3.raw, "=A3*B3");
  assert.equal(calculator(b).cell(b.active, "D3").value, 180);
  assert.equal(b.sheets[0].cells.D3.bold, true);
});
test("sort keeps headers and relocates relative formulas", () => {
  let b = templateBook("sales");
  const calc = calculator(b);
  b = sortSheet(b, b.active, 1, true, (ref) => calc.cell(b.active, ref).value);
  assert.equal(b.sheets[0].cells.A1.raw, "المنتج");
  assert.equal(b.sheets[0].cells.B2.raw, "60");
  assert.equal(b.sheets[0].cells.B6.raw, "=SUM(B2:B5)");
  assert.ok(b.sheets[0].cells.E2.raw.startsWith("="));
});
for (const template of templates)
  test("template calculates without errors: " + template.id, () => {
    const b = templateBook(template.id),
      c = calculator(b);
    for (const ref of Object.keys(b.sheets[0].cells))
      assert.equal(c.cell(b.active, ref).error, undefined, ref);
  });
test("dynamic arrays and unsupported names are explicit errors", () => {
  assert.equal(formula("=UNIQUE(A1:A3)").error, "#ARRAY!");
  assert.ok(formula("=NOT_A_REAL_FUNCTION(1)").error);
});
test("CSV parser handles quoting, BOM, embedded newline and blank fields", () => {
  assert.deepEqual(parseDelimited('\uFEFF"a,b","c""d"\r\n"two\nlines",'), [
    ["a,b", 'c"d'],
    ["two\nlines", ""],
  ]);
  assert.throws(() => parseDelimited('"unclosed'));
});
test("CSV export evaluates formulas and prevents formula injection", async () => {
  const b = exampleBook();
  b.sheets[0].cells.A4 = { raw: '\'=HYPERLINK("bad")' };
  b.sheets[0].cells.B4 = { raw: "=SUM(A1:A3)" };
  const text = await csvBlob(b, b.active).text();
  assert.ok(text.includes('"60"'));
  assert.ok(text.includes("'=HYPERLINK"));
});
test("XLSX round trip preserves sheets, formulas, numeric values and basic fill", async () => {
  const b = templateBook("invoice");
  b.sheets[0].cells.A2.fill = "#123456";
  const blob = await xlsxBlob(b),
    file = new File([blob], "test.xlsx"),
    { book: restored } = await importFile(file);
  assert.equal(restored.sheets.length, 1);
  assert.equal(restored.sheets[0].cells.D2.raw, "=B2*C2");
  assert.equal(restored.sheets[0].cells.A2.fill, "#123456");
  assert.equal(
    calculator(restored).cell(restored.active, "F2").value,
    2850.0000000000005,
  );
});
test("CSV import keeps formula-looking data as literal text", async () => {
  const { book } = await importFile(
    new File(["name,value\nAlice,=1+2"], "data.csv"),
  );
  assert.equal(book.sheets[0].cells.B2.raw, "'=1+2");
  assert.equal(calculator(book).cell(book.active, "B2").value, "=1+2");
});
test("invalid projects and oversized files are rejected", async () => {
  assert.throws(() => validateBook({ version: 1, sheets: [] }));
  const b = newBook();
  b.sheets[0].cells.A301 = { raw: "too far" };
  assert.throws(() => validateBook(b));
  await assert.rejects(() =>
    importFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.xlsx")),
  );
});
test("catalog has documentation and examples for every listed function", () => {
  assert.ok(catalog.length > 400);
  for (const f of catalog) {
    assert.ok(f.description.length > 10, f.name);
    assert.ok(
      f.example.startsWith("=") && f.example.includes(f.name + "("),
      f.name,
    );
    assert.ok(["tested", "reference"].includes(f.status));
  }
});
for (const entry of catalog.filter((f) => f.status === "tested"))
  test("catalog example executes: " + entry.name, () => {
    assert.equal(formula(entry.example).error, undefined, entry.example);
  });

test("allocation-heavy formulas and unbounded XIRR are blocked before execution", () => {
  assert.equal(formula('=REPT("a",1000000000)').error, "#LIMIT!");
  assert.equal(formula("=EXPAND(A1:A3,1000000,1000000)").error, "#ARRAY!");
  assert.equal(formula("=MUNIT(1000000)").error, "#ARRAY!");
  assert.ok(formula("=XIRR({-100,200},{45000,46000})").error);
});
test("scientific notation remains numeric", () => {
  assert.equal(literal("1e+21"), 1e21);
  assert.equal(literal("1.25e-3"), 0.00125);
});
