import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  X,
  LoaderCircle,
  Check,
  Upload,
} from "lucide-react";
import { Context, type StudioContext } from "./context";
import { useWorkbook } from "./useWorkbook";
import { Shell } from "../components/Shell";
import { Modal } from "../components/Modal";
import { applyCells } from "../core/workbook";
import {
  csvBlob,
  download,
  importFile,
  projectBlob,
  xlsxBlob,
} from "../core/io";
import type { Lang, Selection, Workbook } from "../core/types";
import "../app/styles.css";
const Analytics = lazy(() => import("../pages/analytics/AnalyticsPage"));
const Editor = lazy(() => import("../pages/editor/EditorPage")),
  Functions = lazy(() => import("../pages/functions/FunctionsPage")),
  Templates = lazy(() => import("../pages/templates/TemplatesPage"));
function currentPage(): StudioContext["page"] {
  const hash = location.hash.slice(1);
  return hash === "functions" || hash === "templates" || hash === "analytics"
    ? hash
    : "editor";
}
export default function App() {
  const state = useWorkbook(),
    { book, update } = state,
    [lang, setLang] = useState<Lang>(() => {
      try {
        return localStorage.getItem("excel-studio.lang") === "en" ? "en" : "ar";
      } catch {
        return "ar";
      }
    }),
    t = (ar: string, en: string) => (lang === "ar" ? ar : en),
    [page, setPage] = useState(currentPage),
    [selection, setSelection] = useState<Selection>({
      anchor: "A8",
      end: "A8",
    }),
    [exportOpen, setExport] = useState(false),
    [pending, setPending] = useState<{
      book: Workbook;
      warning?: string;
    } | null>(null),
    [formula, setFormula] = useState<string | null>(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(""),
    input = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notice = useCallback((message: string) => {
      setToast(message);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 6000);
    }, []),
    navigate = (page: StudioContext["page"]) => {
      location.hash = page;
      setPage(page);
    };
  useEffect(() => {
    const handler = () => setPage(currentPage());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    if (state.error) {
      notice(state.error);
      state.setError("");
    }
  }, [state.error, notice]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        document.querySelector("dialog[open]") ||
        (e.target as HTMLElement)?.closest(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? state.redo() : state.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        state.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        download(projectBlob(book), book.name + ".unitool.json");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [book, state.undo, state.redo]);
  const performExport = async (kind: "xlsx" | "csv" | "json") => {
    setBusy(t("بنجهّز الملف…", "Preparing your file…"));
    try {
      const blob =
        kind === "xlsx"
          ? await xlsxBlob(book)
          : kind === "csv"
            ? csvBlob(book, book.active)
            : projectBlob(book);
      download(
        blob,
        book.name + (kind === "json" ? ".unitool.json" : "." + kind),
      );
      notice(t("الملف جاهز للتنزيل", "Your file is ready to download"));
      setExport(false);
    } catch (e: any) {
      notice(t("تعذر التصدير: ", "Export failed: ") + e.message);
    } finally {
      setBusy("");
    }
  };
  const openTemplate = (book: Workbook) => setPending({ book });
  const ctx: StudioContext = {
    lang,
    t,
    toggleLang: () => {
      const next = lang === "ar" ? "en" : "ar";
      setLang(next);
      try {
        localStorage.setItem("excel-studio.lang", next);
      } catch {
        notice("Language preference could not be saved.");
      }
    },
    book,
    update,
    notice,
    openTemplate,
    page,
    navigate,
    insertFormula: (raw) => setFormula(raw),
  };
  return (
    <Context.Provider value={ctx}>
      <Shell
        saveState={state.saveState}
        onImport={() => input.current?.click()}
        onExport={() => setExport(true)}
        undo={state.undo}
        redo={state.redo}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
      >
        <Suspense
          fallback={
            <div className="xs-loading">
              <LoaderCircle className="xs-spin" />
              {t("جاري فتح المساحة…", "Opening workspace…")}
            </div>
          }
        >
          {page === "analytics" ? (
            <Analytics />
          ) : page === "editor" ? (
            <Editor selection={selection} setSelection={setSelection} />
          ) : page === "functions" ? (
            <Functions />
          ) : (
            <Templates />
          )}
        </Suspense>
      </Shell>
      <input
        hidden
        ref={input}
        type="file"
        accept=".xlsx,.csv,.tsv,.txt,.json,.unitool"
        aria-label={t("استيراد ملف جدول", "Import spreadsheet file")}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(t("جاري قراءة الملف…", "Reading your file…"));
          try {
            const result = await importFile(file);
            setPending({
              book: result.book,
              warning: result.warnings.join("\n"),
            });
          } catch (err: any) {
            notice(err.message || t("تعذر فتح الملف", "Could not open file"));
          } finally {
            setBusy("");
          }
        }}
      />
      {exportOpen && (
        <Modal
          title={t("شغلك جاهز يطلع للنور.", "Your work, ready to go.")}
          onClose={() => !busy && setExport(false)}
        >
          <p className="xs-hint">
            {t(
              "اختار الصيغة المناسبة. التصفية للعرض فقط؛ ملف التصدير يحتوي كل البيانات.",
              "Choose a format. Display filters do not remove data from exports.",
            )}
          </p>
          <div className="xs-export-options">
            {[
              {
                id: "xlsx",
                icon: FileSpreadsheet,
                title: "Excel .xlsx",
                ar: "كل الأوراق + معادلات + تنسيق أساسي",
                en: "All sheets, formulas and basic styles",
              },
              {
                id: "csv",
                icon: FileText,
                title: "CSV .csv",
                ar: "قيم الورقة الحالية فقط، بدون تنسيق أو معادلات",
                en: "Current sheet values only, no formulas or styles",
              },
              {
                id: "json",
                icon: FileJson,
                title: "UniTool project",
                ar: "نسخة احتياطية تحفظ إعدادات الأداة كاملة",
                en: "Full-fidelity project backup for this tool",
              },
            ].map((o) => (
              <button
                disabled={!!busy}
                key={o.id}
                onClick={() => performExport(o.id as any)}
              >
                <o.icon size={25} />
                <span>
                  <b>{o.title}</b>
                  <small>{t(o.ar, o.en)}</small>
                </span>
                <Download size={16} />
              </button>
            ))}
          </div>
          <p className="xs-callout">
            {t(
              "ملف XLSX لا يتضمن الرسوم البيانية أو الماكرو. Excel يعيد حساب المعادلات عند فتحه.",
              "XLSX does not embed charts or macros. Excel recalculates formulas when opened.",
            )}
          </p>
        </Modal>
      )}
      {pending && (
        <Modal
          title={t("فتح جدول جديد؟", "Open a new workbook?")}
          onClose={() => setPending(null)}
        >
          <p>
            {t(
              "هيستبدل الملف المفتوح حاليًا. لو محتاجه، احفظ نسخة الأول. تقدر تتراجع بعد الفتح.",
              "This replaces your current workbook. Save a backup first if needed. You can also undo after opening.",
            )}
          </p>
          <div className="xs-callout">
            <b>{pending.book.name}</b>
            <p>
              {pending.book.sheets.length} {t("أوراق", "sheets")}
            </p>
          </div>
          {pending.warning && <p className="xs-hint">{pending.warning}</p>}
          <div className="xs-modal-actions">
            <button
              className="xs-button"
              onClick={() =>
                download(projectBlob(book), book.name + ".unitool.json")
              }
            >
              {t("تنزيل نسخة من الملف الحالي", "Back up current workbook")}
            </button>
            <button
              className="xs-button primary"
              onClick={() => {
                update(pending.book);
                setSelection({ anchor: "A8", end: "A8" });
                setPending(null);
                navigate("editor");
                notice(t("الجدول جاهز للتعديل", "Your table is ready to edit"));
              }}
            >
              {t("افتح الجدول", "Open workbook")}
            </button>
          </div>
        </Modal>
      )}
      {formula && (
        <Modal
          title={t("إدراج المعادلة؟", "Insert this formula?")}
          onClose={() => setFormula(null)}
        >
          <p>
            {t(
              "المثال هيُدرج في الخلية المختارة وقد يستبدل قيمتها الحالية. عدّل المراجع لتناسب بياناتك، وتجنب المرجع الدائري.",
              "This replaces the selected cell. Adjust references to your own data and avoid circular references.",
            )}
          </p>
          <code className="xs-signature" dir="ltr">
            {formula}
          </code>
          <p dir="ltr">
            {book.sheets.find((s) => s.id === book.active)?.name} !{" "}
            {selection.end}
          </p>
          <button
            className="xs-button primary"
            onClick={() => {
              update((b) =>
                applyCells(b, b.active, { [selection.end]: { raw: formula } }),
              );
              setFormula(null);
              navigate("editor");
            }}
          >
            {t("إدراج والانتقال للمحرر", "Insert & open editor")}
          </button>
        </Modal>
      )}
      {busy && (
        <div className="xs-busy" role="status">
          <LoaderCircle className="xs-spin" />
          {busy}
        </div>
      )}
      {toast && (
        <div className="xs-toast" role="status">
          <span>{toast}</span>
          <button
            className="xs-icon"
            onClick={() => setToast("")}
            aria-label={t("إخفاء الرسالة", "Dismiss message")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
