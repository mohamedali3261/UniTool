import { useEffect, useRef, useState } from "react";
import { PERFUME_PRESETS, cartonForBottle } from "./perfume";
import type { CartonSize } from "./geometry";
import {
  formatCartonDims,
  formatUnitNumber,
  mmToUnit,
  unitToMm,
  type PackagingUnit,
} from "./units";

export function PerfumeTemplates({
  ar,
  size,
  unit = "mm",
  onApply,
}: {
  ar: boolean;
  size: CartonSize;
  unit?: PackagingUnit;
  onApply: (s: CartonSize, title?: string, ml?: number) => void;
}) {
  const [bottle, setBottle] = useState({
    length: "",
    width: "",
    depth: "",
    clearance: unit === "cm" ? "0.2" : "2",
  });
  const prevUnit = useRef<PackagingUnit>(unit);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (prevUnit.current === unit) return;
    const oldUnit = prevUnit.current;
    prevUnit.current = unit;
    const convert = (raw: string) => {
      if (raw.trim() === "") return "";
      const n = Number(raw);
      if (!Number.isFinite(n)) return raw;
      return formatUnitNumber(unitToMm(n, oldUnit), unit);
    };
    setBottle((prev) => ({
      length: convert(prev.length),
      width: convert(prev.width),
      depth: convert(prev.depth),
      clearance: convert(prev.clearance),
    }));
  }, [unit]);

  const unitBadge = unit === "cm" ? (ar ? "سم" : "cm") : "mm";

  return (
    <section
      className="carton-perfume-section"
      aria-label={ar ? "قوالب علب العطور" : "Perfume carton templates"}
    >
      <h3>{ar ? "قوالب علب العطور" : "Perfume carton templates"}</h3>
      <p className="carton-note">
        {ar
          ? "30 و50 و100 مل هي سعة الزجاجة وليست مقاسها. هذه علب خارجية بمقاسات مبدئية، وليست قوالب لتصنيع الزجاج. قِس زجاجتك بالغطاء قبل الاعتماد؛ جميع المقاسات والألسنة قابلة للتعديل."
          : "30, 50 and 100 ml describe capacity, not bottle dimensions. These are editable starter outer cartons, not glass-manufacturing molds. Measure the actual bottle including its cap before use."}
      </p>
      <div className="carton-capacity-grid">
        {PERFUME_PRESETS.map((p) => (
          <button
            key={p.ml}
            type="button"
            className="carton-capacity-card"
            aria-pressed={
              size.height === p.size.height &&
              size.width === p.size.width &&
              size.depth === p.size.depth
            }
            onClick={() => {
              onApply(
                { ...p.size },
                ar ? `علبة عطر ${p.ml} مل` : `${p.ml} ml perfume carton`,
                p.ml,
              );
              setApplied(false);
              setError("");
            }}
          >
            <span className="carton-bottle-icon" aria-hidden="true">
              <svg
                viewBox="0 0 48 52"
                width="28"
                height="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="19" y="3" width="10" height="9" rx="2" />
                <path d="M20 12v5h8v-5" />
                <rect x="11" y="17" width="26" height="31" rx="5" />
                <rect x="16" y="26" width="16" height="13" rx="1" />
                <path d="M21 30h6m-6 4h6" />
              </svg>
            </span>
            {ar ? `عطر ${p.ml} مل` : `${p.ml} ml perfume`}
            <br />
            <span dir="ltr">{formatCartonDims(p.size, unit, ar)}</span>
          </button>
        ))}
      </div>
      <details>
        <summary>
          {ar
            ? "ضبط العلبة حسب زجاجتك الفعلية"
            : "Size carton from your actual bottle"}
        </summary>
        <p>
          {ar
            ? `قِس أقصى طول وعرض وعمق (${unit === "cm" ? "بالـ سم" : "بالـ مم"})، مع الغطاء والبخاخ وأي بروز. الخلوص لكل جانب؛ أضف مساحة منفصلة لأي بطانة أو حامل.`
            : `Measure maximum length, width and depth (${unit}) including cap, sprayer and protrusions. Clearance is per side; allow extra room for any insert.`}
        </p>
        <div className="carton-fields">
          {(
            [
              ["length", "طول الزجاجة بالغطاء", "Bottle length including cap"],
              ["width", "عرض الزجاجة", "Bottle width"],
              ["depth", "عمق الزجاجة", "Bottle depth"],
              ["clearance", "الخلوص لكل جانب", "Clearance per side"],
            ] as const
          ).map(([key, arabic, en]) => (
            <label key={key}>
              {ar ? arabic : en} · {unitBadge}
              <input
                type="number"
                min={key === "clearance" ? 0 : 0.01}
                max={key === "clearance" ? mmToUnit(10, unit) : undefined}
                step="0.01"
                value={bottle[key]}
                onChange={(e) => {
                  setBottle({ ...bottle, [key]: e.target.value });
                  setApplied(false);
                  setError("");
                }}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              if (Object.values(bottle).some((v) => v.trim() === ""))
                throw Error("EMPTY");
              onApply(
                cartonForBottle(
                  {
                    length: unitToMm(Number(bottle.length), unit),
                    width: unitToMm(Number(bottle.width), unit),
                    depth: unitToMm(Number(bottle.depth), unit),
                    clearance: unitToMm(Number(bottle.clearance), unit),
                  },
                  size,
                ),
              );
              setError("");
              setApplied(true);
            } catch {
              setApplied(false);
              setError(
                ar
                  ? `أدخل مقاسات صحيحة ضمن حدود القالب وخلوصًا من 0 إلى ${unit === "cm" ? "1 سم" : "10 مم"}.`
                  : `Enter valid dimensions within the carton limits and clearance from 0 to ${unit === "cm" ? "1 cm" : "10 mm"}.`,
              );
            }
          }}
        >
          {ar ? "تطبيق المقاسات المحسوبة" : "Apply calculated dimensions"}
        </button>
        {error && <p role="alert">{error}</p>}
        {applied && (
          <p role="status">
            {ar
              ? "تم تطبيق أبعاد اسمية = أبعاد الزجاجة + ضعف الخلوص. راجعها بالأسفل؛ هذا ليس ضمان ملاءمة فعلية، ولا يشمل تعويض سمك الورق."
              : "Applied nominal dimensions = bottle dimensions + twice clearance. Review below; this does not guarantee physical fit or compensate for board thickness."}
          </p>
        )}
      </details>
    </section>
  );
}
