import { SiteNavbar } from "../src/components/SiteNavbar";
/** أوامر المشروع العامة، من غير نسخة منفصلة لحالة التصميم. */
import {
  Undo2,
  Redo2,
  Save,
  Download,
  Sun,
  Moon,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { useDesigner } from "./state";
export default function TopBar() {
  const s = useDesigner();
  return (
    <>
      <SiteNavbar
        lang={s.lang}
        onToggleLang={() => s.setLang(s.lang === "ar" ? "en" : "ar")}
      />
      <header className="ld-topbar">
        <span className="ld-product-name">
          MARK<span> / LOGO DESIGNER</span>
        </span>
        <label className="ld-project-name">
          <input
            aria-label={s.t("اسم المشروع", "Project name")}
            maxLength={160}
            value={s.doc.name}
            onChange={(e) => s.commit((p) => ({ ...p, name: e.target.value }))}
          />
          <small role="status">
            {s.saveStatus === "saved"
              ? s.t("محفوظ على الجهاز", "Saved locally")
              : s.saveStatus === "error"
                ? s.t("تعذّر الحفظ التلقائي", "Autosave failed")
                : s.t("حفظ تلقائي…", "Autosaving…")}
          </small>
        </label>
        <div className="ld-top-actions">
          <button
            aria-label={s.t("تراجع", "Undo")}
            disabled={!s.history.past.length}
            onClick={() => s.dispatch({ type: "undo" })}
          >
            <Undo2 size={18} />
          </button>
          <button
            aria-label={s.t("إعادة", "Redo")}
            disabled={!s.history.future.length}
            onClick={() => s.dispatch({ type: "redo" })}
          >
            <Redo2 size={18} />
          </button>
          <span className="ld-divider" />
          <button
            aria-label={s.t("حفظ المشروع", "Save project")}
            onClick={() => void s.save()}
          >
            <Save size={18} />
          </button>
          <button
            aria-label={s.t("تبديل المظهر", "Toggle theme")}
            onClick={() => s.setTheme(s.theme === "dark" ? "light" : "dark")}
          >
            {s.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            aria-label={s.t("طي مكتبة الأدوات", "Toggle library")}
            onClick={() => {
              s.setLeftOpen(!s.leftOpen);
              if (window.innerWidth < 851) s.setRightOpen(false);
            }}
          >
            <PanelLeftClose size={18} />
          </button>
          <button
            aria-label={s.t("طي الخصائص", "Toggle properties")}
            onClick={() => {
              s.setRightOpen(!s.rightOpen);
              if (window.innerWidth < 851) s.setLeftOpen(false);
            }}
          >
            <PanelRightClose size={18} />
          </button>
          <button className="ld-primary" onClick={() => s.setModal("export")}>
            <Download size={17} />
            {s.t("تصدير", "Export")}
          </button>
        </div>
      </header>
    </>
  );
}
