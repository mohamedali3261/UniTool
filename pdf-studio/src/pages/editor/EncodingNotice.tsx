import { AlertTriangle, ScanText } from "lucide-react";
import type { EncodingIssue } from "../../core/textEncoding";
import type { Translate } from "../../core/types";
export function EncodingNotice({
  issues,
  onOCR,
  busy,
  t,
}: {
  issues: EncodingIssue[];
  onOCR: () => void;
  busy: boolean;
  t: Translate;
}) {
  if (!issues.length) return null;
  const count = issues.reduce((n, i) => n + i.count, 0);
  return (
    <section className="ps-encoding-notice" role="alert">
      <div>
        <AlertTriangle size={16} />
        <b>
          {t(
            "نص غير مكتمل: رموز خط غير معروفة",
            "Incomplete text: unmapped font symbols",
          )}
        </b>
      </div>
      <p>
        {count}{" "}
        {t(
          "رمزًا لا يمكن تحديد حرفه من طبقة النص. علّمناه بـ � بدل تخمين الأسماء أو الأرقام. حوّلنا صيغ الحروف العربية المعروفة فقط لحروف عادية.",
          "symbols cannot be decoded from the text layer. They are marked � instead of guessing names or numbers. Known Arabic presentation forms have been converted to standard letters.",
        )}
      </p>
      <button className="ps-button" disabled={busy} onClick={onOCR}>
        <ScanText size={14} />
        {t("إعادة قراءة صورة الصفحة بـ OCR", "Read the page image with OCR")}
      </button>
      <small>
        {t(
          "OCR قد يخطئ أيضًا. راجع كل اسم ورقم وتاريخ مقابل الصفحة الأصلية.",
          "OCR can also make mistakes. Verify every name, number and date against the original page.",
        )}
      </small>
      <details>
        <summary>
          {t("تشخيص الرموز (بدون تخمين)", "Symbol diagnostics (no guessing)")}
        </summary>
        <ul>
          {issues.slice(0, 30).map((i) => (
            <li key={i.code}>
              <code>{i.code}</code> × {i.count}
            </li>
          ))}
        </ul>
        {issues.length > 30 && (
          <small>
            {t("معروض أول 30 رمزًا مختلفًا", "Showing first 30 distinct codes")}
          </small>
        )}
      </details>
    </section>
  );
}
