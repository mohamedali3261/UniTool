import { test } from "node:test";
import assert from "node:assert/strict";
import { formulaLessons } from "../src/pages/functions/animations";
import {
  lessonExamples,
  lessonResult,
  formulaActions,
  lessonBook,
} from "../src/pages/functions/animations/examples";
import { demoFrame } from "../src/pages/functions/animations/demoModel";
for (const base of Object.values(formulaLessons))
  test(`${base.name}: computed original and extra demonstrations match their visible data`, () => {
    const examples = lessonExamples(base);
    for (const lesson of examples) {
      assert.equal(lessonResult(lesson), lesson.result);
      assert.equal(
        lesson.demo.map((a) => a.text || "").join(""),
        lesson.formula,
      );
      assert.equal(
        demoFrame(lesson, lesson.demo.length - 1, 1).formula,
        lesson.formula,
      );
      for (let i = 1; i < lesson.demo.length; i++) {
        const previous = demoFrame(lesson, i - 1, 1),
          current = demoFrame(lesson, i, 0);
        assert.deepEqual(
          previous.point,
          current.point,
          "pointer must not teleport between actions",
        );
      }
    }
  });
test("24 additional examples are independent from the base data and workbook", () => {
  const all = Object.values(formulaLessons).flatMap((base) =>
    lessonExamples(base).slice(1),
  );
  assert.equal(all.length, 24);
  const examples = lessonExamples(formulaLessons.SUM);
  assert.equal(lessonResult(examples[1]), 400);
  assert.equal(lessonResult(examples[2]), 115);
  const book = lessonBook(examples[1].rows);
  book.sheets[0].cells.A1.raw = "999";
  assert.equal(lessonResult(examples[1]), 400);
  assert.equal(lessonResult(examples[0]), 60);
});
test("quoted cell names remain typed text, not selected references", () => {
  const actions = formulaActions('=IF(A1>0,"A2:B3",C1)');
  assert.deepEqual(
    actions.filter((a) => a.kind === "select").map((a) => a.text),
    ["A1", "C1"],
  );
  assert.equal(
    actions.map((a) => a.text || "").join(""),
    '=IF(A1>0,"A2:B3",C1)',
  );
});
test("drag approaches the range first, then highlights only whole cells", () => {
  const lesson = formulaLessons.SUM;
  assert.equal(demoFrame(lesson, 2, 0).range, null);
  for (const p of [0.2, 0.4, 0.7, 1]) {
    const range = demoFrame(lesson, 2, p).range!;
    assert.equal(range.width % 25, 0);
    assert.ok(
      Math.abs(
        range.height / (100 / 3) - Math.round(range.height / (100 / 3)),
      ) < 1e-8,
    );
  }
  const other = {
    ...lesson,
    demo: [
      {
        kind: "click" as const,
        cell: "B2",
        caption: ["اضغط", "Click"] as const,
      },
    ],
  };
  assert.deepEqual(demoFrame(other, 0, 1).point, { x: 37.5, y: 50 });
});
