/** كل معاينة مبنية بنفس مرسم اللوحة، وكل قالب يظل قابلًا للتعديل. */
import { useMemo, useState } from "react";
import { useDesigner } from "./state";
import { templates, templateProject } from "./templates";
import { categories } from "./catalog";
import { ProjectGraphic } from "./render";
import { matchesSearch } from "./search";
import { Search } from "lucide-react";
export default function Templates() {
  const s = useDesigner(),
    [cat, setCat] = useState("all"),
    [query, setQuery] = useState(""),
    [layout, setLayout] = useState("all"),
    [brand, setBrand] = useState("");
  const previews = useMemo(
    () =>
      new Map(
        templates.map((t) => [
          t.id,
          templateProject(t, s.lang, brand.trim() || undefined),
        ]),
      ),
    [s.lang, brand],
  );
  const filtered = templates.filter(
    (t) =>
      (cat === "all" || t.category === cat) &&
      (layout === "all" || t.layout === layout) &&
      matchesSearch(
        query,
        t.ar,
        t.en,
        ...(categories.find((c) => c[0] === t.category) || []),
      ),
  );
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">A HEAD START, NOT A LIMIT</p>
      <h2>{s.t("بداية جاهزة. بصمتك أنت.", "Start with something good.")}</h2>
      <p>
        {s.t(
          `${templates.length} تكوين قابل للتعديل، بتسع عائلات تصميم مختلفة.`,
          `${templates.length} editable compositions across nine distinct layout families.`,
        )}
      </p>
      <label className="ld-field">
        {s.t("جرّب اسم نشاطك على القوالب", "Preview your brand name")}
        <input
          aria-label={s.t("اسم النشاط للقوالب", "Template brand name")}
          maxLength={28}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder={s.t("اسم علامتك…", "Your brand…")}
        />
      </label>
      <label className="ld-search">
        <Search size={17} />
        <input
          type="search"
          aria-label={s.t("بحث في القوالب", "Search templates")}
          placeholder={s.t("اسم أو مجال النشاط…", "Name or industry…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label className="ld-field">
        {s.t("تكوين التصميم", "Layout family")}
        <select value={layout} onChange={(e) => setLayout(e.target.value)}>
          {[
            ["all", "كل التكوينات", "All layouts"],
            ["vertical", "رأسي", "Vertical"],
            ["horizontal", "أفقي", "Horizontal"],
            ["badge", "شارة", "Badge"],
            ["seal", "ختم دائري", "Seal"],
            ["monogram", "حرف مميز", "Monogram"],
            ["editorial", "تحريري", "Editorial"],
            ["crest", "درع وشريط", "Crest"],
            ["split", "تكوين جانبي", "Split"],
            ["orbital", "مدارات", "Orbital"],
          ].map(([id, ar, en]) => (
            <option key={id} value={id}>
              {s.t(ar, en)}
            </option>
          ))}
        </select>
      </label>
      <p role="status">
        {s.t(`${filtered.length} قالب`, `${filtered.length} templates`)}
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
        {filtered.map((t) => (
          <button
            key={t.id}
            aria-label={s.t("استخدام قالب ", "Use template ") + t[s.lang]}
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
              const p = templateProject(t, s.lang, brand.trim() || undefined);
              s.commit((old) => ({ ...p, id: old.id }));
              s.setSelected([]);
            }}
          >
            <svg viewBox="0 0 800 600">
              <ProjectGraphic
                project={previews.get(t.id)!}
                prefix={`template-${t.id}`}
              />
            </svg>
            <strong>{t[s.lang]}</strong>
          </button>
        ))}
      </div>
      {!filtered.length && (
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
