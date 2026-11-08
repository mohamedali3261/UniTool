import { useEffect, useRef, useState } from "react";
import {
  cartonError,
  cartonGeometry,
  type CartonSize,
} from "./geometry";
import {
  formatCartonDims,
  formatSheetDims,
  formatUnitNumber,
  mmToUnit,
  unitAriaSuffix,
  unitShortLabel,
  unitToMm,
  type PackagingUnit,
} from "./units";
import { useDcLang } from "../hooks/useDcLang";
import "./packaging.css";

export function CartonResizeDialog({
  size,
  initialUnit = "mm",
  onClose,
  onApply,
}: {
  size: CartonSize;
  initialUnit?: PackagingUnit;
  onClose: () => void;
  onApply: (size: CartonSize) => Promise<void>;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    dialog = useRef<HTMLDialogElement>(null),
    [unit, setUnit] = useState<PackagingUnit>(initialUnit),
    [draft, setDraft] = useState<{
      height: string;
      width: string;
      depth: string;
      glue: string;
      tuck: string;
    }>(() => ({
      height: formatUnitNumber(size.height, initialUnit),
      width: formatUnitNumber(size.width, initialUnit),
      depth: formatUnitNumber(size.depth, initialUnit),
      glue: formatUnitNumber(size.glue, initialUnit),
      tuck: formatUnitNumber(size.tuck, initialUnit),
    })),
    [customTabs, setCustomTabs] = useState(false),
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

  const switchUnit = (nextUnit: PackagingUnit) => {
    if (nextUnit === unit) return;
    const convertField = (raw: string) => {
      if (raw.trim() === "") return "";
      const num = Number(raw);
      if (!Number.isFinite(num)) return raw;
      const inMm = unitToMm(num, unit);
      return formatUnitNumber(inMm, nextUnit);
    };
    setDraft({
      height: convertField(draft.height),
      width: convertField(draft.width),
      depth: convertField(draft.depth),
      glue: convertField(draft.glue),
      tuck: convertField(draft.tuck),
    });
    setUnit(nextUnit);
  };

  const parseMm = (raw: string) =>
    raw.trim() === "" ? NaN : unitToMm(Number(raw), unit);

  const heightMm = parseMm(draft.height);
  const widthMm = parseMm(draft.width);
  const depthMm = parseMm(draft.depth);
  const glueMm = customTabs
    ? parseMm(draft.glue)
    : Number((Math.min(size.glue, 30, widthMm * 0.4)).toFixed(4));
  const tuckMm = customTabs
    ? parseMm(draft.tuck)
    : Number(
        (size.construction === "hinged-lid"
          ? Math.min(size.tuck, 30, heightMm * 0.7)
          : Math.min(size.tuck, 30, depthMm * 0.6, widthMm * 0.25)
        ).toFixed(4),
      );

  const adjusted: CartonSize = {
    ...size,
    height: heightMm,
    width: widthMm,
    depth: depthMm,
    glue: glueMm,
    tuck: tuckMm,
  };
  const invalid = cartonError(adjusted);
  const previewGeom = invalid ? null : cartonGeometry(adjusted);

  const mainFields = [
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
  ] as const;

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
        <div className="carton-resize-top">
          <div>
            <h2 id="carton-resize-title">
              {ar ? "تعديل مقاسات التصميم" : "Resize carton design"}
            </h2>
            <p>
              {ar
                ? "اكتب المقاسات بالـ سم (cm) أو الـ مم (mm): تتكيف الخلفيات والأوجه تلقائياً مع الحفاظ على النصوص والصور."
                : "Enter dimensions in cm or mm: backgrounds adapt to the new faces while text and images stay proportional."}
            </p>
          </div>
          <div
            className="carton-unit-switch"
            role="group"
            data-testid="carton-resize-unit-toggle"
            aria-label={ar ? "وحدة قياس العلبة" : "Carton measurement unit"}
          >
            {(["mm", "cm"] as const).map((u) => (
              <button
                key={u}
                type="button"
                disabled={busy}
                aria-pressed={unit === u}
                data-testid={`resize-unit-${u}`}
                onClick={() => switchUnit(u)}
              >
                {u === "cm"
                  ? ar
                    ? "سم · cm"
                    : "cm"
                  : ar
                    ? "مم · mm"
                    : "mm"}
              </button>
            ))}
          </div>
        </div>

        <div className="carton-resize-fields">
          {mainFields.map(([key, arabic, english, minMm, maxMm]) => {
            const minVal = mmToUnit(minMm, unit);
            const maxVal = mmToUnit(maxMm, unit);
            const currentMm = adjusted[key];
            const otherUnit: PackagingUnit = unit === "cm" ? "mm" : "cm";
            return (
              <label key={key}>
                <span className="carton-field-head">
                  <span>
                    {ar ? arabic : english} ({unitShortLabel(unit, ar)})
                  </span>
                  <small dir="ltr">
                    {minVal}–{maxVal} {unit}
                  </small>
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={minVal}
                  max={maxVal}
                  required
                  disabled={busy}
                  aria-label={(ar ? arabic : english) + unitAriaSuffix(unit, ar)}
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
                {Number.isFinite(currentMm) && currentMm > 0 && (
                  <small className="carton-unit-equiv" dir="ltr">
                    = {formatUnitNumber(currentMm, otherUnit)}{" "}
                    {unitShortLabel(otherUnit, ar)}
                  </small>
                )}
              </label>
            );
          })}
        </div>

        <details
          className="carton-resize-advanced"
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open && !customTabs) {
              setDraft((prev) => ({
                ...prev,
                glue: formatUnitNumber(glueMm, unit),
                tuck: formatUnitNumber(tuckMm, unit),
              }));
            }
          }}
        >
          <summary>
            {ar
              ? "ضبط ألسنة اللصق والقفل يدوياً"
              : "Manual glue & tuck flap sizes"}
          </summary>
          <div className="carton-resize-tabs-grid">
            {(
              [
                ["glue", "لسان اللصق", "Glue tab", 5, 30],
                [
                  "tuck",
                  size.construction === "hinged-lid"
                    ? "لسان الغطاء"
                    : "لسان القفل",
                  size.construction === "hinged-lid" ? "Lid flap" : "Tuck tab",
                  5,
                  30,
                ],
              ] as const
            ).map(([key, arabic, english, minMm, maxMm]) => (
              <label key={key}>
                <span>
                  {ar ? arabic : english} ({unitShortLabel(unit, ar)})
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={mmToUnit(minMm, unit)}
                  max={mmToUnit(maxMm, unit)}
                  disabled={busy}
                  aria-label={(ar ? arabic : english) + unitAriaSuffix(unit, ar)}
                  value={draft[key]}
                  onChange={(e) => {
                    setCustomTabs(true);
                    setDraft({ ...draft, [key]: e.target.value });
                  }}
                />
              </label>
            ))}
          </div>
        </details>

        {!invalid && previewGeom && (
          <div
            className="carton-resize-summary"
            data-testid="carton-resize-summary"
          >
            <div>
              <span>{ar ? "أبعاد العلبة المجمّعة" : "Assembled box"}</span>
              <strong dir="ltr">
                {formatCartonDims(adjusted, "cm", ar)} ·{" "}
                {formatCartonDims(adjusted, "mm", false)}
              </strong>
            </div>
            <div>
              <span>{ar ? "الفرخ المفرود" : "Flat sheet"}</span>
              <strong dir="ltr">
                {formatSheetDims(previewGeom.width, previewGeom.height, "cm", ar)}{" "}
                ({previewGeom.width} × {previewGeom.height} mm)
              </strong>
            </div>
          </div>
        )}

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
                ? `أدخل مقاسات صحيحة ضمن الحدود الموضحة (${unit === "cm" ? "بالـ سم" : "بالـ مم"}).`
                : `Enter valid dimensions within the indicated ${unit} limits.`}
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
