import { useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Undo2,
  Redo2,
  HelpCircle,
  Save,
  FolderOpen,
} from "lucide-react";
import type { Translate } from "../../core/types";
export function DocumentBar({
  name,
  dirty,
  history,
  travel,
  load,
  exportFile,
  exportProject,
  importProject,
  busy,
  help,
  t,
}: {
  name: string;
  dirty: boolean;
  history: { undo: number; redo: number };
  travel: (redo?: boolean) => void;
  load: (f: File) => void;
  exportFile: () => void;
  exportProject: () => void;
  importProject: (f: File) => void;
  busy: string;
  help: () => void;
  t: Translate;
}) {
  const input = useRef<HTMLInputElement>(null),
    project = useRef<HTMLInputElement>(null);
  return (
    <div className="ps-documentbar">
      <div>
        <span className="ps-file-icon">
          <FileText size={20} />
        </span>
        <div>
          <strong title={name}>{name}</strong>
          <small>
            {dirty
              ? t(
                  "تعديلات غير محفوظة — صدّر نسخة",
                  "Unsaved changes — export a copy",
                )
              : t(
                  "الأصل محفوظ عندك، والتعديل على نسخة",
                  "Original stays intact. Work on a copy.",
                )}
          </small>
        </div>
      </div>
      <nav aria-label={t("أوامر المستند", "Document actions")}>
        <button
          className="ps-icon"
          disabled={!history.undo || !!busy}
          aria-label={t("تراجع", "Undo")}
          onClick={() => travel()}
        >
          <Undo2 size={17} />
        </button>
        <button
          className="ps-icon"
          disabled={!history.redo || !!busy}
          aria-label={t("إعادة", "Redo")}
          onClick={() => travel(true)}
        >
          <Redo2 size={17} />
        </button>
        <i />
        <button
          className="ps-icon"
          onClick={help}
          aria-label={t("دليل الاستخدام والحدود", "Guide and limitations")}
        >
          <HelpCircle size={17} />
        </button>
        <button
          className="ps-icon"
          disabled={!!busy}
          onClick={exportProject}
          aria-label={t("حفظ مشروع التعديلات", "Save annotation project")}
        >
          <Save size={17} />
        </button>
        <button
          className="ps-icon"
          disabled={!!busy}
          onClick={() => project.current?.click()}
          aria-label={t(
            "استعادة مشروع التعديلات",
            "Restore annotation project",
          )}
        >
          <FolderOpen size={17} />
        </button>
        <button
          className="ps-button"
          disabled={!!busy}
          onClick={() => input.current?.click()}
        >
          <Upload size={14} />
          {t("ملف آخر", "Another PDF")}
        </button>
        <button
          className="ps-button primary"
          disabled={!!busy}
          onClick={exportFile}
        >
          <Download size={15} />
          {busy || t("تصدير PDF", "Export PDF")}
        </button>
      </nav>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        aria-label={t("استبدال ملف PDF", "Replace PDF file")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) load(f);
        }}
      />
      <input
        ref={project}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label={t("ملف مشروع التعليقات", "Annotation project file")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) importProject(f);
        }}
      />
    </div>
  );
}
