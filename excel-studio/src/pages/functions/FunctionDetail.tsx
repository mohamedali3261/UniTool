import { useMemo, useState } from "react";
import { Copy, ArrowUpLeft, Play, ExternalLink } from "lucide-react";
import { Modal } from "../../components/Modal";
import { useStudio } from "../../app/context";
import { calculator, errorHelp } from "../../core/calculate";
import { FormulaAnimation } from "./animations/FormulaAnimation";
import { formulaLessons } from "./animations";
import { exampleBook, type FormulaEntry, categoryAr } from "./catalog";
export function FunctionDetail({
  entry,
  onClose,
}: {
  entry: FormulaEntry;
  onClose: () => void;
}) {
  const { t, lang, insertFormula, notice } = useStudio(),
    [draft, setDraft] = useState(entry.example),
    book = useMemo(() => {
      const b = exampleBook();
      b.sheets[0].cells.J10 = { raw: draft };
      return b;
    }, [draft]),
    res = useMemo(() => calculator(book).cell(book.active, "J10"), [book]);
  return (
    <Modal
      title={
        entry.name + " — " + (lang === "ar" ? entry.title : entry.category)
      }
      onClose={onClose}
      wide
    >
      <div className="xs-function-detail">
        <span className="xs-pill">
          {lang === "ar"
            ? categoryAr[entry.category] || entry.category
            : entry.category}
        </span>
        {entry.ar && lang === "ar" && (
          <p className="xs-function-explanation">{entry.ar}</p>
        )}
        <p className="xs-source-description" dir="ltr">
          {entry.description}
        </p>
        <code className="xs-signature" dir="ltr">
          {entry.signature}
        </code>
        {entry.params.length > 0 && (
          <details>
            <summary>
              {t(
                "المعاملات بالتفصيل (التوثيق الإنجليزي)",
                "Parameters in detail",
              )}
            </summary>
            <dl className="xs-parameters" dir="ltr">
              {entry.params.map((p, i) => (
                <div key={i}>
                  <dt>{p.name}</dt>
                  <dd>{p.description}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <div className="xs-example-layout">
          <div>
            <h3>{t("بيانات المثال", "Example data")}</h3>
            {formulaLessons[entry.name] ? (
              <FormulaAnimation
                key={entry.name}
                lesson={formulaLessons[entry.name]}
                onUseExample={setDraft}
              />
            ) : (
              <>
                <table className="xs-example-table" dir="ltr">
                  <thead>
                    <tr>
                      <th></th>
                      <th>A</th>
                      <th>B</th>
                      <th>C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [10, 2, "Apple"],
                      [20, 4, "Pear"],
                      [30, 6, "Apple"],
                    ].map((r, i) => (
                      <tr key={i}>
                        <th>{i + 1}</th>
                        {r.map((v, j) => (
                          <td key={j}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <small>
                  {t(
                    "كل الخلايا الأخرى فارغة. التجربة مستقلة عن ملفك.",
                    "All other cells are blank. This playground does not change your file.",
                  )}
                </small>
              </>
            )}
          </div>
          <div>
            <h3>{t("جرّبها بإيدك", "Try it yourself")}</h3>
            <label className="xs-playground-label">
              {t(
                "عدّل المعادلة وشوف النتيجة فورًا",
                "Edit the formula to see the result",
              )}
              <textarea
                dir="ltr"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={t("تجربة المعادلة", "Formula playground")}
              />
            </label>
            <div
              className={"xs-example-result " + (res.error ? "danger" : "")}
              role="status"
            >
              <small>{t("النتيجة", "RESULT")}</small>
              <b dir="auto">{String(res.value ?? "—")}</b>
              {res.error && (
                <p>
                  {errorHelp[res.error]?.[lang === "ar" ? 0 : 1] ||
                    t(
                      "هذه الدالة أو المدخلات غير متاحة في المحرر.",
                      "This function or its arguments are not available in the editor.",
                    )}
                </p>
              )}
            </div>
          </div>
        </div>
        {entry.status === "reference" && (
          <p className="xs-callout">
            {t(
              "هذا مثال مرجعي، ولم نعتمد تشغيله داخل المحرر. قد يحتاج Excel أو مدخلات إضافية. يمكنك نسخ الصيغة واستخدامها في Excel.",
              "This is a reference example, not certified for in-app calculation. It may need Excel or additional inputs. Copy it for use in Excel.",
            )}
          </p>
        )}
        <p className="xs-hint">
          {t(
            "الأمثلة تعليمية وليست نصيحة مالية. الدوال العشوائية والتاريخية قد تتغير عند إعادة الحساب. نتائج المصفوفات المتدفقة غير مدعومة.",
            "Examples are educational, not financial advice. Random/time-dependent results can change on recalculation. Spilling arrays are not supported.",
          )}
        </p>
        <div className="xs-modal-actions">
          <a
            className="xs-button"
            href={`https://www.google.com/search?q=${encodeURIComponent("site:support.microsoft.com Excel " + entry.name + " function")}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("مرجع Microsoft", "Microsoft reference")}
            <ExternalLink size={13} />
          </a>
          <button
            className="xs-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(draft);
                notice(t("تم نسخ الصيغة", "Formula copied"));
              } catch {
                notice(
                  t(
                    "حدد الصيغة وانسخها يدويًا.",
                    "Select and copy the formula manually.",
                  ),
                );
              }
            }}
          >
            <Copy size={14} />
            {t("نسخ", "Copy")}
          </button>
          <button
            className="xs-button primary"
            disabled={!!res.error}
            onClick={() => {
              insertFormula(draft);
              onClose();
            }}
          >
            {t("إدراج في الخلية المختارة", "Insert into selected cell")}
            <ArrowUpLeft size={15} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
