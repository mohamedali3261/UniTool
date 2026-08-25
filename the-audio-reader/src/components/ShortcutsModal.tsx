import React from 'react';
import { X, Keyboard, Play, SkipForward, SkipBack, Volume2, Search, Settings } from 'lucide-react';
import { UILanguage } from '../types';
import { getTranslation } from '../translations';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  uiLang,
}) => {
  const t = getTranslation(uiLang);
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: t.shortcutSpace, icon: Play },
    { key: '→', desc: t.shortcutNext, icon: SkipForward },
    { key: '←', desc: t.shortcutPrev, icon: SkipBack },
    { key: 'Shift + →', desc: t.shortcutNextPage, icon: SkipForward },
    { key: 'Shift + ←', desc: t.shortcutPrevPage, icon: SkipBack },
    { key: 'M', desc: t.shortcutMute, icon: Volume2 },
    { key: 'Ctrl / Cmd + F', desc: t.shortcutSearch, icon: Search },
    { key: 'S', desc: t.shortcutSettings, icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-950/80 animate-fade-in">
      <div 
        className="relative flex h-auto max-h-[85vh] w-full max-w-md flex-col rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        id="shortcuts-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-850 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Keyboard className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white font-cairo">
              {t.shortcutsTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {shortcuts.map((sc, index) => {
            const Icon = sc.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-850 bg-slate-950/40 p-3 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon className="h-4 w-4 text-indigo-400" />
                  <span>{sc.desc}</span>
                </div>
                <kbd className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-[11px] font-bold text-slate-200 shadow-sm">
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-850 p-4 text-center bg-slate-950/40">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
