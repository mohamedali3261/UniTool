import { Field, Range, tr, type SectionProps } from "./shared";
import { fonts } from "../../../core/fonts";
export function TypographySection({ design: d, change, lang }: SectionProps) {
  return (
    <>
      <Field label={tr(lang, "الخط", "Font")}>
        <select
          value={d.font}
          onChange={(e) => change({ font: e.target.value as typeof d.font })}
        >
          {fonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tr(lang, "وزن الخط", "Font weight")}>
        <select
          value={d.weight}
          onChange={(e) =>
            change({ weight: Number(e.target.value) as 400 | 700 })
          }
        >
          <option value={400}>{tr(lang, "عادي", "Regular")}</option>
          <option value={700}>{tr(lang, "عريض", "Bold")}</option>
        </select>
      </Field>
      <Range
        label={tr(lang, "حجم الخط", "Font size")}
        value={d.size}
        min={16}
        max={180}
        onChange={(size) => change({ size })}
      />
      <label className="check">
        <input
          type="checkbox"
          checked={d.autoFit}
          onChange={(e) => change({ autoFit: e.target.checked })}
        />
        {tr(lang, "تصغير تلقائي لاحتواء النص", "Auto-fit text")}
      </label>
      <p className="hint">
        {tr(
          lang,
          "الحجم المحدد هو الحد الأقصى عند تفعيل الاحتواء. الحجم الفعلي ظاهر بجانب المعاينة.",
          "The selected size is a maximum with auto-fit. Actual size appears by the preview.",
        )}
      </p>
      <Range
        label={tr(lang, "تباعد الأسطر", "Line height")}
        value={d.lineHeight}
        min={1}
        max={2.2}
        step={0.1}
        onChange={(lineHeight) => change({ lineHeight })}
      />
      <Range
        label={tr(lang, "تباعد الحروف", "Letter spacing")}
        value={d.spacing}
        min={0}
        max={8}
        step={0.5}
        onChange={(spacing) => change({ spacing })}
      />
      {d.spacing > 0 && (
        <p className="hint">
          {tr(
            lang,
            "تباعد الحروف قد يغيّر اتصال الحروف العربية؛ اتركه صفرًا للنص المتصل.",
            "Letter spacing can affect Arabic connections; use zero for connected text.",
          )}
        </p>
      )}
      <Field label={tr(lang, "المحاذاة", "Alignment")}>
        <select
          value={d.align}
          onChange={(e) => change({ align: e.target.value as typeof d.align })}
        >
          <option value="right">{tr(lang, "يمين", "Right")}</option>
          <option value="center">{tr(lang, "وسط", "Center")}</option>
          <option value="left">{tr(lang, "يسار", "Left")}</option>
        </select>
      </Field>
    </>
  );
}
