import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { catalog } from "../src/pages/functions/catalog";
import {
  formulaLessons,
  lessonSections,
} from "../src/pages/functions/animations";
test("public catalogue contains exactly the sixty animated lessons, no reference-only functions", () => {
  assert.equal(catalog.length, 60);
  assert.deepEqual(
    catalog.map((e) => e.name).sort(),
    Object.keys(formulaLessons).sort(),
  );
  assert.equal(new Set(catalog.map((e) => e.category)).size, 5);
  for (const e of catalog) {
    assert.equal(e.example, formulaLessons[e.name].formula);
    assert.equal(e.status, "tested");
    assert.ok(lessonSections[e.name]);
  }
  assert.ok(!catalog.some((e) => e.name === "XIRR"));
});
test("every lesson has a separate named file in its section folder, separate from the player", () => {
  const root = new URL("../src/pages/functions/animations/", import.meta.url);
  for (const name of Object.keys(formulaLessons)) {
    assert.ok(
      existsSync(new URL(`lessons/${lessonSections[name]}/${name}.ts`, root)),
    );
    assert.ok(!existsSync(new URL(`${name}.ts`, root)));
  }
  assert.equal(readdirSync(new URL("lessons/", root)).length, 5);
});
