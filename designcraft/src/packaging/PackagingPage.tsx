import { useState } from "react";
import {
  ArrowUpLeft,
  Box,
  Check,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useDcLang } from "../hooks/useDcLang";
import type { ProjectItem } from "../types";
import { PackagingDialog } from "./PackagingDialog";
import { BoxPreview } from "./BoxPreview";
import { CARTON_PRESETS, type CartonPreset } from "./catalog";
import "./studio.css";
export function PackagingPage({
  onCreate,
}: {
  onCreate: (p: ProjectItem) => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar";
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [selected, setSelected] = useState<CartonPreset | null>(null),
    [custom, setCustom] = useState(false);
  const categories = [
    ["all", "كل القوالب", "All templates"],
    ["compact", "مدمج ومكعب", "Compact & cube"],
    ["tall", "طويل", "Tall"],
    ["wide", "عريض ومسطح", "Wide & flat"],
  ];
  const filtered = CARTON_PRESETS.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.ar} ${p.en}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section
      className="packaging-studio"
      data-testid="packaging-page"
      dir={ar ? "rtl" : "ltr"}
    >
      <header className="packaging-hero">
        <div>
          <span className="packaging-eyebrow">UNITOOL / PACKAGING STUDIO</span>
          <h1>{ar ? "علبتك. بتفاصيلك." : "Your box. Your signature."}</h1>
          <p>
            {ar
              ? "اختَر القالب، اضبط المقاس، وصمّم بحرية."
              : "Choose a template, set the size, make it yours."}
          </p>
          <button
            className="packaging-primary"
            type="button"
            onClick={() => setCustom(true)}
          >
            <SlidersHorizontal size={16} />
            {ar ? "قوالب العلب والمقاسات" : "Carton templates & dimensions"}
            <ArrowUpLeft size={16} />
          </button>
          <div className="packaging-benefits">
            <span>
              <Check size={13} />
              {ar ? "عناصر قابلة للتعديل" : "Editable artwork"}
            </span>
            <span>
              <Check size={13} />
              {ar ? "معاينة 360°" : "360° preview"}
            </span>
            <span>
              <Check size={13} />
              {ar ? "مقاسات بالملليمتر" : "Millimetre dimensions"}
            </span>
          </div>
        </div>
        <div className="packaging-hero-art" aria-hidden="true">
          <BoxPreview
            size={CARTON_PRESETS[3].size}
            artwork={CARTON_PRESETS[3].artwork}
          />
          <BoxPreview
            size={CARTON_PRESETS[0].size}
            artwork={CARTON_PRESETS[0].artwork}
          />
        </div>
      </header>
      <div className="packaging-catalog-bar">
        <div
          className="packaging-filters"
          role="group"
          aria-label={ar ? "فئة القوالب" : "Template category"}
        >
          {categories.map(([id, a, e]) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {ar ? a : e}
            </button>
          ))}
        </div>
        <label className="packaging-search">
          <Search size={16} />
          <input
            type="search"
            aria-label={ar ? "بحث في قوالب العلب" : "Search carton templates"}
            placeholder={ar ? "ابحث عن علبة…" : "Find a carton…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="packaging-catalog-grid">
        {filtered.map((p) => (
          <article
            className={"packaging-template packaging-theme-" + p.artwork.style}
            key={p.id}
            data-carton-preset={p.id}
          >
            <button
              type="button"
              className="packaging-template-preview"
              aria-label={(ar ? "اختيار " : "Choose ") + (ar ? p.ar : p.en)}
              onClick={() => setSelected(p)}
            >
              <BoxPreview size={p.size} artwork={p.artwork} />
              <span>
                {ar ? "تخصيص القالب" : "Customize template"}{" "}
                <ArrowUpLeft size={14} />
              </span>
            </button>
            <div className="packaging-template-meta">
              <div>
                <h2>{ar ? p.ar : p.en}</h2>
                <p>
                  <bdi dir="ltr">
                    {p.size.height} × {p.size.width} × {p.size.depth} mm
                  </bdi>
                </p>
              </div>
              <Box size={17} />
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="packaging-empty">
          {ar ? "لا توجد قوالب مطابقة." : "No matching templates."}
          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {ar ? "عرض الكل" : "Show all"}
          </button>
        </div>
      )}
      <p className="packaging-footnote">
        {ar
          ? "جميع القوالب بتركيب قفل متعاكس؛ تختلف النِسَب والمقاسات. راجع نموذجًا ورقيًا قبل الإنتاج."
          : "All templates use reverse-tuck construction in different proportions and sizes. Prototype before production."}
      </p>
      {(selected || custom) && (
        <PackagingDialog
          key={selected?.id || "custom"}
          initial={selected?.size}
          initialArtwork={selected?.artwork}
          initialTitle={selected ? (ar ? selected.ar : selected.en) : undefined}
          onClose={() => {
            setSelected(null);
            setCustom(false);
          }}
          onCreate={onCreate}
        />
      )}
    </section>
  );
}
