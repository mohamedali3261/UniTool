import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dataset,
  aggregate,
  filterRows,
  series,
  bucketValue,
  defaultDashboard,
  sanitizeDashboard,
} from "../src/core/analytics";
import { newBook, applyCells, validateBook, paste } from "../src/core/workbook";
import { templateBook, templates } from "../src/data/templates";
import {
  conditionalStyle,
  replaceCells,
  validationError,
} from "../src/core/tableFeatures";
import { calculator } from "../src/core/calculate";
test("dashboard uses live formula results and excludes named total / blank rows", () => {
  let b = templateBook("sales", "en");
  let d = dataset(b, b.active);
  assert.equal(d.rows.length, 4);
  assert.equal(d.totals, 1);
  assert.equal(
    aggregate(
      d.rows.map((r) => r.values.E),
      "sum",
    ),
    10620,
  );
  b = applyCells(b, b.active, { B2: { raw: "30" } });
  d = dataset(b, b.active);
  assert.equal(d.rows[0].values.E, 2550);
  assert.equal(dataset(b, b.active, false).rows.length, 5);
  assert.equal(dataset(b, "removed").sheet, null);
});
test("aggregations preserve zero, negative values, distinct types and null for no numbers", () => {
  const v = [null, "", 0, -5, 10, "10", false];
  assert.equal(aggregate(v, "sum"), 5);
  assert.equal(aggregate(v, "count"), 5);
  assert.equal(aggregate(v, "distinct"), 5);
  assert.equal(aggregate(v, "average"), 5 / 3);
  assert.equal(aggregate(v, "min"), -5);
  assert.equal(aggregate(v, "max"), 10);
  assert.equal(aggregate(["x", null], "sum"), null);
});
test("report filters compose without mutating sheet data, date drill uses buckets", () => {
  const b = templateBook("travel", "en"),
    d = dataset(b, b.active);
  assert.equal(
    filterRows(d.rows, [{ id: "a", field: "C", op: "eq", value: "USD" }])
      .length,
    2,
  );
  assert.equal(
    filterRows(d.rows, [
      { id: "a", field: "F", op: "between", value: "1000", value2: "2500" },
    ]).length,
    2,
  );
  assert.equal(
    filterRows(d.rows, [
      { id: "a", field: "B", op: "eq", value: "2026-11", bucket: "month" },
    ]).length,
    4,
  );
  assert.equal(bucketValue(45292, "month"), "2024-01");
  assert.equal(bucketValue("2026-11-01", "year"), "2026");
  assert.equal(bucketValue("not-date", "month"), "not-date");
  assert.equal(
    filterRows(d.rows, [{ id: "a", field: "A", op: "contains", value: "HOT" }])
      .length,
    1,
  );
  assert.equal(d.rows.length, 4);
});
test("category series groups and sorts metrics then limits categories", () => {
  const b = templateBook("payroll", "en"),
    d = dataset(b, b.active),
    w = {
      ...defaultDashboard(b).widgets[3],
      dimension: "B",
      metric: "F",
      limit: 2,
    };
  const p = series(d.rows, w);
  assert.equal(p.length, 2);
  assert.equal(p[0].label, "Design");
  assert.equal(p[0].value, 28100);
  assert.equal(p[0].count, 2);
});
test("untrusted dashboard configs are bounded and survive project validation", () => {
  const b = templateBook("sales"),
    d = defaultDashboard(b);
  d.widgets[0].color = "url(evil)";
  d.widgets[0].limit = 999;
  d.widgets.push({ ...d.widgets[0] });
  b.dashboard = d;
  const safe = validateBook(JSON.parse(JSON.stringify(b)));
  assert.equal(safe.dashboard?.widgets.length, 7);
  assert.equal(safe.dashboard?.widgets[0].limit, 50);
  assert.equal(safe.dashboard?.widgets[0].color, "#28816c");
  assert.equal(sanitizeDashboard({ version: 8 }), undefined);
  assert.equal(safe.dashboard?.source, b.active);
});
test("number/list/date rules validate input and allow formulas explicitly", () => {
  assert.ok(
    validationError("-1", {
      column: 0,
      type: "number",
      min: 0,
      required: true,
    }),
  );
  assert.ok(
    validationError("abc", { column: 0, type: "number", required: false }),
  );
  assert.equal(
    validationError("0", { column: 0, type: "number", required: true }),
    null,
  );
  assert.ok(validationError("", { column: 0, type: "number", required: true }));
  assert.ok(
    validationError("2026-02-30", { column: 0, type: "date", required: false }),
  );
  assert.equal(
    validationError("2026-02-28", { column: 0, type: "date", required: false }),
    null,
  );
  assert.equal(
    validationError("=SUM(A1:A3)", {
      column: 0,
      type: "number",
      required: true,
    }),
    null,
  );
  assert.ok(
    validationError("Unknown", {
      column: 0,
      type: "list",
      required: true,
      options: ["Active"],
    }),
  );
});
test("paste rejects atomically if one value violates the rule; formatting is unaffected", () => {
  const b = templateBook("sales");
  b.sheets[0].validation = [
    { column: 1, type: "number", min: 0, required: true },
  ];
  assert.throws(() => paste(b, b.active, "B2", [["15"], ["bad"]]));
  assert.equal(b.sheets[0].cells.B2.raw, "24");
  assert.equal(
    applyCells(b, b.active, { B2: { bold: true } }).sheets[0].cells.B2.bold,
    true,
  );
  assert.equal(
    applyCells(b, b.active, { B1: { raw: "Title" } }).sheets[0].cells.B1.raw,
    "Title",
  );
});
test("safe replacement treats regex literals, dollars and formulas correctly", () => {
  const b = newBook(),
    s = b.sheets[0];
  s.cells = { A1: { raw: "a.b a.b" }, A2: { raw: "=A1" }, A3: { raw: "A.B" } };
  assert.deepEqual(replaceCells(s, "a.b", "$1", false, false), {
    A1: { raw: "$1 $1" },
    A3: { raw: "$1" },
  });
  assert.deepEqual(replaceCells(s, "a.b", "x", true, true), {});
  assert.deepEqual(replaceCells(s, "a.b", "x", false, true, ["A3"]), {
    A3: { raw: "x" },
  });
});
test("conditional formatting handles computed numeric values, duplicates and precedence", () => {
  const rule = {
    id: "r",
    column: 1,
    op: "gt" as const,
    value: "10",
    fill: "#fff1d7",
    color: "#8b631f",
  };
  assert.equal(conditionalStyle(12, 1, [rule], new Map())?.fill, rule.fill);
  assert.equal(conditionalStyle("12", 1, [rule], new Map()), null);
  assert.ok(
    conditionalStyle(
      "x",
      1,
      [{ ...rule, op: "duplicates" }],
      new Map([["1:string:x", 2]]),
    ),
  );
});
test("five new distinct bilingual templates have valid executable formulas", () => {
  assert.equal(templates.length, 11);
  for (const id of [
    "payroll",
    "marketing",
    "projects",
    "travel",
    "subscriptions",
  ])
    for (const lang of ["ar", "en"] as const) {
      const b = templateBook(id, lang),
        calc = calculator(b);
      assert.equal(b.sheets[0].cols, 6);
      for (const [ref, c] of Object.entries(b.sheets[0].cells))
        if (c.raw.startsWith("="))
          assert.equal(
            calc.cell(b.active, ref).error,
            undefined,
            id + ":" + ref,
          );
      assert.equal(dataset(b, b.active).rows.length, 4);
    }
});
test("project validation bounds widths and unsafe rule styles without losing supported settings", () => {
  const b = templateBook("sales");
  b.sheets[0].wrap = true;
  b.sheets[0].showFormulas = true;
  b.sheets[0].columnWidths = { 0: 900, 1: 20 };
  b.sheets[0].conditional = [
    {
      id: "x",
      column: 0,
      op: "contains",
      value: "a",
      fill: "url(attack)",
      color: "red",
    },
  ];
  const s = validateBook(b).sheets[0];
  assert.deepEqual(s.columnWidths, { 0: 400, 1: 70 });
  assert.equal(s.conditional?.[0].fill, "#fff1d7");
  assert.equal(s.wrap, true);
  assert.equal(s.showFormulas, true);
});
