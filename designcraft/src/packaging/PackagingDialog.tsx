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
import { cartonPdf, downloadCartonSvg, downloadPackaging } from "./export";
import { createCartonProject } from "./project";
import { getSavedProjects, saveProjectToStorage } from "../utils/fabricHelpers";
import type { ProjectItem } from "../types";
import { BoxPreview } from "./BoxPreview";
import "./packaging.css";
const fields = [
  ["width", "عرض الوجه", "Face width", 20, 300],
  ["height", "ارتفاع العلبة", "Box height", 30, 500],
  ["depth", "عمق العلبة", "Box depth", 10, 150],
  ["glue", "لسان اللصق", "Glue tab", 5, 30],
  ["tuck", "لسان القفل", "Tuck tab", 5, 30],
] as const;
export function PackagingDialog({
  onClose,
  onCreate,
  initial = DEFAULT_CARTON,
}: {
  onClose: () => void;
  onCreate: (p: ProjectItem) => void;
  initial?: CartonSize;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    ref = useRef<HTMLDialogElement>(null),
    [title, setTitle] = useState(ar ? "قالب علبة جديد" : "New carton template"),
    [draft, setDraft] = useState(
      () =>
        Object.fromEntries(
          fields.map(([k]) => [k, String(initial[k])]),
        ) as Record<keyof CartonSize, string>,
    ),
    [dimensions, setDimensions] = useState(true),
    [exportDimensions, setExportDimensions] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const size = Object.fromEntries(
      fields.map(([k]) => [k, Number(draft[k])]),
    ) as unknown as CartonSize,
    issue = cartonError(size),
    g = issue ? null : cartonGeometry(size);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const messages: Record<string, string> = {
    finite: ar
      ? "أدخل أرقامًا صالحة في كل المقاسات."
      : "Enter finite numbers in every field.",
    dimensions: ar
      ? "العرض 20–300، الارتفاع 30–500، والعمق 10–150 مم."
      : "Width 20–300, height 30–500, depth 10–150 mm.",
    glue: ar
      ? "لسان اللصق: 5–30 مم، بحد أقصى 40% من العرض."
      : "Glue: 5–30 mm; at most 40% of width.",
    tuck: ar
      ? "لسان القفل: 5–30 مم، بحد أقصى 60% من العمق و25% من العرض."
      : "Tuck: 5–30 mm; at most 60% of depth and 25% of width.",
  };
  const create = () => {
    if (issue) return;
    try {
      const p = createCartonProject(size, title);
      saveProjectToStorage(p);
      if (!getSavedProjects().some((v) => v.id === p.id))
        throw Error("Storage");
      onCreate(p);
    } catch {
      setError(
        ar
          ? "تعذر إنشاء القالب أو حفظه. تحقق من مساحة التخزين."
          : "Could not create/save the template. Check storage.",
      );
    }
  };
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
          <small>PACKAGING / REVERSE TUCK</small>
          <h2 id="carton-title">
            <Box />
            {ar ? "مقاسات وقالب العلبة" : "Carton dimensions & dieline"}
          </h2>
        </div>
        <button
          type="button"
          aria-label={ar ? "إغلاق قالب العلبة" : "Close carton template"}
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      <div className="carton-body">
        <div className="carton-settings">
          <p>
            {ar
              ? "علبة مستطيلة بغطاء علوي وقفل سفلي متعاكس، مثل المرجع. كل القياسات بالملّيمتر."
              : "Rectangular reverse-tuck carton, like the reference. All dimensions are in millimetres."}
          </p>
          <label>
            {ar ? "اسم التصميم" : "Design name"}
            <input
              aria-label={ar ? "اسم قالب العلبة" : "Carton design name"}
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="carton-fields">
            {fields.map(([k, arabic, en, min, max]) => (
              <label key={k}>
                {ar ? arabic : en} · mm
                <input
                  aria-label={
                    ar ? `${arabic} بالملليمتر` : `${en} in millimetres`
                  }
                  type="number"
                  step="0.1"
                  min={min}
                  max={max}
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
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
        <div>
          <div
            className="carton-preview"
            aria-label={ar ? "معاينة قالب القص والطي" : "Cut and fold preview"}
          >
            {g ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: cartonSvg(size, dimensions),
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
          {g && (
            <div className="carton-preview-bottom">
              <div>
                <strong dir="ltr" data-testid="carton-sheet-size">
                  {g.width} × {g.height} mm
                </strong>
                <span>
                  {ar
                    ? "المفرود كاملًا، مع هامش خارجي 10 مم"
                    : "Full sheet, including 10 mm outer margins"}
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
                <BoxPreview size={size} />
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
            ? "PDF مسارات القص والطي فقط. اطبع بالحجم الفعلي 100%، وليس ملاءمة الصفحة."
            : "PDF: cut/crease guides only. Print at actual size (100%), not fit-to-page."}
        </small>
        <div className="carton-actions">
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
