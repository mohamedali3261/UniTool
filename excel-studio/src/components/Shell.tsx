import {
  BarChart3,
  ArrowUpRight,
  BookOpen,
  Table2,
  LayoutTemplate,
  ChevronLeft,
  CheckCircle2,
  LoaderCircle,
  Download,
  Upload,
  Undo2,
  Redo2,
  PanelLeftClose,
} from "lucide-react";
import { useStudio } from "../app/context";
export function Shell({
  children,
  saveState,
  onImport,
  onExport,
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  children: React.ReactNode;
  saveState: string;
  onImport: () => void;
  onExport: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const { lang, t, book, update, page, navigate, toggleLang } = useStudio();
  return (
    <div className="xs-app" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="xs-sitebar">
        <a href="/index.html" className="xs-brand">
          <img src="/UniTool_logo.png" alt="UniTool" />
        </a>
        <span className="xs-site-separator" />
        <a href="/index.html">
          {t("كل الأدوات", "All tools")}
          <ArrowUpRight size={13} />
        </a>
        <span className="xs-private">
          ● {t("ملفاتك على جهازك", "Your files stay on your device")}
        </span>
        <button className="xs-lang" onClick={toggleLang}>
          {lang === "ar" ? "EN" : "عربي"}
        </button>
      </header>
      <div className="xs-workspace">
        <aside className="xs-sidebar">
          <a className="xs-product" href="#editor">
            <span>
              <Table2 size={23} />
            </span>
            <div>
              <b>Sheet Studio</b>
              <small>
                {t(
                  "أرقام مرتّبة. أفكار أوضح.",
                  "Clear numbers. Clearer thinking.",
                )}
              </small>
            </div>
          </a>
          <small className="xs-eyebrow">
            WORKSPACE / {t("مساحة العمل", "YOUR SPACE")}
          </small>
          <nav>
            {(
              [
                {
                  id: "analytics",
                  icon: BarChart3,
                  ar: "التحليل ولوحات المؤشرات",
                  en: "Analytics & dashboards",
                },
                {
                  id: "editor",
                  icon: Table2,
                  ar: "محرر الجداول",
                  en: "Spreadsheet editor",
                },
                {
                  id: "functions",
                  icon: BookOpen,
                  ar: "مكتبة المعادلات",
                  en: "Formula library",
                },
                {
                  id: "templates",
                  icon: LayoutTemplate,
                  ar: "قوالب جاهزة",
                  en: "Ready-made templates",
                },
              ] as const
            ).map((n) => (
              <button
                key={n.id}
                className={page === n.id ? "active" : ""}
                onClick={() => navigate(n.id)}
                aria-current={page === n.id ? "page" : undefined}
              >
                <n.icon size={18} />
                <span>{t(n.ar, n.en)}</span>
                <ChevronLeft size={14} />
              </button>
            ))}
          </nav>
          <div className="xs-sidebar-tip">
            <span>✦</span>
            <h3>{t("مش لازم تكون خبير", "You don’t need to be an expert")}</h3>
            <p>
              {t(
                "اختار خلية، اكتب بياناتك، وسيب الحسابات لمساعد المعادلات.",
                "Pick a cell, add your data and let the formula assistant do the math.",
              )}
            </p>
            <button onClick={() => navigate("functions")}>
              {t("اتعلّم معادلة جديدة", "Learn a new formula")} ←
            </button>
          </div>
          <footer>
            <span className="xs-online-dot" />{" "}
            {t("بدون حساب • حفظ محلي", "No account · Local saves")}
            <small>BUILT FOR YOUR EVERYDAY</small>
          </footer>
        </aside>
        <div className="xs-main">
          <div className="xs-documentbar">
            <div className="xs-doc-title">
              <span className="xs-doc-icon">
                <Table2 size={20} />
              </span>
              <div>
                <input
                  aria-label={t("اسم الملف", "Workbook name")}
                  value={book.name}
                  maxLength={100}
                  onChange={(e) => update({ ...book, name: e.target.value })}
                />
                <small className={saveState === "error" ? "danger" : ""}>
                  {saveState === "saving" ? (
                    <LoaderCircle size={12} className="xs-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}{" "}
                  {saveState === "saved"
                    ? t(
                        "كل التغييرات محفوظة على الجهاز",
                        "All changes saved on this device",
                      )
                    : saveState === "saving"
                      ? t("جاري الحفظ…", "Saving…")
                      : t(
                          "الحفظ متعذر؛ صدّر نسخة",
                          "Save failed; export a backup",
                        )}
                </small>
              </div>
            </div>
            <div className="xs-doc-actions">
              <button
                className="xs-icon"
                onClick={undo}
                disabled={!canUndo}
                aria-label={t("تراجع", "Undo")}
                title={t("تراجع", "Undo")}
              >
                <Undo2 size={17} />
              </button>
              <button
                className="xs-icon"
                onClick={redo}
                disabled={!canRedo}
                aria-label={t("إعادة", "Redo")}
                title={t("إعادة", "Redo")}
              >
                <Redo2 size={17} />
              </button>
              <button className="xs-button xs-import" onClick={onImport}>
                <Upload size={16} />
                {t("استيراد", "Import")}
              </button>
              <button className="xs-button primary" onClick={onExport}>
                <Download size={16} />
                {t("تصدير الملف", "Export file")}
              </button>
            </div>
          </div>
          <div className="xs-page">{children}</div>
        </div>
      </div>
    </div>
  );
}
