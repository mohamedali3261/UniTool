import { Trash2, Bold, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';
import React from 'react';
import { PDFElement } from '../../types/pdf';

interface Props {
  selectedElement: PDFElement | null;
  onUpdateElement: (id: string, updates: Partial<PDFElement>) => void;
  onDeleteElement: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  lang: 'ar' | 'en';
}

export const PdfProperties: React.FC<Props> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onMoveLayer,
  lang,
}) => {
  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Settings2 size={24} className="text-gray-600 mb-2" />
        <p className="text-[9px] font-mono text-gray-500">{lang === 'ar' ? 'اختر عنصراً لتعديله' : 'Select an element to edit'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139] sticky top-0 bg-[#14171C] z-10">
        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
          {selectedElement.type === 'text' ? (lang === 'ar' ? 'نص' : 'Text') : (lang === 'ar' ? 'عنصر' : 'Element')}
        </span>
        <button
          onClick={() => onDeleteElement(selectedElement.id)}
          className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex-1 p-3 space-y-4">
        {selectedElement.type === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'المحتوى' : 'Content'}</label>
              <textarea
                value={selectedElement.content}
                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                className="w-full mt-1 px-2 py-1.5 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50 resize-none h-20"
                dir="auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'الحجم' : 'Size'}</label>
                <input type="number" value={selectedElement.fontSize}
                  onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full mt-1 px-2 py-1 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'اللون' : 'Color'}</label>
                <input type="color" value={selectedElement.color || '#000000'}
                  onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                  className="w-full mt-1 h-7 p-0.5 bg-[#0F1115] border border-[#2D3139] rounded cursor-pointer" />
              </div>
            </div>
            <button
              onClick={() => onUpdateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all ${selectedElement.fontWeight === 'bold' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-[#0F1115] text-gray-400 border border-[#2D3139]'}`}
            >
              <Bold size={10} /> {lang === 'ar' ? 'عريض' : 'Bold'}
            </button>
          </div>
        )}

        {selectedElement.type === 'image' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'العرض' : 'Width'}</label>
                <input type="number" value={Math.round(selectedElement.width)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                  className="w-full mt-1 px-2 py-1 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'الارتفاع' : 'Height'}</label>
                <input type="number" value={Math.round(selectedElement.height)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                  className="w-full mt-1 px-2 py-1 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'تأثير' : 'Filter'}</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[
                  { label: lang === 'ar' ? 'بدون' : 'None', value: 'none' },
                  { label: lang === 'ar' ? 'رمادي' : 'Gray', value: 'grayscale(100%)' },
                  { label: lang === 'ar' ? 'بني' : 'Sepia', value: 'sepia(100%)' },
                  { label: lang === 'ar' ? 'عكسي' : 'Invert', value: 'invert(100%)' },
                  { label: lang === 'ar' ? 'مشرق' : 'Bright', value: 'brightness(150%)' },
                  { label: lang === 'ar' ? 'ضبابي' : 'Blur', value: 'blur(2px)' },
                ].map((f) => (
                  <button key={f.value}
                    onClick={() => onUpdateElement(selectedElement.id, { filter: f.value })}
                    className={`px-1 py-1 rounded text-[7px] font-mono transition-all border ${selectedElement.filter === f.value ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:text-gray-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-3 border-t border-[#2D3139]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'الحدود' : 'Border'}</label>
              <input type="number" value={selectedElement.borderWidth || 0}
                onChange={(e) => onUpdateElement(selectedElement.id, { borderWidth: parseInt(e.target.value) })}
                className="w-full mt-1 px-2 py-1 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'لون الحدود' : 'Border Color'}</label>
              <input type="color" value={selectedElement.borderColor || '#000000'}
                onChange={(e) => onUpdateElement(selectedElement.id, { borderColor: e.target.value })}
                className="w-full mt-1 h-7 p-0.5 bg-[#0F1115] border border-[#2D3139] rounded cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'الطبقات' : 'Layers'}</label>
            <div className="flex gap-1 mt-1">
              <button onClick={() => onMoveLayer(selectedElement.id, 'up')}
                className="flex-1 py-1 bg-[#0F1115] hover:bg-blue-600/20 text-blue-400 border border-[#2D3139] rounded text-[8px] font-mono transition-all flex items-center justify-center gap-1">
                <ArrowUp size={10} /> {lang === 'ar' ? 'لأعلى' : 'Up'}
              </button>
              <button onClick={() => onMoveLayer(selectedElement.id, 'down')}
                className="flex-1 py-1 bg-[#0F1115] hover:bg-blue-600/20 text-blue-400 border border-[#2D3139] rounded text-[8px] font-mono transition-all flex items-center justify-center gap-1">
                <ArrowDown size={10} /> {lang === 'ar' ? 'لأسفل' : 'Down'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'الدوران' : 'Rotation'}</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min="0" max="360" value={selectedElement.rotation || 0}
                onChange={(e) => onUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                className="flex-1 h-1 bg-[#2D3139] rounded-lg appearance-none cursor-pointer accent-blue-500" />
              <span className="text-[9px] font-mono text-blue-400 w-8 text-right">{selectedElement.rotation || 0}°</span>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{lang === 'ar' ? 'الشفافية' : 'Opacity'}</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                onChange={(e) => onUpdateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                className="flex-1 h-1 bg-[#2D3139] rounded-lg appearance-none cursor-pointer accent-blue-500" />
              <span className="text-[9px] font-mono text-blue-400 w-8 text-right">{Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">X</label>
              <input type="number" value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                className="w-full mt-1 px-2 py-1 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">Y</label>
              <input type="number" value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                className="w-full mt-1 px-2 py-1 bg-[#0F1115] border border-[#2D3139] rounded text-[10px] font-mono text-gray-200 outline-none focus:border-blue-500/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
