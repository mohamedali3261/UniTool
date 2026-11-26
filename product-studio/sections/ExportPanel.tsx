import { useEffect, useRef, useState } from "react";
import { Download, X, ArrowUpRight } from "lucide-react";
export function ExportPanel({
  close,
  onExport,
  ar,
  initialKind = "mockup",
}: {
  initialKind?: "artwork" | "mockup" | "person";
  close: () => void;
  onExport: (
    kind: "artwork" | "mockup" | "person",
    size: number,
    transparent: boolean,
  ) => Promise<void>;
  ar: boolean;
}) {
  const [kind, setKind] = useState<"artwork" | "mockup" | "person">(
      initialKind,
    ),
    [size, setSize] = useState(2048),
    [transparent, setTransparent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="ps-modal-backdrop" onClick={() => !busy && close()}>
      <section
        ref={panel}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) {
            e.stopPropagation();
            close();
          }
          if (e.key === "Tab") {
            const nodes = Array.from(
              panel.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled),select,input",
              ) ?? [],
            );
            const first = nodes[0],
              last = nodes.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
        className="ps-modal"
        role="dialog"
        aria-modal="true"
        aria-label={ar ? "تصدير التصميم" : "Export design"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="ps-modal-close"
          aria-label={ar ? "إغلاق" : "Close"}
          disabled={busy}
          onClick={close}
        >
          <X size={20} />
        </button>
        <span className="ps-eyebrow">READY FOR THE WORLD</span>
        <h2>{ar ? "من الاستوديو، لمتجرك." : "From studio to storefront."}</h2>
        <p>
          {ar
            ? "صور PNG عالية الدقة، جاهزة للكتالوج والمتجر."
            : "High-resolution PNG files, ready for your store and catalog."}
        </p>
        <label>
          {ar ? "نوع الملف" : "Export type"}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="mockup">
              {ar
                ? "صورة المجسم 3D — الزاوية الحالية"
                : "3D mockup — current angle"}
            </option>
            <option value="person">
              {ar
                ? "معاينة على شخص 2D — الوجه الأمامي"
                : "On-person 2D photo — front artwork"}
            </option>
            <option value="artwork">
              {ar
                ? "التصميم فقط — الوجه الحالي"
                : "Artwork only — current side"}
            </option>
          </select>
        </label>
        <label>
          {ar ? "الدقة بالبكسل" : "Resolution in pixels"}
          <select value={size} onChange={(e) => setSize(+e.target.value)}>
            {[1024, 2048, 4096].map((n) => (
              <option key={n} value={n}>
                {kind === "person" ? Math.round(n * 0.75) : n} × {n} px
              </option>
            ))}
          </select>
        </label>
        {kind === "mockup" && (
          <label className="ps-check">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
            />
            {ar ? "خلفية شفافة" : "Transparent background"}
          </label>
        )}
        <small>
          {ar
            ? "التصميم يُصدّر بخلفية شفافة. راجع مواصفات المطبعة قبل الطباعة؛ المعاينة ليست باترون خياطة أو محاكاة قماش."
            : "Artwork exports with transparency. Check your printer’s specifications; previews are not sewing patterns or cloth simulations."}
        </small>
        {error && <p role="alert">{error}</p>}
        <button
          className="ps-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onExport(kind, size, transparent);
            } catch (e) {
              setError(String(e instanceof Error ? e.message : e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={17} />
          {busy
            ? ar
              ? "جارٍ التجهيز…"
              : "Preparing…"
            : ar
              ? "تنزيل PNG"
              : "Download PNG"}
          <ArrowUpRight size={17} />
        </button>
      </section>
    </div>
  );
}
