/** أرشيف محلي ونسخ احتياطية JSON مع التحقق قبل الاستيراد. */
import { useEffect, useRef, useState } from "react";
import { FolderOpen, Plus, Copy, Trash2, Upload } from "lucide-react";
import { useDesigner } from "./state";
import {
  allProjects,
  deleteProject,
  saveProject,
  validateProject,
} from "./storage";
import { uid, type Project } from "./types";
import { ProjectGraphic } from "./render";
export default function Projects() {
  const s = useDesigner(),
    [projects, setProjects] = useState<Project[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    input = useRef<HTMLInputElement>(null);
  const refresh = () =>
    allProjects()
      .then(setProjects)
      .catch(() =>
        setError(
          s.t(
            "تعذّر الوصول للتخزين. استخدم ملفات JSON.",
            "Storage unavailable. Use JSON backups.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  useEffect(() => {
    void refresh();
  }, [s.revision]);
  async function remove(p: Project) {
    if (
      !confirm(
        s.t(
          `حذف مشروع «${p.name}» نهائيًا من الجهاز؟`,
          "Permanently delete this project from this device?",
        ),
      )
    )
      return;
    try {
      if (p.id === s.doc.id) s.newProject();
      await deleteProject(p.id);
      await refresh();
    } catch {
      setError(s.t("فشل حذف المشروع.", "Could not delete the project."));
    }
  }
  async function duplicate(p: Project) {
    try {
      await saveProject({
        ...structuredClone(p.id === s.doc.id ? s.doc : p),
        id: uid(),
        name: p.name + " — copy",
      });
      await refresh();
    } catch {
      setError(s.t("فشل نسخ المشروع.", "Could not duplicate the project."));
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error();
      const p = validateProject(JSON.parse(await file.text()));
      await s.save();
      s.load({ ...p, id: uid() });
      setError("");
    } catch {
      setError(
        s.t(
          "ملف مشروع غير صالح أو أكبر من 30 ميجا.",
          "Invalid project file or larger than 30MB.",
        ),
      );
    }
  }
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">YOUR LITTLE BRAND ARCHIVE</p>
      <h2>{s.t("كل أفكارك، في مكان.", "A home for your ideas.")}</h2>
      <p>
        {s.t(
          "الحفظ على المتصفح الحالي فقط. نزّل JSON كنسخة احتياطية؛ مسح بيانات المتصفح يمسح المشاريع.",
          "Saved in this browser only. Download JSON backups; clearing browser data removes projects.",
        )}
      </p>
      <div className="ld-toolbar">
        <button
          className="ld-primary"
          onClick={async () => {
            await s.save();
            s.newProject();
          }}
        >
          <Plus size={17} />
          {s.t("مشروع جديد", "New project")}
        </button>
        <button onClick={() => input.current?.click()}>
          <Upload size={17} />
          {s.t("استيراد JSON", "Import JSON")}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        accept=".json,application/json"
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {loading && (
        <p role="status">{s.t("تحميل المشاريع…", "Loading projects…")}</p>
      )}
      {error && (
        <p role="alert" className="ld-error">
          {error}
        </p>
      )}
      <div className="ld-projects">
        {projects.map((p) => (
          <article key={p.id}>
            <button
              className="ld-project-preview"
              aria-label={s.t("فتح ", "Open ") + p.name}
              onClick={async () => {
                await s.save();
                if (p.id !== s.doc.id) s.load(p);
              }}
            >
              <svg viewBox={`0 0 ${p.width} ${p.height}`}>
                <ProjectGraphic project={p} prefix={"project-" + p.id} />
              </svg>
            </button>
            <strong>{p.name}</strong>
            <small>{new Date(p.updated).toLocaleString(s.lang)}</small>
            <div className="ld-toolbar">
              <button
                aria-label={s.t("فتح ", "Open ") + p.name}
                onClick={async () => {
                  await s.save();
                  if (p.id !== s.doc.id) s.load(p);
                }}
              >
                <FolderOpen size={15} />
              </button>
              <button
                aria-label={s.t("نسخ ", "Duplicate ") + p.name}
                onClick={() => void duplicate(p)}
              >
                <Copy size={15} />
              </button>
              <button
                aria-label={s.t("حذف ", "Delete ") + p.name}
                onClick={() => void remove(p)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!loading && !projects.length && (
        <p className="ld-empty">
          {s.t(
            "أول تصميم هيتحفظ هنا تلقائيًا.",
            "Your first design will appear here automatically.",
          )}
        </p>
      )}
    </section>
  );
}
