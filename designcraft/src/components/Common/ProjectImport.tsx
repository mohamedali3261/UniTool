import { useEffect, useRef, useState } from "react";
import type { ProjectItem } from "../../types";
import { parseProjectFile } from "../../utils/projectFile";
import { useDcLang } from "../../hooks/useDcLang";
export function ProjectImport({
  onImport, hideButton = false,
}: {
  onImport: (p: ProjectItem) => boolean | null | Promise<boolean | null>;
  hideButton?: boolean;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    ref = useRef<HTMLInputElement>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [temporaryId, setTemporaryId] = useState<string | null>(null);
  useEffect(() => {
    const saved = (event: Event) => { const d = (event as CustomEvent).detail; if (d?.ok && d.id === temporaryId) { setTemporaryId(null); setError(""); } };
    window.addEventListener("designcraft:saved", saved);
    return () => window.removeEventListener("designcraft:saved", saved);
  }, [temporaryId]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 45,
        width: 310,
        maxWidth: "calc(100vw - 24px)",
        pointerEvents: error ? "auto" : undefined,
      }}
    >
      {!hideButton && <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="px-3 py-2 text-xs text-white rounded-lg border border-sky-700 bg-slate-900"
      >
        {busy
          ? ar
            ? "جارٍ فتح المشروع…"
            : "Opening project…"
          : ar
            ? "استيراد مشروع قابل للتعديل"
            : "Import editable project"}
      </button>}
      <input
        id="designer-project-input"
        type="file"
        ref={ref}
        hidden
        accept=".json,application/json"
        aria-label={ar ? "ملف مشروع المصمم" : "Designer project file"}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            if (file.size > 32 * 1024 * 1024) throw Error("SIZE");
            const project = parseProjectFile(JSON.parse(await file.text()));
            const stored = await onImport(project);
            if (stored === null) return; // User declined leaving the current design.
            setTemporaryId(stored ? null : project.id);
            if (!stored) setError(ar
              ? "تم فتح المشروع للتعديل بدون حفظ دائم. المتصفح رفض التخزين؛ هذا لا يعني امتلاء الجهاز. نزّل ملف المشروع قبل إغلاق الصفحة."
              : "Project opened for editing without a durable save. Browser storage was refused; this does not mean your device is full. Download the project before closing this page.");
          } catch (cause) {
            setError(
              cause instanceof Error && cause.message === "STORAGE"
                ? ar
                  ? "مساحة التخزين المحلي غير كافية أو غير متاحة. لم نستبدل التصميم الحالي؛ حرّر مساحة ثم أعد الاستيراد."
                  : "Local storage is full or unavailable. Your current design was not replaced; free space and retry."
                : ar
                  ? "تعذر الاستيراد. اختر مشروع UniTool JSON صالحًا (حتى 32 MB)."
                  : "Import failed. Choose a valid UniTool JSON project, up to 32 MB.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && (
        <p
          role="alert"
          className="bg-slate-900 text-red-300 text-xs p-2 rounded-lg"
        >
          {error}
          <button type="button" onClick={() => setError("")} className="mt-2 block underline">{ar ? "فهمت" : "Understood"}</button>
        </p>
      )}
    </div>
  );
}
