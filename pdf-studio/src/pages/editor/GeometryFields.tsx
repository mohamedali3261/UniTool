import { useEffect, useState } from "react";
import type { Annotation, Translate } from "../../core/types";
/** Keyboard editing in PDF points, independent of viewport zoom. */
export function GeometryFields({
  item,
  patch,
  t,
}: {
  item: Annotation;
  patch: (id: string, p: Partial<Annotation>) => void;
  t: Translate;
}) {
  const [value, setValue] = useState({
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  });
  useEffect(
    () => setValue({ x: item.x, y: item.y, w: item.w, h: item.h }),
    [item.id, item.x, item.y, item.w, item.h],
  );
  if (item.type === "pen") return null;
  return (
    <div className="ps-geometry">
      <small>
        {t(
          "الموضع والمقاس بالنقاط — من أعلى الصفحة الأصلية",
          "Position and size in points — from original page top",
        )}
      </small>
      <div>
        {[
          ["x", "X"],
          ["y", "Y"],
          ["w", t("العرض", "Width")],
          ["h", t("الارتفاع", "Height")],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={0}
              max={5000}
              aria-label={t("موضع/مقاس ", "Position/size ") + label}
              step={0.01}
              value={Number(value[key as keyof typeof value].toFixed(2))}
              onChange={(e) =>
                setValue({
                  ...value,
                  [key]: Math.max(
                    0,
                    Math.min(5000, Number(e.target.value) || 0),
                  ),
                })
              }
            />
          </label>
        ))}
      </div>
      <button
        className="ps-button"
        disabled={value.w < 1 || value.h < 1}
        onClick={() =>
          patch(
            item.id,
            Object.fromEntries(
              Object.entries(value).map(([k, v]) => [k, Number(v.toFixed(2))]),
            ),
          )
        }
      >
        {t("تطبيق الموضع والمقاس", "Apply position and size")}
      </button>
      <p className="ps-hint">
        {t(
          "أي جزء خارج حدود الصفحة يتم قصّه في العرض والتصدير.",
          "Any part outside the page is clipped in preview and export.",
        )}
      </p>
    </div>
  );
}
