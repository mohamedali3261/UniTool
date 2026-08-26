import React, { useState } from 'react';
import { X, Smartphone, Monitor, Download, Maximize2 } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
  onOpenExport: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  previewUrl,
  title,
  width,
  height,
  onOpenExport
}) => {
  const { t } = useDcLang();
  const [deviceFrame, setDeviceFrame] = useState<'fit' | 'mobile' | 'clean'>('fit');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="preview-modal"
        className="relative w-full max-w-5xl h-[90vh] bg-[#0B132B] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#1C2541]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {t.pvTitle} {title}
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0B132B] text-sky-400">
              {width} × {height} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center bg-[#0B132B] p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setDeviceFrame('fit')}
                className={`p-1.5 rounded-lg transition ${
                  deviceFrame === 'fit' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={t.pvFitScreen}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceFrame('mobile')}
                className={`p-1.5 rounded-lg transition ${
                  deviceFrame === 'mobile' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={t.pvPhoneFrame}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceFrame('clean')}
                className={`p-1.5 rounded-lg transition ${
                  deviceFrame === 'clean' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={t.pvDesktopFrame}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{t.pvExport}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          {deviceFrame === 'mobile' ? (
            <div className="relative w-[340px] h-[680px] bg-slate-950 rounded-[48px] p-4 shadow-2xl border-[6px] border-slate-800 flex flex-col">
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
              <div className="flex-1 rounded-[32px] overflow-hidden bg-slate-900 flex items-center justify-center p-2">
                <img src={previewUrl} alt={title} className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            </div>
          ) : deviceFrame === 'clean' ? (
            <div className="relative w-full max-w-3xl bg-slate-950 rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-4">
                <img src={previewUrl} alt={title} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="max-w-full max-h-full flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt={title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
