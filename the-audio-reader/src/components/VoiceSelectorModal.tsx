import React, { useState, useMemo } from 'react';
import { 
  X, 
  Volume2, 
  Sparkles, 
  Check, 
  Play, 
  Search, 
  Info, 
  Globe, 
  Cpu, 
  SlidersHorizontal 
} from 'lucide-react';
import { DeviceVoice, ReaderSettings, UILanguage } from '../types';
import { getTranslation } from '../translations';
import { speechEngine } from '../utils/speechEngine';

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  voices: DeviceVoice[];
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

type FilterType = 'all' | 'arabic' | 'english';

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  voices,
  settings,
  onUpdateSettings,
}) => {
  const t = getTranslation(uiLang);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testingVoiceURI, setTestingVoiceURI] = useState<string | null>(null);

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      // 1. Language filter
      if (filter === 'arabic' && !v.isArabic) return false;
      if (filter === 'english' && !v.isEnglish) return false;

      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return v.name.toLowerCase().includes(q) || v.lang.toLowerCase().includes(q);
      }

      return true;
    });
  }, [voices, filter, searchQuery]);

  const arabicVoices = useMemo(() => voices.filter((v) => v.isArabic), [voices]);
  const englishVoices = useMemo(() => voices.filter((v) => v.isEnglish), [voices]);

  if (!isOpen) return null;

  const handleTestVoice = (voiceURI: string) => {
    setTestingVoiceURI(voiceURI);
    speechEngine.testVoice(voiceURI);
    setTimeout(() => {
      setTestingVoiceURI(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-950/80 animate-fade-in">
      <div 
        className="relative flex h-[85vh] max-h-[700px] w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        id="voice-selector-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-850 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-cairo">
                {t.voiceSelectorTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.voiceSelectorDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            id="close-voice-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Auto-detection Switch */}
        <div className="border-b border-slate-850 bg-slate-950/40 p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {t.autoDetectLangVoice}
                </p>
                <p className="text-[11px] text-slate-400">
                  {uiLang === 'ar'
                    ? 'يتم اختيار صوت عربي للفقرات العربية وصوت إنجليزي للفقرات الإنجليزية تلقائياً'
                    : 'Automatically selects Arabic voice for Arabic chunks and English voice for English.'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoVoiceSelect}
              onChange={(e) => onUpdateSettings({ autoVoiceSelect: e.target.checked })}
              className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
            />
          </label>
        </div>

        {/* Search & Filters */}
        <div className="p-4 space-y-3 border-b border-slate-850">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={uiLang === 'ar' ? 'بحث عن صوت معين...' : 'Search voice by name or code...'}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 ps-9 pe-3 text-xs text-white placeholder:text-slate-500 focus-ring"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {t.filterAll} ({voices.length})
              </button>
              <button
                onClick={() => setFilter('arabic')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  filter === 'arabic'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {t.filterArabic} ({arabicVoices.length})
              </button>
              <button
                onClick={() => setFilter('english')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  filter === 'english'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {t.filterEnglish} ({englishVoices.length})
              </button>
            </div>
          </div>
        </div>

        {/* Voices List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredVoices.length > 0 ? (
            filteredVoices.map((voice) => {
              const isSelectedAr = settings.selectedArabicVoiceURI === voice.voiceURI;
              const isSelectedEn = settings.selectedEnglishVoiceURI === voice.voiceURI;
              const isTesting = testingVoiceURI === voice.voiceURI;

              return (
                <div
                  key={voice.voiceURI}
                  className={`flex items-center justify-between rounded-2xl border p-3 sm:p-3.5 transition ${
                    isSelectedAr || isSelectedEn
                      ? 'border-indigo-500/50 bg-indigo-950/30'
                      : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      voice.isArabic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <Volume2 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-white truncate">
                          {voice.name}
                        </p>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                          {voice.lang}
                        </span>
                        {voice.isArabic && (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                            عربي
                          </span>
                        )}
                        {voice.isEnglish && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-blue-400">
                            EN
                          </span>
                        )}
                        {voice.isDefault && (
                          <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-400">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Test Voice Button */}
                    <button
                      onClick={() => handleTestVoice(voice.voiceURI)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        isTesting
                          ? 'bg-purple-600 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={t.testVoiceBtn}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span className="hidden sm:inline">{t.testVoiceBtn}</span>
                    </button>

                    {/* Set as Arabic Voice Button */}
                    {voice.isArabic && (
                      <button
                        onClick={() => onUpdateSettings({ selectedArabicVoiceURI: voice.voiceURI })}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                          isSelectedAr
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {isSelectedAr ? '✓ المفضل للعربية' : 'تعيين للعربية'}
                      </button>
                    )}

                    {/* Set as English Voice Button */}
                    {voice.isEnglish && (
                      <button
                        onClick={() => onUpdateSettings({ selectedEnglishVoiceURI: voice.voiceURI })}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                          isSelectedEn
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {isSelectedEn ? '✓ Selected EN' : 'Set as EN'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Info className="mx-auto h-8 w-8 text-slate-500" />
              <p>{t.noVoicesDetected}</p>
            </div>
          )}
        </div>

        {/* Modal Footer Hint */}
        <div className="border-t border-slate-850 bg-slate-950/60 p-4 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t.deviceVoiceHint}
          </p>
        </div>

      </div>
    </div>
  );
};
