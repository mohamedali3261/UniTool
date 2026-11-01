import { useState } from "react";
import { useDesigner } from "./state";
import { ProjectGraphic } from "./render";
import { kitVariant } from "./export-tools";
/** أحجام فعلية وخلفيات متعددة؛ ليس تقييمًا آليًا مزعومًا لجودة العلامة. */
export default function Readability() {
  const s = useDesigner(),
    [background, setBackground] = useState("#ffffff"),
    p = kitVariant(s.doc, "square");
  return (
    <section className="ld-feature-block">
      <h3>{s.t("اختبار وضوح الشعار", "Logo readability test")}</h3>
      <p>
        {s.t(
          "عاين التفاصيل بحجم عرض فعلي. دي مراجعة بصرية، مش درجة جودة آلية.",
          "Inspect at actual CSS pixel sizes. This is a visual review, not an automated quality score.",
        )}
      </p>
      <div className="ld-mini-grid">
        {["#ffffff", "#14221d", "#b6c6e0", "#e7ad77"].map((c) => (
          <button
            key={c}
            aria-label={"Test background " + c}
            style={{
              background: c,
              color: c === "#14221d" ? "white" : "#14221d",
            }}
            onClick={() => setBackground(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="ld-readability" style={{ background }}>
        {[16, 24, 32, 48, 64, 128].map((size) => (
          <div key={size}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${p.width} ${p.height}`}
              aria-label={`Logo at ${size}px`}
            >
              <ProjectGraphic project={p} prefix={"readability-" + size} />
            </svg>
            <small
              style={{ color: background === "#14221d" ? "#fff" : "#14221d" }}
            >
              {size}px
            </small>
          </div>
        ))}
      </div>
      <p>
        {s.t(
          "لو الخط أو الفراغات اختفوا في المقاسات الصغيرة، قلّل التفاصيل أو استخدم نسخة مبسطة.",
          "If letters or gaps disappear at small sizes, reduce detail or use a simplified variant.",
        )}
      </p>
    </section>
  );
}
