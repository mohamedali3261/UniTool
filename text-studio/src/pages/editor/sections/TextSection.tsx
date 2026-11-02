import { Field, tr, type SectionProps } from "./shared";
import { statistics } from "../../../core/model";
export function TextSection({ design: d, change, lang }: SectionProps) {
  const s = statistics(d.text);
  return (
    <>
      <p className="hint">
        {tr(
          lang,
          "اكتب جملتك، وسيظهر شكلها فورًا. القوالب تغيّر التصميم ولا تستبدل كلامك.",
          "Write your words. Templates change the look, never your message.",
        )}
      </p>
      <Field label={tr(lang, "النص الرئيسي", "Main text")}>
        <textarea
          dir="auto"
          rows={6}
          value={d.text}
          maxLength={1500}
          onChange={(e) => change({ text: e.target.value })}
        />
      </Field>
      <div className="stats">
        <span>
          {s.words} {tr(lang, "كلمة", "words")}
        </span>
        <span>
          {s.characters} {tr(lang, "حرف", "characters")}
        </span>
        <span>
          {s.lines} {tr(lang, "سطر", "lines")}
        </span>
      </div>
      <Field
        label={tr(lang, "توقيع أو عبارة صغيرة", "Signature or small caption")}
      >
        <input
          dir="auto"
          value={d.signature}
          maxLength={100}
          onChange={(e) => change({ signature: e.target.value })}
        />
      </Field>
      <Field label={tr(lang, "اتجاه النص", "Text direction")}>
        <select
          value={d.direction}
          onChange={(e) =>
            change({ direction: e.target.value as typeof d.direction })
          }
        >
          <option value="auto">{tr(lang, "تلقائي", "Automatic")}</option>
          <option value="rtl">
            {tr(lang, "من اليمين لليسار", "Right to left")}
          </option>
          <option value="ltr">
            {tr(lang, "من اليسار لليمين", "Left to right")}
          </option>
        </select>
      </Field>
    </>
  );
}
