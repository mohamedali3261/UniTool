import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Heart, ArrowUpLeft, Menu, Layers3, X } from "lucide-react";
import { sitePages } from "../../config/sitePages";
import type { LibraryElement, Category } from "./types";
import { ElementCard } from "./components/ElementCard";
import { ElementInspector } from "./components/ElementInspector";
import { readFavorites, saveFavorites } from "./lib/preferences";
export default function ElementsPage() {
  const [items, setItems] = useState<LibraryElement[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [source, setSource] = useState("all"),
    [favorites, setFavorites] = useState(readFavorites),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [limit, setLimit] = useState(24),
    [sort, setSort] = useState("default"),
    [selected, setSelected] = useState<LibraryElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let alive = true;
    import("./registry")
      .then((m) => {
        const data = m.loadElements();
        if (alive) {
          setItems(data);
          setCategories(m.categories);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (alive) setError("تعذّر تحميل المكتبة. جرّب إعادة تحميل الصفحة.");
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => saveFavorites(favorites), [favorites]);
  useEffect(() => setLimit(24), [query, category, source, onlyFavorites, sort]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        !selected
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [selected]);
  const q = query.trim().toLocaleLowerCase();
  const sources = useMemo(
    () => [...new Map(items.map((i) => [i.source, i.sourceName])).entries()],
    [items],
  );
  const filtered = useMemo(() => {
    let result = items.filter(
      (i) =>
        (category === "all" || category === i.category) &&
        (source === "all" || i.source === source) &&
        (!onlyFavorites || favorites.includes(i.id)) &&
        (!q ||
          `${i.name} ${i.sourceName} ${i.id} ${categories.find((c) => c.id === i.category)?.name}`
            .toLocaleLowerCase()
            .includes(q)),
    );
    if (sort === "name")
      result.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    else if (sort === "source")
      result.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
    else if (category === "all") {
      const buckets = categories.map((c) =>
        result.filter((i) => i.category === c.id),
      );
      result = [];
      for (let n = 0; buckets.some((b) => n < b.length); n++)
        for (const bucket of buckets) if (bucket[n]) result.push(bucket[n]);
    }
    return result;
  }, [items, category, source, onlyFavorites, favorites, q, categories, sort]);
  function toggleFavorite(id: string) {
    setFavorites((old) =>
      old.includes(id) ? old.filter((v) => v !== id) : [...old, id],
    );
  }
  function reset() {
    setQuery("");
    setCategory("all");
    setSource("all");
    setOnlyFavorites(false);
  }
  return (
    <div className="elements-page">
      <a className="skip-link" href="#element-catalog">
        انتقل للعناصر
      </a>
      <header className="elements-header">
        <div className="home-container">
          <a
            className="original-brand"
            href="/index.html"
            aria-label="UniTool — الرئيسية"
          >
            <img
              src="/UniTool_logo.png"
              alt="UniTool"
              width="128"
              height="32"
            />
          </a>
          <nav aria-label="التنقل الرئيسي">
            {sitePages.map((p) => (
              <a
                key={p.href}
                href={p.href}
                aria-current={p.href === "/elements.html" ? "page" : undefined}
              >
                {p.ar}
              </a>
            ))}
          </nav>
          <details className="elements-mobile-menu">
            <summary aria-label="قائمة الصفحات">
              <Menu size={22} />
            </summary>
            <div>
              {sitePages.map((p) => (
                <a key={p.href} href={p.href}>
                  {p.ar}
                </a>
              ))}
            </div>
          </details>
        </div>
      </header>
      <main className="home-container">
        <section className="elements-hero">
          <span className="section-eyebrow">
            THE BUILDING BLOCKS / ELEMENTS LIBRARY
          </span>
          <span className="elements-hero-symbol" aria-hidden="true">
            <Layers3 size={48} />
          </span>
          <h1>
            العناصر اللي ورا
            <br />
            <span>أفكارك الكبيرة.</span>
          </h1>
          <p>
            مش مجرد صور للعرض. دي طبقات وخلفيات ومشاهد من قوالب الاستوديو نفسها؛
            اعرف مصدرها، جرّبها، وخدها معاك لمشروعك.
          </p>
          <div className="elements-hero-notes">
            <span>مصادر القوالب الأصلية</span>
            <span>مفضلة محفوظة على جهازك</span>
            <span>PNG · SVG · JSON</span>
          </div>
          <a href="/video-studio.html">
            افتح استوديو الفيديو
            <ArrowUpLeft size={18} />
          </a>
        </section>
        <section
          id="element-catalog"
          className="element-catalog"
          aria-label="دليل العناصر"
        >
          <div className="element-category-grid">
            <button
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              <span>✳</span>
              <strong>كل العناصر</strong>
              <small>{items.length}</small>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
                title={c.description}
              >
                <span>{c.symbol}</span>
                <strong>{c.name}</strong>
                <small>{items.filter((i) => i.category === c.id).length}</small>
              </button>
            ))}
          </div>
          <div className="element-filter-bar">
            <label className="element-search">
              <Search size={19} />
              <input
                ref={search}
                type="search"
                aria-label="بحث في العناصر"
                placeholder="ابحث باسم العنصر أو القالب…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="مسح البحث" onClick={() => setQuery("")}>
                  <X size={17} />
                </button>
              )}
              <kbd>⌘ / Ctrl K</kbd>
            </label>
            <select
              aria-label="قالب المصدر"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="all">كل القوالب</option>
              {sources.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select
              aria-label="ترتيب العناصر"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">استكشاف الأقسام</option>
              <option value="name">حسب الاسم</option>
              <option value="source">حسب القالب</option>
            </select>
            <button
              className="element-favorites-filter"
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Heart size={16} />
              المفضلة (
              {favorites.filter((id) => items.some((i) => i.id === id)).length})
            </button>
          </div>
          <div className="element-results-heading">
            <div>
              <h2>
                {category === "all"
                  ? "كل التفاصيل، في مكان واحد."
                  : categories.find((c) => c.id === category)?.name}
              </h2>
              <p>
                {categories.find((c) => c.id === category)?.description ||
                  "اختار عنصر وشوف تفاصيله ومصدره وصيغ التصدير المتاحة."}
              </p>
            </div>
            <span role="status">
              {loaded ? `${filtered.length} عنصر` : "تحميل العناصر…"}
            </span>
          </div>
          {error && (
            <div role="alert" className="elements-empty">
              {error}
              <button onClick={() => location.reload()}>إعادة التحميل</button>
            </div>
          )}
          <div className="elements-grid">
            {filtered.slice(0, limit).map((item) => (
              <ElementCard
                key={item.id}
                item={item}
                favorite={favorites.includes(item.id)}
                onFavorite={() => toggleFavorite(item.id)}
                onOpen={() => setSelected(item)}
              />
            ))}
          </div>
          {loaded && !filtered.length && (
            <div className="elements-empty">
              <Search size={34} />
              <h3>مفيش عناصر مطابقة لبحثك</h3>
              <p>
                جرّب اسم تاني، أو احفظ عناصر بقلب المفضلة علشان ترجع لها بسهولة.
              </p>
              <button onClick={reset}>مسح الفلاتر</button>
            </div>
          )}
          {filtered.length > limit && (
            <button
              className="elements-load-more"
              onClick={() => setLimit((v) => v + 24)}
            >
              عرض عناصر أكتر ({Math.min(limit, filtered.length)} /{" "}
              {filtered.length})
            </button>
          )}
          <details className="element-library-help">
            <summary>أستخدم العناصر إزاي؟ وإيه الفرق بين الصيغ؟</summary>
            <p>
              PNG لقطة ثابتة بخلفية شفافة للطبقات. SVG متاح للخلفيات المتجهة
              الأصلية. JSON المشروع يفتح من «فتح مشروع» في استوديو الفيديو:
              الطبقات تفضل قابلة للتعديل، وSVG يفضل أصلًا واحدًا، ومشهد
              Interface Flow يفضل مشهدًا بالكود. تنزيل عنصر مش بيضيفه تلقائيًا
              لمشروع مفتوح ومش بيعدّل القالب الأصلي.
            </p>
            <p>
              المكتبة بتقرأ مصادر قوالب الاستوديو التسعة؛ الصوت وملفات المستخدم
              الخارجية مش ضمن مكتبة الرسومات دي.
            </p>
          </details>
        </section>
      </main>
      <footer className="elements-footer home-container">
        <a href="/index.html">↗ العودة للرئيسية</a>
        <span>UniTool / EVERY DETAIL HAS A PLACE.</span>
      </footer>
      {selected && (
        <ElementInspector
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
