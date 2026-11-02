import { Modal } from "../../components/Modal";
import type { Translate } from "../../core/types";
export function Guide({ t, onClose }: { t: Translate; onClose: () => void }) {
  return (
    <Modal
      title={t("دليل صغير لشغل أدق", "A small guide for precise work")}
      onClose={onClose}
    >
      <h3>{t("الأصل أولًا", "Original first")}</h3>
      <p>
        {t(
          "عرض PDF.js يحافظ على رسم الصفحة. أضف تعليقات ونصوصًا فوقها؛ هذه النسخة لا تعدل النص الأصلي في بنية PDF ولا تعيد تدفق الفقرات. الغطاء الأبيض ليس حجبًا آمنًا، ولا يزيل المعلومات تحته.",
          "PDF.js preserves the page appearance. Add annotations on top; this version does not rewrite original PDF text or reflow paragraphs. White covers do not securely redact underlying data.",
        )}
      </p>
      <h3>
        {t("العربي بدقة وشفافية", "Arabic, accurately and transparently")}
      </h3>
      <p>
        {t(
          "طبقة النص الأصلية قد تحتوي ترميزًا غير صالح أو ترتيب أعمدة غير سليم. جرّب ترتيب السطور أو OCR ثم راجع الأصل. لا نعكس حروف الكلمات العربية عشوائيًا. OCR محلي وقد يخطئ في الأرقام والأسماء والتشكيل. ثقة المحرك ليست نسبة دقة مثبتة.",
          "Native text can have broken mappings or column order. Try position-based ordering or OCR, then verify against the page. Arabic words are never blindly reversed. Local OCR can misread numbers, names and diacritics; confidence is not verified accuracy.",
        )}
      </p>
      <h3>{t("التصدير والحفظ", "Export and saving")}</h3>
      <p>
        {t(
          "الصفحات الأصلية تظل متجهة؛ إضافاتك تُدمج كصورة شفافة عالية الدقة للحفاظ على شكل العربي. OCR للتنزيل والنسخ فقط ولا يضيف طبقة بحث. احفظ مشروع JSON لاستعادة الإضافات مع نفس PDF الأصلي؛ الملف مربوط ببصمته الرقمية ولا يحوي مستندك. مفيش حفظ تلقائي للمستندات في التخزين المحلي.",
          "Original pages remain vector-based; annotations are flattened as high-resolution transparent images for consistent Arabic. OCR is for copy/TXT only, not a searchable PDF layer. Save JSON to restore annotations against the identical original PDF fingerprint. No document autosave or cross-file annotation reuse.",
        )}
      </p>
      <h3>{t("حدود واضحة", "Clear limits")}</h3>
      <p>
        {t(
          "25 MB، 100 صفحة، 100 إضافة للصفحة و500 للمستند، 40 خطوة تراجع. ملفات كلمة المرور تحتاج نسخة غير محمية ومصرّح بها. لا نشغّل JavaScript أو روابط PDF. التصدير قد يفقد التوقيعات الرقمية والمرفقات والخصائص التفاعلية؛ لا تستخدمه للحفاظ على توقيع قانوني.",
          "25 MB, 100 pages, 100 annotations/page, 500/document, 40 undo steps. Password files need an authorized unlocked copy. No PDF JavaScript or link execution. Export can lose digital signatures, attachments and interactive document features; do not use it to preserve a legal signature.",
        )}
      </p>
      <p className="ps-hint">
        Ctrl/Cmd+Z · Ctrl/Cmd+Shift+Z ·{" "}
        {t(
          "التراجع والإعادة عندما لا تكتب داخل حقل. استخدم أزرار الطبقات والخصائص لتحرير الإضافات بالكيبورد.",
          "Undo/redo outside text fields. Layer buttons and property fields support keyboard annotation editing.",
        )}
      </p>
    </Modal>
  );
}
