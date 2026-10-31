/** مجمّع الأقسام والاختصارات؛ المشروع نفسه يأتي من الحالة المشتركة. */
import { useEffect, type ComponentType } from "react";
import {
  Shapes,
  Type,
  Palette,
  LayoutTemplate,
  Layers as LayersIcon,
  UploadCloud,
  Sparkles,
  Shirt,
  FolderOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DesignerProvider, useDesigner } from "./state";
import TopBar from "./TopBar";
import Canvas from "./Canvas";
import ShapeLibrary from "./ShapeLibrary";
import TextSection from "./TextSection";
import Colors from "./Colors";
import Templates from "./Templates";
import Layers from "./Layers";
import Properties from "./Properties";
import Upload from "./Upload";
import SmartAssistant from "./SmartAssistant";
import Mockups from "./Mockups";
import Projects from "./Projects";
import Export from "./Export";
import Help from "./Help";
const tabs = [
  {
    id: "library",
    ar: "عناصر",
    en: "Elements",
    icon: Shapes,
    view: ShapeLibrary,
  },
  {
    id: "templates",
    ar: "قوالب",
    en: "Templates",
    icon: LayoutTemplate,
    view: Templates,
  },
  { id: "text", ar: "نصوص", en: "Text", icon: Type, view: TextSection },
  { id: "colors", ar: "ألوان", en: "Colors", icon: Palette, view: Colors },
  { id: "layers", ar: "طبقات", en: "Layers", icon: LayersIcon, view: Layers },
  { id: "upload", ar: "رفع", en: "Upload", icon: UploadCloud, view: Upload },
  {
    id: "assistant",
    ar: "مساعد",
    en: "Assistant",
    icon: Sparkles,
    view: SmartAssistant,
  },
  { id: "mockups", ar: "نماذج", en: "Mockups", icon: Shirt, view: Mockups },
  {
    id: "projects",
    ar: "مشاريع",
    en: "Projects",
    icon: FolderOpen,
    view: Projects,
  },
];
function Workspace() {
  const s = useDesigner(),
    View: ComponentType =
      tabs.find((t) => t.id === s.tab)?.view || ShapeLibrary;
  useEffect(() => {
    try {
      if (!localStorage.getItem("logo-designer-tour")) s.setModal("help");
    } catch {}
  }, []);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (s.modal) return;
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]'))
        return;
      const ctrl = e.ctrlKey || e.metaKey,
        k = e.key.toLowerCase();
      if (ctrl && ["z", "y", "s", "d", "a"].includes(k)) {
        e.preventDefault();
        if (k === "z") s.dispatch({ type: e.shiftKey ? "redo" : "undo" });
        if (k === "y") s.dispatch({ type: "redo" });
        if (k === "s") void s.save();
        if (k === "d") s.duplicate();
        if (k === "a")
          s.setSelected(
            s.doc.nodes.filter((n) => !n.locked && !n.hidden).map((n) => n.id),
          );
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        s.remove();
      }
      if (e.key === "Escape") s.setSelected([]);
      if (k === "h") s.setHand(true);
      if (k === "v") s.setHand(false);
      if (e.key.startsWith("Arrow") && s.selected.length) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        s.commit((p) => ({
          ...p,
          nodes: p.nodes.map((n) =>
            s.selected.includes(n.id) && !n.locked
              ? {
                  ...n,
                  x:
                    n.x +
                    (e.key === "ArrowRight"
                      ? delta
                      : e.key === "ArrowLeft"
                        ? -delta
                        : 0),
                  y:
                    n.y +
                    (e.key === "ArrowDown"
                      ? delta
                      : e.key === "ArrowUp"
                        ? -delta
                        : 0),
                }
              : n,
          ),
        }));
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [s]);
  return (
    <div
      className={`ld-app ld-${s.theme} ${s.leftOpen ? "" : "ld-left-closed"} ${s.rightOpen ? "" : "ld-right-closed"}`}
      dir={s.lang === "ar" ? "rtl" : "ltr"}
    >
      <TopBar />
      <div className="ld-workspace">
        <nav
          className="ld-rail"
          aria-label={s.t("أدوات التصميم", "Design tools")}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              aria-label={s.t(t.ar, t.en)}
              aria-pressed={s.tab === t.id && s.leftOpen}
              onClick={() => {
                s.setTab(t.id);
                s.setLeftOpen(true);
                if (window.innerWidth < 851) s.setRightOpen(false);
              }}
            >
              <t.icon size={21} />
              <span>{s.t(t.ar, t.en)}</span>
            </button>
          ))}
          <button className="ld-rail-help" onClick={() => s.setModal("help")}>
            <HelpCircle size={21} />
            <span>{s.t("مساعدة", "Help")}</span>
          </button>
        </nav>
        {s.leftOpen && (
          <aside
            className="ld-library"
            aria-label={s.t("مكتبة الأدوات", "Tool library")}
          >
            <div className="ld-panel-title">
              <span>
                {s.t(
                  tabs.find((t) => t.id === s.tab)!.ar,
                  tabs.find((t) => t.id === s.tab)!.en,
                )}
              </span>
              <button
                aria-label={s.t("إغلاق المكتبة", "Close library")}
                onClick={() => s.setLeftOpen(false)}
              >
                {s.lang === "ar" ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </button>
            </div>
            <View />
          </aside>
        )}
        <main className="ld-center">
          <div className="ld-canvas-heading">
            <div>
              <span className="ld-live-dot" />{" "}
              {s.t("مساحتك الإبداعية", "YOUR CREATIVE SPACE")}
            </div>
            <span>
              01 / {s.doc.width} × {s.doc.height}
            </span>
          </div>
          <Canvas />
          <div className="ld-workspace-caption">
            <span>MADE TO BE YOURS.</span>
            <button onClick={() => s.setModal("help")}>
              {s.t("اسحب. جرّب. خلّيها أنت.", "Drag. Explore. Make your mark.")}
            </button>
          </div>
        </main>
        {s.rightOpen && (
          <aside
            className="ld-inspector"
            aria-label={s.t("خصائص التصميم", "Design properties")}
          >
            <Properties />
          </aside>
        )}
      </div>
      {s.notice && (
        <div role="status" className="ld-toast">
          {s.notice}
        </div>
      )}
      {s.modal === "export" && <Export />}
      {s.modal === "help" && <Help />}
    </div>
  );
}
export default function App() {
  return (
    <DesignerProvider>
      <Workspace />
    </DesignerProvider>
  );
}
