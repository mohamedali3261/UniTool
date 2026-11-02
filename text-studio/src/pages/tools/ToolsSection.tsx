import { useState } from "react";
import { cleanText, type CleanAction } from "../../core/model";
import { tr, type SectionProps } from "../editor/sections/shared";
export function ToolsSection({ design, change, lang }: SectionProps) {
  const [error, setError] = useState(false);
  const actions: { id: CleanAction; ar: string; en: string }[] = [
    { id: "spaces", ar: "تنظيف المسافات", en: "Clean whitespace" },
    { id: "diacritics", ar: "إزالة التشكيل", en: "Remove Arabic diacritics" },
    { id: "tatweel", ar: "إزالة التطويل", en: "Remove tatweel" },
    { id: "upper", ar: "حروف إنجليزية كبيرة", en: "UPPERCASE" },
    { id: "lower", ar: "حروف إنجليزية صغيرة", en: "lowercase" },
  ];
  return (
    <>
      <p className="hint">
        {tr(
          lang,
          "تعديلات نصية فعلية، ويمكن التراجع عنها. لا توجد إعادة صياغة أو توليد بالذكاء الاصطناعي.",
          "Real, undoable text operations. No AI generation or rewriting.",
        )}
      </p>
      {error && (
        <p className="notice warning" role="alert">
          {tr(
            lang,
            "النتيجة تتجاوز حد 1500 حرف. لم نغيّر النص؛ قلّل طوله ثم أعد المحاولة.",
            "The result exceeds 1500 characters. Your text is unchanged; shorten it and try again.",
          )}
        </p>
      )}
      <div className="tool-buttons">
        {actions.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => {
              const next = cleanText(design.text, a.id);
              if (next.length > 1500) {
                setError(true);
                return;
              }
              setError(false);
              change({ text: next });
            }}
          >
            {tr(lang, a.ar, a.en)}
          </button>
        ))}
      </div>
    </>
  );
}
