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
