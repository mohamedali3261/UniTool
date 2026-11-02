import { ArrowUpLeft, BookOpen } from "lucide-react";
import type { Translate } from "../../core/types";
import { UploadCard } from "./UploadCard";
import { FeatureCards } from "./FeatureCards";
import "./welcome.css";
export default function WelcomePage({
  load,
  loading,
  t,
}: {
  load: (f: File) => void;
  loading: boolean;
  t: Translate;
}) {
  return (
    <main className="ps-welcome">
      <div className="ps-welcome-heading">
        <span className="ps-eyebrow">UNITOOL / PDF STUDIO</span>
        <h1>
          {t("مستندك.", "Your document.")}
          <br />
          <em>{t("بكل تفاصيله.", "Every little detail.")}</em>
          <span>✳</span>
        </h1>
        <p>
          {t(
            "مساحة أهدى لشغل أدق. اقرأ، علّق، ورتّب ملفات PDF… والعربي في قلب التجربة.",
            "A calmer space for precise work. Read, annotate and organize your PDFs — with Arabic at the heart of the experience.",
          )}
        </p>
        <a href="#ps-features">
          {t("تفاصيل صغيرة. فرق كبير.", "Small details. A big difference.")}
          <ArrowUpLeft size={16} />
        </a>
        <div className="ps-arabic-note">
          <BookOpen size={20} />
          <p>
            <b>{t("الدقة قبل أي وعد.", "Accuracy before promises.")}</b>
            {t(
              "جودة استخراج النص تعتمد على ترميز الملف ووضوح الصورة. راجع نتائج OCR؛ ثقة المحرك مش ضمان دقة، ومفيش قراءة مضمونة لكل ملف.",
              "Text quality depends on encoding and image clarity. Review OCR results; engine confidence is not an accuracy guarantee.",
            )}
          </p>
        </div>
      </div>
      <UploadCard load={load} loading={loading} t={t} />
      <div id="ps-features">
        <FeatureCards t={t} />
      </div>
      <footer>
        CRAFTED FOR YOUR WORDS.{" "}
        <span>
          {t(
            "بدون تغيير الأصل. بدون تعقيد.",
            "Keep the original. Lose the complexity.",
          )}
        </span>
      </footer>
    </main>
  );
}
