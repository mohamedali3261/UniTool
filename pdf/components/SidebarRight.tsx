import { AlignCenter, AlignLeft, AlignRight, Bold, Settings2, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import React from 'react';
import { PDFElement } from '../types';

interface SidebarRightProps {
  selectedElement: PDFElement | null;
  onUpdateElement: (id: string, updates: Partial<PDFElement>) => void;
  onDeleteElement: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onMoveLayer,
}) => {
  if (!selectedElement) {
    return (
      <div className="w-72 border-l border-gray-100 bg-gray-50/30 flex flex-col h-[calc(100vh-80px)] shrink-0">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-white">
          <Settings2 size={18} className="text-gray-400" />
          <span className="font-bold text-gray-800 text-sm uppercase tracking-widest">Properties</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 border border-gray-100 transform rotate-6 scale-90 opacity-40">
            <Settings2 size={32} className="text-gray-400" />
          </div>
          <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">Select target</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-gray-100 bg-white flex flex-col h-[calc(100vh-80px)] shrink-0 overflow-y-auto shadow-2xl">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Settings2 size={16} className="text-indigo-600" />
          </div>
          <span className="font-black text-gray-950 text-xs uppercase tracking-widest">
            {selectedElement.type === 'text' ? 'Editor' : 'Graphics'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all changes?')) {
                localStorage.removeItem('pdf_editor_elements');
                window.location.reload();
              }
            }}
            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
            title="Clear all changes"
          >
            <Layers size={16} />
          </button>
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm active:scale-95"
            title="Delete element"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {selectedElement.type === 'text' && (
          <>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Content</label>
              <textarea
                value={selectedElement.content}
                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none h-32 shadow-inner"
                dir="auto"
              />
            </div>

            <div className="space-y-5">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Typography</label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 ml-1">Size</span>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold border-none shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 ml-1">Color</span>
                  <div className="relative group">
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                      className="h-10 w-full p-1 bg-gray-50 rounded-xl cursor-pointer border-none shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="flex p-1 bg-gray-50 rounded-xl shadow-inner">
                <button
                  onClick={() => onUpdateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`flex-1 py-2.5 flex justify-center items-center rounded-lg transition-all ${selectedElement.fontWeight === 'bold' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Bold size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {selectedElement.type === 'image' && (
          <div className="space-y-6">
             <div className="space-y-3">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-1">Scaling</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 ml-1">Width</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold border-none shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 ml-1">Height</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold border-none shadow-inner"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-1">Photo Effects</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'None', value: 'none' },
                  { label: 'Grayscale', value: 'grayscale(100%)' },
                  { label: 'Sepia', value: 'sepia(100%)' },
                  { label: 'Invert', value: 'invert(100%)' },
                  { label: 'Bright', value: 'brightness(150%)' },
                  { label: 'Blur', value: 'blur(2px)' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => onUpdateElement(selectedElement.id, { filter: f.value })}
                    className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                      selectedElement.filter === f.value 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg' 
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl">
               <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2">
                  <img src={selectedElement.src} alt="Preview" className="max-w-full h-auto rounded-xl" style={{ filter: selectedElement.filter }} />
               </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Appearance</label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 ml-1">Border Width</span>
                <input
                  type="number"
                  value={selectedElement.borderWidth || 0}
                  onChange={(e) => onUpdateElement(selectedElement.id, { borderWidth: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold border-none shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 ml-1">Border Color</span>
                <input
                  type="color"
                  value={selectedElement.borderColor || '#000000'}
                  onChange={(e) => onUpdateElement(selectedElement.id, { borderColor: e.target.value })}
                  className="h-10 w-full p-1 bg-gray-50 rounded-xl cursor-pointer border-none shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 ml-1">Stacking Order</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onMoveLayer(selectedElement.id, 'up')}
                  className="flex-1 py-2 bg-gray-50 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all flex items-center justify-center gap-2 group"
                  title="Bring to front"
                >
                  <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Bring Up</span>
                </button>
                <button
                  onClick={() => onMoveLayer(selectedElement.id, 'down')}
                  className="flex-1 py-2 bg-gray-50 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all flex items-center justify-center gap-2 group"
                  title="Send to back"
                >
                  <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Send Down</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-400">Rotation</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const cur = selectedElement.rotation || 0;
                      let newRot = (cur - 90) % 360;
                      if (newRot < 0) newRot += 360;
                      onUpdateElement(selectedElement.id, { rotation: newRot });
                    }}
                    className="px-1.5 py-0.5 bg-gray-50 hover:bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold transition-colors border border-gray-100 cursor-pointer"
                    title="Rotate -90°"
                  >
                    -90°
                  </button>
                  <button
                    onClick={() => {
                      const cur = selectedElement.rotation || 0;
                      const newRot = (cur + 90) % 360;
                      onUpdateElement(selectedElement.id, { rotation: newRot });
                    }}
                    className="px-1.5 py-0.5 bg-gray-50 hover:bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold transition-colors border border-gray-100 cursor-pointer"
                    title="Rotate +90°"
                  >
                    +90°
                  </button>
                  <span className="text-[10px] font-black text-indigo-600 ml-1">{selectedElement.rotation || 0}°</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedElement.rotation || 0}
                onChange={(e) => onUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-400">Opacity</span>
                <span className="text-[10px] font-black text-indigo-600">{Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                onChange={(e) => onUpdateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Positioning</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 ml-1">Horizontal</span>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold border-none shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 ml-1">Vertical</span>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold border-none shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
