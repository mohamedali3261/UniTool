import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpLeft, Layers3, Clock3 } from "lucide-react";
import { toolCategories, totalToolCount } from "../../ToolsHome/data";
import { studios, type Language } from "../data";
const allTools = toolCategories.flatMap((c) =>
  c.tools.map((t) => ({ ...t, category: c.id })),
);
export function HeroWorkspace({ lang }: { lang: Language }) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [recents, setRecents] = useState<string[]>(() => {
      try {
        const data = JSON.parse(
          localStorage.getItem("unitool-recent-tools") || "[]",
        );
        return Array.isArray(data)
          ? data
              .filter(
                (id) =>
                  typeof id === "string" && allTools.some((t) => t.id === id),
              )
              .slice(0, 4)
          : [];
      } catch {
        return [];
      }
    });
  const search = useRef<HTMLInputElement>(null);
  const ar = lang === "ar";
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
        search.current?.scrollIntoView({
          block: "center",
          behavior: "instant",
        });
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const q = query.trim().toLowerCase();
  const tools = allTools.filter(
    (t) =>
      (category === "all" || category === "tools" || category === t.category) &&
      (!q ||
        `${t.titleAr} ${t.titleEn} ${t.descAr} ${t.descEn}`
          .toLowerCase()
          .includes(q)),
  );
  const spaces = studios.filter(
    (s) =>
      category === "all" &&
      `${s.name.ar} ${s.name.en} ${s.detail.ar} ${s.detail.en}`
        .toLowerCase()
        .includes(q),
  );
  const elementsMatch =
    category === "all" &&
    (!q || "العناصر elements قوالب templates shapes".includes(q));
  function remember(id: string) {
    const next = [id, ...recents.filter((i) => i !== id)].slice(0, 4);
    setRecents(next);
    try {
      localStorage.setItem("unitool-recent-tools", JSON.stringify(next));
    } catch {}
  }
  const browsing = q || category !== "all";
  return (
    <div
      className="hero-workspace"
      aria-label={
        ar ? "مركز كل الأدوات والاستوديوهات" : "All tools and studios hub"
      }
    >
      <div className="hero-workspace-bar">
        <span>
          <i />
          <i />
          <i />
        </span>
        <small>UNITOOL / YOUR NEXT IDEA STARTS HERE</small>
        <b>
          {totalToolCount} TOOLS + {studios.length} STUDIOS
        </b>
      </div>
      <div className="hero-workspace-body">
        <nav
          className="hero-workspace-nav"
          aria-label={ar ? "أقسام الهيرو" : "Hero categories"}
        >
          <button
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            <Layers3 size={16} />
            {ar ? "كل المساحات" : "All spaces"}
            <span>✳</span>
          </button>
          <button
            aria-pressed={category === "tools"}
            onClick={() => setCategory("tools")}
          >
            <Search size={15} />
            {ar ? "كل الأدوات" : "All tools"}
            <span>{totalToolCount}</span>
          </button>
          {toolCategories.map((c) => (
            <button
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              <c.icon size={15} />
              {ar ? c.titleAr : c.titleEn}
              <span>{c.tools.length}</span>
            </button>
          ))}
        </nav>
        <div className="hero-workspace-main">
          <label className="hero-hub-search">
            <Search size={19} />
            <input
              ref={search}
              aria-label={
                ar ? "ابحث في كل أدوات UniTool" : "Search all UniTool tools"
              }
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                ar
                  ? "فكرتك محتاجة إيه؟ ابحث عن أي أداة أو استوديو…"
                  : "What does your idea need? Find a tool or studio…"
              }
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="hero-workspace-caption">
            <span>
              {browsing
                ? ar
                  ? "نتائج مباشرة"
                  : "Direct results"
                : ar
                  ? "مساحة لكل فكرة"
                  : "A space for every idea"}
            </span>
            <small>
              {browsing
                ? `${tools.length + spaces.length + Number(elementsMatch)} ${ar ? "نتيجة" : "results"}`
                : "CHOOSE YOUR NEXT MOVE ↗"}
            </small>
          </div>
          <div className={`hero-space-grid ${browsing ? "show-tools" : ""}`}>
            {spaces.map((s) => (
              <a
                key={s.id}
                href={s.href}
                style={{ "--space-color": s.color } as React.CSSProperties}
              >
                <span className="hero-space-icon">
                  <s.icon size={22} />
                </span>
                <div>
                  <strong>{s.name[lang]}</strong>
                  <small>{s.eyebrow}</small>
                </div>
                <ArrowUpLeft size={16} />
              </a>
            ))}
            {elementsMatch && (
              <a href="/elements.html" className="hero-elements-space">
                <span className="hero-space-icon">
                  <Layers3 size={22} />
                </span>
                <div>
                  <strong>{ar ? "مكتبة العناصر" : "Elements library"}</strong>
                  <small>THE BUILDING BLOCKS</small>
                </div>
                <ArrowUpLeft size={16} />
              </a>
            )}
            {browsing &&
              tools.map((t) => (
                <a
                  className="hero-tool-result"
                  key={t.id}
                  href={`/app.html#${t.id}`}
                  onClick={() => remember(t.id)}
                >
                  <span className="hero-space-icon">
                    <t.icon size={19} />
                  </span>
                  <div>
                    <strong>{ar ? t.titleAr : t.titleEn}</strong>
                    <small>{ar ? t.descAr : t.descEn}</small>
                  </div>
                  <ArrowUpLeft size={15} />
                </a>
              ))}
          </div>
          {browsing && !tools.length && !spaces.length && !elementsMatch && (
            <div className="hero-no-results">
              {ar
                ? "مفيش نتائج. جرّب كلمة تانية أو اختار قسم مختلف."
                : "No results. Try a different term or category."}
            </div>
          )}
          {!browsing && (
            <div className="hero-quick-tools">
              <span>{ar ? "ابدأ بحاجة بسيطة" : "A quick place to start"}</span>
              {["pdfMerger", "imageCropper", "compress", "qrCode"].map((id) => {
                const t = allTools.find((t) => t.id === id)!;
                return (
                  <a
                    key={id}
                    href={`/app.html#${id}`}
                    onClick={() => remember(id)}
                  >
                    <t.icon size={13} />
                    {ar ? t.titleAr : t.titleEn}
                  </a>
                );
              })}
            </div>
          )}
          {recents.length > 0 && !browsing && (
            <div className="hero-recent">
              <span>
                <Clock3 size={12} />
                {ar ? "آخر أدوات فتحتها" : "Recently opened"}
              </span>
              {recents.map((id) => {
                const t = allTools.find((t) => t.id === id)!;
                return (
                  <a
                    key={id}
                    href={`/app.html#${id}`}
                    onClick={() => remember(id)}
                  >
                    {ar ? t.titleAr : t.titleEn}
                  </a>
                );
              })}
              <button
                onClick={() => {
                  setRecents([]);
                  try {
                    localStorage.removeItem("unitool-recent-tools");
                  } catch {}
                }}
              >
                {ar ? "مسح" : "Clear"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="hero-workspace-footer">
        <span>
          <i />
          {ar
            ? "كل الأدوات موجودة فعلًا — افتح وابدأ مباشرة"
            : "Real tools. Direct links. Ready when you are."}
        </span>
        <a href="/app.html">
          {ar ? "دليل الأدوات الكامل" : "Full tool directory"}
          <ArrowUpLeft size={12} />
        </a>
      </div>
    </div>
  );
}
