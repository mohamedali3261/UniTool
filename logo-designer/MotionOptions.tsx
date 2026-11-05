import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { useDesigner } from "./state";
import { fitForPublishing, publishingSizes } from "./motion-layout";
import {
  addMotionVersion,
  switchMotionVersion,
  deleteMotionVersion,
} from "./motion-versions";
import { ProjectGraphic } from "./render";
export default function MotionOptions() {
  const s = useDesigner(),
    [name, setName] = useState("");
  return (
    <div className="ld-motion-options">
      <details>
        <summary>
          {s.t(
            "مقاسات النشر والمساحات الآمنة",
            "Publishing sizes & safe areas",
          )}
        </summary>
        <div className="ld-motion-options-body">
          <p>
            {s.t(
              "تمركز وتغيير مقاس العناصر بنفس النسبة داخل مساحة آمنة ١٠٪. العملية قابلة للتراجع.",
              "Center and uniformly fit your artwork inside a 10% safe margin. Undo restores the original.",
            )}
          </p>
          <div className="ld-motion-size-grid">
            {publishingSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => {
                  try {
                    const next = fitForPublishing(s.doc, size.id);
                    s.commit(() => next);
                  } catch {
                    s.setNotice(
                      s.t(
                        "العناصر متباعدة جدًا أو صغيرة جدًا. قرّبها قبل تغيير المقاس.",
                        "Some elements are too small or far apart. Bring them closer before resizing.",
                      ),
                    );
                  }
                }}
              >
                <strong>{size[s.lang]}</strong>
                <small dir="ltr">
                  {size.width} × {size.height}
                </small>
              </button>
            ))}
          </div>
        </div>
      </details>
      <details>
        <summary>
          {s.t("نسخ بديلة للحركة والألوان", "Motion & color alternatives")}{" "}
          <span>{s.doc.motionVersions?.length || 1}/6</span>
        </summary>
        <div className="ld-motion-options-body">
          <p>
            {s.t(
              "كل نسخة تحتفظ بالعناصر والألوان والمقاس والحركة. يتم حفظ آخر تعديلاتك تلقائيًا قبل التبديل.",
              "Each version keeps artwork, colors, size and motion. Your latest edits are saved before switching.",
            )}
          </p>
          <label className="ld-field">
            {s.t("اسم النسخة الجديدة", "New version name")}
            <input
              aria-label={s.t("اسم النسخة الجديدة", "New version name")}
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="ld-secondary ld-full"
            disabled={(s.doc.motionVersions?.length || 1) >= 6}
            onClick={() => {
              s.commit((p) =>
                addMotionVersion(
                  p,
                  name || s.t("تجربة جديدة", "New experiment"),
                ),
              );
              setName("");
            }}
          >
            <Copy size={15} />
            {s.t("إنشاء نسخة بديلة", "Create alternative")}
          </button>
          <div className="ld-motion-version-grid">
            {s.doc.motionVersions?.map((v) => {
              const active = v.id === s.doc.activeMotionVersion,
                preview = active ? s.doc : { ...s.doc, ...v };
              return (
                <article key={v.id} className="ld-motion-version">
                  <button
                    aria-pressed={active}
                    aria-label={s.t("فتح النسخة: ", "Open version: ") + v.name}
                    onClick={() => {
                      s.commit((p) => switchMotionVersion(p, v.id));
                      s.setSelected([]);
                    }}
                  >
                    <svg
                      viewBox={`0 0 ${preview.width} ${preview.height}`}
                      aria-hidden="true"
                    >
                      <ProjectGraphic
                        project={preview}
                        prefix={`version-${v.id}`}
                      />
                    </svg>
                    <strong>
                      {v.name === "Original"
                        ? s.t("الأصل", "Original")
                        : v.name}
                    </strong>
                  </button>
                  <label className="ld-field">
                    {s.t("تسمية النسخة", "Rename version")}
                    <input
                      key={`${v.id}-${v.name}`}
                      aria-label={
                        s.t("اسم النسخة: ", "Version name: ") + v.name
                      }
                      defaultValue={v.name}
                      maxLength={60}
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (name && name !== v.name)
                          s.commit((p) => ({
                            ...p,
                            motionVersions: p.motionVersions?.map((version) =>
                              version.id === v.id
                                ? { ...version, name }
                                : version,
                            ),
                          }));
                      }}
                    />
                  </label>
                  <button
                    aria-label={
                      s.t("حذف النسخة: ", "Delete version: ") + v.name
                    }
                    disabled={active}
                    onClick={() => {
                      if (
                        confirm(
                          s.t(
                            "حذف النسخة المحفوظة؟ تقدر تتراجع.",
                            "Delete this saved alternative? You can undo.",
                          ),
                        )
                      )
                        s.commit((p) => deleteMotionVersion(p, v.id));
                    }}
                  >
                    <Trash2 size={13} />
                    {s.t("حذف", "Delete")}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}
