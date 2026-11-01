import PersonalLibrary from "./PersonalLibrary";
import Combinations from "./Combinations";
/** المكتبة تجمع الرموز والعلامات الأصلية؛ الإضافة دائمًا عنصر حقيقي قابل للتعديل. */
import { useMemo, useState } from "react";
import { Search, Star, Clock } from "lucide-react";
import { useDesigner } from "./state";
import {
  symbols,
  shapes,
  categories,
  matchesSymbol,
  matchesShape,
} from "./catalog";
import { node, type Element } from "./types";
import { ElementGraphic } from "./render";
import { vectorMarks, vectorNode } from "./vector-library";
import { matchesSearch } from "./search";
import { useLibraryPreferences } from "./library-preferences";
export default function ShapeLibrary() {
  const s = useDesigner(),
    [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [collection, setCollection] = useState("all"),
    [kind, setKind] = useState("all"),
    [showCombinations, setShowCombinations] = useState(false),
    [personal, setPersonal] = useState(false),
    prefs = useLibraryPreferences();
  const entries = useMemo(
    () => [
      ...shapes.map(([id, ar, en]) => ({
        id: "shape:" + id,
        ar,
        en,
        kind: "shape",
        category: "geometry",
        data: node({
          asset: id,
          name: s.t(ar, en),
          x: 50,
          y: 50,
          w: 60,
          h: 60,
        }),
        matches: (cat: string) => matchesShape(id, cat),
      })),
      ...vectorMarks.map((v) => ({
        id: "vector:" + v.id,
        ar: v.ar,
        en: v.en,
        kind: "vector",
        category: v.category,
        data: node({
          ...vectorNode(v),
          name: s.t(v.ar, v.en),
          x: 50,
          y: 50,
          w: 60,
          h: 60,
        }),
        matches: (cat: string) => cat === "all" || cat === v.category,
      })),
      ...symbols.map((v) => ({
        id: "icon:" + v.id,
        ar: v.ar,
        en: v.en,
        kind: "icon",
        category: v.category,
        data: node({
          kind: "icon",
          asset: v.id,
          name: s.t(v.ar, v.en),
          strokeWidth: 1.8,
          x: 50,
          y: 50,
          w: 60,
          h: 60,
        }),
        matches: (cat: string) => matchesSymbol(v, cat),
      })),
    ],
    [s.lang],
  );
  const filtered = entries.filter(
    (v) =>
      v.matches(cat) &&
      (kind === "all" || v.kind === kind) &&
      (collection === "all" ||
        (collection === "favorites" ? prefs.favorites : prefs.recent).includes(
          v.id,
        )) &&
      matchesSearch(
        q,
        v.ar,
        v.en,
        ...(categories.find((c) => c[0] === v.category) || []),
      ),
  );
  if (collection === "recent")
    filtered.sort(
      (a, b) => prefs.recent.indexOf(a.id) - prefs.recent.indexOf(b.id),
    );
  function add(id: string, data: Element) {
    const { id: ignored, x, y, w, h, ...rest } = data;
    s.add([{ ...rest, w: 160, h: 160 }]);
    prefs.used(id);
  }
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">THE BUILDING BLOCKS</p>
      <h2>{s.t("ابني علامة مختلفة.", "Make your mark.")}</h2>
      <p>
        {s.t(
          `${entries.length} عنصر متجهي، منها ${vectorMarks.length} علامة أصلية. اختار، عدّل وخلّيها بصمتك.`,
          `${entries.length} vector elements, including ${vectorMarks.length} original marks. Pick, edit and make them yours.`,
        )}
      </p>
      <button
        className="ld-secondary"
        aria-pressed={personal}
        onClick={() => {
          setPersonal(!personal);
          setShowCombinations(false);
        }}
      >
        {s.t(
          personal ? "رجوع للمكتبة العامة" : "مكتبتي الشخصية",
          personal ? "Back to public library" : "My personal library",
        )}
      </button>
      {personal ? (
        <PersonalLibrary />
      ) : (
        <>
          <button
            className="ld-secondary"
            aria-pressed={showCombinations}
            onClick={() => setShowCombinations(!showCombinations)}
          >
            {s.t(
              showCombinations
                ? "رجوع للعناصر المفردة"
                : "تركيبات أيقونات قابلة للتعديل",
              showCombinations
                ? "Back to individual elements"
                : "Editable icon combinations",
            )}
          </button>
          {showCombinations ? (
            <Combinations />
          ) : (
            <>
              <label className="ld-search">
                <Search size={17} />
                <input
                  type="search"
                  aria-label={s.t("بحث في الأشكال", "Search symbols")}
                  placeholder={s.t(
                    "ورقة، صحة، عقارات…",
                    "Leaf, health, estate…",
                  )}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <div className="ld-collection-tabs">
                {[
                  ["all", "المكتبة", "Library"],
                  ["favorites", "المفضلة", "Favorites"],
                  ["recent", "مؤخرًا", "Recent"],
                ].map(([id, ar, en]) => (
                  <button
                    key={id}
                    aria-pressed={collection === id}
                    onClick={() => setCollection(id)}
                  >
                    {id === "favorites" ? (
                      <Star size={12} />
                    ) : id === "recent" ? (
                      <Clock size={12} />
                    ) : null}
                    {s.t(ar, en)}
                  </button>
                ))}
              </div>
              <label className="ld-field">
                {s.t("نوع العنصر", "Element type")}
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {[
                    ["all", "كل العناصر", "All elements"],
                    ["shape", "أشكال هندسية", "Shapes"],
                    ["icon", "رموز خطية", "Line icons"],
                    ["vector", "علامات أصلية", "Original marks"],
                  ].map(([id, ar, en]) => (
                    <option key={id} value={id}>
                      {s.t(ar, en)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ld-chips">
                {categories.map(([id, ar, en]) => (
                  <button
                    key={id}
                    aria-pressed={cat === id}
                    onClick={() => setCat(id)}
                  >
                    {s.t(ar, en)}
                  </button>
                ))}
              </div>
              <p className="ld-results" role="status">
                {s.t(`${filtered.length} عنصر`, `${filtered.length} elements`)}
              </p>
              <div className="ld-symbol-grid">
                {filtered.map((v) => (
                  <article className="ld-library-item" key={v.id}>
                    <button
                      className="ld-element-add"
                      title={s.t(v.ar, v.en)}
                      aria-label={s.t("إضافة ", "Add ") + s.t(v.ar, v.en)}
                      onClick={() => add(v.id, v.data)}
                    >
                      <svg viewBox="0 0 100 100">
                        <ElementGraphic
                          n={v.data}
                          prefix={"library-" + v.id.replace(":", "-")}
                        />
                      </svg>
                      <span>{s.t(v.ar, v.en)}</span>
                    </button>
                    <button
                      className="ld-favorite-toggle"
                      aria-label={s.t("مفضلة ", "Favorite ") + s.t(v.ar, v.en)}
                      aria-pressed={prefs.favorites.includes(v.id)}
                      onClick={() => prefs.toggle(v.id)}
                    >
                      <Star
                        size={11}
                        fill={
                          prefs.favorites.includes(v.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <div className="ld-empty" role="status">
                  <p>
                    {s.t(
                      collection === "favorites"
                        ? "اضغط النجمة على أي عنصر علشان تضيفه للمفضلة."
                        : "مفيش نتائج بالفلاتر دي. جرّب كلمة أو تصنيف تاني.",
                      collection === "favorites"
                        ? "Star any element to save it here."
                        : "No matches for these filters. Try another search or category.",
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setQ("");
                      setCat("all");
                      setKind("all");
                      setCollection("all");
                    }}
                  >
                    {s.t("إظهار كل العناصر", "Show all elements")}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
