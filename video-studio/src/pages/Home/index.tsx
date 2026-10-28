import { EffectsShowcase } from "./EffectsShowcase";
import { FeatureGrid } from "./FeatureGrid";
import { FormatGallery } from "./FormatGallery";
import { Hero } from "./Hero";
import {
  ArrowUpLeft,
  Clapperboard,
  Plus,
  FolderOpen,
  ShieldCheck,
  Scissors,
  Type,
  SlidersHorizontal,
  Music2,
  Layers,
  ArrowLeft,
  MonitorPlay,
  Film,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Project, durationOf, timeLabel } from "../../types";
export function Home({
  hasProject,
  project,
  onResume,
  onNew,
  onImport,
  onOpen,
  onEffects,
}: {
  hasProject: boolean;
  project: Project;
  onResume: () => void;
  onNew: (r?: string) => void;
  onImport: () => void;
  onOpen: () => void;
  onEffects: () => void;
}) {
  return (
    <div className="home-shell">
      <aside className="home-nav">
        <a className="brand" href="/">
          <div className="brand-icon">
            <Clapperboard size={23} />
          </div>
          <span>
            UniTool<small>VIDEO STUDIO</small>
          </span>
        </a>
        <div className="nav-caption">مساحتك الإبداعية</div>
        <button className="active">
          <MonitorPlay size={19} />
          الاستوديو
        </button>
        <button onClick={hasProject ? onResume : onOpen}>
          <FolderOpen size={19} />
          مشاريعي<small>{hasProject ? "01" : "00"}</small>
        </button>
        <button
          onClick={() =>
            document
              .getElementById("formats")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Layers size={19} />
          مقاسات جاهزة
        </button>
        <div className="nav-bottom">
          <div className="privacy-card">
            <ShieldCheck size={22} />
            <b>إبداعك، يفضل ملكك.</b>
            <p>
              كل المعالجة على جهازك.
              <br />
              بدون رفع ملفاتك أو علامة مائية.
            </p>
          </div>
          <a href="/">
            العودة إلى UniTool <ArrowUpLeft size={16} />
          </a>
        </div>
      </aside>
      <main className="home-main">
        <header className="home-header">
          <div className="breadcrumb">
            UniTool <ChevronLeft size={14} />
            <b>استوديو الفيديو</b>
          </div>
          <span className="local-badge">
            <i /> يعمل محليًا في متصفحك
          </span>
        </header>
        <Hero onNew={onNew} />
        <section className="quick-actions">
          <button onClick={onImport}>
            <div className="action-icon mint">
              <Plus />
            </div>
            <div>
              <h3>ارفع ملفاتك وابدأ</h3>
              <p>فيديو، صور، أو صوت… كله في مكان واحد</p>
            </div>
            <ArrowUpLeft />
          </button>
          <button onClick={onOpen}>
            <div className="action-icon purple">
              <FolderOpen />
            </div>
            <div>
              <h3>كمّل من آخر مرة</h3>
              <p>افتح ملف مشروع UniTool محفوظ على جهازك</p>
            </div>
            <ArrowUpLeft />
          </button>
        </section>
        <FormatGallery onNew={onNew} />
        <FeatureGrid onNew={onNew} />
        {hasProject && (
          <section className="resume-card" onClick={onResume}>
            <FolderOpen />
            <div>
              <b>{project.name}</b>
              <p>
                {timeLabel(durationOf(project))} • {project.clips.length} مقاطع
                • مشروع الجلسة الحالية
              </p>
            </div>
            <button className="secondary">
              متابعة التحرير <ArrowLeft size={16} />
            </button>
          </section>
        )}
        <EffectsShowcase onBrowse={onEffects} />
        <footer className="home-footer">
          <span>صُنع لتكون المسافة بين فكرتك وفيديوك… أقصر.</span>
          <b>
            UniTool <span>Video Studio</span>
          </b>
        </footer>
      </main>
    </div>
  );
}
