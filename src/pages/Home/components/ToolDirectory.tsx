import { useMemo, useState, type RefObject } from "react";
import { Search, X, ArrowUpLeft, ChevronDown, LayoutGrid } from "lucide-react";
import { toolCategories, totalToolCount } from "../../ToolsHome/data";
import { copy, studios, type Language } from "../data";
export function ToolDirectory({
  lang,
  searchRef,
}: {
  lang: Language;
  searchRef: RefObject<HTMLInputElement>;
}) {
  const t = copy[lang];
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [expanded, setExpanded] = useState(false);
  const q = query.trim().toLocaleLowerCase();
  const tools = useMemo(
    () =>
      toolCategories
        .filter((c) => category === "all" || category === c.id)
        .flatMap((c) =>
          c.tools.map((tool) => ({
            ...tool,
            category: c.id,
            categoryLabel: lang === "ar" ? c.titleAr : c.titleEn,
          })),
        )
        .filter(
          (tool) =>
            !q ||
            [tool.titleAr, tool.titleEn, tool.descAr, tool.descEn]
              .join(" ")
              .toLocaleLowerCase()
              .includes(q),
        ),
    [q, category, lang],
  );
  const matches =
    q && category === "all"
      ? studios.filter((s) =>
          [s.name.ar, s.name.en, s.eyebrow, s.detail.ar, s.detail.en]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q),
        )
      : [];
  const featuredIds = [
    "excelStudio",
    "pdfMerger",
    "imageCropper",
    "videoMerger",
    "compress",
    "qrCode",
    "formatConverter",
    "pdfSigner",
    "imageCompressor",
  ];
  const visible =
    q || expanded || category !== "all"
      ? tools
      : featuredIds.flatMap((id) => tools.filter((t) => t.id === id));
  const reset = () => {
    setQuery("");
    setCategory("all");
    setExpanded(false);
    searchRef.current?.focus();
  };
  return (
    <div className="tool-directory">
      <div className="directory-search">
        <Search size={21} />
        <input
          ref={searchRef}
          type="search"
          aria-label={t.search}
          placeholder={t.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button
            aria-label={t.clear}
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </div>
      <div className="directory-filter-row">
        <div
          className="directory-filters"
          role="group"
          aria-label={lang === "ar" ? "أقسام الأدوات" : "Tool categories"}
        >
          {[
            { id: "all", titleAr: t.all, titleEn: t.all, icon: LayoutGrid },
            ...toolCategories,
          ].map((c) => (
            <button
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              <c.icon size={14} />
              {lang === "ar" ? c.titleAr : c.titleEn}
            </button>
          ))}
        </div>
        <span className="directory-count" role="status">
          {tools.length + matches.length} {t.results}
        </span>
      </div>
      {matches.length > 0 && (
        <div className="studio-search-matches">
          {matches.map((s) => (
            <a key={s.id} href={s.href}>
              <s.icon size={19} />
              <div>
                <strong>{s.name[lang]}</strong>
                <small>{s.eyebrow}</small>
              </div>
              <ArrowUpLeft size={18} />
            </a>
          ))}
        </div>
      )}
      <div className="tool-grid">
        {visible.map((tool) => (
          <a
            key={tool.id}
            href={tool.href || `/app.html#${tool.id}`}
            className={`directory-tool tone-${tool.category}`}
          >
            <span className="tool-icon">
              <tool.icon size={20} strokeWidth={1.7} />
            </span>
            <ArrowUpLeft className="tool-link-arrow" size={17} />
            <small>{tool.categoryLabel}</small>
            <h3>{lang === "ar" ? tool.titleAr : tool.titleEn}</h3>
            <p>{lang === "ar" ? tool.descAr : tool.descEn}</p>
          </a>
        ))}
      </div>
      {!tools.length && !matches.length && (
        <div className="directory-empty">
          <Search size={32} />
          <h3>{t.empty}</h3>
          <p>{t.emptyHelp}</p>
          <button className="home-btn secondary" onClick={reset}>
            {t.reset}
          </button>
        </div>
      )}
      {!q && category === "all" && tools.length > 8 && (
        <button
          className="directory-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t.showLess : `${t.showAll} (${totalToolCount})`}
          <ChevronDown
            size={16}
            style={{ transform: expanded ? "rotate(180deg)" : undefined }}
          />
        </button>
      )}
    </div>
  );
}
