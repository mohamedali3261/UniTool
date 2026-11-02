import { useState } from "react";
import {
  applyFormatting,
  copyFormatting,
  clearFormatting,
  isText,
  applyTextFit,
  type FitMode,
} from "../core/text";
import { Field, Note, t, type Props } from "./shared";
export function TextSection({
  canvas,
  ar,
  run,
  clipboard,
  setClipboard,
}: Props & { clipboard: any; setClipboard: (v: any) => void }) {
  const [mode, setMode] = useState<FitMode>("shrink"),
    [height, setHeight] = useState(120);
  const active = canvas.getActiveObject() as any;
  return (
    <>
      <div className="adv-grid">
        <button
          onClick={() => run(() => setClipboard(copyFormatting(active)), false)}
        >
          {t(ar, "نسخ التنسيق فقط", "Copy formatting only")}
        </button>
        <button
          disabled={!clipboard}
          onClick={() => run(() => applyFormatting(active, clipboard))}
        >
          {t(ar, "لصق التنسيق", "Paste formatting")}
        </button>
        <button
          onClick={() =>
            run(() => clearFormatting(active, canvas.backgroundColor))
          }
        >
          {t(ar, "مسح التنسيق", "Clear formatting")}
        </button>
      </div>
      <Note>
        {t(
          ar,
          "التنسيق لا ينسخ الكلمات أو الموقع. مسح التنسيق يحتفظ بالمحتوى والحجم والمكان.",
          "Formatting does not copy words or position. Clearing keeps content, size and location.",
        )}
      </Note>
      <h3>{t(ar, "احتواء النص داخل الصندوق", "Text-box fitting")}</h3>
      <Field label={t(ar, "طريقة الاحتواء", "Fit policy")}>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as FitMode)}
        >
          <option value="shrink">
            {t(ar, "تصغير تلقائي للخط", "Shrink font automatically")}
          </option>
          <option value="grow">
            {t(ar, "تكبير ارتفاع الصندوق", "Grow box height")}
          </option>
          <option value="warn">
            {t(ar, "تنبيه عند تجاوز المساحة", "Warn on overflow")}
          </option>
        </select>
      </Field>
      <Field label={t(ar, "ارتفاع الصندوق بالبكسل", "Box height in pixels")}>
        <input
          type="number"
          min={16}
          max={5000}
          value={height}
          onChange={(e) => setHeight(e.target.valueAsNumber)}
        />
      </Field>
      <button
        onClick={() =>
          run(() => {
            if (
              !isText(active) ||
              !Number.isFinite(height) ||
              height < 16 ||
              height > 5000
            )
              throw Error("Select text and a valid height");
            active.textFitMode = mode;
            active.textFitHeight = height;
            active.textFitMaxSize = active.fontSize;
            applyTextFit(active);
          })
        }
      >
        {t(ar, "تطبيق سياسة الاحتواء", "Apply fit policy")}
      </button>
      {active?.textFitOverflow && (
        <p role="alert">
          {t(
            ar,
            "النص أكبر من الصندوق. كبّر المساحة أو قلّل النص.",
            "Text exceeds the box. Increase space or shorten the text.",
          )}
        </p>
      )}
      <Note>
        {t(
          ar,
          "تطبق السياسة عند الكتابة لاحقًا أيضًا. التصغير يصل إلى 8px؛ لا نحذف نصًا لا يتسع.",
          "Policy also applies to later typing. Shrink stops at 8px; overflowing text is never deleted.",
        )}
      </Note>
    </>
  );
}
