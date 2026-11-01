import { useState } from "react";
import { PERFUME_PRESETS, cartonForBottle } from "./perfume";
import type { CartonSize } from "./geometry";
export function PerfumeTemplates({
  ar,
  size,
  onApply,
}: {
  ar: boolean;
  size: CartonSize;
  onApply: (s: CartonSize, title?: string) => void;
}) {
  const [bottle, setBottle] = useState({
    length: "",
    width: "",
    depth: "",
    clearance: "2",
  });
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  return (
    <section aria-label={ar ? "قوالب علب العطور" : "Perfume carton templates"}>
      <h3>{ar ? "قوالب علب العطور" : "Perfume carton templates"}</h3>
      <p className="carton-note">
        {ar
          ? "30 و50 و100 مل هي سعة الزجاجة وليست مقاسها. هذه علب خارجية بمقاسات مبدئية، وليست قوالب لتصنيع الزجاج. قِس زجاجتك بالغطاء قبل الاعتماد؛ جميع المقاسات والألسنة قابلة للتعديل."
          : "30, 50 and 100 ml describe capacity, not bottle dimensions. These are editable starter outer cartons, not glass-manufacturing molds. Measure the actual bottle including its cap before use."}
      </p>
      <div className="carton-fields">
        {PERFUME_PRESETS.map((p) => (
          <button
            key={p.ml}
            type="button"
            onClick={() => {
              onApply(
                { ...p.size },
                ar ? `علبة عطر ${p.ml} مل` : `${p.ml} ml perfume carton`,
              );
              setApplied(false);
              setError("");
            }}
          >
            {ar ? `عطر ${p.ml} مل` : `${p.ml} ml perfume`}
            <br />
            <span dir="ltr">
              {p.size.height} × {p.size.width} × {p.size.depth} mm
            </span>
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
            ? "قِس أقصى طول وعرض وعمق، مع الغطاء والبخاخ وأي بروز. الخلوص لكل جانب؛ أضف مساحة منفصلة لأي بطانة أو حامل."
            : "Measure maximum length, width and depth including cap, sprayer and protrusions. Clearance is per side; allow extra room for any insert."}
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
              {ar ? arabic : en} · mm
              <input
                type="number"
                min={key === "clearance" ? 0 : 0.01}
                max={key === "clearance" ? 10 : undefined}
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
                    length: Number(bottle.length),
                    width: Number(bottle.width),
                    depth: Number(bottle.depth),
                    clearance: Number(bottle.clearance),
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
                  ? "أدخل مقاسات صحيحة ضمن حدود القالب وخلوصًا من 0 إلى 10 مم."
                  : "Enter valid dimensions within the carton limits and clearance from 0 to 10 mm.",
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
