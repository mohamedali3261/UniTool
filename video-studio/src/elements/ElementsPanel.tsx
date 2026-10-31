import { useMemo, useState } from "react";
import { loadElements, categories } from "../../../src/pages/Elements/registry";
import { ElementPreview } from "../../../src/pages/Elements/components/ElementPreview";
import type { LibraryElement } from "../../../src/pages/Elements/types";
import "./elements.css";
export default function ElementsPanel({
  onAdd,
  suspended,
}: {
  onAdd: (item: LibraryElement, color?: string, seconds?: number) => void;
  suspended: boolean;
}) {
  const items = useMemo(loadElements, []);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [source, setSource] = useState("all"),
    [limit, setLimit] = useState(12),
    [seconds, setSeconds] = useState(5);
  const filtered = items.filter(
    (i) =>
      (category === "all" || category === i.category) &&
      (source === "all" || source === i.source) &&
      `${i.name} ${i.sourceName}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="studio-elements" aria-label="مكتبة عناصر القوالب">
      <p>
        طبقات حقيقية من القوالب. النصوص والأشكال تُضاف عند المؤشر، وSVG كطبقة
        صورة. المشاهد بالكود تُضاف كمقطع في النهاية.
      </p>
      <label>
        بحث في عناصر القوالب
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(12);
          }}
          placeholder="اسم العنصر أو القالب…"
        />
      </label>
      <div className="studio-elements-filters">
        <label>
          القسم
          <select
            aria-label="القسم"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setLimit(12);
            }}
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          القالب
          <select
            aria-label="القالب"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setLimit(12);
            }}
          >
            <option value="all">كل القوالب</option>
            {[
              ...new Map(items.map((i) => [i.source, i.sourceName])).entries(),
            ].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        مدة العنصر بالثواني
        <input
          type="number"
          min="0.1"
          max="30"
          step="0.1"
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />
      </label>
      <small role="status">
        {filtered.length} عنصر · تقدر تتراجع عن الإضافة بـ Ctrl+Z
      </small>
      <div className="studio-elements-grid">
        {filtered.slice(0, limit).map((item) => (
          <article key={item.id}>
            <div>{!suspended && <ElementPreview item={item} />}</div>
            <small>
              {item.sourceName} ·{" "}
              {item.kind === "layer"
                ? "طبقة مستقلة"
                : item.kind === "svg"
                  ? "SVG"
                  : "مشهد مركّب"}
            </small>
            <strong>{item.name}</strong>
            <button
              disabled={
                !Number.isFinite(seconds) || seconds < 0.1 || seconds > 30
              }
              onClick={() => onAdd(item, undefined, seconds)}
              aria-label={`إضافة ${item.name} للتايم لاين`}
            >
              ＋ إضافة للتايم لاين
            </button>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p role="status">مفيش عناصر مطابقة. جرّب تغيير البحث أو الفلاتر.</p>
      )}
      {filtered.length > limit && (
        <button className="secondary" onClick={() => setLimit((v) => v + 12)}>
          عرض عناصر أكتر
        </button>
      )}
    </section>
  );
}
