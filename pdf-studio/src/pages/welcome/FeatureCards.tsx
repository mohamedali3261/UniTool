import { Languages, ScanText, Layers3, PenLine } from "lucide-react";
import type { Translate } from "../../core/types";
export function FeatureCards({ t }: { t: Translate }) {
  return (
    <section className="ps-feature-cards">
      {[
        [
          Languages,
          t("العربي، بأصله.", "Arabic, as intended."),
          t(
            "عرض الصفحة بمحرك PDF.js بدل إعادة تركيب النص الأصلي.",
            "PDF.js renders the original page without rebuilding its text.",
          ),
        ],
        [
          ScanText,
          t("اقرأ ما وراء الصورة.", "Read beyond the image."),
          t(
            "استخراج النص الأصلي وOCR عربي/إنجليزي محلي للصفحات المصوّرة.",
            "Native extraction and local Arabic/English OCR for scanned pages.",
          ),
        ],
        [
          PenLine,
          t("تفاصيلك، فوق الورق.", "Make your mark."),
          t(
            "نصوص عربية، تظليل ورسم، مع تراجع وإعادة لكل خطوة.",
            "Arabic text, highlights and drawing with undo and redo.",
          ),
        ],
        [
          Layers3,
          t("مستند مرتب، فعلًا.", "A document in order."),
          t(
            "رتّب ودوّر وانسخ الصفحات، وصدّر نسخة تحفظ الأصل.",
            "Reorder, rotate and duplicate pages, then export a new copy.",
          ),
        ],
      ].map(([Icon, title, desc]) => {
        const I = Icon as typeof Languages;
        return (
          <article key={String(title)}>
            <I size={20} />
            <h3>{String(title)}</h3>
            <p>{String(desc)}</p>
          </article>
        );
      })}
    </section>
  );
}
