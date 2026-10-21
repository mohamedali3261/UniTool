import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Copy,
  Trash2,
  Lock,
  Unlock,
  MoveVertical,
  Import
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface AlignPropertiesProps {
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

const PropCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, children }) => (
  <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xs overflow-hidden">
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-800/80 bg-white/[0.02]">
      <span className={`shrink-0 p-1 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</span>
      <h4 className="text-[10px] font-bold text-slate-200 truncate">{title}</h4>
    </div>
    <div className="p-2.5">{children}</div>
  </div>
);

export const AlignProperties: React.FC<AlignPropertiesProps> = ({
  onAlign,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  isLocked,
  onToggleLock
}) => {
  const { t } = useDcLang();
  return (
    <div className="space-y-2.5">
      {/* 1. Canvas alignment grid */}
      <PropCard
        title={t.apTitle}
        icon={<AlignCenter className="w-3 h-3 text-sky-300" />}
        iconBg="bg-sky-500/15"
      >
        <div className="grid grid-cols-6 gap-1">
          <button
            type="button"
            title={t.apAlignRight}
            onClick={() => onAlign('right')}
            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition flex justify-center"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t.apAlignCenterH}
            onClick={() => onAlign('center')}
            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition flex justify-center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t.apAlignLeft}
            onClick={() => onAlign('left')}
            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition flex justify-center"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            title={t.apAlignTop}
            onClick={() => onAlign('top')}
            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition flex justify-center"
          >
            <AlignStartVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t.apAlignCenterV}
            onClick={() => onAlign('middle')}
            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition flex justify-center"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t.apAlignBottom}
            onClick={() => onAlign('bottom')}
            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition flex justify-center"
          >
            <AlignEndVertical className="w-4 h-4" />
          </button>
        </div>
      </PropCard>

      {/* 2. Layer ordering */}
      <PropCard
        title={t.apLayerOrder}
        icon={<MoveVertical className="w-3 h-3 text-amber-300" />}
        iconBg="bg-amber-500/15"
      >
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            title={t.apBringFront}
            onClick={onBringToFront}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[9px] font-semibold"
          >
            <ChevronsUp className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.apToFront}</span>
          </button>
          <button
            type="button"
            title={t.apForward}
            onClick={onBringForward}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[9px] font-semibold"
          >
            <ArrowUp className="w-3.5 h-3.5 text-sky-300" />
            <span>{t.apToForward}</span>
          </button>
          <button
            type="button"
            title={t.apBackward}
            onClick={onSendBackward}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[9px] font-semibold"
          >
            <ArrowDown className="w-3.5 h-3.5 text-sky-300" />
            <span>{t.apToBackward}</span>
          </button>
          <button
            type="button"
            title={t.apToBack}
            onClick={onSendToBack}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[9px] font-semibold"
          >
            <ChevronsDown className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.apToBottom}</span>
          </button>
        </div>
      </PropCard>

      {/* 3. Quick actions: duplicate / lock / delete */}
      <PropCard
        title={t.apQuickActions}
        icon={<Import className="w-3 h-3 text-rose-300" />}
        iconBg="bg-rose-500/15"
      >
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-[10px] font-semibold text-slate-200 hover:text-white rounded-xl transition"
          >
            <Copy className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">{t.apDuplicate}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLock}
            className={`flex items-center justify-center gap-1 py-2 px-2 border text-[10px] font-semibold rounded-xl transition ${
              isLocked
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 hover:border-slate-600 text-slate-200'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Unlock className="w-3.5 h-3.5 shrink-0 text-emerald-300" />}
            <span className="truncate">{isLocked ? t.apLocked : t.apLock}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-900/60 hover:bg-rose-900/30 border border-slate-800 hover:border-rose-500/50 text-[10px] font-semibold text-slate-300 hover:text-rose-300 rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{t.apDelete}</span>
          </button>
        </div>
      </PropCard>
    </div>
  );
};
