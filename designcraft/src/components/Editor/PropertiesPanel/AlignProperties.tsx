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
  Move
} from 'lucide-react';

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
  return (
    <div className="space-y-4 pt-3 border-t border-slate-800">
      {/* Canvas Alignment */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">محاذاة في الكانفاس</label>
        <div className="grid grid-cols-6 gap-1 bg-[#0B132B] p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            title="محاذاة لليمين"
            onClick={() => onAlign('right')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex justify-center"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="توسيط أفقي"
            onClick={() => onAlign('center')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex justify-center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="محاذاة لليسار"
            onClick={() => onAlign('left')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex justify-center"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="محاذاة للأعلى"
            onClick={() => onAlign('top')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex justify-center"
          >
            <AlignStartVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="توسيط رأسي"
            onClick={() => onAlign('middle')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex justify-center"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="محاذاة للأسفل"
            onClick={() => onAlign('bottom')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex justify-center"
          >
            <AlignEndVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layer Hierarchy Actions */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">ترتيب الطبقات (Layer Ordering)</label>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            title="إحضار للمقدمة (Bring to Front)"
            onClick={onBringToFront}
            className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[10px]"
          >
            <ChevronsUp className="w-3.5 h-3.5 text-sky-400" />
            <span>للمقدمة</span>
          </button>
          <button
            type="button"
            title="تحريك للأمام (Bring Forward)"
            onClick={onBringForward}
            className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[10px]"
          >
            <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
            <span>للأمام</span>
          </button>
          <button
            type="button"
            title="تحريك للخلف (Send Backward)"
            onClick={onSendBackward}
            className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[10px]"
          >
            <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
            <span>للخلف</span>
          </button>
          <button
            type="button"
            title="إرسال للقاع (Send to Back)"
            onClick={onSendToBack}
            className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex flex-col items-center gap-1 text-[10px]"
          >
            <ChevronsDown className="w-3.5 h-3.5 text-sky-400" />
            <span>للقاع</span>
          </button>
        </div>
      </div>

      {/* Quick Action Buttons: Duplicate, Lock, Delete */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#0B132B] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white rounded-xl transition"
        >
          <Copy className="w-3.5 h-3.5 text-sky-400" />
          <span>تكرار</span>
        </button>

        <button
          type="button"
          onClick={onToggleLock}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border text-xs font-semibold rounded-xl transition ${
            isLocked
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-[#0B132B] hover:bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{isLocked ? 'مقفل' : 'قفل'}</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#0B132B] hover:bg-rose-900/30 border border-slate-700 hover:border-rose-500/50 text-xs font-semibold text-slate-300 hover:text-rose-300 rounded-xl transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>حذف</span>
        </button>
      </div>
    </div>
  );
};
