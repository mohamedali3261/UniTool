import React, { useState, useEffect } from 'react';
import { ProjectItem, DimensionPreset } from '../../types';
import { DIMENSION_PRESETS } from '../../data/presets';
import { NewDesignModal } from './NewDesignModal';
import {
  getSavedProjects,
  saveProjectToStorage,
  deleteProjectFromStorage
} from '../../utils/fabricHelpers';
import {
  Plus,
  Search,
  Clock,
  Sparkles,
  FolderPlus,
  Trash2,
  Copy,
  ArrowUpRight,
  Maximize2,
  Palette
} from 'lucide-react';

interface DashboardHomeProps {
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

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onSelectPreset,
  onCreateCustom,
  onOpenProject,
  onShowToast
}) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Load saved projects on mount
  useEffect(() => {
    try {
      const saved = getSavedProjects();
      setProjects(saved || []);
    } catch (e) {
      setProjects([]);
    }
  }, []);

  const handleDuplicateProject = (project: ProjectItem) => {
    const duplicated: ProjectItem = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${project.title} (نسخة)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveProjectToStorage(duplicated);
    setProjects(getSavedProjects());
    if (onShowToast) {
      onShowToast('تم تكرار المشروع', duplicated.title, 'success');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = deleteProjectFromStorage(projectId);
    setProjects(updated);
    if (onShowToast) {
      onShowToast('تم حذف المشروع', 'تمت إزالة المشروع من قائمة المشاريع المحفوظة', 'info');
    }
  };

  const filteredProjects = (projects || []).filter((p) =>
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#1C2541]/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              DesignCraft <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono">STUDIO</span>
            </h1>
            <p className="text-[11px] text-slate-400">استوديو تصميم البنرات والسوشيال ميديا</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث في مشاريعك..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تصميم جديد</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-10">
        {/* Hero Banner with Preset Dimensions */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#1C2541] via-[#151e36] to-[#0B132B] border border-slate-700/60 p-4 md:p-5 overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white">
                اختر المقاس أو ابدأ تصميماً جديداً
              </h2>
            </div>

            {/* Presets Horizontal Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {DIMENSION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className="group p-2.5 rounded-xl bg-[#0B132B]/80 hover:bg-[#0B132B] border border-slate-800 hover:border-sky-500/60 transition flex flex-col items-center text-center gap-1.5 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-sky-500 text-slate-300 group-hover:text-white flex items-center justify-center transition">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-full">
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 truncate">
                      {preset.titleAr}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {preset.width}×{preset.height}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        <section className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">تصاميمي المحفوظة</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {filteredProjects.length}
              </span>
            </div>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> مشروع جديد
            </button>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#1C2541]/40 border border-dashed border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <FolderPlus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">لا توجد مشاريع سابقة بعد</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  ابدأ بإنشاء أول تصميم بنر احترافي وسيتم حفظ عملك تلقائياً في المتصفح.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء أول تصميم الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group relative rounded-2xl bg-[#1C2541] border border-slate-700/80 hover:border-sky-400 overflow-hidden transition shadow-lg flex flex-col justify-between"
                >
                  <div
                    onClick={() => onOpenProject(project)}
                    className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                        <Palette className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-mono">{project.width} × {project.height}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-1.5">
                        فتح في المحرر <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3
                        onClick={() => onOpenProject(project)}
                        className="text-sm font-bold text-white group-hover:text-sky-300 transition cursor-pointer truncate"
                      >
                        {project.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="font-mono">{project.category || `${project.width}x${project.height}`}</span>
                        <span>{new Date(project.updatedAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-700/60">
                      <button
                        type="button"
                        title="تكرار المشروع / Duplicate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProject(project);
                        }}
                        className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="حذف المشروع / Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* New Design Modal */}
      <NewDesignModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={(width, height, title) => {
          setIsNewModalOpen(false);
          onCreateCustom({
            title,
            width,
            height,
            backgroundColor: '#0B132B'
          });
        }}
      />
    </div>
  );
};
