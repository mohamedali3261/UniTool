import { useEffect, useState } from "react";
import type { Project } from "../core/model";
import { drawArtwork } from "../core/artwork";
import {
  listProjects,
  saveProject,
  deleteProject,
  restoreProject,
  type SavedProject,
} from "../core/library";
export function LibraryPanel({
  project,
  open,
  ar,
}: {
  project: Project;
  open: (p: Project) => void;
  ar: boolean;
}) {
  const [items, setItems] = useState<SavedProject[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = () =>
    listProjects()
      .then(setItems)
      .catch((e) => setError(String(e)));
  useEffect(() => {
    void refresh();
  }, []);
  async function save(variant = false) {
    setBusy(true);
    try {
      const canvas = await drawArtwork(project.sides.front, 160);
      const p = structuredClone(project);
      if (variant) {
        p.name += " / color";
        p.color = project.color === "#eeeeee" ? "#496c50" : "#eeeeee";
      }
      await saveProject({
        id: crypto.randomUUID(),
        name: p.name,
        date: Date.now(),
        thumbnail: canvas.toDataURL(),
        project: p,
      });
      await refresh();
      if (variant) open(p);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "مكتبة المشاريع على جهازك" : "Local project library"}</h3>
      <div className="ps-chip-grid">
        <button disabled={busy} onClick={() => save()}>
          {ar ? "حفظ نسخة بالمكتبة" : "Save snapshot"}
        </button>
        <button disabled={busy} onClick={() => save(true)}>
          {ar ? "نسخة بلون آخر" : "New color version"}
        </button>
      </div>
      <small>
        {ar
          ? "النسخ محفوظة في هذا المتصفح فقط. نزّل ملف المشروع كنسخة احتياطية."
          : "Snapshots live in this browser only. Download project files for backup."}
      </small>
      <div className="ps-library-grid">
        {[...items]
          .sort((a, b) => b.date - a.date)
          .map((p) => (
            <article key={p.id}>
              <button
                onClick={async () => {
                  try {
                    open(restoreProject(p));
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                <img
                  src={p.thumbnail}
                  alt=""
                  style={{ background: p.project.color }}
                />
                <b>{p.name}</b>
                <small>
                  {new Date(p.date).toLocaleString(ar ? "ar" : "en")}
                </small>
              </button>
              <button
                onClick={async () => {
                  if (!confirm(ar ? "حذف النسخة؟" : "Delete snapshot?")) return;
                  try {
                    await deleteProject(p.id);
                    await refresh();
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                {ar ? "حذف" : "Delete"}
              </button>
            </article>
          ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
