import { useEffect, useState } from "react";
import { Check, FunctionSquare } from "lucide-react";
import { useStudio } from "../../app/context";
export function FormulaBar({
  selected,
  raw,
  onCommit,
  onAssistant,
}: {
  selected: string;
  raw: string;
  onCommit: (value: string) => void;
  onAssistant: () => void;
}) {
  const { t } = useStudio(),
    [draft, setDraft] = useState(raw);
  useEffect(() => setDraft(raw), [raw, selected]);
  return (
    <form
      className="xs-formula-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onCommit(draft);
      }}
    >
      <span className="xs-cell-address" dir="ltr">
        {selected}
      </span>
      <button
        type="button"
        className="xs-fx"
        onClick={onAssistant}
        title={t("مساعد المعادلات", "Formula assistant")}
        aria-label={t("مساعد المعادلات", "Formula assistant")}
      >
        ƒx
      </button>
      <input
        id="xs-formula-input"
        aria-label={t("قيمة الخلية أو المعادلة", "Cell value or formula")}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== raw) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(raw);
            e.currentTarget.blur();
          }
        }}
        dir="auto"
        placeholder={t(
          "اكتب قيمة أو ابدأ المعادلة بـ =",
          "Type a value or start a formula with =",
        )}
      />
      <button aria-label={t("تطبيق القيمة", "Apply value")} className="xs-icon">
        <Check size={17} />
      </button>
    </form>
  );
}
