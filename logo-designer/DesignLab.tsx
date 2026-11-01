import { useState } from "react";
import { useDesigner } from "./state";
import Variants from "./Variants";
import Readability from "./Readability";
import { exportBrandGuide } from "./brand-guide";
export default function DesignLab() {
  const s = useDesigner(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">REFINE · COMPARE · PUBLISH</p>
      <h2>{s.t("معمل الهوية", "Brand lab")}</h2>
      <Variants />
      <Readability />
      <section className="ld-feature-block">
        <h3>{s.t("دليل الهوية جاهز للتنزيل", "Download brand guidelines")}</h3>
        <p>
          {s.t(
            "PDF فيه الشعار وأكواد كل الألوان وأسماء الخطوط والنسخ البديلة. مستند مرئي عالي الدقة، مش PDF بمسارات متجهة.",
            "A PDF with your logo, every color code, font families and design variants. A high-resolution visual guide, not outlined vector PDF.",
          )}
        </p>
        <button
          className="ld-primary ld-full"
          disabled={busy || !s.doc.nodes.length}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await exportBrandGuide(s.doc, s.lang);
            } catch {
              setError(
                s.t(
                  "فشل إنشاء الدليل؛ جرّب تقليل الصور أو الأبعاد.",
                  "Guide export failed. Try reducing embedded image sizes.",
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy
            ? s.t("جاري إنشاء الدليل…", "Building guide…")
            : s.t("تنزيل دليل الهوية PDF", "Download brand guide PDF")}
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
    </section>
  );
}
