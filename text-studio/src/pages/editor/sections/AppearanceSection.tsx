import { Color, Field, tr, type SectionProps } from "./shared";
export function AppearanceSection({ design: d, change, lang }: SectionProps) {
  return (
    <>
      <Color
        label={tr(lang, "لون النص", "Text color")}
        value={d.color}
        onChange={(color) => change({ color })}
      />
      <label className="check">
        <input
          type="checkbox"
          checked={d.textGradient}
          onChange={(e) => change({ textGradient: e.target.checked })}
        />
        {tr(lang, "تدرج لوني للنص", "Text gradient")}
      </label>
      {d.textGradient && (
        <Color
          label={tr(lang, "لون النص الثاني", "Second text color")}
          value={d.color2}
          onChange={(color2) => change({ color2 })}
        />
      )}
      <Field label={tr(lang, "التأثير", "Effect")}>
        <select
          value={d.effect}
          onChange={(e) =>
            change({ effect: e.target.value as typeof d.effect })
          }
        >
          <option value="none">{tr(lang, "بدون تأثير", "None")}</option>
          <option value="shadow">{tr(lang, "ظل ناعم", "Soft shadow")}</option>
          <option value="glow">{tr(lang, "توهج", "Glow")}</option>
          <option value="outline">{tr(lang, "حدود", "Outline")}</option>
        </select>
      </Field>
      <Field label={tr(lang, "نوع الخلفية", "Background type")}>
        <select
          value={d.background}
          onChange={(e) =>
            change({ background: e.target.value as typeof d.background })
          }
        >
          <option value="solid">{tr(lang, "لون ثابت", "Solid")}</option>
          <option value="gradient">{tr(lang, "تدرج لوني", "Gradient")}</option>
          <option value="transparent">
            {tr(lang, "شفافة", "Transparent")}
          </option>
        </select>
      </Field>
      {d.background !== "transparent" && (
        <Color
          label={tr(lang, "لون الخلفية", "Background color")}
          value={d.bg}
          onChange={(bg) => change({ bg })}
        />
      )}
      {d.background === "gradient" && (
        <Color
          label={tr(lang, "لون الخلفية الثاني", "Second background color")}
          value={d.bg2}
          onChange={(bg2) => change({ bg2 })}
        />
      )}
      <Field label={tr(lang, "زخرفة التصميم", "Decoration")}>
        <select
          value={d.decoration}
          onChange={(e) =>
            change({ decoration: e.target.value as typeof d.decoration })
          }
        >
          <option value="none">{tr(lang, "بدون", "None")}</option>
          <option value="orbit">{tr(lang, "مدارات", "Orbits")}</option>
          <option value="frame">{tr(lang, "إطار", "Frame")}</option>
          <option value="dots">{tr(lang, "نقاط", "Dots")}</option>
        </select>
      </Field>
    </>
  );
}
