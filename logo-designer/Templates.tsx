/** كل معاينة مبنية بنفس مرسم اللوحة، وكل قالب يظل قابلًا للتعديل. */
import { useState } from "react";
import { useDesigner } from "./state";
import { templates, templateProject } from "./templates";
import { categories } from "./catalog";
import { ProjectGraphic } from "./render";
export default function Templates() {
  const s = useDesigner(),
    [cat, setCat] = useState("all");
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">A HEAD START, NOT A LIMIT</p>
      <h2>{s.t("بداية جاهزة. بصمتك أنت.", "Start with something good.")}</h2>
      <p>
        {s.t(
          "36 تكوين أصلي. كل رمز وكلمة وإطار طبقة مستقلة.",
          "36 original compositions. Every symbol, word and frame stays editable.",
        )}
      </p>
      <div className="ld-chips">
        {categories
          .filter(
            (c) => c[0] === "all" || templates.some((t) => t.category === c[0]),
          )
          .map(([id, ar, en]) => (
            <button
              key={id}
              aria-pressed={cat === id}
              onClick={() => setCat(id)}
            >
              {s.t(ar, en)}
            </button>
          ))}
      </div>
      <div className="ld-template-grid">
        {templates
          .filter((t) => cat === "all" || t.category === cat)
          .map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (
                  s.doc.nodes.length &&
                  !confirm(
                    s.t(
                      "استبدال التصميم بالقالب؟ تقدر تتراجع.",
                      "Replace the design with this template? You can undo.",
                    ),
                  )
                )
                  return;
                const p = templateProject(t, s.lang);
                s.commit((old) => ({ ...p, id: old.id }));
                s.setSelected([]);
              }}
            >
              <svg viewBox="0 0 800 600">
                <ProjectGraphic
                  project={templateProject(t, s.lang)}
                  prefix={`template-${t.id}`}
                />
              </svg>
              <strong>{t[s.lang]}</strong>
            </button>
          ))}
      </div>
      {!templates.some((t) => cat === "all" || t.category === cat) && (
        <p className="ld-empty">
          {s.t(
            "مفيش قالب في التصنيف ده؛ ابدأ من رمز أو جرّب تصنيف تاني.",
            "No template in this category yet. Start with a symbol or another category.",
          )}
        </p>
      )}
    </section>
  );
}
