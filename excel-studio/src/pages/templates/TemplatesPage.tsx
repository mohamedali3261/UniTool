import { LayoutTemplate, ShieldCheck } from "lucide-react";
import { useStudio } from "../../app/context";
import { templates } from "../../data/templates";
import { TemplateCard } from "./TemplateCard";
import "./templates.css";
export default function TemplatesPage() {
  const { t } = useStudio();
  return (
    <div className="xs-templates-page">
      <section className="xs-page-heading">
        <div>
          <div className="xs-breadcrumb">
            {t("نقطة بداية أحسن", "A BETTER STARTING POINT")}
          </div>
          <h1>
            {t("مش كل بداية، صفحة فاضية.", "Skip the blank page.")}{" "}
            <span>▦</span>
          </h1>
          <p>
            {t(
              "قوالب معمولة لشغلك اليومي. غيّر البيانات، وخلي الحساب علينا.",
              "Made for everyday work. Add your own data and let the formulas do the rest.",
            )}
          </p>
        </div>
        <span className="xs-pill">
          <ShieldCheck size={15} />
          {t("كل عنصر قابل للتعديل", "Fully editable")}
        </span>
      </section>
      <div className="xs-template-grid">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
      <section className="xs-template-bottom">
        <span>✦</span>
        <div>
          <h2>
            {t(
              "القالب مجرد بداية. الباقي على ذوقك.",
              "A template is just the beginning.",
            )}
          </h2>
          <p>
            {t(
              "غيّر الألوان والعناوين والأرقام، زوّد أعمدة، وصدّر ملف Excel حقيقي.",
              "Change colors, headings and numbers, add columns and export a real Excel workbook.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
