import React, { useState } from 'react';
import {
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  MoveRight,
  Heart,
  Award,
  Shapes,
  Palette,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { COLOR_PALETTES } from '../../../data/presets';

interface ElementsTabProps {
  onAddRectangle: (fill?: string, rx?: number) => void;
  onAddCircle: (fill?: string) => void;
  onAddTriangle: (fill?: string) => void;
  onAddStar: (fill?: string) => void;
  onAddLine: (stroke?: string) => void;
  onAddArrow: (stroke?: string) => void;
  onAddBadge: (fill?: string) => void;
  onAddHeart: (fill?: string) => void;
  onOpenShapesModal?: () => void;
}

export const ElementsTab: React.FC<ElementsTabProps> = ({
  onAddRectangle,
  onAddCircle,
  onAddTriangle,
  onAddStar,
  onAddLine,
  onAddArrow,
  onAddBadge,
  onAddHeart,
  onOpenShapesModal
}) => {
  const [selectedColor, setSelectedColor] = useState('#0284C7');

  const shapesList = [
    {
      id: 'rect',
      label: 'مستطيل',
      icon: <Square className="w-5 h-5" />,
      action: () => onAddRectangle(selectedColor, 0)
    },
    {
      id: 'rounded-rect',
      label: 'مستطيل دائري',
      icon: <div className="w-5 h-4 rounded-md border-2 border-current" />,
      action: () => onAddRectangle(selectedColor, 20)
    },
    {
      id: 'circle',
      label: 'دائرة',
      icon: <Circle className="w-5 h-5" />,
      action: () => onAddCircle(selectedColor)
    },
    {
      id: 'triangle',
      label: 'مثلث',
      icon: <Triangle className="w-5 h-5" />,
      action: () => onAddTriangle(selectedColor)
    },
    {
      id: 'star',
      label: 'نجمة',
      icon: <Star className="w-5 h-5" />,
      action: () => onAddStar(selectedColor)
    },
    {
      id: 'badge',
      label: 'شارة عرض',
      icon: <Award className="w-5 h-5" />,
      action: () => onAddBadge(selectedColor)
    },
    {
      id: 'line',
      label: 'خط مستقيم',
      icon: <Minus className="w-5 h-5" />,
      action: () => onAddLine(selectedColor)
    },
    {
      id: 'arrow',
      label: 'سهم توجيهي',
      icon: <MoveRight className="w-5 h-5" />,
      action: () => onAddArrow(selectedColor)
    },
    {
      id: 'heart',
      label: 'قلب',
      icon: <Heart className="w-5 h-5" />,
      action: () => onAddHeart(selectedColor)
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-3.5 overflow-y-auto pr-0.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Shapes className="w-3.5 h-3.5 text-sky-400" />
          <span>الأشكال والعناصر</span>
        </h3>
        {onOpenShapesModal && (
          <button
            type="button"
            onClick={onOpenShapesModal}
            className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-500/30 transition"
          >
            <Maximize2 className="w-3 h-3" />
            <span>+200 شكل</span>
          </button>
        )}
      </div>

      {/* Prominent Modal Opener Button */}
      {onOpenShapesModal && (
        <button
          type="button"
          onClick={onOpenShapesModal}
          className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-sky-600/30 to-blue-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-500/40 text-white font-bold text-xs flex items-center justify-between transition group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500 text-white shadow-sm group-hover:scale-110 transition">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>فتح مكتبة الأشكال المتقدمة</span>
          </div>
          <span className="text-[10px] font-mono bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full font-bold">
            +200
          </span>
        </button>
      )}

      {/* Color Pre-selector */}
      <div className="p-2.5 bg-[#0B132B] rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1 font-medium">
            <Palette className="w-3 h-3 text-sky-400" /> لون التعبئة
          </span>
          <span className="font-mono text-[10px] text-sky-400">{selectedColor}</span>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {COLOR_PALETTES.solids.slice(0, 16).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`w-5 h-5 rounded-md transition ${
                selectedColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Shapes Grid */}
      <div className="grid grid-cols-3 gap-2">
        {shapesList.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={shape.action}
            className="p-2 rounded-xl bg-[#0B132B] hover:bg-[#151e36] border border-slate-800 hover:border-sky-400 text-slate-200 hover:text-sky-300 transition flex flex-col items-center justify-center gap-1.5 group shadow-xs"
          >
            <div className="p-1.5 rounded-lg bg-slate-800/80 group-hover:bg-sky-500/20 text-sky-400 transition">
              {shape.icon}
            </div>
            <span className="text-[10px] font-medium text-center">{shape.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
