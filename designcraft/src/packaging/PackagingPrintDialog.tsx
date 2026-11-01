import { useEffect, useRef, useState } from "react";
import type { fabric } from "fabric";
import { useDcLang } from "../hooks/useDcLang";
import { cartonGeometry, type CartonSize } from "./geometry";
import { imagePreflight, packagingPrint } from "./print";
import { assertPhysicalCanvas, printSpec, type PrintDpi } from "./printMath";
import "./packaging.css";
export function PackagingPrintDialog({
  canvas,
  size,
  width,
  height,
  onClose,
}: {
  canvas: fabric.Canvas;
  size: CartonSize;
  width: number;
  height: number;
  onClose: () => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    ref = useRef<HTMLDialogElement>(null),
    [format, setFormat] = useState<"pdf" | "svg" | "png">("pdf"),
    [dpi, setDpi] = useState<PrintDpi>(300),
    [guides, setGuides] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const g = cartonGeometry(size),
    preflight = imagePreflight(canvas, dpi);
  let sizeError = false;
  try {
    assertPhysicalCanvas(size, width, height);
  } catch {
    sizeError = true;
  }
  let spec: ReturnType<typeof printSpec> | null = null;
  try {
    spec = printSpec(size, dpi);
  } catch {}
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      if (old?.isConnected) old.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="carton-dialog carton-print"
      aria-labelledby="carton-print-title"
      dir={ar ? "rtl" : "ltr"}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2 id="carton-print-title">
          {ar ? "تصدير العلبة للطباعة" : "Print carton artwork"}
        </h2>
        <button type="button" disabled={busy} onClick={onClose}>
          {ar ? "إغلاق" : "Close"}
        </button>
      </header>
      <div className="carton-print-body">
        <p>
          {ar
            ? "كل المحتوى مقصوص على حدود العلبة. ملف الطباعة يشمل تصميمك، وليس قالب الخطوط فقط."
            : "All content is clipped to the carton silhouette. Export includes your artwork, not just the template."}
        </p>
        <strong dir="ltr">
          {g.width} × {g.height} mm
        </strong>
        <label>
          {ar ? "نوع الملف" : "Format"}
          <select
            aria-label={ar ? "صيغة ملف الطباعة" : "Print format"}
            value={format}
            disabled={busy}
            onChange={(e) => setFormat(e.target.value as typeof format)}
          >
            <option value="pdf">PDF</option>
            <option value="svg">SVG · Vector</option>
            <option value="png">PNG</option>
          </select>
        </label>
        {format !== "svg" && (
          <label>
            {ar ? "دقة الطباعة" : "Print resolution"}
            <select
              aria-label={ar ? "دقة الطباعة" : "Print resolution"}
              disabled={busy}
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value) as PrintDpi)}
            >
              <option value="300">300 DPI</option>
              <option value="600">600 DPI</option>
            </select>
          </label>
        )}
        <label className="carton-check">
          <input
            type="checkbox"
            checked={guides}
            disabled={busy}
            onChange={(e) => setGuides(e.target.checked)}
          />
          {ar ? "تضمين خطوط القص والطي" : "Include cut and crease lines"}
        </label>
        {format !== "svg" && spec && (
          <p dir="ltr" data-testid="print-pixels">
            {spec.width} × {spec.height} px · {dpi} DPI
          </p>
        )}
        {preflight.low.length > 0 && (
          <div className="carton-note" role="status">
            {ar
              ? `تنبيه: ${preflight.low.length} صورة أقل من ${dpi} DPI بالحجم المستخدم. رفع دقة الملف لا يسترجع تفاصيل الصورة الأصلية.`
              : `Warning: ${preflight.low.length} image(s) below ${dpi} DPI at their placed size. Upsampling cannot restore missing image detail.`}
            <ul>
              {preflight.low.map((o, i) => (
                <li key={i}>
                  {o.name}: {o.dpi} DPI
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="carton-note">
          {ar
            ? "PDF: تصميم بدقة 300/600 DPI وخطوط قص وطي متجهية. SVG يحافظ على العناصر المتجهية ويحتاج الخطوط المستخدمة؛ الصور تظل بدقتها الأصلية. PNG يتضمن بيانات DPI. الألوان RGB، وليست CMYK أو PDF/X أو ألوان قص Spot معتمدة."
            : "PDF: 300/600 DPI artwork and vector guides. SVG retains vector objects and requires the original fonts; images retain their original detail. PNG embeds DPI metadata. RGB only, not certified CMYK, PDF/X or production spot colors."}
        </p>
        <p>
          {ar
            ? "اطبع بالحجم الفعلي 100%، وليس ملاءمة الصفحة. المقاسات الهندسية دقيقة حسابيًا؛ سمك الورق والتخديد وسماحات المطبعة غير محسوبة. اعمل نموذجًا تجريبيًا."
            : "Print actual size / 100%, not fit-to-page. Numerically precise nominal geometry; paper thickness, creasing and machine allowances still require a prototype."}
        </p>
        {sizeError && (
          <p role="alert">
            {ar
              ? "مساحة العمل لا تطابق مقاس العلبة. أنشئ قالبًا جديدًا؛ تم إيقاف التصدير لمنع تغيير المقياس."
              : "Canvas no longer matches the carton size. Export is blocked to prevent scaling errors; create a fresh template."}
          </p>
        )}
        {format !== "svg" && !spec && (
          <p role="alert">
            {ar
              ? "الحجم يتجاوز حد التصدير الآمن (40 مليون بكسل). اختر SVG أو 300 DPI؛ لن نقلل الجودة تلقائيًا."
              : "Exceeds the safe 40 MP limit. Choose SVG or 300 DPI; resolution is never silently reduced."}
          </p>
        )}
        {error && (
          <p role="alert" className="carton-error">
            {error}
          </p>
        )}
        <button
          className="carton-primary"
          type="button"
          disabled={busy || sizeError || (format !== "svg" && !spec)}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await document.fonts.ready;
              await new Promise((r) => setTimeout(r, 0));
              const blob = await packagingPrint(
                  canvas,
                  size,
                  width,
                  height,
                  format,
                  dpi,
                  guides,
                ),
                url = URL.createObjectURL(blob),
                a = document.createElement("a");
              a.href = url;
              a.download = `carton-artwork-${format === "svg" ? "vector" : dpi + "dpi"}.${format}`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch {
              setError(
                ar
                  ? "تعذر التصدير. جرّب 300 DPI أو SVG وتحقق من تحميل الصور."
                  : "Export failed. Try 300 DPI or SVG and verify image loading.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy
            ? ar
              ? "جارٍ تجهيز ملف الطباعة…"
              : "Preparing print file…"
            : ar
              ? "تنزيل ملف الطباعة"
              : "Download print file"}
        </button>
      </div>
    </dialog>
  );
}
