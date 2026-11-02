import FormulaParser from "fast-formula-parser";
import * as formula from "@formulajs/formulajs";
export const nativeFunctions = new FormulaParser()
  .supportedFunctions()
  .filter((n: string) => n !== "WEBSERVICE");
/** تحويل واجهة Formula.js إلى معاملات المحلل، بدون eval أو اتصالات خارجية. */
export function flattenFunctions(
  source: Record<string, unknown> = formula,
  prefix = "",
): Record<string, Function> {
  const out: Record<string, Function> = {};
  for (const [key, v] of Object.entries(source)) {
    if (key === "utils" || key === "__esModule" || key === "default") continue;
    const name = prefix ? prefix + "." + key : key;
    if (typeof v === "function") out[name] = v;
    if (v && (typeof v === "object" || typeof v === "function"))
      for (const [k, child] of Object.entries(v)) {
        if (typeof child === "function") out[name + "." + k] = child;
        else if (child && typeof child === "object")
          Object.assign(out, flattenFunctions({ [k]: child }, name));
      }
  }
  return out;
}
export const extraFunctions = flattenFunctions();
export const functionAdapters = Object.fromEntries(
  Object.entries(extraFunctions)
    .filter(
      ([name]) =>
        !nativeFunctions.includes(name) &&
        !["ROW", "COLUMN", "INDEX", "CHOOSE", "OFFSET", "INDIRECT"].includes(
          name,
        ),
    )
    .map(([name, fn]) => [
      name,
      (...args: any[]) => {
        const output = fn(
          ...args.map((a) =>
            a && typeof a === "object" && "value" in a ? a.value : a,
          ),
        );
        if (output instanceof Error)
          throw new FormulaParser.FormulaError(output.message);
        if (output instanceof Date)
          return (output.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
        return output;
      },
    ]),
);

/** المصفوفات المتدفقة تحتاج شبكة انتشار مستقلة؛ نرفضها قبل تخصيص الذاكرة. */
const noSpill = ["EXPAND", "MUNIT"];
for (const name of noSpill)
  functionAdapters[name] = () => {
    throw new FormulaParser.FormulaError("#ARRAY!");
  };
functionAdapters.REPT = (text: any, times: any) => {
  const s = String(text?.value ?? text ?? ""),
    n = Number(times?.value ?? times);
  if (!Number.isFinite(n) || n < 0)
    throw new FormulaParser.FormulaError("#VALUE!");
  if (n > 10000 || s.length * n > 50000)
    throw new FormulaParser.FormulaError("#LIMIT!");
  return s.repeat(Math.floor(n));
};

// XIRR في المصدر يستخدم حلقة غير محدودة؛ يبقى مرجعًا لـ Excel فقط.
functionAdapters.XIRR = () => {
  throw new FormulaParser.FormulaError("#BLOCKED!");
};

/** SEARCH is case-insensitive even without wildcards (the native parser isn't).
 * Use bounded dynamic programming for wildcard matching, never an untrusted regex.
 */
functionAdapters.SEARCH = (needleArg: any, textArg: any, startArg?: any) => {
  const value = (a: any) =>
    a && typeof a === "object" && "value" in a ? a.value : a;
  const needle = String(value(needleArg) ?? "").toLowerCase();
  const text = String(value(textArg) ?? "").toLowerCase();
  const start = Math.trunc(
    Number(startArg === undefined ? 1 : value(startArg)),
  );
  if (!Number.isFinite(start) || start < 1 || start > Math.max(1, text.length))
    throw new FormulaParser.FormulaError("#VALUE!");
  const tokens: { kind: "literal" | "one" | "many"; char?: string }[] = [];
  for (let i = 0; i < needle.length; i++) {
    const c = needle[i];
    if (c === "~" && i + 1 < needle.length && "*?~".includes(needle[i + 1]))
      tokens.push({ kind: "literal", char: needle[++i] });
    else if (c === "*") {
      if (tokens.at(-1)?.kind !== "many") tokens.push({ kind: "many" });
    } else if (c === "?") tokens.push({ kind: "one" });
    else tokens.push({ kind: "literal", char: c });
  }
  if (tokens.every((t) => t.kind === "literal")) {
    const found = text.indexOf(tokens.map((t) => t.char).join(""), start - 1);
    if (found < 0) throw new FormulaParser.FormulaError("#VALUE!");
    return found + 1;
  }
  if (tokens.length * (text.length + 1) > 2_000_000)
    throw new FormulaParser.FormulaError("#LIMIT!");
  let next = new Uint8Array(text.length + 1).fill(1),
    current = new Uint8Array(text.length + 1);
  for (let p = tokens.length - 1; p >= 0; p--) {
    current.fill(0);
    const token = tokens[p];
    for (let j = text.length; j >= start - 1; j--) {
      current[j] =
        token.kind === "many"
          ? next[j] || (j < text.length ? current[j + 1] : 0)
          : j < text.length && (token.kind === "one" || token.char === text[j])
            ? next[j + 1]
            : 0;
    }
    [next, current] = [current, next];
  }
  for (let j = start - 1; j < text.length; j++) if (next[j]) return j + 1;
  throw new FormulaParser.FormulaError("#VALUE!");
};

// Preserve Excel's explicit divide-by-zero error instead of letting Infinity
// become a generic #NUM! in the native QUOTIENT implementation.
functionAdapters.QUOTIENT = (numeratorArg: any, denominatorArg: any) => {
  const number = (arg: any) =>
    Number(arg && typeof arg === "object" && "value" in arg ? arg.value : arg);
  const numerator = number(numeratorArg),
    denominator = number(denominatorArg);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator))
    throw new FormulaParser.FormulaError("#VALUE!");
  if (denominator === 0) throw new FormulaParser.FormulaError("#DIV/0!");
  const result = Math.trunc(numerator / denominator);
  if (!Number.isFinite(result)) throw new FormulaParser.FormulaError("#NUM!");
  return result;
};

/** Numeric-text VALUE subset: reject words rather than silently stripping them
 * into zero. Dates and locale-specific number formats need separate parsers.
 */
functionAdapters.VALUE = (arg: any) => {
  const input =
    arg && typeof arg === "object" && "value" in arg ? arg.value : arg;
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input !== "string")
    throw new FormulaParser.FormulaError("#VALUE!");
  const text = input.trim().replace(/^([+-]?)[$€£¥]\s*/, "$1");
  if (
    !/^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?%?$/.test(
      text,
    )
  )
    throw new FormulaParser.FormulaError("#VALUE!");
  const result =
    Number(text.replace(/[,%]/g, "")) / (text.endsWith("%") ? 100 : 1);
  if (!Number.isFinite(result)) throw new FormulaParser.FormulaError("#VALUE!");
  return result;
};
