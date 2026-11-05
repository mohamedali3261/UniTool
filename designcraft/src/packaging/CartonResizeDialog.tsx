import { useEffect, useRef, useState } from "react";
import { cartonError, type CartonSize } from "./geometry";
import { useDcLang } from "../hooks/useDcLang";
import "./packaging.css";
export function CartonResizeDialog({
  size,
  onClose,
  onApply,
}: {
  size: CartonSize;
  onClose: () => void;
  onApply: (size: CartonSize) => Promise<void>;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    dialog = useRef<HTMLDialogElement>(null),
    [value, setValue] = useState(size),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const adjusted = {
      ...value,
      glue: Math.min(size.glue, 30, value.width * 0.4),
      tuck:
        size.construction === "hinged-lid"
          ? Math.min(size.tuck, 30, value.height * 0.7)
          : Math.min(size.tuck, 30, value.depth * 0.6, value.width * 0.25),
    },
    invalid = cartonError(adjusted);
  return (
    <dialog
      ref={dialog}
      className="carton-resize-dialog"
      dir={ar ? "rtl" : "ltr"}
      aria-labelledby="carton-resize-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (invalid || busy) return;
          setBusy(true);
          setFailed(false);
          try {
            await onApply(adjusted);
            onClose();
          } catch {
            setFailed(true);
            setBusy(false);
          }
        }}
      >
        <h2 id="carton-resize-title">
          {ar ? "تعديل مقاسات التصميم" : "Resize carton design"}
        </h2>
        <p>
          {ar
            ? "تعديل نفس التصميم: تتكيف الخلفيات مع الأوجه الجديدة، مع الحفاظ على تناسب النصوص والصور وإمكانية تعديل كل عنصر."
            : "Resize this design: backgrounds fit the new faces while text and images retain their proportions and remain editable."}
        </p>
        <div className="carton-resize-fields">
          {(
            [
              [
                "height",
                size.construction ? "ارتفاع العلبة" : "طول العلبة",
                size.construction ? "Carton height" : "Carton length",
                size.construction ? 20 : 30,
                size.construction ? 150 : 500,
              ],
              [
                "width",
                "عرض العلبة",
                "Carton width",
                size.construction ? 100 : 20,
                size.construction ? 650 : 300,
              ],
              [
                "depth",
                size.construction ? "طول القاعدة" : "عمق العلبة",
                size.construction ? "Base length" : "Carton depth",
                size.construction ? 100 : 10,
                size.construction ? 650 : 150,
              ],
            ] as const
          ).map(([key, arabic, english, min, max]) => (
            <label key={key}>
              {ar ? arabic : english} (mm)
              <input
                type="number"
                step="0.01"
                min={min}
                max={max}
                required
                disabled={busy}
                aria-label={
                  (ar ? arabic : english) +
                  (ar ? " بالملليمتر" : " in millimetres")
                }
                value={Number.isNaN(value[key]) ? "" : value[key]}
                onChange={(e) =>
                  setValue({ ...value, [key]: e.target.valueAsNumber })
                }
              />
            </label>
          ))}
        </div>
        <small>
          {ar
            ? "قد يتم تصغير ألسنة الغلق تلقائيًا لتناسب المقاس. راجع توزيع العناصر والمعاينة ثلاثية الأبعاد قبل الطباعة."
            : "Closure tabs may shrink automatically to fit. Review artwork placement and the 3D preview before printing."}
        </small>
        {(invalid || failed) && (
          <p role="alert">
            {failed
              ? ar
                ? "تعذر تطبيق المقاسات. حاول مرة أخرى."
                : "Could not apply dimensions. Please retry."
              : ar
                ? "أدخل مقاسات صحيحة ضمن الحدود الموضحة."
                : "Enter valid dimensions within the indicated limits."}
          </p>
        )}
        <footer>
          <button type="button" disabled={busy} onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button type="submit" disabled={!!invalid || busy}>
            {busy
              ? ar
                ? "جاري التكييف…"
                : "Adapting…"
              : ar
                ? "تطبيق المقاسات"
                : "Apply dimensions"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
