import { useState } from "react";
import { preflight, type Finding } from "../core/preflight";
import { Note, t, type Props } from "./shared";
export function PreflightSection({
  canvas,
  project,
  ar,
  safeMm,
}: Props & { safeMm: number }) {
  const [results, setResults] = useState<Finding[] | null>(null);
  return (
    <>
      <button
        onClick={() =>
          setResults(
            preflight(
              canvas,
              project.width,
              project.height,
              project.packaging?.size,
              safeMm,
            ),
          )
        }
      >
        {t(ar, "فحص التصميم قبل التصدير", "Run export preflight")}
      </button>
      {results && (
        <div role="status">
          <strong>
            {results.length
              ? t(
                  ar,
                  `${results.length} تنبيه للمراجعة`,
                  `${results.length} item(s) to review`,
                )
              : t(
                  ar,
                  "لا توجد تنبيهات ضمن الفحوص الحالية",
                  "No findings in the current checks",
                )}
          </strong>
          <ul>
            {results.map((r, i) => (
              <li key={i}>
                <b>{r.name}</b> · {r.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Note>
        {t(
          ar,
          "نفحص الصور الأقل من 300 DPI، والعناصر المخفية وخارج اللوحة، وتجاوز النص، وقرب نصوص العلب من القص والطيات بناءً على حدودها. الفحص ليس اعتماد مطبعة، ولا يتحقق من CMYK أو الخطوط المفقودة أو كل تقاطع مع شكل القص.",
          "Checks images under 300 DPI, hidden/off-canvas objects, text overflow and carton text safety using bounds. Not printer certification; does not validate CMYK, missing fonts or every silhouette intersection.",
        )}
      </Note>
    </>
  );
}
