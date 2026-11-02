import { test } from "node:test";
import assert from "node:assert/strict";
import { formulaLessons } from "../src/pages/functions/animations";
import {
  demoFrame,
  cellPosition,
} from "../src/pages/functions/animations/demoModel";
for (const lesson of Object.values(formulaLessons))
  test(`${lesson.name}: mouse/keyboard sequence constructs the exact working formula`, () => {
    assert.equal(lesson.demo[0].kind, "click");
    assert.equal(lesson.demo.at(-1)?.kind, "enter");
    assert.equal(lesson.demo.map((a) => a.text || "").join(""), lesson.formula);
    const completed = demoFrame(lesson, lesson.demo.length - 1, 1);
    assert.equal(completed.formula, lesson.formula);
    assert.equal(completed.done, true);
    for (let i = 0; i < lesson.demo.length; i++) {
      const a = lesson.demo[i];
      assert.ok(a.caption.every(Boolean));
      if (a.kind === "select") {
        const start = demoFrame(lesson, i, 0),
          end = demoFrame(lesson, i, 1);
        assert.ok(start.range && end.range);
        assert.ok(
          end.range.width >= start.range.width &&
            end.range.height >= start.range.height,
        );
        const target = cellPosition(a.toCell!);
        assert.equal(end.point.x, (target.col + 0.5) * 25);
        assert.equal(end.point.y, ((target.row + 0.5) * 100) / 3);
      }
      if (a.kind === "type" && a.text!.length > 1) {
        assert.ok(
          demoFrame(lesson, i, 0.5).formula.length <
            demoFrame(lesson, i, 1).formula.length,
        );
      }
    }
  });
test("typing and drag previews are deterministic and Enter alone commits a result", () => {
  const l = formulaLessons.SUM;
  assert.equal(demoFrame(l, 1, 0).formula, "");
  assert.equal(demoFrame(l, 1, 1).formula, "=SUM(");
  assert.equal(demoFrame(l, 2, 0.5).formula, "=SUM(A1:A2");
  assert.equal(demoFrame(l, 2, 1).formula, "=SUM(A1:A3");
  assert.equal(demoFrame(l, l.demo.length - 1, 0).done, false);
  assert.equal(demoFrame(l, l.demo.length - 1, 1).done, true);
  assert.throws(() => cellPosition("J10"));
});
