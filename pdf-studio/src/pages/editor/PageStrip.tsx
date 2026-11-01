import { ArrowUp, ArrowDown, Copy, RotateCw, Trash2 } from "lucide-react";
import type { PdfDoc } from "../../core/pdf";
import type { EditState, PageState, Translate } from "../../core/types";
import { Thumbnail } from "./Thumbnail";
export function PageStrip({
  doc,
  pages,
  current,
  onSelect,
  action,
  t,
}: {
  doc: PdfDoc;
  pages: PageState[];
  current: string;
  onSelect: (id: string) => void;
  action: (
    kind: "up" | "down" | "duplicate" | "rotate" | "delete",
    id: string,
  ) => void;
  t: Translate;
}) {
  return (
    <section className="ps-pages">
      <header>
        <b>{t("الصفحات", "Pages")}</b>
        <span>{pages.length}</span>
      </header>
      <div className="ps-page-list">
        {pages.map((p, i) => (
          <div
            className={"ps-page-item " + (p.id === current ? "active" : "")}
            key={p.id}
          >
            <button
              className="ps-page-preview"
              onClick={() => onSelect(p.id)}
              aria-label={t("فتح صفحة ", "Open page ") + (i + 1)}
              aria-pressed={p.id === current}
            >
              <Thumbnail doc={doc} source={p.source} rotation={p.rotation} />
              <span>
                {String(i + 1).padStart(2, "0")}
                <small>
                  {p.annotations.length ? `${p.annotations.length} ✎` : ""}
                </small>
              </span>
            </button>
            {p.id === current && (
              <div className="ps-page-actions">
                {[
                  [ArrowUp, "up", t("نقل لأعلى", "Move page earlier"), i === 0],
                  [
                    ArrowDown,
                    "down",
                    t("نقل لأسفل", "Move page later"),
                    i === pages.length - 1,
                  ],
                  [RotateCw, "rotate", t("تدوير الصفحة", "Rotate page"), false],
                  [
                    Copy,
                    "duplicate",
                    t("نسخ الصفحة", "Duplicate page"),
                    pages.length >= 100,
                  ],
                  [
                    Trash2,
                    "delete",
                    t("حذف الصفحة", "Delete page"),
                    pages.length <= 1,
                  ],
                ].map(([Icon, kind, label, disabled]) => {
                  const I = Icon as typeof Copy;
                  return (
                    <button
                      key={String(kind)}
                      disabled={!!disabled}
                      aria-label={String(label)}
                      onClick={() => action(kind as any, p.id)}
                    >
                      <I size={13} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <p>
        {t(
          "تعديلات الصفحات قابلة للتراجع. الأصل لا يتغير.",
          "Page changes can be undone. Your original is unchanged.",
        )}
      </p>
    </section>
  );
}
