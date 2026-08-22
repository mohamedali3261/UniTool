import React, { useState } from 'react';
import {
  ArrowRight,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Download,
  Save,
  Check,
  Edit2,
  Grid,
  Keyboard,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Hand
} from 'lucide-react';

interface TopBarProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  onBackToDashboard: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onSave: () => void;
  onOpenShortcuts: () => void;
  isSaving?: boolean;
  width: number;
  height: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isPropertiesOpen?: boolean;
  onToggleProperties?: () => void;
  isPanMode?: boolean;
  onTogglePanMode?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onUpdateTitle,
  onBackToDashboard,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid,
  onToggleGrid,
  onOpenPreview,
  onOpenExport,
  onSave,
  onOpenShortcuts,
  isSaving,
  width,
  height,
  isSidebarOpen,
  onToggleSidebar,
  isPropertiesOpen,
  onToggleProperties,
  isPanMode,
  onTogglePanMode
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header
      id="editor-top-bar"
      className="h-12 bg-[#1C2541] border-b border-slate-700/70 px-2 sm:px-3 flex items-center justify-between z-30 shrink-0 select-none text-slate-100 font-sans gap-1 overflow-x-auto no-scrollbar"
    >
      {/* Left Section: Navigation & Title */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-1 p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition text-xs font-semibold"
          title="العودة للشاشة الرئيسية"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="hidden md:inline text-[11px]">الرئيسية</span>
        </button>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}

        <div className="h-4 w-px bg-slate-700/80 mx-0.5 hidden xs:block" />

        {/* Project Title */}
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              autoFocus
              onBlur={handleTitleSubmit}
              className="bg-[#0B132B] border border-sky-500 rounded-md px-2 py-0.5 text-xs text-white focus:outline-none w-28 sm:w-44 font-medium"
            />
            <button
              type="submit"
              className="p-1 bg-sky-600 text-white rounded-md hover:bg-sky-500 transition"
            >
              <Check className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <div
            onClick={() => {
              setTempTitle(title);
              setIsEditingTitle(true);
            }}
            className="group flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-800 transition max-w-[100px] xs:max-w-[130px] sm:max-w-[180px]"
          >
            <span className="text-xs font-bold text-white truncate">{title}</span>
            <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0 hidden sm:inline" />
            <span className="hidden lg:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-[#0B132B] text-sky-400 shrink-0">
              {width}×{height}
            </span>
          </div>
        )}
      </div>

      {/* Center Section: Canvas Tools (Undo/Redo, Zoom, Pan, Grid) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#0B132B] p-0.5 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="تراجع"
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="إعادة"
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pan Mode Toggle */}
        {onTogglePanMode && (
          <button
            type="button"
            onClick={onTogglePanMode}
            title={isPanMode ? 'إيقاف وضع تحريك الكانفاس (اليد)' : 'تفعيل وضع تحريك الكانفاس (اليد)'}
            className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
              isPanMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                : 'bg-[#0B132B] border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#0B132B] p-0.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={onZoomOut}
            title="تصغير"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            title="ملاءمة الشاشة"
            className="px-1 py-0.5 font-mono font-bold text-sky-400 hover:bg-slate-800 rounded text-[10px] sm:text-[11px] transition"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            title="تكبير"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid toggle */}
        <button
          type="button"
          onClick={onToggleGrid}
          title="إظهار / إخفاء الشبكة"
          className={`p-1.5 rounded-lg border transition text-xs hidden sm:flex items-center ${
            showGrid
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
              : 'bg-[#0B132B] border-slate-700/60 text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Section: Actions (Preview, Save, Export) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {onToggleProperties && (
          <button
            type="button"
            onClick={onToggleProperties}
            title={isPropertiesOpen ? 'إخفاء الخصائص' : 'إظهار الخصائص'}
            className={`p-1.5 rounded-lg border transition text-xs ${
              isPropertiesOpen
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-[#0B132B] border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Preview Button */}
        <button
          type="button"
          onClick={onOpenPreview}
          title="معاينة التصميم"
          className="p-1.5 sm:px-2.5 sm:py-1 bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline text-[11px]">معاينة</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          title="حفظ المشروع"
          className="p-1.5 sm:px-2.5 sm:py-1 bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-[11px]">{isSaving ? '...' : 'حفظ'}</span>
        </button>

        {/* Export CTA - Always Prominent on Mobile */}
        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-lg text-xs font-bold shadow-sm shadow-sky-500/20 transition active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">تصدير</span>
        </button>
      </div>
    </header>
  );
};
