import React, { useEffect, useState, Suspense } from 'react';
import { X, Smartphone, Monitor, Download, Maximize2, Box } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

const DesignCard3DStage = React.lazy(() =>
  import('./DesignCard3DStage').then((m) => ({ default: m.DesignCard3DStage }))
);

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
  onOpenExport,
}) => {
  const { t, lang } = useDcLang();
  const isAr = lang === 'ar';
  const [deviceFrame, setDeviceFrame] = useState<'3d' | 'fit' | 'mobile' | 'clean'>('3d');

  useEffect(() => {
    if (!isOpen) return;
    setDeviceFrame('3d');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roundedW = Math.round(width);
  const roundedH = Math.round(height);

  return (
    <div
      style={{ zIndex: 250 }}
      className="fixed inset-0 flex items-center justify-center p-2.5 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${t.pvTitle} ${title}`}
        dir={isAr ? 'rtl' : 'ltr'}
        className="dc-preview-modal relative w-[min(94vw,390px)] sm:w-full sm:max-w-4xl h-[70dvh] max-h-[540px] sm:h-[82vh] sm:max-h-[760px] bg-[#171717] border border-[#383838] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Compact Responsive Header */}
        <div className="dc-preview-modal__header flex items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3 border-b border-[#2e2e2e] bg-[#1f1f1f] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[115px] sm:max-w-xs">
              {title || t.pvTitle}
            </h2>
            <span
              dir="ltr"
              className="hidden xs:inline-block sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#24795e]/20 text-[#85ccac] whitespace-nowrap shrink-0"
            >
              {roundedW} × {roundedH} px
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Switcher: 3D Card (default) + 2D Fit + Phone + Screen */}
            <div className="dc-preview-modal__modes flex items-center bg-[#141414] p-0.5 rounded-xl border border-[#343434] text-[11px]">
              <button
                type="button"
                data-testid="preview-mode-3d"
                onClick={() => setDeviceFrame('3d')}
                className={`px-2 py-1 rounded-lg transition inline-flex items-center gap-1 font-bold ${
                  deviceFrame === '3d'
                    ? 'bg-[#24795e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'كارت 3D واقعي · 360°' : 'Realistic 3D Card · 360°'}
                aria-label={isAr ? 'كارت 3D واقعي' : '3D Card'}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D</span>
              </button>
              <button
                type="button"
                data-testid="preview-mode-fit"
                onClick={() => setDeviceFrame('fit')}
                className={`p-1.5 rounded-lg transition ${
                  deviceFrame === 'fit'
                    ? 'bg-[#24795e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={t.pvFitScreen}
                aria-label={t.pvFitScreen}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="preview-mode-mobile"
                onClick={() => setDeviceFrame('mobile')}
                className={`p-1.5 rounded-lg transition ${
                  deviceFrame === 'mobile'
                    ? 'bg-[#24795e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={t.pvPhoneFrame}
                aria-label={t.pvPhoneFrame}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="preview-mode-clean"
                onClick={() => setDeviceFrame('clean')}
                className={`p-1.5 rounded-lg transition hidden sm:inline-flex ${
                  deviceFrame === 'clean'
                    ? 'bg-[#24795e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={t.pvDesktopFrame}
                aria-label={t.pvDesktopFrame}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              data-studio-button="primary"
              onClick={onOpenExport}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 h-7 sm:h-8 bg-[#24795e] hover:bg-[#1d634b] text-white rounded-xl text-[11px] font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.pvExport}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              title={t.close}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="dc-preview-modal__body flex-1 min-h-0 overflow-hidden flex items-center justify-center">
          {deviceFrame === '3d' ? (
            <Suspense
              fallback={
                <div className="text-xs text-slate-400 font-semibold animate-pulse">
                  {isAr ? 'جاري تجهيز الكارت ثلاثي الأبعاد…' : 'Preparing 3D card preview…'}
                </div>
              }
            >
              <DesignCard3DStage
                previewUrl={previewUrl}
                width={width}
                height={height}
                title={title}
                isAr={isAr}
              />
            </Suspense>
          ) : deviceFrame === 'mobile' ? (
            <div className="w-full h-full overflow-auto p-3 sm:p-5 flex items-center justify-center">
              <div className="relative w-[min(220px,68vw)] sm:w-[290px] aspect-[9/18.5] max-h-full bg-[#111] rounded-[32px] sm:rounded-[42px] p-2.5 sm:p-3.5 shadow-2xl border-4 border-[#333] flex flex-col">
                <div className="w-20 h-2.5 bg-[#2a2a2a] rounded-full mx-auto mb-2 shrink-0" />
                <div className="flex-1 min-h-0 rounded-[22px] sm:rounded-[28px] overflow-hidden bg-[#1b1b1b] flex items-center justify-center p-1.5">
                  <img
                    src={previewUrl}
                    alt={title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          ) : deviceFrame === 'clean' ? (
            <div className="w-full h-full overflow-auto p-3 sm:p-6 flex items-center justify-center">
              <div className="relative w-full max-w-2xl bg-[#111] rounded-2xl p-3 sm:p-4 shadow-2xl border border-[#333] flex flex-col max-h-full">
                <div className="flex items-center gap-1.5 mb-2.5 px-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-[#1b1b1b] flex items-center justify-center p-3">
                  <img
                    src={previewUrl}
                    alt={title}
                    className="max-w-full max-h-[54vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto p-3 sm:p-6 flex items-center justify-center">
              <img
                src={previewUrl}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
