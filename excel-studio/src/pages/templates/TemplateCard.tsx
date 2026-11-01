import { ArrowUpLeft } from "lucide-react";
import { useMemo } from "react";
import { useStudio } from "../../app/context";
import { templates, templateBook } from "../../data/templates";
import { calculator } from "../../core/calculate";
import { address } from "../../core/address";
import { themes } from "../../core/types";
export function TemplateCard({
  template,
}: {
  template: (typeof templates)[number];
}) {
  const { t, lang, openTemplate } = useStudio(),
    book = useMemo(() => templateBook(template.id, lang), [template.id, lang]),
    sheet = book.sheets[0],
    calc = useMemo(() => calculator(book), [book]),
    theme = themes[template.theme as keyof typeof themes];
  return (
    <article className="xs-template-card">
      <div className="xs-template-preview" style={{ background: theme.stripe }}>
        <div className="xs-mini-window">
          <div>
            <i />
            <i />
            <i />
            <span>{t(template.ar, template.en)}</span>
          </div>
          <table dir="ltr">
            <tbody>
              {Array.from({ length: 5 }, (_, r) => (
                <tr key={r}>
                  {Array.from({ length: 5 }, (_, c) => (
                    <td
                      key={c}
                      style={{
                        background: r === 0 ? theme.head : undefined,
                        color: r === 0 ? "white" : undefined,
                      }}
                    >
                      {template.id === "blank"
                        ? r === 0
                          ? String.fromCharCode(65 + c)
                          : ""
                        : String(
                            calc.cell(sheet.id, address(r, c)).value ?? "",
                          ).slice(0, 12)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span className="xs-template-icon" style={{ color: theme.head }}>
          {template.icon}
        </span>
      </div>
      <div className="xs-template-info">
        <small>{t(template.tag, template.enTag)}</small>
        <h2>{t(template.ar, template.en)}</h2>
        <p>{t(template.desc, template.enDesc)}</p>
        <button
          className="xs-button"
          onClick={() => openTemplate(structuredClone(book))}
        >
          {t("استخدم القالب", "Use this template")}
          <ArrowUpLeft size={16} />
        </button>
      </div>
    </article>
  );
}
