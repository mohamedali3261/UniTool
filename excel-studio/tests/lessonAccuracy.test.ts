import { test } from "node:test";
import assert from "node:assert/strict";
import { exampleBook } from "../src/pages/functions/catalog";
import { calculator } from "../src/core/calculate";
const calculate = (formula: string) => {
  const b = exampleBook();
  b.sheets[0].cells.J10 = { raw: formula };
  return calculator(b).cell(b.active, "J10");
};
for (const [formula, expected] of [
  ['=SEARCH("P",C1)', 2],
  ['=SEARCH("P",C1,3)', 3],
  ['=SEARCH("a?P",C1)', 1],
  ['=SEARCH("*le",C1)', 1],
  ['=SEARCH("~*","x*y")', 2],
  ['=SEARCH("~?","a?b")', 2],
  ['=SEARCH(".","a.b")', 2],
  ['=SEARCH("[","a[b")', 2],
  ['=SEARCH("~*P","x*pear")', 2],
  ['=FIND("p",C1)', 2],
  ['=IFNA(MATCH(20,A1:A3,0),"missing")', 2],
  ["=QUOTIENT(-20,3)", -6],
  ["=TRUNC(-2.6)", -2],
  ["=INT(-2.6)", -3],
  ["=SIGN(0)", 0],
  ["=SIGN(10)", 1],
  ["=EVEN(-3)", -4],
  ["=ODD(-4)", -5],
  ["=INDEX(A1:B3,3,1)", 30],
  ["=NOT(FALSE)", true],
  ['=EXACT("Apple","apple")', false],
  ['=REPLACE(C1,2,2,"XX")', "AXXle"],
  ["=REPT(C2,0)", ""],
  ['=VALUE(B1&"0")', 20],
  ['=TEXT(3.3,"0.00")', "3.30"],
  ["=ROW(A3)", 3],
  ["=COLUMN(B1)", 2],
  ["=ROWS(A1:B3)", 3],
  ["=COLUMNS(A1:B3)", 2],
] as const)
  test(`accuracy: ${formula}`, () => {
    const result = calculate(formula);
    assert.equal(result.error, undefined);
    assert.equal(result.value, expected);
  });
for (const [formula, error] of [
  ['=FIND("P",C1)', "#VALUE!"],
  ['=SEARCH("z",C1)', "#VALUE!"],
  ['=SEARCH("p",C1,0)', "#VALUE!"],
  ['=SEARCH("p",C1,99)', "#VALUE!"],
  ['=IFNA(1/0,"missing")', "#DIV/0!"],
  ["=QUOTIENT(20,0)", "#DIV/0!"],
  ['=VALUE("Apple")', "#VALUE!"],
] as const)
  test(`error stays visible: ${formula}`, () =>
    assert.equal(calculate(formula).error, error));
for (const [formula, expected] of [
  ['=VALUE("1,234.50")', 1234.5],
  ['=VALUE("12%")', 0.12],
  ['=VALUE("1e3")', 1000],
  ['=VALUE("$12.50")', 12.5],
  ['=SEARCH("~~","a~b")', 2],
  ['=SEARCH("p?e",C1)', 3],
  ['=SEARCH("p*e",C1)', 2],
  ['=SEARCH("a+b","xa+by")', 2],
] as const)
  test(`format and wildcard accuracy: ${formula}`, () => {
    const result = calculate(formula);
    assert.equal(result.error, undefined);
    assert.equal(result.value, expected);
  });
test("VALUE rejects arbitrary text around digits instead of silently accepting it", () =>
  assert.equal(calculate('=VALUE("abc123xyz")').error, "#VALUE!"));
