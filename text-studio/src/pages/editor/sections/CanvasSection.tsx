import { useState, useEffect } from "react";
import { Field, Range, tr, type SectionProps } from "./shared";
export function CanvasSection({ design: d, change, lang }: SectionProps) {
  return (
    <>
      <div className="size-presets">
        {[
          { ar: "مربع", en: "Square", w: 1080, h: 1080 },
          { ar: "قصة", en: "Story", w: 1080, h: 1920 },
          { ar: "منشور", en: "Portrait", w: 1080, h: 1350 },
          { ar: "عريض", en: "Landscape", w: 1920, h: 1080 },
        ].map((p) => (
          <button
            type="button"
            key={p.en}
            aria-pressed={d.width === p.w && d.height === p.h}
            onClick={() => change({ width: p.w, height: p.h })}
          >
            {tr(lang, p.ar, p.en)}
            <small>
              {p.w} × {p.h}
            </small>
          </button>
        ))}
      </div>
      <div className="two-fields">
        {(["width", "height"] as const).map((key) => (
          <Field
            key={key}
            label={
              key === "width"
                ? tr(lang, "العرض", "Width")
                : tr(lang, "الارتفاع", "Height")
            }
          >
            <Dimension value={d[key]} onChange={(n) => change({ [key]: n })} />
          </Field>
        ))}
      </div>
      <Range
        label={tr(lang, "الهامش الداخلي", "Padding")}
        value={d.padding}
        min={24}
        max={160}
        onChange={(padding) => change({ padding })}
      />
      <p className="hint">
        {tr(
          lang,
          "الأبعاد بين 320 و2048 بكسل. تصدير 2× يصل إلى 4096 بكسل.",
          "Dimensions: 320–2048 px. 2× export supports up to 4096 px.",
        )}
      </p>
    </>
  );
}

function Dimension({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <input
      type="number"
      id={id}
      min={320}
      max={2048}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number(draft);
        if (draft.trim() && Number.isFinite(n)) {
          const next = Math.min(2048, Math.max(320, Math.round(n)));
          onChange(next);
          setDraft(String(next));
        } else setDraft(String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
