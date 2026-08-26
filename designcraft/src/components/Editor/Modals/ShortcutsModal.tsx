import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useDcLang();
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Z', desc: t.scUndo },
    { key: 'Ctrl + Y / Ctrl + Shift + Z', desc: t.scRedo },
    { key: 'Delete / Backspace', desc: t.scDelete },
    { key: 'Ctrl + C', desc: t.scCopy },
    { key: 'Ctrl + V', desc: t.scPaste },
    { key: 'Ctrl + D', desc: t.scDuplicate },
    { key: 'Ctrl + A', desc: t.scSelectAll },
    { key: 'Esc', desc: t.scDeselect },
    { key: 'Arrow Keys', desc: t.scMove1 },
    { key: 'Shift + Arrow Keys', desc: t.scMove10 },
    { key: 'Ctrl + S', desc: t.scSave }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="shortcuts-modal"
        className="relative w-full max-w-md bg-[#1C2541] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-[#0B132B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">{t.scTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[65vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B132B] border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-mono text-sky-300 font-bold shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
