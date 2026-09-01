import React, { useState, useEffect } from 'react';
import { ProjectItem, DimensionPreset } from '../../types';
import { DIMENSION_PRESETS } from '../../data/presets';
import { PresetSilhouette } from './PresetSilhouette';
import {
  getSavedProjects,
  saveProjectToStorage,
  deleteProjectFromStorage
} from '../../utils/fabricHelpers';
import {
  Sparkles,
  ArrowRight,
  Maximize2,
  Lock,
  Unlock,
  Search,
  Clock,
  Trash2,
  Copy,
  FolderOpen,
  ArrowUpRight,
  Sliders,
  Plus,
  X,
  Globe
} from 'lucide-react';
import { getDcTranslation, DCLang } from '../../translations';

interface NewDesignScreenProps {
  onSelectPreset: (preset: DimensionPreset) => void;
  onCreateCustom: (data: {
    title: string;
    width: number;
    height: number;
    backgroundColor: string;
  }) => void;
  onOpenProject: (project: ProjectItem) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const navPages = [
  { href: '/index.html', key: 'home' },
  { href: '/app.html', key: 'tools' },
  { href: '/designcraft.html', key: 'designCraft' },
  { href: '/the-audio-reader.html', key: 'audioReader' },
] as const;

export const NewDesignScreen: React.FC<NewDesignScreenProps> = ({
  onSelectPreset,
  onCreateCustom,
  onOpenProject,
  onShowToast
}) => {
  const [lang, setLang] = useState<DCLang>(() => {
    const shared = localStorage.getItem('unitool-lang');
    return shared === 'en' ? 'en' : 'ar';
  });
  const t = getDcTranslation(lang);

  const [activeTab, setActiveTab] = useState<'create' | 'projects'>('create');
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [selectedBg, setSelectedBg] = useState<string>('#FFFFFF');
  const [aspectLocked, setAspectLocked] = useState<boolean>(false);
  const [aspectRatioVal, setAspectRatioVal] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saved projects
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectSearch, setProjectSearch] = useState<string>('');

  const dir = 'ltr';

  useEffect(() => {
    try {
      const saved = getSavedProjects();
      setProjects(saved || []);
    } catch (e) {
      setProjects([]);
    }
  }, []);

  const toggleLang = () => {
    const next: DCLang = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
    localStorage.setItem('unitool-lang', next);
  };

  const handleWidthChange = (val: number) => {
    const safeVal = Math.max(50, Math.min(val, 5000));
    setCustomWidth(safeVal);
    if (aspectLocked && aspectRatioVal > 0) {
      setCustomHeight(Math.round(safeVal / aspectRatioVal));
    }
  };

  const handleHeightChange = (val: number) => {
    const safeVal = Math.max(50, Math.min(val, 5000));
    setCustomHeight(safeVal);
    if (aspectLocked && aspectRatioVal > 0) {
      setCustomWidth(Math.round(safeVal * aspectRatioVal));
    }
  };

  const setRatioPreset = (w: number, h: number, titleAr: string, titleEn: string) => {
    setCustomWidth(w);
    setCustomHeight(h);
    setAspectRatioVal(w / (h || 1));
    if (!customTitle) {
      setCustomTitle(lang === 'ar' ? titleAr : titleEn);
    }
  };

  const toggleAspectLock = () => {
    if (!aspectLocked) {
      setAspectRatioVal(customWidth / (customHeight || 1));
    }
    setAspectLocked(!aspectLocked);
  };

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const finalW = Math.max(100, Math.min(customWidth, 5000));
    const finalH = Math.max(100, Math.min(customHeight, 5000));
    onCreateCustom({
      title: customTitle.trim() || t.newDesignDefault,
      width: finalW,
      height: finalH,
      backgroundColor: selectedBg
    });
  };

  const handleDuplicateProject = (project: ProjectItem) => {
    const duplicated: ProjectItem = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${project.title} ${t.copySuffix}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveProjectToStorage(duplicated);
    setProjects(getSavedProjects());
    if (onShowToast) {
      onShowToast(t.toastDuplicated, duplicated.title, 'success');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = deleteProjectFromStorage(projectId);
    setProjects(updated);
    if (onShowToast) {
      onShowToast(t.toastDeleted, '', 'info');
    }
  };

  // Filter presets based on category and search query
  const filteredPresets = DIMENSION_PRESETS.filter((p) => {
    if (p.id === 'custom') return false;

    const categoryMatches =
      selectedCategory === 'all' ||
      (selectedCategory === 'google-play' && p.category === 'google-play') ||
      (selectedCategory === 'social' && p.category === 'social') ||
      (selectedCategory === 'video' && p.category === 'video');

    if (!categoryMatches) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.titleAr.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.width.toString().includes(q) ||
      p.height.toString().includes(q) ||
      p.aspectRatio.toLowerCase().includes(q)
    );
  });

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return DIMENSION_PRESETS.filter((p) => p.id !== 'custom').length;
    return DIMENSION_PRESETS.filter((p) => p.id !== 'custom' && p.category === catId).length;
  };

  const filteredProjects = projects.filter((p) => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.toLowerCase().trim();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      p.width.toString().includes(q) ||
      p.height.toString().includes(q)
    );
  });

  // Calculate live custom ratio text
  const customRatioNum = (customWidth / (customHeight || 1));
  const getCustomRatioLabel = () => {
    if (Math.abs(customRatioNum - 1) < 0.05) return t.ratioSquare;
    if (Math.abs(customRatioNum - 1.777) < 0.05) return t.ratioWide;
    if (Math.abs(customRatioNum - 0.5625) < 0.05) return t.ratioTall;
    if (Math.abs(customRatioNum - 2.048) < 0.05) return t.ratioBanner;
    if (customWidth > customHeight) return `${t.ratioLandscape} ${customRatioNum.toFixed(2)}:1`;
    return `${t.ratioPortrait} ${(1 / customRatioNum).toFixed(2)}:1`;
  };

  const linkStyle: React.CSSProperties = {
    fontSize: 13, textDecoration: 'none', padding: '6px 14px', borderRadius: 16,
    transition: 'all .25s',
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white antialiased" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
      {/* Navbar - matches index.html */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(7,8,11,.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid #1e2028',
      }}>
        <a href="/index.html" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', margin: 0, padding: 0, lineHeight: 0 }}>
          <img src="/UniTool_logo.png" alt="UniTool" style={{ width: 128, height: 'auto', objectFit: 'contain', margin: 0, padding: 0, border: 0, outline: 'none', display: 'block' }} />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Page Links */}
          <div className="hidden lg:flex items-center" style={{ gap: 6 }}>
            {navPages.map(p => {
              const active = window.location.pathname.endsWith(p.href);
              return (
                <a
                  key={p.href}
                  href={p.href}
                  style={{
                    ...linkStyle,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#a5b4fc' : '#7c7f8a',
                    background: active ? 'rgba(99,102,241,.12)' : 'transparent',
                    boxShadow: active ? '0 0 16px rgba(99,102,241,.35), inset 0 0 0 1px rgba(99,102,241,.25)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e4e6eb'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#7c7f8a'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  {t[p.key]}
                </a>
              );
            })}
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLang}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
              borderRadius: 20, border: '1px solid #1e2028', background: 'transparent',
              color: '#7c7f8a', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'all .2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2028'; e.currentTarget.style.color = '#7c7f8a'; }}
          >
            <Globe style={{ width: 14, height: 14, opacity: 0.6 }} />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1">
        {/* Main Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-6" style={{ paddingTop: 90, marginInlineStart: 'auto' }}>
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-[#0B132B] p-1.5 rounded-2xl border border-slate-700/70">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-lg shadow-sky-500/10'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.newDesign}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'projects'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-lg shadow-sky-500/10'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>{t.myProjects}</span>
              {projects.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'projects' ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {projects.length}
                </span>
              )}
            </button>
          </div>

          {/* Create New Design */}
          {activeTab === 'create' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Custom Dimension Box */}
              <section className="bg-[#141E38] border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-5">
                  {/* Header of custom size */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          <span>{t.customSizeTitle}</span>
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-400">
                          {t.customSizeDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="flex items-center gap-1.5 bg-[#0B132B] px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-sky-300">
                        <span className="text-slate-400 font-sans">{t.ratio}</span>
                        <span className="font-bold">{getCustomRatioLabel()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Form & Live Proportional Canvas Preview Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    {/* Preview Box */}
                    <div className="lg:col-span-4 bg-[#0B132B]/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 min-h-[170px] relative overflow-hidden">
                      <div className="w-full flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span>{t.sizePreview}</span>
                        </span>
                        <span className="font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {customWidth} × {customHeight} px
                        </span>
                      </div>

                      <div className="w-full h-28 flex items-center justify-center p-2 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />

                        <div
                          className="relative rounded-lg border-2 border-sky-400/80 flex flex-col items-center justify-center transition-all duration-300 shadow-lg shadow-sky-500/10 overflow-hidden"
                          style={{
                            aspectRatio: `${customWidth} / ${customHeight}`,
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: customWidth >= customHeight ? '100%' : `${Math.max(25, Math.min(100, Math.round((customWidth / customHeight) * 100)))}%`,
                            height: customHeight > customWidth ? '100%' : `${Math.max(25, Math.min(100, Math.round((customHeight / customWidth) * 100)))}%`,
                            backgroundColor: selectedBg
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
                            <div className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-sm ${
                              selectedBg === '#FFFFFF' ? 'text-slate-800 bg-white/90' : 'text-white bg-slate-950/70'
                            }`}>
                              {customWidth}×{customHeight}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full text-center">
                        <span className="text-[10px] text-slate-400 font-sans">
                          {t.aspectRatioLabel} {customRatioNum.toFixed(2)}:1 ({getCustomRatioLabel()})
                        </span>
                      </div>
                    </div>

                    {/* Form Controls */}
                    <form onSubmit={handleStartCustom} className="lg:col-span-8 space-y-4">
                      {/* Quick Fast-Click Aspect Presets */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-300">{t.quickSizes}</span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setRatioPreset(1024, 500, 'بانر جوجل بلاي', 'Google Play Banner')}
                            className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              customWidth === 1024 && customHeight === 500
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                                : 'bg-[#0B132B] hover:bg-[#152042] border-slate-700/80 text-slate-200'
                            }`}
                          >
                            <span className="font-bold text-emerald-400 text-[11px]">{t.googlePlay}</span>
                            <span className="text-[10px] text-slate-400 font-mono">1024 × 500</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRatioPreset(1080, 1080, 'منشور مربع', 'Square Post')}
                            className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              customWidth === 1080 && customHeight === 1080
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                                : 'bg-[#0B132B] hover:bg-[#152042] border-slate-700/80 text-slate-200'
                            }`}
                          >
                            <span className="font-bold text-white text-[11px]">{t.square1x1}</span>
                            <span className="text-[10px] text-slate-400 font-mono">1080 × 1080</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRatioPreset(1080, 1920, 'ستوري ريلز', 'Story Reels')}
                            className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              customWidth === 1080 && customHeight === 1920
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                                : 'bg-[#0B132B] hover:bg-[#152042] border-slate-700/80 text-slate-200'
                            }`}
                          >
                            <span className="font-bold text-pink-400 text-[11px]">{t.story9x16}</span>
                            <span className="text-[10px] text-slate-400 font-mono">1080 × 1920</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRatioPreset(1280, 720, 'يوتيوب فيديو', 'YouTube Video')}
                            className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              customWidth === 1280 && customHeight === 720
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                                : 'bg-[#0B132B] hover:bg-[#152042] border-slate-700/80 text-slate-200'
                            }`}
                          >
                            <span className="font-bold text-rose-400 text-[11px]">{t.youtube16x9}</span>
                            <span className="text-[10px] text-slate-400 font-mono">1280 × 720</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRatioPreset(512, 512, 'أيقونة تطبيق', 'App Icon')}
                            className={`col-span-2 sm:col-span-1 p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              customWidth === 512 && customHeight === 512
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                                : 'bg-[#0B132B] hover:bg-[#152042] border-slate-700/80 text-slate-200'
                            }`}
                          >
                            <span className="font-bold text-amber-400 text-[11px]">{t.icon512}</span>
                            <span className="text-[10px] text-slate-400 font-mono">512 × 512</span>
                          </button>
                        </div>
                      </div>

                      {/* Inputs Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Design Title */}
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-xs font-semibold text-slate-300">{t.designName}</label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder={t.designNamePlaceholder}
                            className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition min-h-[44px]"
                          />
                        </div>

                        {/* Width & Height + Lock Switch */}
                        <div className="sm:col-span-5 grid grid-cols-7 gap-2 items-end">
                          {/* Width */}
                          <div className="col-span-3 space-y-1">
                            <label className="text-[11px] font-semibold text-slate-300">{t.width}</label>
                            <input
                              type="number"
                              min="50"
                              max="5000"
                              value={customWidth}
                              onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                              className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-sky-500 transition min-h-[44px]"
                            />
                          </div>

                          {/* Aspect Lock Toggle */}
                          <div className="col-span-1 flex items-center justify-center pb-0.5">
                            <button
                              type="button"
                              onClick={toggleAspectLock}
                              title={aspectLocked ? t.unlockRatio : t.lockRatio}
                              className={`p-2 rounded-xl border transition min-h-[44px] flex items-center justify-center w-full ${
                                aspectLocked
                                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                  : 'bg-[#0B132B] border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {aspectLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Height */}
                          <div className="col-span-3 space-y-1">
                            <label className="text-[11px] font-semibold text-slate-300">{t.height}</label>
                            <input
                              type="number"
                              min="50"
                              max="5000"
                              value={customHeight}
                              onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                              className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-sky-500 transition min-h-[44px]"
                            />
                          </div>
                        </div>

                        {/* Start Design CTA Button */}
                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            className="w-full min-h-[44px] bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <span>{t.startDesign}</span>
                            <ArrowRight className="w-4 h-4" style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />
                          </button>
                        </div>
                      </div>

                      {/* Canvas Background Color Chooser */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/40 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 text-xs font-semibold">{t.canvasBg}</span>
                          <div className="flex items-center gap-2">
                            {[
                              { color: '#FFFFFF', label: t.bgWhite },
                              { color: '#0B132B', label: t.bgNavy },
                              { color: '#1E293B', label: t.bgGray },
                              { color: '#0369A1', label: t.bgOcean },
                              { color: '#4C1D95', label: t.bgPurple },
                              { color: '#064E3B', label: t.bgEmerald }
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => setSelectedBg(c.color)}
                                title={c.label}
                                className={`w-7 h-7 rounded-full border transition hover:scale-110 shadow-sm ${
                                  selectedBg === c.color ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-[#141E38] scale-110' : 'border-slate-600'
                                }`}
                                style={{ backgroundColor: c.color }}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
                        >
                          <span>{t.openWorkspace} ({customWidth}×{customHeight}px)</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </section>

              {/* Presets Catalog Section */}
              <section className="space-y-4">
                {/* Section Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141E38] p-3.5 sm:p-4 rounded-2xl border border-slate-700/70">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {t.libraryTitle}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {t.libraryDesc}
                      </p>
                    </div>
                  </div>

                  {/* Search & Category Tabs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Search Input */}
                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full bg-[#0B132B] border border-slate-700 rounded-xl ps-8 pe-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Category Pills with counts */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
                      {[
                        { id: 'all', label: t.catAll },
                        { id: 'google-play', label: t.catGooglePlay },
                        { id: 'social', label: t.catSocial },
                        { id: 'video', label: t.catVideo }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition min-h-[34px] flex items-center gap-1.5 ${
                            selectedCategory === cat.id
                              ? 'bg-sky-500 text-white font-bold shadow-sm'
                              : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                            selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {getCategoryCount(cat.id)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid of Dimension Preset Cards */}
                {filteredPresets.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#141E38] border border-dashed border-slate-700/80 space-y-3">
                    <Maximize2 className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">{t.noResults}</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                      className="text-xs text-sky-400 hover:underline font-bold"
                    >
                      {t.resetFilters}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                    {filteredPresets.map((preset) => {
                      const isGp = preset.category === 'google-play';
                      const isVideo = preset.category === 'video';
                      const isSocial = preset.category === 'social';

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onSelectPreset(preset)}
                          className="p-3 sm:p-4 rounded-2xl bg-[#141E38]/90 hover:bg-[#192444] border border-slate-700/80 hover:border-sky-400/90 transition-all duration-200 text-start flex items-center gap-3.5 group shadow-sm hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-0.5 active:scale-[0.98] w-full"
                        >
                          <PresetSilhouette
                            width={preset.width}
                            height={preset.height}
                            category={preset.category}
                            icon={preset.icon}
                          />

                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2">
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1">
                                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition truncate">
                                  {lang === 'ar' ? preset.titleAr : preset.title}
                                </h4>

                                {isGp && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-mono border border-emerald-500/30 shrink-0 font-bold">
                                    Google Play
                                  </span>
                                )}
                                {isVideo && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[9px] font-mono border border-rose-500/30 shrink-0 font-bold">
                                    YouTube
                                  </span>
                                )}
                                {isSocial && (
                                  <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[9px] font-mono border border-pink-500/30 shrink-0 font-bold">
                                    Social
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                                {lang === 'ar' ? (preset.descriptionAr || preset.description) : (preset.description || preset.descriptionAr)}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                              <span className="text-[11px] sm:text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                                {preset.width} × {preset.height} px
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-[#0B132B] px-2 py-0.5 rounded-md border border-slate-700/70">
                                {preset.aspectRatio}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Saved Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141E38] p-4 rounded-2xl border border-slate-700/70">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.savedProjects} ({projects.length})</h3>
                    <p className="text-xs text-slate-400">{t.savedProjectsDesc}</p>
                  </div>
                </div>

                {projects.length > 0 && (
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder={t.searchProjects}
                      className="w-full bg-[#0B132B] border border-slate-700 rounded-xl ps-8 pe-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-[#141E38] border border-dashed border-slate-700/80 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-white">{t.noProjects}</h3>
                    <p className="text-xs text-slate-400">
                      {t.noProjectsDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 transition cursor-pointer"
                  >
                    {t.createNow}
                  </button>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#141E38] border border-slate-700 space-y-2">
                  <p className="text-sm text-slate-300">{t.noProjectResults} "{projectSearch}"</p>
                  <button
                    type="button"
                    onClick={() => setProjectSearch('')}
                    className="text-xs text-sky-400 hover:underline font-bold"
                  >
                    {t.clearSearch}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProjects.map((p) => (
                    <div
                      key={p.id}
                      className="group rounded-2xl bg-[#141E38] border border-slate-700/80 hover:border-sky-400 overflow-hidden transition shadow-lg flex flex-col justify-between"
                    >
                      {/* Thumbnail Preview */}
                      <div
                        onClick={() => onOpenProject(p)}
                        className="relative aspect-video bg-[#070D1E] cursor-pointer overflow-hidden flex items-center justify-center border-b border-slate-800"
                      >
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <PresetSilhouette
                              width={p.width}
                              height={p.height}
                              category={p.category}
                              className="w-12 h-12"
                            />
                            <span className="text-[10px] font-mono text-slate-400">
                              {p.width} × {p.height} px
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-xs">
                          <span className="px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg transform group-hover:scale-105 transition">
                            {t.continueEditing}
                          </span>
                        </div>
                      </div>

                      {/* Metadata & Actions */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => onOpenProject(p)}
                            className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-sky-300 transition flex-1"
                          >
                            {p.title}
                          </h4>
                          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shrink-0">
                            {p.width}×{p.height}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-700/60">
                          <span>{new Date(p.updatedAt || p.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateProject(p)}
                              title={t.duplicateProject}
                              className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(p.id)}
                              title={t.deleteProject}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
