import React, { useState } from 'react';
import { DIMENSION_PRESETS } from '../../data/presets';
import { DimensionPreset } from '../../types';
import { PresetSilhouette } from './PresetSilhouette';
import {
  X,
  Sliders,
  Sparkles,
  ArrowRight,
  Maximize2,
  Search
} from 'lucide-react';

interface NewDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (width: number, height: number, title: string, category: string) => void;
}

export const NewDesignModal: React.FC<NewDesignModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [selectedPreset, setSelectedPreset] = useState<DimensionPreset>(DIMENSION_PRESETS[0]);
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [designTitle, setDesignTitle] = useState<string>('تصميم جديد بدون عنوان');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalSearch, setModalSearch] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DimensionPreset) => {
    setSelectedPreset(preset);
    if (preset.id !== 'custom') {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalW = Math.max(100, Math.min(customWidth, 5000));
    const finalH = Math.max(100, Math.min(customHeight, 5000));
    const finalTitle = designTitle.trim() || selectedPreset.titleAr;
    onCreate(finalW, finalH, finalTitle, selectedPreset.title);
  };

  const filteredPresets = DIMENSION_PRESETS.filter((p) => {
    if (p.id === 'custom') return false;
    const categoryMatches =
      categoryFilter === 'all' ||
      (categoryFilter === 'google-play' && p.category === 'google-play') ||
      (categoryFilter === 'social' && p.category === 'social') ||
      (categoryFilter === 'video' && p.category === 'video');

    if (!categoryMatches) return false;

    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase().trim();
    return (
      p.titleAr.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.width.toString().includes(q) ||
      p.height.toString().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="new-design-modal"
        className="relative w-full max-w-4xl bg-[#141E38] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/70 bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/25 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">اختيار مقاس لتصميم جديد</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">اختر من المقاسات المعتمدة أو حدد الأبعاد يدوياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Design Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">اسم التصميم</label>
            <input
              type="text"
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              placeholder="مثال: بانر تخفيضات رمضان 2026"
              className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition min-h-[42px]"
            />
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-700/60">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'google-play', label: 'جوجل بلاي' },
                { id: 'social', label: 'سوشيال ميديا' },
                { id: 'video', label: 'فيديو ويوتيوب' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                    categoryFilter === cat.id
                      ? 'bg-sky-500 text-white font-bold shadow-xs'
                      : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="بحث في المقاسات..."
                className="w-full bg-[#0B132B] border border-slate-700 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Presets Grid with Miniature Aspect Ratio Frame */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredPresets.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`relative text-right p-3 rounded-2xl border transition-all flex items-center gap-3 group ${
                    isSelected
                      ? 'bg-[#0B132B] border-sky-400 shadow-lg ring-2 ring-sky-500/30'
                      : 'bg-[#0B132B]/70 border-slate-800 hover:border-slate-600 hover:bg-[#0B132B]'
                  }`}
                >
                  {/* Aspect Ratio Miniature */}
                  <PresetSilhouette
                    width={preset.width}
                    height={preset.height}
                    category={preset.category}
                    icon={preset.icon}
                    className="w-12 h-12"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-sky-300">
                      {preset.titleAr}
                    </h4>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
                      <span className="text-[10px] font-mono text-sky-400 font-bold">
                        {preset.width} × {preset.height} px
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                        {preset.aspectRatio}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Size Form Section */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white">تخصيص الأبعاد يدوياً (Pixels)</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                المقاس الحالي: {customWidth} × {customHeight} px
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">العرض (px)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">الارتفاع (px)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-end pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    const temp = customWidth;
                    setCustomWidth(customHeight);
                    setCustomHeight(temp);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  تبديل الاتجاه ⟲
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-slate-700/70 bg-[#0B132B]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
          >
            إلغاء
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition transform active:scale-95 cursor-pointer"
          >
            <span>بدء التصميم في المحرر</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
