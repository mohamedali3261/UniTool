import { Download, Image as ImageIcon, Upload, Type, Frame, Shapes, Square, Circle, Minus, FileText } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolbarProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddText: () => void;
  onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddShape: (type: 'rectangle' | 'ellipse' | 'line') => void;
  onExport: () => void;
  hasFile: boolean;
  isExporting: boolean;
  lang: 'ar' | 'en';
}

export const PdfToolbar: React.FC<ToolbarProps> = ({
  onUpload,
  onAddText,
  onAddImage,
  onAddShape,
  onExport,
  hasFile,
  isExporting,
  lang,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#1A1D23] border-b border-[#2D3139] overflow-x-auto shrink-0">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all text-[9px] sm:text-[10px] font-bold shrink-0"
      >
        <Upload size={12} />
        <span className="hidden sm:inline">{lang === 'ar' ? 'رفع' : 'Upload'}</span>
        <input type="file" ref={fileInputRef} onChange={onUpload} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
      </button>

      {hasFile && (
        <>
          <div className="w-px h-5 bg-[#2D3139]" />

          <button
            onClick={onAddText}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all text-[9px] sm:text-[10px] font-bold shrink-0"
          >
            <Type size={12} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'نص' : 'Text'}</span>
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg transition-all text-[9px] sm:text-[10px] font-bold shrink-0"
          >
            <ImageIcon size={12} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'صورة' : 'Image'}</span>
            <input type="file" ref={imageInputRef} onChange={onAddImage} accept="image/*" className="hidden" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShapeMenu(!showShapeMenu)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-lg transition-all text-[9px] sm:text-[10px] font-bold shrink-0"
            >
              <Shapes size={12} />
              <span className="hidden sm:inline">{lang === 'ar' ? 'شكل' : 'Shape'}</span>
            </button>

            <AnimatePresence>
              {showShapeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowShapeMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute left-0 mt-1 w-36 bg-[#1A1D23] border border-[#2D3139] rounded-xl overflow-hidden z-50 shadow-2xl"
                  >
                    {[
                      { type: 'rectangle' as const, icon: Square, label: lang === 'ar' ? 'مربع' : 'Rectangle' },
                      { type: 'ellipse' as const, icon: Circle, label: lang === 'ar' ? 'دائرة' : 'Circle' },
                      { type: 'line' as const, icon: Minus, label: lang === 'ar' ? 'خط' : 'Line' },
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => { onAddShape(type); setShowShapeMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2D3139] transition-colors text-[10px] font-mono text-gray-300"
                      >
                        <Icon size={12} className="text-green-400" />
                        {label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all text-[9px] sm:text-[10px] font-bold shrink-0 disabled:opacity-50"
          >
            <Download size={12} />
            {lang === 'ar' ? 'تصدير' : 'Export'}
          </button>
        </>
      )}
    </div>
  );
};
