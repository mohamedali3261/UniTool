import { packagingProjects } from "./projectScope";
import { CardPhoto, CardPhotoProvider } from "./CardPhoto";
import { ProjectShelf } from "./ProjectShelf";
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
import {
  CARTON_PRESETS,
  ALL_BOX_PRESETS,
  BOX_FAMILIES,
  boxFamily,
  type PackagingFamily,
  type CartonPreset,
} from "./catalog";
import "./studio.css";
import "./daylight.css";
export function PackagingPage({
  onCreate,
  projects = [],
}: {
  onCreate: (p: ProjectItem) => void;
  projects?: ProjectItem[];
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar";
  const [family, setFamily] = useState<PackagingFamily>("all");
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
  const filtered = ALL_BOX_PRESETS.filter(
    (p) =>
      (family === "all" || boxFamily(p.size) === family) &&
      (category === "all" || p.category === category) &&
      `${p.ar} ${p.en}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <CardPhotoProvider>
      <section
        className="packaging-studio"
        data-testid="packaging-page"
        dir={ar ? "rtl" : "ltr"}
      >
        <header className="packaging-hero">
          <div>
            <span className="packaging-eyebrow">
              UNITOOL / PACKAGING STUDIO
            </span>
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
        <nav
          className="packaging-family-tabs"
          aria-label={ar ? "أقسام العلب" : "Box sections"}
        >
          {BOX_FAMILIES.map(([id, a, e]) => (
            <button
              type="button"
              key={id}
              aria-pressed={family === id}
              onClick={() => {
                setFamily(id);
                setCategory("all");
                setQuery("");
              }}
            >
              {ar ? a : e}
            </button>
          ))}
        </nav>
        <ProjectShelf
          key={family}
          projects={packagingProjects(projects, family)}
          onOpen={onCreate}
        />
        <h2 className="packaging-catalog-title">
          {ar ? "قوالب هذا القسم" : "Templates in this section"}{" "}
          <small>{filtered.length}</small>
        </h2>
        <div className="packaging-catalog-bar">
          <div
            className="packaging-filters"
            role="group"
            aria-label={ar ? "فئة القوالب" : "Template category"}
          >
            {(family === "all" || family === "carton"
              ? categories
              : categories.slice(0, 1)
            ).map(([id, a, e]) => (
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
              className={
                "packaging-template packaging-theme-" + p.artwork.style
              }
              key={p.id}
              data-carton-preset={p.id}
            >
              <button
                type="button"
                className="packaging-template-preview"
                aria-label={(ar ? "اختيار " : "Choose ") + (ar ? p.ar : p.en)}
                onClick={() => setSelected(p)}
              >
                <CardPhoto
                  source={{ key: p.id, size: p.size, artwork: p.artwork }}
                />
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
                setFamily("all");
              }}
            >
              {ar ? "عرض الكل" : "Show all"}
            </button>
          </div>
        )}
        <p className="packaging-footnote">
          {ar
            ? "قوالب قفل متعاكس وقوالب غطاء متصل بحدود قصّ وطيّ فعلية. المقاسات قابلة للتعديل؛ جرّب نموذجًا ورقيًا قبل الإنتاج."
            : "Reverse-tuck and hinged-lid dielines with editable physical sizes. Prototype before production."}
        </p>
        {(selected || custom) && (
          <PackagingDialog
            key={selected?.id || "custom"}
            initial={
              selected?.size ||
              (family !== "all" && family !== "carton"
                ? ALL_BOX_PRESETS.find((p) => boxFamily(p.size) === family)
                    ?.size
                : undefined)
            }
            initialArtwork={selected?.artwork}
            initialTitle={
              selected ? (ar ? selected.ar : selected.en) : undefined
            }
            onClose={() => {
              setSelected(null);
              setCustom(false);
            }}
            onCreate={onCreate}
          />
        )}
      </section>
    </CardPhotoProvider>
  );
}
