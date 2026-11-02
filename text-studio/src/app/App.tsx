import { useEffect, useRef, useState } from "react";
import {
  Type,
  Palette,
  SlidersHorizontal,
  LayoutTemplate,
  Scan,
  WandSparkles,
  Undo2,
  Redo2,
  ShieldCheck,
  FolderOpen,
  Save,
  Trash2,
  Copy,
  X,
} from "lucide-react";
import { Header } from "../../../src/components/Header";
import { sitePages } from "../../../src/config/sitePages";
import { defaults, parseProject, type Lang } from "../core/model";
import { localFontCss, readyFonts } from "../core/fonts";
import { useDesignHistory } from "../core/history";
import { restoreDraft, saveDraft, DRAFT_KEY } from "../core/storage";
import { download, exportProject } from "../core/export";
import { TextSection } from "../pages/editor/sections/TextSection";
import { TypographySection } from "../pages/editor/sections/TypographySection";
import { AppearanceSection } from "../pages/editor/sections/AppearanceSection";
import { CanvasSection } from "../pages/editor/sections/CanvasSection";
import { TemplatesSection } from "../pages/templates/TemplatesSection";
import { ToolsSection } from "../pages/tools/ToolsSection";
import { Preview } from "../pages/editor/Preview";
import { ExportBar } from "../pages/editor/ExportBar";
import { tr } from "../pages/editor/sections/shared";
const sections = [
  { id: "text", ar: "النص", en: "Text", icon: Type, component: TextSection },
  {
    id: "templates",
    ar: "القوالب",
    en: "Templates",
    icon: LayoutTemplate,
    component: TemplatesSection,
  },
  {
    id: "type",
    ar: "الخطوط",
    en: "Typography",
    icon: SlidersHorizontal,
    component: TypographySection,
  },
  {
    id: "look",
    ar: "المظهر",
    en: "Appearance",
    icon: Palette,
    component: AppearanceSection,
  },
  {
    id: "canvas",
    ar: "اللوحة",
    en: "Canvas",
    icon: Scan,
    component: CanvasSection,
  },
  {
    id: "tools",
    ar: "أدوات النص",
    en: "Text tools",
    icon: WandSparkles,
    component: ToolsSection,
  },
];
export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
      try {
        return localStorage.getItem("unitool-lang") === "en" ? "en" : "ar";
      } catch {
        return "ar";
      }
    }),
    [mobileMenu, setMobileMenu] = useState(false);
  const initial = useRef<ReturnType<typeof restoreDraft> | null>(null);
  if (!initial.current) initial.current = restoreDraft();
  const { design, change, undo, redo, canUndo, canRedo } = useDesignHistory(
    initial.current.design,
  );
  const [tab, setTab] = useState("text"),
    [fontReady, setFontReady] = useState(false),
    [fontError, setFontError] = useState(false),
    [autoSave, setAutoSave] = useState(true),
    [saved, setSaved] = useState(""),
    [message, setMessage] = useState("");
  const hasEdited = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = sections.find((s) => s.id === tab)!,
    Section = active.component;
  useEffect(() => {
    let alive = true;
    readyFonts()
      .then(() => {
        if (alive) setFontReady(true);
      })
      .catch(() => {
        if (alive) setFontError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = tr(
      lang,
      "استوديو النصوص — UniTool",
      "Text Studio — UniTool",
    );
    try {
      localStorage.setItem("unitool-lang", lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    if (design !== initial.current!.design) hasEdited.current = true;
    if (!autoSave || !hasEdited.current) return;
    setSaved("pending");
    const timer = setTimeout(() => {
      try {
        saveDraft(design);
        setSaved("saved");
      } catch {
        setSaved("failed");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [design, autoSave]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,select,[contenteditable=true]")) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo]);
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100_000) throw Error("SIZE");
      const next = parseProject(JSON.parse(await file.text()));
      change(next);
      setMessage(tr(lang, "تم فتح المشروع.", "Project opened."));
    } catch {
      setMessage(
        tr(
          lang,
          "ملف مشروع غير صالح. اختر ملف JSON صادرًا من استوديو النصوص (حتى 100 KB).",
          "Invalid project. Choose a Text Studio JSON file, up to 100 KB.",
        ),
      );
    }
  }
  async function copyText() {
    try {
      await navigator.clipboard.writeText(design.text);
      setMessage(tr(lang, "تم نسخ النص.", "Text copied."));
    } catch {
      setMessage(
        tr(
          lang,
          "تعذر النسخ. يمكنك تحديد النص ونسخه يدويًا.",
          "Copy failed. Select your text and copy it manually.",
        ),
      );
    }
  }
  return (
    <>
      <style>{localFontCss}</style>
      <Header
        lang={lang}
        onToggleLang={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
        onOpenMobileMenu={() => setMobileMenu((v) => !v)}
      />
      {mobileMenu && (
        <div className="studio-mobile-nav">
          <button
            onClick={() => setMobileMenu(false)}
            aria-label={tr(lang, "إغلاق القائمة", "Close menu")}
          >
            <X size={20} />
          </button>
          {sitePages.map((p) => (
            <a key={p.href} href={p.href}>
              {p[lang]}
            </a>
          ))}
        </div>
      )}
      <main className="text-studio" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="studio-intro">
          <div>
            <div className="eyebrow">
              <span /> WORDS, WITH CHARACTER
            </div>
            <h1>
              {tr(lang, "استوديو النصوص", "Text Studio")}
              <span> ✦</span>
            </h1>
            <p>
              {tr(
                lang,
                "كلماتك، بشكل يشبهك.",
                "Your words. Your own kind of beautiful.",
              )}
            </p>
          </div>
          <div className="privacy">
            <ShieldCheck size={18} />
            <span>
              {tr(lang, "نصك لا يغادر جهازك", "Your words stay on your device")}
              <small>
                {tr(
                  lang,
                  "بلا حساب · بلا رفع · خطوط محلية",
                  "No account · No uploads · Local fonts",
                )}
              </small>
            </span>
          </div>
        </div>
        <div className="workspace-toolbar">
          <div className="toolbar-group">
            <button
              disabled={!canUndo}
              onClick={undo}
              title="Ctrl/Cmd+Z"
              aria-label={tr(lang, "تراجع", "Undo")}
            >
              <Undo2 size={17} />
            </button>
            <button
              disabled={!canRedo}
              onClick={redo}
              title="Ctrl/Cmd+Shift+Z"
              aria-label={tr(lang, "إعادة", "Redo")}
            >
              <Redo2 size={17} />
            </button>
            <span className="toolbar-divider" />
            <button
              onClick={() => {
                if (
                  confirm(
                    tr(
                      lang,
                      "استبدال التصميم الحالي بتصميم البداية؟ يمكنك التراجع.",
                      "Replace the current design with the starting design? You can undo.",
                    ),
                  )
                )
                  change({ ...defaults });
              }}
            >
              {tr(lang, "تصميم جديد", "New design")}
            </button>
          </div>
          <div className="toolbar-group">
            <button onClick={() => inputRef.current?.click()}>
              <FolderOpen size={16} />
              {tr(lang, "فتح مشروع", "Open project")}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              aria-label={tr(lang, "ملف المشروع", "Project file")}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void importFile(file);
              }}
            />
            <button onClick={() => exportProject(design)}>
              <Save size={16} />
              {tr(lang, "حفظ مشروع", "Save project")}
            </button>
          </div>
        </div>
        <div className="studio-workspace">
          <aside className="controls-panel">
            <nav
              className="section-tabs"
              aria-label={tr(
                lang,
                "أقسام استوديو النصوص",
                "Text Studio sections",
              )}
            >
              {sections.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  aria-pressed={tab === s.id}
                  onClick={() => setTab(s.id)}
                >
                  <s.icon size={18} />
                  <span>{tr(lang, s.ar, s.en)}</span>
                </button>
              ))}
            </nav>
            <div className="section-content">
              <div className="section-heading">
                <span>
                  {String(sections.indexOf(active) + 1).padStart(2, "0")}
                </span>
                <h2>{tr(lang, active.ar, active.en)}</h2>
              </div>
              <Section design={design} change={change} lang={lang} />
            </div>
            <div className="local-save">
              <label className="check">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => {
                    setAutoSave(e.target.checked);
                    setSaved("");
                  }}
                />
                {tr(
                  lang,
                  "حفظ تلقائي في هذا المتصفح",
                  "Auto-save in this browser",
                )}
              </label>
              <span role="status">
                {saved === "saved"
                  ? tr(lang, "تم الحفظ محليًا", "Saved locally")
                  : saved === "pending"
                    ? tr(lang, "جارٍ الحفظ…", "Saving…")
                    : saved === "failed"
                      ? tr(
                          lang,
                          "تعذر الحفظ، نزّل ملف المشروع.",
                          "Save failed; download your project.",
                        )
                      : tr(
                          lang,
                          "ملف المشروع أفضل نسخة احتياطية.",
                          "A project file is the best backup.",
                        )}
              </span>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem(DRAFT_KEY);
                    setAutoSave(false);
                    setSaved("");
                    setMessage(
                      tr(
                        lang,
                        "تم حذف النسخة المحفوظة وتعطيل الحفظ التلقائي. التصميم الحالي لم يُحذف.",
                        "Saved draft removed and auto-save disabled. The current design is unchanged.",
                      ),
                    );
                  } catch {
                    setMessage(
                      tr(
                        lang,
                        "تعذر حذف الحفظ المحلي.",
                        "Could not remove local draft.",
                      ),
                    );
                  }
                }}
              >
                <Trash2 size={13} />
                {tr(lang, "حذف النسخة المحلية", "Remove local draft")}
              </button>
            </div>
          </aside>
          <div className="output-panel">
            <Preview design={design} lang={lang} fontReady={fontReady} />
            <ExportBar design={design} lang={lang} fontReady={fontReady} />
            <div className="text-actions">
              <button onClick={copyText}>
                <Copy size={15} />
                {tr(lang, "نسخ النص فقط", "Copy plain text")}
              </button>
              <button
                onClick={() =>
                  download(
                    new Blob([design.text], {
                      type: "text/plain;charset=utf-8",
                    }),
                    "unitool-text.txt",
                  )
                }
              >
                {tr(lang, "تحميل TXT", "Download TXT")}
              </button>
            </div>
          </div>
        </div>
        {!fontReady && (
          <p className="notice" role="status">
            {fontError
              ? tr(
                  lang,
                  "تعذر تحميل الخطوط المحلية. أعد تحميل الصفحة قبل التصدير.",
                  "Local fonts failed to load. Reload before exporting.",
                )
              : tr(
                  lang,
                  "جارٍ تجهيز الخطوط المحلية…",
                  "Preparing local fonts…",
                )}
          </p>
        )}
        {initial.current.warning && (
          <p className="notice warning">
            {tr(
              lang,
              "تعذر استعادة نسخة محلية سليمة. فتحنا تصميم البداية؛ يمكنك استيراد ملف مشروعك.",
              "Could not restore a valid local draft. A starting design is open; you can import a project file.",
            )}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <footer className="studio-footer">
          <span>UniTool / TEXT STUDIO</span>
          <p>
            {tr(
              lang,
              "تنسيق محلي، مش توليد بالذكاء الاصطناعي. الخطوط مضمّنة، ولا توجد طلبات لخدمات خارجية من هذه الصفحة.",
              "Local typography, not AI generation. Bundled fonts. This page makes no requests to external services.",
            )}
          </p>
        </footer>
      </main>
    </>
  );
}
