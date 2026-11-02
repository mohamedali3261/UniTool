import { useState } from "react";
import { Modal } from "../../components/Modal";
import { useStudio } from "../../app/context";
import { themes, LIMITS, type Sheet } from "../../core/types";
import { newSheet } from "../../core/workbook";
import { address } from "../../core/address";
export function TableDesigner({
  sheet,
  onApply,
  onClose,
}: {
  sheet?: Sheet;
  onApply: (sheet: Sheet) => void;
  onClose: () => void;
}) {
  const { t, book } = useStudio(),
    [draft, setDraft] = useState(
      sheet ? structuredClone(sheet) : newSheet(t("جدول جديد", "New table")),
    ),
    [headers, setHeaders] = useState(
      t("البند، الكمية، السعر، الإجمالي", "Item, Quantity, Price, Total"),
    ),
    [error, setError] = useState("");
  const set = (patch: Partial<Sheet>) => setDraft((s) => ({ ...s, ...patch }));
  return (
    <Modal
      title={
        sheet
          ? t("تصميم وإعدادات الجدول", "Table design & settings")
          : t("صمم جدولك في دقيقة", "Design your table in a minute")
      }
      onClose={onClose}
    >
      <p className="xs-hint">
        {t(
          "ابدأ بالأعمدة اللي تحتاجها، والتنسيق علينا. تقدر تعدّل كل حاجة بعدين.",
          "Start with the columns you need. You can change everything later.",
        )}
      </p>
      <label>
        {t("اسم الورقة", "Sheet name")}
        <input
          value={draft.name}
          maxLength={31}
          onChange={(e) => set({ name: e.target.value })}
        />
      </label>
      {!sheet && (
        <label>
          {t(
            "عناوين الأعمدة (افصل بينها بفاصلة)",
            "Column headings (comma-separated)",
          )}
          <textarea
            rows={2}
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
          />
        </label>
      )}
      <div className="xs-form-grid">
        <label>
          {t("عدد الصفوف", "Rows")}
          <input
            type="number"
            min={sheet ? sheet.rows : 2}
            max={LIMITS.rows}
            value={draft.rows}
            onChange={(e) => set({ rows: Number(e.target.value) })}
          />
        </label>
        <label>
          {t("المنازل العشرية", "Decimal places")}
          <select
            value={draft.decimals}
            onChange={(e) => set({ decimals: Number(e.target.value) })}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          {t("العملة", "Currency")}
          <select
            value={draft.currency}
            onChange={(e) => set({ currency: e.target.value })}
          >
            {["EGP", "USD", "EUR", "SAR", "AED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <span className="xs-field-label">
        {t("اختار الستايل", "Choose a style")}
      </span>
      <div className="xs-theme-picker">
        {Object.entries(themes).map(([id, theme]) => (
          <button
            key={id}
            aria-label={theme.name}
            aria-pressed={draft.theme === id}
            onClick={() => set({ theme: id })}
            style={{ background: theme.head }}
          >
            {draft.theme === id ? "✓" : ""}
          </button>
        ))}
      </div>
      <div className="xs-checkboxes">
        {(
          [
            {
              key: "header",
              ar: "أول صف عنوان مميز",
              en: "Style the first row as a header",
            },
            {
              key: "striped",
              ar: "تظليل الصفوف بالتبادل",
              en: "Alternating row colors",
            },
            {
              key: "freeze",
              ar: "تثبيت عناوين الأعمدة",
              en: "Freeze column headers",
            },
            {
              key: "negative",
              ar: "الأرقام السالبة بالأحمر",
              en: "Highlight negative numbers",
            },
          ] as const
        ).map((c) => (
          <label key={c.key}>
            <input
              type="checkbox"
              checked={draft[c.key]}
              onChange={(e) => set({ [c.key]: e.target.checked })}
            />
            {t(c.ar, c.en)}
          </label>
        ))}
      </div>
      {error && (
        <p className="danger" role="alert">
          {error}
        </p>
      )}
      <div className="xs-modal-actions">
        <button
          className="xs-button primary"
          onClick={() => {
            const name = draft.name.trim();
            if (
              !name ||
              /[\[\]:*?\/\\]/.test(name) ||
              book.sheets.some(
                (s) =>
                  s.id !== draft.id &&
                  s.name.toLowerCase() === name.toLowerCase(),
              )
            ) {
              setError(
                t(
                  "اختار اسمًا فريدًا بدون رموز Excel المحجوزة.",
                  "Use a unique name without Excel-reserved symbols.",
                ),
              );
              return;
            }
            if (
              !Number.isInteger(draft.rows) ||
              draft.rows < (sheet?.rows || 2) ||
              draft.rows > LIMITS.rows
            ) {
              setError(
                t(
                  "عدد صفوف غير صالح؛ لا يمكن حذف بيانات بتقليل الحجم هنا.",
                  "Invalid row count. This dialog cannot shrink existing data.",
                ),
              );
              return;
            }
            if (!sheet) {
              const titles = headers
                .split(/[,،\n]/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (!titles.length || titles.length > LIMITS.cols) {
                setError(
                  t("أدخل من 1 إلى 30 عنوانًا.", "Enter 1 to 30 headings."),
                );
                return;
              }
              draft.cols = Math.max(8, titles.length);
              titles.forEach(
                (raw, c) => (draft.cells[address(0, c)] = { raw }),
              );
            }
            onApply({ ...draft, name });
            onClose();
          }}
        >
          {t(
            sheet ? "حفظ التصميم" : "أنشئ الجدول",
            sheet ? "Save design" : "Create table",
          )}{" "}
          ←
        </button>
      </div>
    </Modal>
  );
}
