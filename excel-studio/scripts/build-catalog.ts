import { referenceExamples } from "../src/data/referenceExamples";
/** يولّد التوثيق والأمثلة من مصادر MIT؛ النتائج تُراجع باختبارات آلية. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { extraFunctions, nativeFunctions } from "../src/core/functions";
import { calculator } from "../src/core/calculate";
import { newBook } from "../src/core/workbook";
import { common } from "../src/data/commonFunctions";
const require = createRequire(import.meta.url),
  source = fs.readFileSync(
    "node_modules/@formulajs/formulajs/lib/cjs/index.cjs",
    "utf8",
  ),
  docs: Record<string, any> = {};
const re =
  /\/\*\*((?:(?!\/\*\*)[\s\S])*?)\*\/\s*(?:function\s+(\w+)\s*\(|([A-Z][A-Z0-9_.]*)\s*=\s*(?:function\s*)?\()/g;
for (const m of source.matchAll(re)) {
  const clean = m[1]
      .split("\n")
      .map((l) => l.replace(/^\s*\* ?/, ""))
      .join("\n"),
    name = m[2] || m[3],
    description = clean.split(/\n\s*\n|\nCategory:/)[0].trim(),
    category = clean.match(/Category:\s*(.*)/)?.[1] || "Other",
    params = [...clean.matchAll(/@param\s+\{[^}]*\}\s+(\S+)\s+([^\n]*)/g)].map(
      (m) => ({ name: m[1], description: m[2] }),
    );
  docs[name] = { description, category, params };
}
const upstream: Record<string, string[]> = {};
if (fs.existsSync(".cache/formula-reference/test/formulas"))
  for (const cat of fs.readdirSync(".cache/formula-reference/test/formulas")) {
    const file = path.resolve(
      ".cache/formula-reference/test/formulas",
      cat,
      "testcase.js",
    );
    if (!fs.existsSync(file)) continue;
    try {
      const cases = require(file);
      for (const [name, examples] of Object.entries(cases))
        upstream[name] = Object.keys(examples as object).map((x) => "=" + x);
    } catch {}
  }
const book = newBook();
book.sheets[0].cells = {
  A1: { raw: "10" },
  A2: { raw: "20" },
  A3: { raw: "30" },
  B1: { raw: "2" },
  B2: { raw: "4" },
  B3: { raw: "6" },
  C1: { raw: "Apple" },
  C2: { raw: "Pear" },
  C3: { raw: "Apple" },
};
function trial(formula: string) {
  const b = structuredClone(book);
  b.sheets[0].cells.J10 = { raw: formula };
  return calculator(b).cell(b.active, "J10");
}
function guess(name: string) {
  if (/values|known_y|known_x|array|range|ref|data|vector/i.test(name))
    return "A1:A3";
  if (/dates/i.test(name)) return "{45000,45100,45200}";
  if (/date|settlement|maturity|issue|start|end/i.test(name)) return "45000";
  if (/rate|guess|alpha|beta|prob|percent/i.test(name)) return "0.1";
  if (/criteria/i.test(name)) return '">15"';
  if (/text|string/i.test(name)) return '"Hello"';
  if (/cumulative|logical|ignore/i.test(name)) return "TRUE";
  if (/pv|cost|salvage|investment|par/i.test(name)) return "100";
  if (/type|basis|fv/i.test(name)) return "0";
  return "2";
}
const nativeDocs: Record<string, any> = {
  ADDRESS: {
    description:
      "Returns a cell address as text from a row number, column number and reference style.",
    category: "Lookup and reference",
  },
  AREAS: {
    description: "Counts the separate areas in a cell or range reference.",
    category: "Lookup and reference",
  },
  ASC: {
    description:
      "Converts full-width Latin and katakana characters to half-width characters.",
    category: "Text",
  },
  BAHTTEXT: {
    description:
      "Converts a number to Thai text and adds the baht currency suffix.",
    category: "Text",
  },
  DBCS: {
    description:
      "Converts half-width Latin characters to full-width characters.",
    category: "Text",
  },
  ENCODEURL: {
    description:
      "Encodes text for use in a URL. This does not send any network request.",
    category: "Web",
  },
  ISREF: {
    description: "Tests whether a value is a reference to a cell or a range.",
    category: "Information",
  },
  MDETERM: {
    description: "Returns the determinant of a square numeric matrix.",
    category: "Math and trigonometry",
  },
};
Object.assign(docs, nativeDocs, {
  "ERROR.TYPE": {
    description:
      "Returns a number identifying an Excel error, or #N/A if the value is not an error.",
    category: "Information",
    params: [
      { name: "error_val", description: "The error value to identify." },
    ],
  },
  COUPDAYS: {
    description:
      "Returns the number of days in the coupon period containing the settlement date. This implementation is a reference only; calculate it in Excel.",
    category: "Financial",
  },
  "T.DIST.2T": {
    description:
      "Returns the two-tailed Student t-distribution probability for a t statistic and degrees of freedom.",
    category: "Statistical",
    params: [
      { name: "x", description: "The nonnegative t statistic." },
      { name: "deg_freedom", description: "Degrees of freedom, at least 1." },
    ],
  },
  "T.INV.2T": {
    description:
      "Returns the inverse of the two-tailed Student t-distribution for a probability and degrees of freedom.",
    category: "Statistical",
    params: [
      { name: "probability", description: "Probability from 0 to 1." },
      { name: "deg_freedom", description: "Degrees of freedom, at least 1." },
    ],
  },
});
docs["FORECAST.LINEAR"] = docs.FORECAST;
const existing = fs.existsSync("excel-studio/src/data/catalog.json")
  ? JSON.parse(fs.readFileSync("excel-studio/src/data/catalog.json", "utf8"))
  : [];
const legacy = new Set(
  "BETADIST BETAINV BINOMDIST CHIDIST CHIINV CHITEST COVAR CRITBINOM EXPONDIST FDIST FINV FTEST GAMMADIST GAMMAINV HYPGEOMDIST LOGINV LOGNORMDIST NORMDIST NORMINV NORMSDIST NORMSINV NEGBINOMDIST POISSON PERCENTILE PERCENTRANK QUARTILE RANK STDEV STDEVP VAR VARP TDIST TINV TTEST WEIBULL ZTEST".split(
    " ",
  ),
);
const names = [...new Set([...nativeFunctions, ...Object.keys(extraFunctions)])]
  .filter(
    (n) =>
      ![
        "BINOMDIST.RANGE",
        "CHIDIST.RT",
        "CHIINV.RT",
        "FDIST.RT",
        "FINV.RT",
        "TDIST.2T",
        "TDIST.RT",
        "TINV.2T",
      ].includes(n) &&
      !n.startsWith("_") &&
      (n.includes(".") ||
        legacy.has(n) ||
        !Object.keys(extraFunctions).some(
          (other) => other.includes(".") && other.replace(/\./g, "") === n,
        )),
  )
  .sort();
const catalog = names.map((name) => {
  const fn = extraFunctions[name],
    meta =
      docs[name] ||
      docs[
        Object.keys(docs).find((d) => d.replace(/\./g, "") === name) || ""
      ] ||
      docs[name.replace(/B$/, "")] ||
      docs[fn?.name] ||
      docs[
        Object.entries(extraFunctions).find(
          ([n, f]) => f === fn && docs[n],
        )?.[0] || ""
      ] ||
      {},
    params = meta.params || [];
  let candidates = [
    common[name]?.[2],
    existing.find((f: any) => f.name === name && f.status === "tested")
      ?.example,
    ...(upstream[name] || []),
    `=${name}(${params.map((p: any) => guess(p.name)).join(",")})`,
    `=${name}(A1:A3)`,
    `=${name}(A1:A3,B1:B3)`,
    `=${name}("hello")`,
    `=${name}("2")`,
    `=${name}()`,
  ];
  for (let n = 1; n <= 6; n++)
    for (const val of ["1", "2", "0.5"])
      candidates.push(`=${name}(${Array(n).fill(val).join(",")})`);
  let chosen = "",
    result: any;
  for (const c of candidates) {
    if (!c || c.length > 250 || /WEBSERVICE|HYPERLINK|XIRR\(/.test(c)) continue;
    try {
      const r = trial(c);
      if (!r.error && r.value !== null) {
        chosen = c;
        result = r.value;
        break;
      }
    } catch {}
  }
  const category =
    meta.category ||
    (/LOOKUP|INDEX|MATCH|ROW|COLUMN|ADDRESS|AREAS|ISREF/.test(name)
      ? "Lookup and reference"
      : "Other");
  return {
    name,
    title: common[name]?.[0] || name,
    ar: common[name]?.[1] || "",
    description:
      meta.description ||
      `Compatibility form of ${name}. Evaluate the example below against the displayed sample data; use the Excel reference to confirm version-specific behavior.`,
    category,
    params,
    signature: `${name}(${params.length ? params.map((p: any) => p.name).join(", ") : "…"})`,
    example:
      chosen ||
      referenceExamples[name] ||
      `=${name}(${params.map((p: any) => guess(p.name)).join(",")})`,
    result: result ?? null,
    status: chosen ? "tested" : "reference",
    common: !!common[name],
  };
});
fs.writeFileSync(
  "excel-studio/src/data/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log(
  "Catalog",
  catalog.length,
  "tested",
  catalog.filter((f) => f.status === "tested").length,
  "reference",
  catalog
    .filter((f) => f.status === "reference")
    .map((f) => f.name)
    .join(","),
);
