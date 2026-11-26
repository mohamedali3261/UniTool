import {
  Shirt,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Download,
  Save,
  FolderOpen,
  Sun,
  Moon,
} from "lucide-react";
export function TopBar({
  name,
  rename,
  undo,
  redo,
  canUndo,
  canRedo,
  save,
  load,
  exportOpen,
  ar,
  dark,
  toggleDark,
  focus,
  toggleFocus,
}: {
  name: string;
  rename: (s: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  save: () => void;
  load: () => void;
  exportOpen: () => void;
  ar: boolean;
  dark: boolean;
  toggleDark: () => void;
  focus: boolean;
  toggleFocus: () => void;
}) {
  return (
    <header className="ps-topbar">
      <div className="ps-brand">
        <span>
          <Shirt size={23} />
        </span>
        <div>
          <h1>{ar ? "استوديو المنتجات" : "Product Studio"}</h1>
          <small>DESIGN IT. WEAR IT. MAKE IT YOURS.</small>
        </div>
      </div>
      <div className="ps-project-name">
        <span className="ps-dot" />
        <input
          aria-label={ar ? "اسم المشروع" : "Project name"}
          value={name}
          maxLength={80}
          onChange={(e) => rename(e.target.value)}
        />
      </div>
      <div className="ps-top-actions">
        <button
          title={ar ? "وضع التركيز" : "Focus workspace"}
          aria-pressed={focus}
          onClick={toggleFocus}
        >
          {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
        <button
          title={ar ? "تراجع Ctrl+Z" : "Undo Ctrl+Z"}
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 size={18} />
        </button>
        <button
          title={ar ? "إعادة Ctrl+Shift+Z" : "Redo Ctrl+Shift+Z"}
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 size={18} />
        </button>
        <i />
        <button title={ar ? "فتح مشروع" : "Open project"} onClick={load}>
          <FolderOpen size={18} />
        </button>
        <button
          title={ar ? "حفظ ملف المشروع" : "Save project file"}
          onClick={save}
        >
          <Save size={18} />
        </button>
        <button
          title={ar ? "تغيير المظهر" : "Toggle theme"}
          onClick={toggleDark}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="ps-primary" onClick={exportOpen}>
          <Download size={16} />
          <span>{ar ? "تصدير التصميم" : "Export design"}</span>
        </button>
      </div>
    </header>
  );
}
