import { useEffect, useState } from "react";
import { useDesigner } from "./state";
import {
  listAssets,
  saveAsset,
  removeAsset,
  selectionAsset,
  type PersonalAsset,
} from "./personal-assets";
import { ProjectGraphic } from "./render";
import { pasteNodes } from "./clipboard";
import { download, safeName } from "./export-tools";
/** أرشيف مستقل في IndexedDB يحتفظ بالأجزاء، وليس صورة مسطحة. */
export default function PersonalLibrary() {
  const s = useDesigner(),
    [assets, setAssets] = useState<PersonalAsset[]>([]),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      setAssets(await listAssets());
    } catch {
      setError(
        s.t(
          "تعذّر فتح المكتبة المحلية.",
          "Local asset storage is unavailable.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <section className="ld-feature-block">
      <h3>{s.t("مكتبتي الشخصية", "My reusable marks")}</h3>
      <p>
        {s.t(
          "احفظ التحديد كعناصر قابلة للتعديل لاستخدامه في أي مشروع. التخزين محلي؛ نزّل JSON للاحتياط.",
          "Save a selection as editable elements for any project. Stored locally; download JSON backups.",
        )}
      </p>
      <label className="ld-field">
        {s.t("اسم العنصر المحفوظ", "Saved mark name")}
        <input
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button
        className="ld-primary ld-full"
        disabled={!s.selected.length || assets.length >= 50}
        onClick={async () => {
          try {
            await saveAsset(
              selectionAsset(s.doc, s.selected, name.trim() || s.doc.name),
            );
            setError("");
            await refresh();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        {s.t("حفظ التحديد في مكتبتي", "Save selection to my library")}
      </button>
      {loading && <p role="status">{s.t("تحميل…", "Loading…")}</p>}
      {error && <p role="alert">{error}</p>}
      <div className="ld-personal-grid">
        {assets.map((a) => (
          <article key={a.id}>
            <button
              aria-label={s.t("إضافة من مكتبتي ", "Add saved mark ") + a.name}
              onClick={() =>
                s.add(
                  pasteNodes(a.project.nodes, {
                    x: s.doc.width / 2,
                    y: s.doc.height / 2,
                  }),
                )
              }
            >
              <svg viewBox="0 0 800 600">
                <ProjectGraphic
                  project={a.project}
                  prefix={"personal-" + a.id}
                />
              </svg>
            </button>
            <strong>{a.name}</strong>
            <div className="ld-mini-grid">
              <button
                onClick={() =>
                  download(
                    new Blob([JSON.stringify(a.project)], {
                      type: "application/json",
                    }),
                    safeName(a.name) + ".json",
                  )
                }
              >
                JSON
              </button>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      s.t("حذف العنصر المحفوظ؟", "Delete this saved mark?"),
                    )
                  )
                    return;
                  try {
                    await removeAsset(a.id);
                    await refresh();
                  } catch {
                    setError(s.t("فشل الحذف.", "Delete failed."));
                  }
                }}
              >
                {s.t("حذف", "Delete")}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!loading && !assets.length && (
        <p className="ld-empty">
          {s.t(
            "حدّد عناصر من اللوحة واحفظ أول تركيب خاص بك.",
            "Select elements and save your first reusable mark.",
          )}
        </p>
      )}
    </section>
  );
}
