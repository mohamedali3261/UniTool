/** السجل المتجهي مشترك مع التصدير؛ البحث لا يغيّر المشروع. */
import { useState } from "react";
import { Search } from "lucide-react";
import { useDesigner } from "./state";
import {
  symbols,
  shapes,
  categories,
  matchesSymbol,
  matchesShape,
} from "./catalog";
import { node } from "./types";
import { ElementGraphic } from "./render";
export default function ShapeLibrary() {
  const s = useDesigner(),
    [q, setQ] = useState(""),
    [cat, setCat] = useState("all");
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">THE BUILDING BLOCKS</p>
      <h2>{s.t("ابني علامة مختلفة.", "Make your mark.")}</h2>
      <p>
        {s.t(
          "أكثر من 100 رمز متجهي + أشكال هندسية. مفيش صور مسطحة.",
          "100+ vector symbols and geometric shapes. No flattened artwork.",
        )}
      </p>
      <label className="ld-search">
        <Search size={17} />
        <input
          type="search"
          aria-label={s.t("بحث في الأشكال", "Search symbols")}
          placeholder={s.t("ورقة، مطعم، عقارات…", "Leaf, food, estate…")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <div className="ld-chips">
        {categories.map(([id, ar, en]) => (
          <button key={id} aria-pressed={cat === id} onClick={() => setCat(id)}>
            {s.t(ar, en)}
          </button>
        ))}
      </div>
      <div className="ld-symbol-grid">
        {true &&
          shapes
            .filter(
              ([id, ar, en]) =>
                matchesShape(id, cat) &&
                `${ar} ${en}`.toLowerCase().includes(q.toLowerCase()),
            )
            .map(([id, ar, en]) => (
              <button
                key={id}
                aria-label={s.t("إضافة ", "Add ") + s.t(ar, en)}
                onClick={() => s.add([{ asset: id, name: s.t(ar, en) }])}
              >
                <svg viewBox="0 0 100 100">
                  <ElementGraphic
                    n={node({ asset: id, x: 50, y: 50, w: 60, h: 60 })}
                    prefix={`library-${id}`}
                  />
                </svg>
                <span>{s.t(ar, en)}</span>
              </button>
            ))}
        {symbols
          .filter(
            (v) =>
              matchesSymbol(v, cat) &&
              `${v.ar} ${v.en}`.toLowerCase().includes(q.toLowerCase()),
          )
          .map((v) => (
            <button
              key={v.id}
              aria-label={s.t("إضافة ", "Add ") + s.t(v.ar, v.en)}
              onClick={() =>
                s.add([
                  {
                    kind: "icon",
                    asset: v.id,
                    name: s.t(v.ar, v.en),
                    strokeWidth: 1.8,
                  },
                ])
              }
            >
              <v.icon size={31} />
              <span>{s.t(v.ar, v.en)}</span>
            </button>
          ))}
      </div>
      {q &&
        !symbols.some((v) =>
          `${v.ar} ${v.en}`.toLowerCase().includes(q.toLowerCase()),
        ) &&
        !shapes.some((v) =>
          v.join(" ").toLowerCase().includes(q.toLowerCase()),
        ) && (
          <p role="status">
            {s.t(
              "مفيش نتائج؛ جرّب كلمة تانية.",
              "No matches. Try another search.",
            )}
          </p>
        )}
    </section>
  );
}
