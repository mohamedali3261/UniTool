import React, { useEffect, useState } from "react";
import {
  ArrowUpLeft,
  Box,
  Check,
  FolderOpen,
  LayoutGrid,
  Ruler,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useDcLang } from "../hooks/useDcLang";
import type { ProjectItem } from "../types";
import { saveProjectToStorage } from "../utils/fabricHelpers";
import { packagingProjects } from "./projectScope";
import { CardPhoto, CardPhotoProvider } from "./CardPhoto";
import { ProjectShelf } from "./ProjectShelf";
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
import {
  cartonError,
  cartonGeometry,
  type CartonSize,
} from "./geometry";
import { createCartonProject } from "./project";
import {
  formatCartonDims,
  formatSheetDims,
  formatUnitNumber,
  mmToUnit,
  unitShortLabel,
  unitToMm,
  type PackagingUnit,
} from "./units";
import "./studio.css";
import "./daylight.css";

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export type PackagingSectionView = "all" | "templates" | "dimensions" | "saved";

export function PackagingPage({
  onCreate,
  onDuplicateProject,
  onDeleteProject,
  projects = [],
  sectionView = "all",
  onChangeSectionView,
}: {
  onCreate: (p: ProjectItem) => void;
  onDuplicateProject?: (p: ProjectItem, e: React.MouseEvent) => void;
  onDeleteProject?: (id: string, e: React.MouseEvent) => void;
  projects?: ProjectItem[];
  sectionView?: PackagingSectionView;
  onChangeSectionView?: (view: PackagingSectionView) => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar";
  const [localSection, setLocalSection] =
    useState<PackagingSectionView>(sectionView);

  useEffect(() => {
    setLocalSection(sectionView);
  }, [sectionView]);

  const activeSection = onChangeSectionView ? sectionView : localSection;
  const setSection = (next: PackagingSectionView) => {
    setLocalSection(next);
    onChangeSectionView?.(next);
  };

  const [family, setFamily] = useState<PackagingFamily>("all");
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [pageUnit, setPageUnit] = useState<PackagingUnit>("mm"),
    [selected, setSelected] = useState<CartonPreset | null>(null),
    [custom, setCustom] = useState(false),
    [customInitial, setCustomInitial] = useState<CartonSize | undefined>(
      undefined,
    ),
    [customUnit, setCustomUnit] = useState<PackagingUnit>("mm");

  // Quick Custom Box Builder state (defaults to 'cm' — السنتيمتر!)
  const [quickUnit, setQuickUnit] = useState<PackagingUnit>("cm");
  const [quickKind, setQuickKind] = useState<"reverse-tuck" | "hinged-lid">(
    "reverse-tuck",
  );
  const [quickDraft, setQuickDraft] = useState({
    height: "12",
    width: "8",
    depth: "4.5",
  });
  const [quickBusy, setQuickBusy] = useState(false);

  const switchQuickUnit = (next: PackagingUnit) => {
    if (next === quickUnit) return;
    setQuickDraft((prev) => {
      const conv = (raw: string) => {
        if (!raw || raw.trim() === "") return "";
        const n = Number(raw);
        if (!Number.isFinite(n)) return raw;
        return formatUnitNumber(unitToMm(n, quickUnit), next);
      };
      return {
        height: conv(prev.height),
        width: conv(prev.width),
        depth: conv(prev.depth),
      };
    });
    setQuickUnit(next);
  };

  const switchQuickKind = (nextKind: "reverse-tuck" | "hinged-lid") => {
    if (nextKind === quickKind) return;
    setQuickKind(nextKind);
    if (nextKind === "hinged-lid") {
      setQuickDraft({
        height: formatUnitNumber(60, quickUnit),
        width: formatUnitNumber(220, quickUnit),
        depth: formatUnitNumber(160, quickUnit),
      });
    } else {
      setQuickDraft({
        height: formatUnitNumber(120, quickUnit),
        width: formatUnitNumber(80, quickUnit),
        depth: formatUnitNumber(45, quickUnit),
      });
    }
  };

  const qHeightMm =
    quickDraft.height.trim() === ""
      ? NaN
      : unitToMm(Number(quickDraft.height), quickUnit);
  const qWidthMm =
    quickDraft.width.trim() === ""
      ? NaN
      : unitToMm(Number(quickDraft.width), quickUnit);
  const qDepthMm =
    quickDraft.depth.trim() === ""
      ? NaN
      : unitToMm(Number(quickDraft.depth), quickUnit);

  const quickSize: CartonSize =
    quickKind === "hinged-lid"
      ? {
          construction: "hinged-lid",
          family: "bakery",
          height: qHeightMm,
          width: qWidthMm,
          depth: qDepthMm,
          glue: Number.isFinite(qWidthMm)
            ? Math.round(clamp(15, 5, Math.min(30, qWidthMm * 0.4)) * 100) / 100
            : 15,
          tuck: Number.isFinite(qHeightMm)
            ? Math.round(clamp(18, 5, Math.min(30, qHeightMm * 0.7)) * 100) /
              100
            : 18,
        }
      : {
          height: qHeightMm,
          width: qWidthMm,
          depth: qDepthMm,
          glue: Number.isFinite(qWidthMm)
            ? Math.round(clamp(14, 5, Math.min(30, qWidthMm * 0.4)) * 100) / 100
            : 14,
          tuck:
            Number.isFinite(qWidthMm) && Number.isFinite(qDepthMm)
              ? Math.round(
                  clamp(15, 5, Math.min(30, qDepthMm * 0.6, qWidthMm * 0.25)) *
                    100,
                ) / 100
              : 15,
        };

  const quickIssue = cartonError(quickSize);
  const quickGeom = quickIssue ? null : cartonGeometry(quickSize);

  const handleQuickLaunch = async () => {
    if (quickIssue || quickBusy) return;
    setQuickBusy(true);
    try {
      const title = ar
        ? `علبة مخصصة (${formatUnitNumber(quickSize.height, "cm")}×${formatUnitNumber(quickSize.width, "cm")}×${formatUnitNumber(quickSize.depth, "cm")} سم)`
        : `Custom box (${formatUnitNumber(quickSize.height, "cm")}×${formatUnitNumber(quickSize.width, "cm")}×${formatUnitNumber(quickSize.depth, "cm")} cm)`;
      const proj = createCartonProject(quickSize, title);
      await saveProjectToStorage(proj);
      onCreate(proj);
    } finally {
      setQuickBusy(false);
    }
  };

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
  const scopedBoxProjects = packagingProjects(projects, family);
  const allBoxProjectsCount = packagingProjects(projects, "all").length;

  const showTemplates =
    activeSection === "all" || activeSection === "templates";
  const showDimensions =
    activeSection === "all" || activeSection === "dimensions";
  const showSaved = activeSection === "all" || activeSection === "saved";

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
                ? "قسم مستقل بالكامل لتصميم العلب: قوالب هندسية، مقاسات مخصصة بالـ سم والمم، ومحفوظات العلب منفصلة."
                : "Dedicated box design studio: physical dieline templates, custom cm & mm dimensions, and separate saved box projects."}
            </p>
            <div className="packaging-hero-cta-row">
              <button
                className="packaging-primary"
                type="button"
                onClick={() => {
                  setCustomInitial(undefined);
                  setCustomUnit(pageUnit);
                  setCustom(true);
                }}
              >
                <SlidersHorizontal size={16} />
                {ar ? "قوالب العلب والمقاسات" : "Carton templates & dimensions"}
                <ArrowUpLeft size={16} />
              </button>
              <button
                type="button"
                className="packaging-secondary-cta"
                onClick={() =>
                  document.getElementById("designer-project-input")?.click()
                }
              >
                <Upload size={15} />
                {ar ? "استيراد ملف علبة" : "Import box file"}
              </button>
            </div>
            <div className="packaging-benefits">
              <span>
                <Check size={13} />
                {ar ? "قوالب علب جاهزة (28)" : "28 box templates"}
              </span>
              <span>
                <Check size={13} />
                {ar ? "مقاسات بالـ سم والمم" : "cm & mm live dimensions"}
              </span>
              <span>
                <Check size={13} />
                {ar ? "محفوظات العلب منفصلة" : "Separate saved boxes"}
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

        {/* Dedicated Section Filter Bar inside Box Design Studio */}
        <div
          className="dc-section-pills"
          data-testid="packaging-section-pills"
          role="group"
          aria-label={ar ? "أقسام تصميم العلب" : "Box studio sections"}
        >
          <button
            type="button"
            aria-pressed={activeSection === "all"}
            data-testid="pkg-pill-all"
            onClick={() => setSection("all")}
          >
            <LayoutGrid size={14} />
            <span>{ar ? "كل أقسام العلب" : "All Box Sections"}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeSection === "templates"}
            data-testid="pkg-pill-templates"
            onClick={() => setSection("templates")}
          >
            <Box size={14} />
            <span>
              {ar
                ? `قوالب العلب (${ALL_BOX_PRESETS.length})`
                : `Templates (${ALL_BOX_PRESETS.length})`}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={activeSection === "dimensions"}
            data-testid="pkg-pill-dimensions"
            onClick={() => setSection("dimensions")}
          >
            <Ruler size={14} />
            <span>
              {ar ? "المقاسات والإنشاء (سم / مم)" : "Dimensions (cm / mm)"}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={activeSection === "saved"}
            data-testid="pkg-pill-saved"
            onClick={() => setSection("saved")}
          >
            <FolderOpen size={14} />
            <span>
              {ar
                ? `المحفوظات (${allBoxProjectsCount})`
                : `Saved Boxes (${allBoxProjectsCount})`}
            </span>
          </button>
        </div>

        {/* SECTION 1: Custom Dimensions & Box Setup (سم / مم) */}
        {showDimensions && (
          <section
            className="packaging-quick-workbench"
            data-testid="packaging-quick-builder"
            aria-label={
              ar ? "قسم مقاسات العلب والإنشاء" : "Box dimensions & builder"
            }
          >
            <div className="packaging-quick-workbench__head">
              <div className="packaging-quick-workbench__title">
                <Ruler size={17} />
                <div>
                  <h2>
                    {ar
                      ? "قسم المقاسات المخصصة للعلب (بالـ سم أو المم)"
                      : "Custom Box Dimensions & Setup (cm / mm)"}
                  </h2>
                  <p>
                    {ar
                      ? "اكتب طول وعرض وعمق العلبة بالسنتيمتر أو الملليمتر، واختر هيكل القفل لفتح خطوط القص والطي مباشرة."
                      : "Enter length, width, and depth in cm or mm and launch your dieline immediately."}
                  </p>
                </div>
              </div>
              <div className="packaging-quick-workbench__toggles">
                <div
                  className="carton-unit-switch"
                  role="group"
                  aria-label={ar ? "نوع هيكل العلبة" : "Box construction"}
                >
                  <button
                    type="button"
                    aria-pressed={quickKind === "reverse-tuck"}
                    onClick={() => switchQuickKind("reverse-tuck")}
                  >
                    {ar ? "علبة قفل متعاكس" : "Reverse-tuck"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={quickKind === "hinged-lid"}
                    onClick={() => switchQuickKind("hinged-lid")}
                  >
                    {ar ? "علبة غطاء متصل" : "Hinged-lid"}
                  </button>
                </div>

                <div
                  className="carton-unit-switch"
                  role="group"
                  data-testid="quick-builder-unit-toggle"
                  aria-label={ar ? "وحدة المقاس السريع" : "Quick builder unit"}
                >
                  {(["cm", "mm"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={quickUnit === u}
                      onClick={() => switchQuickUnit(u)}
                    >
                      {u === "cm"
                        ? ar
                          ? "سم · cm"
                          : "cm"
                        : ar
                          ? "مم · mm"
                          : "mm"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="packaging-quick-workbench__body">
              <div className="packaging-quick-fields">
                {(quickKind === "hinged-lid"
                  ? ([
                      ["height", ar ? "ارتفاع الجدار" : "Wall height", 20, 150],
                      ["width", ar ? "عرض العلبة" : "Box width", 100, 650],
                      ["depth", ar ? "طول القاعدة" : "Base length", 100, 650],
                    ] as const)
                  : ([
                      ["height", ar ? "طول العلبة" : "Box length", 30, 500],
                      ["width", ar ? "عرض العلبة" : "Box width", 20, 300],
                      ["depth", ar ? "عمق العلبة" : "Box depth", 10, 150],
                    ] as const)
                ).map(([k, label, minMm, maxMm]) => (
                  <label key={k}>
                    <span>
                      {label} ({unitShortLabel(quickUnit, ar)})
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min={mmToUnit(minMm, quickUnit)}
                      max={mmToUnit(maxMm, quickUnit)}
                      data-testid={`quick-box-${k}`}
                      aria-label={`${label} (${unitShortLabel(quickUnit, ar)})`}
                      value={quickDraft[k]}
                      onChange={(e) =>
                        setQuickDraft((prev) => ({
                          ...prev,
                          [k]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="packaging-quick-actions">
                {quickGeom ? (
                  <div className="packaging-quick-readout" dir="ltr">
                    <small>{ar ? "المفرود الكلي:" : "Unfolded sheet:"}</small>
                    <strong>
                      {formatSheetDims(
                        quickGeom.width,
                        quickGeom.height,
                        "cm",
                        ar,
                      )}
                    </strong>
                    <span>
                      ({quickGeom.width} × {quickGeom.height} mm)
                    </span>
                  </div>
                ) : (
                  <div className="packaging-quick-readout is-invalid">
                    <small>
                      {ar
                        ? "تحقق من حدود المقاس المسموحة"
                        : "Check allowed size range"}
                    </small>
                  </div>
                )}

                <div className="packaging-quick-btns">
                  <button
                    type="button"
                    className="packaging-secondary-cta"
                    disabled={!!quickIssue}
                    onClick={() => {
                      if (quickIssue) return;
                      setCustomInitial(quickSize);
                      setCustomUnit(quickUnit);
                      setCustom(true);
                    }}
                  >
                    <SlidersHorizontal size={15} />
                    {ar ? "ضبط الألسنة والزجاجة" : "Flaps & bottle fit"}
                  </button>
                  <button
                    type="button"
                    data-testid="quick-box-launch"
                    className="packaging-quick-launch-btn"
                    disabled={!!quickIssue || quickBusy}
                    onClick={handleQuickLaunch}
                  >
                    <Box size={15} />
                    {ar ? "بدء تصميم العلبة فوراً" : "Open box in editor"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Family Filter Bar (shared across Templates & Saved Box Projects) */}
        {(showTemplates || showSaved) && (
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
        )}

        {/* SECTION 2: Ready Box Templates (28 Engineered Dielines) */}
        {showTemplates && (
          <>
            <div className="packaging-catalog-head-row">
              <h2 className="packaging-catalog-title">
                {ar ? "قوالب العلب الجاهزة" : "Ready Box Templates"}{" "}
                <small>{filtered.length}</small>
              </h2>
              <div
                className="carton-unit-switch"
                role="group"
                data-testid="packaging-page-unit-toggle"
                aria-label={ar ? "وحدة عرض القوالب" : "Catalog display unit"}
              >
                {(["mm", "cm"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={pageUnit === u}
                    data-testid={`catalog-unit-${u}`}
                    onClick={() => setPageUnit(u)}
                  >
                    {u === "cm"
                      ? ar
                        ? "عرض بالـ سم"
                        : "Show in cm"
                      : ar
                        ? "عرض بالـ مم"
                        : "Show in mm"}
                  </button>
                ))}
              </div>
            </div>

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
                  aria-label={
                    ar ? "بحث في قوالب العلب" : "Search carton templates"
                  }
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
                    aria-label={
                      (ar ? "اختيار " : "Choose ") + (ar ? p.ar : p.en)
                    }
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
                          {formatCartonDims(p.size, pageUnit, ar)}
                        </bdi>
                        {pageUnit === "mm" && (
                          <small className="packaging-cm-sub" dir="ltr">
                            ({formatCartonDims(p.size, "cm", ar)})
                          </small>
                        )}
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
                  type="button"
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
          </>
        )}

        {/* SECTION 3: Saved Box Projects (المحفوظات الخاصة بالعلب فقط) */}
        {showSaved && (
          <ProjectShelf
            key={family}
            unit="cm"
            projects={scopedBoxProjects}
            onOpen={onCreate}
            onDuplicate={onDuplicateProject}
            onDelete={onDeleteProject}
          />
        )}

        <p className="packaging-footnote">
          {ar
            ? "قوالب قفل متعاكس وقوالب غطاء متصل بحدود قصّ وطيّ فعلية قابلة للتعديل بالـ سم أو المم. جرّب نموذجًا ورقيًا قبل الإنتاج."
            : "Reverse-tuck and hinged-lid dielines with editable cm & mm physical sizes. Prototype before production."}
        </p>

        {(selected || custom) && (
          <PackagingDialog
            key={selected?.id || (customInitial ? "quick-custom" : "custom")}
            initial={
              selected?.size ||
              customInitial ||
              (family !== "all" && family !== "carton"
                ? ALL_BOX_PRESETS.find((p) => boxFamily(p.size) === family)
                    ?.size
                : undefined)
            }
            initialUnit={selected ? pageUnit : customUnit}
            initialArtwork={selected?.artwork}
            initialTitle={
              selected ? (ar ? selected.ar : selected.en) : undefined
            }
            onClose={() => {
              setSelected(null);
              setCustom(false);
              setCustomInitial(undefined);
            }}
            onCreate={onCreate}
          />
        )}
      </section>
    </CardPhotoProvider>
  );
}
