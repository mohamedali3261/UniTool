import { useEffect, useRef, useState } from "react";
import type { fabric } from "fabric";
import type { ProjectItem } from "../types";
import { useDcLang } from "../hooks/useDcLang";
import { useStudio } from "./useStudio";
import type { PrintSettings } from "./core/faces";
import { ArrangeSection } from "./sections/ArrangeSection";
import { TextSection } from "./sections/TextSection";
import { BrandSection } from "./sections/BrandSection";
import { BoxSection } from "./sections/BoxSection";
import { PreflightSection } from "./sections/PreflightSection";
import { RecoverySection } from "./sections/RecoverySection";
import { BatchSection } from "./sections/BatchSection";
import { t } from "./sections/shared";
import "./advanced.css";
export function AdvancedTools({
  canvas,
  project,
  settings,
  onSettings,
  onChanged,
  onRestore,
  onFace,
  onSave,onEditStart,onEditEnd,
}: {
  canvas: fabric.Canvas | null;
  project: ProjectItem;
  settings: PrintSettings;
  onSettings: (s: PrintSettings) => void;
  onChanged: () => void;
  onEditStart:()=>void;onEditEnd:()=>void;
  onRestore: (p: ProjectItem) => Promise<void>;
  onFace: (index: number) => void;
  onSave: () => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar";
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState("arrange"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [clipboard, setClipboard] = useState<any>(null);
  const ref = useRef<HTMLDialogElement>(null),
    studio = useStudio(canvas, project);
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current,
      previous = document.activeElement as HTMLElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.isConnected && previous.focus();
    };
  }, [open]);
  async function run(fn: () => void | Promise<void>, edit = true) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if(edit)onEditStart();
      await fn();
      if(edit)onEditEnd();
      if (edit && canvas?.contextContainer) {
        canvas.requestRenderAll();
        onChanged();
        canvas.fire("studio:changed" as any);
      }
      setMessage(t(ar, "تمت العملية.", "Done."));
    } catch (error) {
      setMessage(
        t(
          ar,
          "تعذرت العملية. تأكد من تحديد العناصر المناسبة ومن توفر مساحة التخزين. ",
          "Operation failed. Check selection and available storage. ",
        ) + (error instanceof Error ? error.message : ""),
      );
    } finally {
      if(edit)onEditEnd();
      setBusy(false);
    }
  }
  const props = canvas
    ? { canvas, project, ar, run, revision: studio.revision }
    : null;
  const tabs = [
    ["arrange", "ترتيب ومقاسات", "Arrange & dimensions"],
    ["text", "تنسيق النص", "Text formatting"],
    ["brand", "الهوية", "Brand kit"],
    ["box", "أوجه العلبة", "Carton faces"],
    ["preflight", "فحص التصدير", "Export preflight"],
    ["recovery", "استرداد النسخ", "Recovery"],
    ["batch", "تصدير جماعي", "Batch export"],
  ];
  return (
    <>
      <div className="adv-toolbar" dir={ar ? "rtl" : "ltr"}>
        <button
          disabled={!canvas}
          onClick={() => {
            setOpen(true);
            setMessage("");
          }}
        >
          {t(ar, "أدوات المصمم المتقدمة", "Advanced designer tools")}
        </button>
        <span data-testid="design-save-status" role="status">
          {studio.saving
            ? t(ar, "جارٍ الحفظ في المتصفح…", "Saving in this browser…")
            : studio.dirty
              ? t(ar, "تعديلات غير محفوظة", "Unsaved changes")
              : t(ar, "لا توجد تعديلات غير محفوظة", "No unsaved changes")}
        </span>
        <span>
          {t(ar, "استرداد: ", "Recovery: ")}
          {studio.recoveryStatus === "saved"
            ? t(ar, "نسخة محلية محفوظة", "Local version saved")
            : studio.recoveryStatus === "failed"
              ? t(
                  ar,
                  "تعذر الحفظ — نزّل ملف المشروع",
                  "Save failed — download project",
                )
              : studio.recoveryStatus === "saving"
                ? t(ar, "جارٍ الحفظ", "Saving")
                : t(ar, "بانتظار التعديل", "Waiting for edits")}
        </span>
        {studio.dirty && (
          <button onClick={onSave}>{t(ar, "حفظ الآن", "Save now")}</button>
        )}
      </div>
      {open && (
        <dialog
          ref={ref}
          className="adv-dialog"
          aria-label={t(ar, "أدوات المصمم المتقدمة", "Advanced designer tools")}
          dir={ar ? "rtl" : "ltr"}
          onCancel={(e) => {
            e.preventDefault();
            if (!busy) setOpen(false);
          }}
        >
          <header>
            <h2>{t(ar, "أدوات المصمم المتقدمة", "Advanced designer tools")}</h2>
            <button disabled={busy} onClick={() => setOpen(false)}>
              {t(ar, "إغلاق الأدوات", "Close tools")}
            </button>
          </header>
          <nav>
            {tabs.map(([id, a, b]) => (
              <button
                key={id}
                disabled={busy}
                aria-pressed={tab === id}
                onClick={() => {
                  setTab(id);
                  setMessage("");
                }}
              >
                {t(ar, a, b)}
              </button>
            ))}
          </nav>
          <div className="adv-content">
            <fieldset disabled={busy}>
              {props && (
                <>
                  {tab === "arrange" && <ArrangeSection {...props} />}
                  {tab === "text" && (
                    <TextSection
                      {...props}
                      clipboard={clipboard}
                      setClipboard={setClipboard}
                    />
                  )}
                  {tab === "brand" && <BrandSection {...props} />}
                  {tab === "box" && (
                    <BoxSection
                      {...props}
                      settings={settings}
                      onSettings={onSettings}
                      onFace={(index) => {
                        setOpen(false);
                        onFace(index);
                      }}
                    />
                  )}
                  {tab === "preflight" && (
                    <PreflightSection {...props} safeMm={settings.safeMm} />
                  )}
                  {tab === "recovery" && (
                    <RecoverySection
                      {...props}
                      points={studio.points}
                      status={studio.recoveryStatus}
                      onRestore={onRestore}
                      checkpoint={studio.checkpoint}
                      refresh={studio.refresh}
                    />
                  )}
                  {tab === "batch" && <BatchSection {...props} />}
                </>
              )}
            </fieldset>
            {message && (
              <p className="adv-message" role="status">
                {message}
              </p>
            )}
            {busy && <p role="status">{t(ar, "جارٍ التنفيذ…", "Working…")}</p>}
          </div>
        </dialog>
      )}
    </>
  );
}
