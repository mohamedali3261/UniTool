import {
  readFavorites,
  saveFavorites,
} from "../../../src/pages/Elements/lib/preferences";
import { useEffect, useMemo, useState } from "react";
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
  const [live, setLive] = useState(true);
  const [favorites, setFavorites] = useState(readFavorites),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [onlyNew, setOnlyNew] = useState(false),
    [onlyCreative, setOnlyCreative] = useState(false);
  useEffect(() => saveFavorites(favorites), [favorites]);
  useEffect(() => setLimit(12), [onlyFavorites, onlyNew]);
  const items = useMemo(loadElements, []);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [source, setSource] = useState("all"),
    [limit, setLimit] = useState(12),
    [seconds, setSeconds] = useState(5);
  const filtered = items.filter(
    (i) =>
      (!onlyFavorites || favorites.includes(i.id)) &&
      (!onlyCreative || i.id.startsWith("creative-")) &&
      (!onlyNew || i.id.startsWith("video-")) &&
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
      <button
        className="secondary"
        aria-pressed={live}
        onClick={() => setLive(!live)}
      >
        {live ? "إيقاف المعاينات الحية" : "تشغيل المعاينات الحية"}
      </button>
      <div className="studio-elements-quick">
        <button
          aria-pressed={onlyCreative}
          onClick={() => {
            setOnlyCreative((v) => !v);
            setOnlyNew(false);
            setCategory("all");
            setSource("all");
            setQuery("");
            setLimit(12);
          }}
        >
          حركات إبداعية · 36
        </button>
        <button
          aria-pressed={onlyNew}
          onClick={() => {
            setOnlyNew((v) => !v);
            setOnlyCreative(false);
          }}
        >
          الجديد · {items.filter((i) => i.id.startsWith("video-")).length} عنصر
        </button>
        <button
          aria-pressed={onlyFavorites}
          onClick={() => setOnlyFavorites((v) => !v)}
        >
          المفضلة ({favorites.length})
        </button>
      </div>
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
            <div>
              {!suspended && (
                <ElementPreview live={live && item.animated} item={item} />
              )}
            </div>
            <small>
              {item.sourceName} ·{" "}
              {item.kind === "group"
                ? "تكوين جاهز"
                : item.kind === "layer"
                  ? "طبقة مستقلة"
                  : item.kind === "svg"
                    ? "SVG"
                    : "مشهد مركّب"}
            </small>
            <strong>{item.name}</strong>
            <button
              className="studio-element-favorite"
              aria-label={`حفظ ${item.name} في المفضلة`}
              aria-pressed={favorites.includes(item.id)}
              onClick={() =>
                setFavorites((old) =>
                  old.includes(item.id)
                    ? old.filter((id) => id !== item.id)
                    : [...old, item.id],
                )
              }
            >
              {favorites.includes(item.id) ? "♥ محفوظ" : "♡ حفظ"}
            </button>
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
