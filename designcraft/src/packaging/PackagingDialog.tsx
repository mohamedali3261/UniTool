import { useEffect, useRef, useState } from "react";
import { Box, Download, X } from "lucide-react";
import { useDcLang } from "../hooks/useDcLang";
import {
  cartonError,
  cartonGeometry,
  cartonSvg,
  DEFAULT_CARTON,
  paperFor,
  type CartonSize,
} from "./geometry";
import {
  formatSheetDims,
  formatUnitNumber,
  mmToUnit,
  unitAriaSuffix,
  unitShortLabel,
  unitToMm,
  type PackagingUnit,
} from "./units";
import { cartonPdf, downloadCartonSvg, downloadPackaging } from "./export";
import { createCartonProject } from "./project";
import { saveProjectToStorage } from "../utils/fabricHelpers";
import type { ProjectItem } from "../types";
import { PerfumeTemplates } from "./PerfumeTemplates";
import { ArtworkControls } from "./ArtworkControls";
import {
  DEFAULT_ARTWORK,
  ART_STYLES,
  artworkPreview,
  cartonArtwork,
  type ArtworkOptions,
} from "./artwork";
import { BoxPreview } from "./BoxPreview";
import "./packaging.css";

const standardFields = [
  ["height", "طول العلبة", "Box length", 30, 500],
  ["width", "عرض العلبة", "Box width", 20, 300],
  ["depth", "عمق العلبة", "Box depth", 10, 150],
  ["glue", "لسان اللصق", "Glue tab", 5, 30],
  ["tuck", "لسان القفل", "Tuck tab", 5, 30],
] as const;

export function PackagingDialog({
  onClose,
  onCreate,
  initial = DEFAULT_CARTON,
  initialArtwork,
  initialTitle,
  initialUnit = "mm",
}: {
  onClose: () => void;
  onCreate: (p: ProjectItem) => void;
  initial?: CartonSize;
  initialArtwork?: ArtworkOptions;
  initialTitle?: string;
  initialUnit?: PackagingUnit;
}) {
  const hinged = initial.construction === "hinged-lid";
  const fields: ReadonlyArray<
    readonly [
      "height" | "width" | "depth" | "glue" | "tuck",
      string,
      string,
      number,
      number,
    ]
  > = hinged
    ? ([
        ["height", "ارتفاع العلبة", "Box height", 20, 150],
        ["width", "عرض العلبة", "Box width", 100, 650],
        ["depth", "طول القاعدة", "Base length", 100, 650],
        ["glue", "احتياطي الوصلة", "Allowance", 5, 30],
        ["tuck", "لسان الغطاء", "Lid flap", 5, 30],
      ] as const)
    : standardFields;

  const { lang } = useDcLang(),
    ar = lang === "ar",
    ref = useRef<HTMLDialogElement>(null),
    [unit, setUnit] = useState<PackagingUnit>(initialUnit),
    [title, setTitle] = useState(
      initialTitle || (ar ? "قالب علبة جديد" : "New carton template"),
    ),
    [draft, setDraft] = useState(
      () =>
        Object.fromEntries(
          fields.map(([k]) => [k, formatUnitNumber(initial[k], initialUnit)]),
        ) as Record<keyof CartonSize, string>,
    ),
    [artwork, setArtwork] = useState<ArtworkOptions>({
      ...(initialArtwork ||
        (hinged
          ? {
              ...DEFAULT_ARTWORK,
              descriptor: "YOUR DESIGN",
              quantity: "MADE WITH CARE",
              brand: "YOUR BRAND",
              product:
                initial.family === "pizza"
                  ? "WOOD FIRED PIZZA"
                  : "YOUR PRODUCT",
              stock: "kraft" as const,
            }
          : DEFAULT_ARTWORK)),
    }),
    [resetKey, setResetKey] = useState(0),
    [safeArea, setSafeArea] = useState(false),
    [previewMode, setPreviewMode] = useState<"art" | "cut">("art"),
    [dimensions, setDimensions] = useState(true),
    [exportDimensions, setExportDimensions] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  const switchUnit = (nextUnit: PackagingUnit) => {
    if (nextUnit === unit) return;
    setDraft((prev) =>
      Object.fromEntries(
        fields.map(([k]) => {
          const raw = prev[k];
          if (!raw || raw.trim() === "") return [k, ""];
          const n = Number(raw);
          if (!Number.isFinite(n)) return [k, raw];
          return [k, formatUnitNumber(unitToMm(n, unit), nextUnit)];
        }),
      ) as Record<keyof CartonSize, string>,
    );
    setUnit(nextUnit);
  };

  const size = {
      ...Object.fromEntries(
        fields.map(([k]) => [
          k,
          draft[k]?.trim() === "" ? NaN : unitToMm(Number(draft[k]), unit),
        ]),
      ),
      ...(hinged
        ? { construction: initial.construction, family: initial.family }
        : {}),
    } as unknown as CartonSize,
    issue = cartonError(size),
    g = issue ? null : cartonGeometry(size);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const messages: Record<string, string> = {
    finite: ar
      ? "أدخل أرقامًا صالحة في كل المقاسات."
      : "Enter finite numbers in every field.",
    dimensions: hinged
      ? unit === "cm"
        ? ar
          ? "ارتفاع الجدار 2–15 سم، والعرض وطول القاعدة 10–65 سم."
          : "Wall height 2–15 cm; base width and length 10–65 cm."
        : ar
          ? "ارتفاع الجدار 20–150 مم، والعرض وطول القاعدة 100–650 مم."
          : "Wall height 20–150 mm; base width and length 100–650 mm."
      : unit === "cm"
        ? ar
          ? "الطول 3–50 سم، العرض 2–30 سم، والعمق 1–15 سم."
          : "Length 3–50 cm, width 2–30 cm, depth 1–15 cm."
        : ar
          ? "الطول 30–500، العرض 20–300، والعمق 10–150 مم."
          : "Length 30–500, width 20–300, depth 10–150 mm.",
    glue:
      unit === "cm"
        ? ar
          ? "لسان اللصق: 0.5–3 سم، بحد أقصى 40% من العرض."
          : "Glue: 0.5–3 cm; at most 40% of width."
        : ar
          ? "لسان اللصق: 5–30 مم، بحد أقصى 40% من العرض."
          : "Glue: 5–30 mm; at most 40% of width.",
    tuck: hinged
      ? unit === "cm"
        ? ar
          ? "لسان الغطاء: 0.5–3 سم، وبحد أقصى 70% من ارتفاع الجدار."
          : "Lid flap: 0.5–3 cm and at most 70% of wall height."
        : ar
          ? "لسان الغطاء: 5–30 مم، وبحد أقصى 70% من ارتفاع الجدار."
          : "Lid flap: 5–30 mm and at most 70% of wall height."
      : unit === "cm"
        ? ar
          ? "لسان القفل: 0.5–3 سم، بحد أقصى 60% من العمق و25% من العرض."
          : "Tuck: 0.5–3 cm; at most 60% of depth and 25% of width."
        : ar
          ? "لسان القفل: 5–30 مم، بحد أقصى 60% من العمق و25% من العرض."
          : "Tuck: 5–30 mm; at most 60% of depth and 25% of width.",
  };

  const create = async () => {
    if (issue || busy) return;
    setBusy(true);
    setError("");
    try {
      const p = createCartonProject(size, title);
      p.canvasData.objects = [
        ...cartonArtwork(size, artwork),
        ...p.canvasData.objects,
      ];
      if (!(await saveProjectToStorage(p))) throw Error("Storage");
      onCreate(p);
    } catch {
      setError(
        ar
          ? "تعذر إنشاء القالب أو حفظه. تحقق من مساحة التخزين."
          : "Could not create/save the template. Check storage.",
      );
    } finally {
      setBusy(false);
    }
  };

  const unitBadge = unit === "cm" ? (ar ? "سم" : "cm") : "mm";
  const otherUnit: PackagingUnit = unit === "cm" ? "mm" : "cm";

  return (
    <dialog
      ref={ref}
      className="carton-dialog"
      aria-labelledby="carton-title"
      dir={ar ? "rtl" : "ltr"}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <small>UNITOOL / PACKAGING ATELIER</small>
          <h2 id="carton-title">
            <Box />
            {ar ? "مقاسات وقالب العلبة" : "Carton dimensions & dieline"}
          </h2>
          <p className="carton-header-caption">
            {ar
              ? "من المقاس بالـ سم أو المم إلى الهوية… علبة بتفاصيلك."
              : "From precise cm / mm dimensions to a signature design."}
          </p>
        </div>
        <button
          type="button"
          aria-label={ar ? "إغلاق قالب العلبة" : "Close carton template"}
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      <nav
        className="carton-jumpbar"
        aria-label={ar ? "أقسام إعداد العلبة" : "Carton setup sections"}
      >
        {(
          [
            [".carton-settings", "المقاسات", "Dimensions"],
            [".carton-art-controls", "هوية التصميم", "Brand identity"],
            [".carton-preview-column", "المعاينة", "Preview"],
          ] as const
        ).map(([selector, arabic, en]) => (
          <button
            type="button"
            key={selector}
            onClick={() => {
              const section = ref.current?.querySelector<HTMLElement>(selector);
              section?.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              });
              section?.focus({ preventScroll: true });
            }}
          >
            {ar ? arabic : en}
          </button>
        ))}
      </nav>
      <div className="carton-body">
        <div className="carton-settings" tabIndex={-1}>
          <div className="carton-section-head-row">
            <div className="carton-section-title">
              <span>01</span>
              <div>
                <h3>{ar ? "ابدأ بالعلبة المناسبة" : "Find your perfect fit"}</h3>
                <p>
                  {ar
                    ? "قالب جاهز أو مقاساتك بالـ سم أو المم"
                    : "A starter template or your own cm / mm dimensions"}
                </p>
              </div>
            </div>
            <div
              className="carton-unit-switch"
              role="group"
              data-testid="packaging-dialog-unit-toggle"
              aria-label={ar ? "وحدة قياس العلبة" : "Carton measurement unit"}
            >
              {(["mm", "cm"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  data-testid={`dialog-unit-${u}`}
                  onClick={() => switchUnit(u)}
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

          <label>
            {ar ? "اسم التصميم" : "Design name"}
            <input
              aria-label={ar ? "اسم قالب العلبة" : "Carton design name"}
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <p className="carton-note">
            {ar
              ? `طول × عرض × عمق — مقاسات العلبة بعد التجميع (${unit === "cm" ? "بالسنتيمتر سم" : "بالملليمتر مم"})، وليست مقاسات الورقة المفرودة.`
              : `Length × width × depth — assembled box dimensions (${unit === "cm" ? "centimetres cm" : "millimetres mm"}), not the unfolded sheet size.`}
          </p>
          {!hinged && artwork.descriptor === undefined && (
            <PerfumeTemplates
              key={resetKey}
              ar={ar}
              size={size}
              unit={unit}
              onApply={(next, name, ml) => {
                if (ml) {
                  const style =
                    ml === 30 ? "rose" : ml === 50 ? "emerald" : "noir";
                  setArtwork({
                    ...artwork,
                    ml,
                    descriptor: undefined,
                    quantity: undefined,
                    sideLabel: undefined,
                    style,
                    accent: ART_STYLES[style].accent,
                    product: ART_STYLES[style].product,
                  });
                }
                setDraft(
                  Object.fromEntries(
                    fields.map(([key]) => [
                      key,
                      formatUnitNumber(next[key], unit),
                    ]),
                  ) as Record<keyof CartonSize, string>,
                );
                if (name) setTitle(name);
                setError("");
              }}
            />
          )}
          <div className="carton-fields">
            {fields.slice(0, 3).map(([k, arabic, en, min, max]) => {
              const currentMm = size[k];
              return (
                <label key={k}>
                  <span>
                    {ar ? arabic : en} · {unitBadge}
                  </span>
                  <input
                    aria-label={(ar ? arabic : en) + unitAriaSuffix(unit, ar)}
                    type="number"
                    step="0.01"
                    min={mmToUnit(min, unit)}
                    max={mmToUnit(max, unit)}
                    value={draft[k]}
                    onChange={(e) =>
                      setDraft({ ...draft, [k]: e.target.value })
                    }
                  />
                  {Number.isFinite(currentMm) && currentMm > 0 && (
                    <small className="carton-unit-equiv" dir="ltr">
                      = {formatUnitNumber(currentMm, otherUnit)}{" "}
                      {unitShortLabel(otherUnit, ar)}
                    </small>
                  )}
                </label>
              );
            })}
          </div>
          <details>
            <summary>
              {ar ? "إعدادات الألسنة المتقدمة" : "Advanced tab settings"}
            </summary>
            <div className="carton-fields">
              {fields.slice(hinged ? 4 : 3).map(([k, arabic, en, min, max]) => (
                <label key={k}>
                  {ar ? arabic : en} · {unitBadge}
                  <input
                    aria-label={(ar ? arabic : en) + unitAriaSuffix(unit, ar)}
                    type="number"
                    step="0.01"
                    min={mmToUnit(min, unit)}
                    max={mmToUnit(max, unit)}
                    value={draft[k]}
                    onChange={(e) =>
                      setDraft({ ...draft, [k]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
          </details>
          <details>
            <summary>
              {ar
                ? "مراجعة المقاسات وطريقة التجميع"
                : "Dimension review & assembly checklist"}
            </summary>
            {!issue && (
              <p dir="ltr">
                {hinged ? "H" : "L"} {formatUnitNumber(size.height, "cm")} cm (
                {size.height} mm) · W {formatUnitNumber(size.width, "cm")} cm (
                {size.width} mm) · {hinged ? "L" : "D"}{" "}
                {formatUnitNumber(size.depth, "cm")} cm ({size.depth} mm)
                <br />
                {ar ? "وجهان / Faces" : "Faces"}: 2 × (
                {formatUnitNumber(size.width, unit)} ×{" "}
                {formatUnitNumber(size.height, unit)}) {unit}
                <br />
                {ar ? "جانبان / Sides" : "Sides"}: 2 × (
                {formatUnitNumber(size.depth, unit)} ×{" "}
                {formatUnitNumber(size.height, unit)}) {unit}
              </p>
            )}
            <ol>
              <li>
                {ar
                  ? "اطبع بالحجم الفعلي 100% وقِس وجهًا بالمسطرة قبل القص. لا تستخدم ملاءمة الصفحة."
                  : "Print at actual size / 100% and measure a face with a ruler before cutting; do not fit to page."}
              </li>
              <li>
                {ar
                  ? "قص على الخط المتصل فقط، ثم خدّد خطوط الطي المتقطعة دون قطعها."
                  : "Cut only solid lines; score dashed fold lines without cutting through."}
              </li>
              <li>
                {hinged
                  ? ar
                    ? "ارفع الجدران الأربعة واطوِ أجنحة الزوايا للداخل؛ ثبّتها حسب الورق المستخدم."
                    : "Raise the four walls; fold corner wings inward and secure them to suit your board."
                  : ar
                    ? "اطوِ الأوجه الأربعة وألصق لسان اللصق داخل الحافة المقابلة. لا تلصق ألسنة القفل."
                    : "Fold the four panels; glue the seam tab inside the opposite edge. Do not glue tuck tabs."}
              </li>
              <li>
                {hinged
                  ? ar
                    ? "اطوِ الغطاء فوق القاعدة وأدخل ألسنته للداخل برفق. هذا نموذج غطاء متصل، وليس قفل شحن معتمدًا."
                    : "Close the hinged lid and gently tuck its flaps inside. This is not a certified locking shipping construction."
                  : ar
                    ? "اطوِ الألسنة الجانبية الصغيرة أولًا، ثم الغطاء الكبير وأدخل لسان القفل. جرّب الإغلاق دون إجبار."
                    : "Fold small dust flaps first, then the main cover and insert its tuck tab. Test closure without force."}
              </li>
              <li>
                {ar
                  ? "جرّب الزجاجة بالغطاء والبطانة، وراجع الخلوص والإغلاق والقاعدة. هذا قفل لساني وليس قاعدة أمان معتمدة لوزن الزجاج؛ قد تحتاج حاملًا أو قاعدة مقوّاة يراجعها مصنع التغليف."
                  : "Test the capped bottle and insert, clearance, closure and base. This is a tuck closure, not a certified load-bearing glass-bottle base; an insert or reinforced base may be required by your packaging manufacturer."}
              </li>
            </ol>
            <p className="carton-note">
              {ar
                ? "الهندسة اسمية بين خطوط الطي. سمك الورق والتخديد واللصق يغيّر الفراغ الداخلي؛ لا يمكن تأكيد الملاءمة من السعة بالملليلتر أو المعاينة وحدها. اعتمد نموذجًا ورقيًا ثم عينة بنفس خامة الإنتاج."
                : "Dimensions are nominal between fold lines. Board thickness, scoring and gluing affect internal space. Capacity or a preview cannot certify fit: validate a paper prototype, then a sample in production stock."}
            </p>
          </details>
          <ArtworkControls ar={ar} value={artwork} onChange={setArtwork} />
          {issue && (
            <p role="alert" className="carton-error">
              {messages[issue]}
            </p>
          )}
          <label className="carton-check">
            <input
              type="checkbox"
              checked={dimensions}
              onChange={(e) => setDimensions(e.target.checked)}
            />
            {ar ? "إظهار المقاسات في المعاينة" : "Show preview dimensions"}
          </label>
          <div className="carton-legend">
            <span>
              <i />
              {ar ? "قصّ" : "Cut"}
            </span>
            <span>
              <i className="fold" />
              {ar ? "طيّ / تخديد" : "Fold / crease"}
            </span>
          </div>
          <p className="carton-note">
            {ar
              ? "مقاسات اسمية دون تعويض سمك الورق أو سماحات الماكينة. اطبع نموذجًا بنسبة 100% وراجعه مع المطبعة قبل الإنتاج."
              : "Nominal geometry, without material-caliper or machine allowances. Print a 100% prototype and confirm with your printer before production."}
          </p>
        </div>
        <div className="carton-preview-column" tabIndex={-1}>
          <div className="carton-preview-toolbar">
            <div>
              <small>LIVE PREVIEW</small>
              <h3>{ar ? "شاهد فكرتك تتشكّل" : "Watch your idea unfold"}</h3>
            </div>
            <div className="carton-view-toggle">
              {(["art", "cut"] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  aria-pressed={previewMode === mode}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode === "art"
                    ? ar
                      ? "التصميم"
                      : "Artwork"
                    : ar
                      ? "القص والطي"
                      : "Dieline"}
                </button>
              ))}
            </div>
          </div>
          <div
            className="carton-preview"
            aria-label={ar ? "معاينة قالب القص والطي" : "Cut and fold preview"}
          >
            {g ? (
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    previewMode === "cut"
                      ? cartonSvg(size, dimensions)
                      : artworkPreview(size, artwork, dimensions, safeArea),
                }}
              />
            ) : (
              <p>
                {ar
                  ? "صحّح المقاسات لعرض القالب."
                  : "Correct dimensions to preview."}
              </p>
            )}
          </div>
          <label className="carton-check">
            <input
              type="checkbox"
              checked={safeArea}
              onChange={(e) => setSafeArea(e.target.checked)}
            />
            {ar
              ? "منطقة أمان إرشادية 3 مم (معاينة التصميم فقط)"
              : "Suggested 3 mm safe area (artwork preview only)"}
          </label>
          <p className="carton-new-note">
            {ar
              ? "أبقِ النصوص المهمة داخل المنطقة الإرشادية. ليست سماحات نزف أو تعويضًا لمتطلبات المطبعة."
              : "Keep important text inside the suggested area. This is not bleed or a substitute for printer specifications."}
          </p>
          {g && (
            <div className="carton-preview-bottom">
              <div>
                <strong dir="ltr" data-testid="carton-sheet-size">
                  {g.width} × {g.height} mm
                </strong>
                <small dir="ltr" className="carton-sheet-cm">
                  {formatSheetDims(g.width, g.height, "cm", ar)}
                </small>
                <span>
                  {ar
                    ? "المفرود كاملًا، مع هامش خارجي 10 مم (1 سم)"
                    : "Full sheet, including 10 mm (1 cm) outer margins"}
                </span>
                <small>
                  {paperFor(g) === "custom"
                    ? ar
                      ? "ورق بمقاس مخصص"
                      : "Custom paper"
                    : `${ar ? "يتسع على" : "Fits on"} ${paperFor(g)}`}
                </small>
              </div>
              <figure>
                <BoxPreview size={size} artwork={artwork} />
                <figcaption>
                  {ar
                    ? "تصوّر نسبي — ليس محاكاة تجميع"
                    : "Proportional view — not assembly simulation"}
                </figcaption>
              </figure>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="carton-error">
          {error}
        </p>
      )}
      <footer>
        <label className="carton-check">
          <input
            type="checkbox"
            checked={exportDimensions}
            onChange={(e) => setExportDimensions(e.target.checked)}
          />
          {ar ? "المقاسات في SVG أيضًا" : "Include dimensions in SVG"}
        </label>
        <small>
          {ar
            ? "تنزيل SVG وPDF هنا لخطوط القص والطي فقط. لتصدير التصميم الكامل، افتحه في المصمم ثم اختر «تصدير للطباعة». اطبع بنسبة 100%."
            : "SVG/PDF here contain dielines only. For complete artwork, open in the editor and choose Print export. Print at 100%."}
        </small>
        <div className="carton-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDraft(
                Object.fromEntries(
                  fields.map(([k]) => [k, formatUnitNumber(initial[k], unit)]),
                ) as Record<keyof CartonSize, string>,
              );
              setResetKey((k) => k + 1);
              setExportDimensions(false);
              setArtwork({ ...DEFAULT_ARTWORK });
              setTitle(ar ? "قالب علبة جديد" : "New carton template");
              setSafeArea(false);
              setPreviewMode("art");
              setDimensions(true);
              setError("");
            }}
          >
            {ar ? "إعادة الضبط" : "Reset settings"}
          </button>
          <button
            type="button"
            disabled={!!issue || busy}
            onClick={() => downloadCartonSvg(size, exportDimensions)}
          >
            <Download size={16} />
            SVG · mm
          </button>
          <button
            type="button"
            disabled={!!issue || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                downloadPackaging(
                  new Uint8Array(await cartonPdf(size)),
                  "application/pdf",
                  "carton-dieline-mm.pdf",
                );
              } catch {
                setError(ar ? "تعذر تصدير PDF" : "PDF export failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download size={16} />
            {busy ? "…" : "PDF · mm"}
          </button>
          <button
            className="carton-primary"
            type="button"
            disabled={!!issue || busy}
            onClick={create}
          >
            {ar
              ? "إنشاء تصميم جديد بالقالب"
              : "Create a new design with this template"}
          </button>
        </div>
        <p className="carton-new-note">
          {ar
            ? "يفتح قالبًا جديدًا بخطوط مقفولة. أي تصميم حالي يظل كما هو؛ لا تُنقل الرسومات تلقائيًا."
            : "Creates a fresh design with locked guides. Existing artwork is preserved in its own project, not automatically transferred."}
        </p>
      </footer>
    </dialog>
  );
}
