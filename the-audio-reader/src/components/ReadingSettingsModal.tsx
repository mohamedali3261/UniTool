import React from 'react';
import { 
  X, 
  Settings, 
  Type, 
  Palette, 
  Volume2, 
  Highlighter, 
  RotateCcw, 
  Check, 
  Sparkles,
  MoveVertical
} from 'lucide-react';
import { FontFamily, HighlightMode, ReaderSettings, ThemeMode, UILanguage } from '../types';
import { getTranslation } from '../translations';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  settings,
  onUpdateSettings,
}) => {
  const t = getTranslation(uiLang);
  if (!isOpen) return null;

  const fontOptions: { id: FontFamily; label: string; sample: string }[] = [
    { id: 'cairo', label: t.fontCairo, sample: 'أبجد هوز Cairo' },
    { id: 'amiri', label: t.fontAmiri, sample: 'بسم الله Amiri' },
    { id: 'tajawal', label: t.fontTajawal, sample: 'معرفة وفكر Tajawal' },
    { id: 'sans', label: t.fontSans, sample: 'Modern Sans' },
    { id: 'serif', label: t.fontSerif, sample: 'Classic Serif' },
  ];

  const themeOptions: { id: ThemeMode; label: string; bg: string; text: string; border: string }[] = [
    { id: 'dark', label: t.themeDark, bg: 'bg-slate-950', text: 'text-slate-100', border: 'border-slate-800' },
    { id: 'midnight', label: t.themeMidnight, bg: 'bg-black', text: 'text-zinc-200', border: 'border-zinc-800' },
    { id: 'sepia', label: t.themeSepia, bg: 'bg-[#141210]', text: 'text-[#f0e6d2]', border: 'border-[#362e28]' },
    { id: 'light', label: t.themeLight, bg: 'bg-[#031e17]', text: 'text-[#e6f4f1]', border: 'border-[#0f4d3d]' },
  ];

  const highlightOptions: { id: HighlightMode; label: string }[] = [
    { id: 'sentence', label: t.highlightSentence },
    { id: 'word', label: t.highlightWord },
    { id: 'paragraph', label: t.highlightParagraph },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-950/80 animate-fade-in">
      <div 
        className="relative flex h-[85vh] max-h-[700px] w-full max-w-xl flex-col rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        id="reading-settings-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-850 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-cairo">
                {t.settingsTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            id="close-settings-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Section 1: Themes */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Palette className="h-4 w-4 text-indigo-400" />
              <span>{t.theme}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {themeOptions.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onUpdateSettings({ theme: th.id })}
                  className={`flex flex-col items-center justify-between rounded-2xl border p-3 text-center transition ${
                    settings.theme === th.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  } ${th.bg}`}
                >
                  <span className={`text-xs font-bold ${th.text}`}>
                    {th.label.split(' ')[0]}
                  </span>
                  {settings.theme === th.id && (
                    <span className="mt-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Typography & Font Family */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Type className="h-4 w-4 text-purple-400" />
              <span>{t.fontFamily}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fontOptions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateSettings({ fontFamily: f.id })}
                  className={`flex items-center justify-between rounded-xl border p-3 text-start transition ${
                    settings.fontFamily === f.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs">{f.label}</span>
                  {settings.fontFamily === f.id && <Check className="h-4 w-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Font Size & Line Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{t.fontSize}</span>
                <span className="text-indigo-400 font-mono">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={32}
                step={1}
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{t.lineHeight}</span>
                <span className="text-purple-400 font-mono">{settings.lineHeight}x</span>
              </div>
              <input
                type="range"
                min={1.4}
                max={2.4}
                step={0.1}
                value={settings.lineHeight}
                onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Section 4: Speech Rate Speed Gauge */}
          <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <span>{uiLang === 'ar' ? 'مؤشر سرعة القراءة الصوتية' : 'Speech Speed Gauge'}</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {settings.speechRate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.05}
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              title={uiLang === 'ar' ? 'مؤشر التحكم في السرعة' : 'Speed Slider'}
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.5x (بطيء)</span>
              <span>1.0x (عادي)</span>
              <span>2.0x (سريع)</span>
              <span>3.0x</span>
            </div>
          </div>

          {/* Section 5: Highlight Style */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Highlighter className="h-4 w-4 text-amber-400" />
              <span>{t.highlightStyle}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {highlightOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ highlightMode: opt.id })}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition ${
                    settings.highlightMode === opt.id
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Auto-Scroll Toggle */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <MoveVertical className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">{t.autoScroll}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => onUpdateSettings({ autoScroll: e.target.checked })}
                className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-850 p-4 sm:p-5 bg-slate-950/40">
          <button
            onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.resetSettings}</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
