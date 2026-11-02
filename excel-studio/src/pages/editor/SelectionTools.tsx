import { useState } from "react";
import { display } from "../../core/calculate";
import { useStudio } from "../../app/context";
import { bounds, address } from "../../core/address";
import {
  parseSelection,
  wholeSelection,
  fillRight,
  clearFormatting,
} from "../../core/selectionTools";
import type { Selection, Sheet, Result } from "../../core/types";
export function SelectionTools({
  sheet,
  selection,
  setSelection,
  patch,
  result,
}: {
  sheet: Sheet;
  selection: Selection;
  setSelection: (s: Selection) => void;
  patch: (p: Partial<Sheet>) => void;
  result: (ref: string) => Result;
}) {
  const { t, update, notice, lang } = useStudio(),
    [range, setRange] = useState(""),
    [error, setError] = useState("");
  const b = bounds(selection.anchor, selection.end);
  const focus = (ref: string) => {
    document
      .querySelector<HTMLElement>(`.xs-grid [data-ref="${ref}"]`)
      ?.focus();
  };
  return (
    <div className="xs-selection-tools">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const s = parseSelection(range, sheet);
            setSelection(s);
            focus(s.end);
            setError("");
          } catch {
            setError(
              t(
                "اكتب خلية أو نطاقًا داخل الورقة، مثل B2 أو A1:C5.",
                "Enter a cell or range inside this sheet, such as B2 or A1:C5.",
              ),
            );
          }
        }}
      >
        <input
          dir="ltr"
          aria-label={t("انتقال إلى خلية أو نطاق", "Go to cell or range")}
          placeholder="A1:C5"
          value={range}
          onChange={(e) => {
            setRange(e.target.value);
            setError("");
          }}
        />
        <button type="submit" className="xs-button">
          {t("انتقال", "Go")}
        </button>
      </form>
      <button
        type="button"
        className="xs-button"
        onClick={() => {
          setSelection(wholeSelection(sheet));
          focus("A1");
        }}
      >
        {t("تحديد الكل", "Select all")}
      </button>
      <button
        type="button"
        className="xs-button"
        disabled={b.c1 === b.c2}
        onClick={() => update((book) => fillRight(book, sheet.id, selection))}
      >
        {t("تعبئة لليمين", "Fill right")}
      </button>
      <button
        type="button"
        className="xs-button"
        onClick={() =>
          update((book) => clearFormatting(book, sheet.id, selection))
        }
      >
        {t("مسح التنسيق فقط", "Clear formatting only")}
      </button>
      <button
        type="button"
        className="xs-button"
        onClick={() => {
          const canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
          if (!ctx) {
            notice(t("قياس النص غير متاح.", "Text measurement unavailable."));
            return;
          }
          ctx.font = "13px Arial";
          const widths = { ...sheet.columnWidths };
          for (let c = b.c1; c <= b.c2; c++) {
            let max = 70;
            for (let r = 0; r < sheet.rows; r++) {
              const ref = address(r, c),
                raw = sheet.showFormulas
                  ? sheet.cells[ref]?.raw
                  : display(result(ref).value, sheet.cells[ref], sheet, lang);
              for (const line of (raw || "").split("\n"))
                max = Math.max(max, ctx.measureText(line).width + 32);
            }
            widths[c] = Math.min(400, Math.ceil(max));
          }
          patch({ columnWidths: widths });
          notice(
            t(
              "تم ضبط الأعمدة المحددة حسب المحتوى (حتى 400 بكسل).",
              "Selected columns fitted to content (up to 400 px).",
            ),
          );
        }}
      >
        {t("ضبط عرض الأعمدة", "Fit column widths")}
      </button>
      <span className="xs-selection-dimensions">
        {b.r2 - b.r1 + 1} × {b.c2 - b.c1 + 1} {t("خلايا", "cells")}
      </span>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
