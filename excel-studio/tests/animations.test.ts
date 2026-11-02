import { test } from "node:test";
import assert from "node:assert/strict";
import { formulaLessons } from "../src/pages/functions/animations";
import { exampleRows } from "../src/pages/functions/animations/types";
import { exampleBook } from "../src/pages/functions/catalog";
import { calculator } from "../src/core/calculate";
test("first release has ten independently authored lessons", () => {
  assert.deepEqual(
    Object.keys(formulaLessons).sort(),
    [
      "SUM",
      "AVERAGE",
      "COUNT",
      "COUNTA",
      "MAX",
      "MIN",
      "IF",
      "SUMIF",
      "COUNTIF",
      "VLOOKUP",
    ].sort(),
  );
});
for (const lesson of Object.values(formulaLessons))
  test(`${lesson.name}: expected result agrees with the real calculator and all steps reference actual cells`, () => {
    const b = exampleBook();
    b.sheets[0].cells.J10 = { raw: lesson.formula };
    const result = calculator(b).cell(b.active, "J10");
    assert.equal(result.error, undefined);
    assert.equal(result.value, lesson.result);
    assert.ok(lesson.steps.length >= 5);
    assert.ok(lesson.goal.every(Boolean));
    assert.ok(lesson.tip.every(Boolean));
    for (const s of lesson.steps) {
      assert.ok(s.title.every(Boolean));
      assert.ok(s.explanation.every(Boolean));
      assert.ok(s.calculation);
      for (const r of [
        ...(s.active || []),
        ...(s.matched || []),
        ...(s.skipped || []),
      ])
        assert.match(r, /^[ABC][123]$/);
      assert.ok(!(s.matched || []).some((r) => (s.skipped || []).includes(r)));
    }
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        assert.equal(
          String(exampleRows[i][j]),
          b.sheets[0].cells[String.fromCharCode(65 + j) + (i + 1)].raw,
        );
  });
test("IF opposite branch and VLOOKUP missing match behave as taught", () => {
  const b = exampleBook();
  b.sheets[0].cells.A1 = { raw: "3" };
  b.sheets[0].cells.J10 = { raw: formulaLessons.IF.formula };
  assert.equal(calculator(b).cell(b.active, "J10").value, "راجع");
  b.sheets[0].cells.J10 = { raw: "=VLOOKUP(99,A1:B3,2,FALSE)" };
  assert.equal(calculator(b).cell(b.active, "J10").error, "#N/A");
});
