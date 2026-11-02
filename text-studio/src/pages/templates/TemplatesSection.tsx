import { templates } from "./data";
import { tr, type SectionProps } from "../editor/sections/shared";
export function TemplatesSection({ design, change, lang }: SectionProps) {
  return (
    <>
      <p className="hint">
        {tr(
          lang,
          "ثمانية اتجاهات جاهزة. نصك ومقاساتك يفضلوا زي ما هم.",
          "Eight starting points. Your words and dimensions stay unchanged.",
        )}
      </p>
      <div className="template-grid">
        {templates.map((t) => (
          <button
            type="button"
            className="template"
            key={t.id}
            aria-pressed={Object.entries(t.patch).every(
              ([key, value]) => design[key as keyof typeof design] === value,
            )}
            onClick={() => change(t.patch)}
          >
            <span
              aria-hidden="true"
              style={{
                background:
                  t.patch.background === "gradient"
                    ? `linear-gradient(135deg,${t.patch.bg},${t.patch.bg2})`
                    : t.patch.bg,
                color: t.patch.color,
                fontFamily: `TextStudio-${t.patch.font}`,
              }}
            >
              {lang === "ar" ? "أثرٌ جميل" : "Aa"}
            </span>
            <strong>{tr(lang, t.ar, t.en)}</strong>
          </button>
        ))}
      </div>
    </>
  );
}
