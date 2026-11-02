import { rasterWithinBudget } from '../../../utils/rasterBudget';
import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Layers,
  FileCheck
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'jpeg' | 'webp', quality: number, multiplier: number, guides?:boolean) => string;
  onExportSvg?: (guides?:boolean) => string;
  onExportPdf?: (title: string,guides?:boolean) => void | Promise<void>;
  isPackaging?:boolean;
  onExportProject?:()=>Promise<string>;
  defaultTitle: string;
  canvasWidth: number;
  canvasHeight: number;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onExportSvg,
  onExportPdf,
  isPackaging,onExportProject,
  defaultTitle,
  canvasWidth,
  canvasHeight,
  onShowToast
}) => {
  const { t,lang } = useDcLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [isOpen]);
  const [guides,setGuides]=useState(true);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'project'>('png');
  const [quality, setQuality] = useState(0.95);
  const [multiplier, setMultiplier] = useState(1);
  const [fileName, setFileName] = useState(defaultTitle || 'design');
  const [isCopied, setIsCopied] = useState(false);
  const [exporting,setExporting]=useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !exporting) onClose();
      if (e.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose,exporting]);

  if (!isOpen) return null;

  const raster = ['png', 'jpeg', 'webp'].includes(format);
  const tooLarge = raster && !rasterWithinBudget(canvasWidth, canvasHeight, multiplier);
  const finalWidth = canvasWidth * multiplier;
  const finalHeight = canvasHeight * multiplier;

  const handleDownload = async () => {
    if(exporting || tooLarge)return;setExporting(true);
    try {
      if(format==='project'){
        if(!onExportProject)throw Error('PROJECT');const json=await onExportProject();const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`${fileName.trim()||'design'}.unitool.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }else if (format === 'svg') {
        const svgContent = onExportSvg ? onExportSvg(guides) : '';
        if (!svgContent) {
          onShowToast(t.exSvgError, t.exSvgErrorHint, 'error');
          return;
        }
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${fileName.trim() || 'my-design'}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        if (onExportPdf) {
          await onExportPdf(fileName.trim() || 'my-design',guides);
        }
      } else {
        const dataUrl = onExport(format, quality, multiplier,guides);
        if (!dataUrl) throw Error('RASTER_EXPORT_FAILED');
        const link = document.createElement('a');
        const ext = format === 'jpeg' ? 'jpg' : format;
        link.download = `${fileName.trim() || 'my-design'}.${ext}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onShowToast(t.exSuccess, `${t.exSuccessFile} ${fileName}.${format === 'project' ? 'unitool.json' : format === 'jpeg' ? 'jpg' : format}`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      onShowToast(t.exError, t.exErrorHint, 'error');
    } finally {setExporting(false);}
  };

  const handleCopyToClipboard = async () => {
    try {
      const dataUrl = onExport('png', 1, 1,guides);
      if (!dataUrl) throw Error('RASTER_EXPORT_FAILED');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      setIsCopied(true);
      onShowToast(t.exCopied, t.exCopiedHint, 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      onShowToast(t.exCopyFailed, t.exCopyFailedHint, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="export-modal" ref={dialogRef} tabIndex={-1}
        role="dialog" aria-modal="true" aria-label={t.exTitle}
        className="relative w-full max-w-sm max-h-[90dvh] bg-[#1C2541] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-700/60 bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.exTitle}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            title={t.close}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto min-h-0">
          {/* File Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t.exFileName}</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Format Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t.exFormat}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'png', label: 'PNG Image', desc: t.exFormatPngHint },
                { id: 'jpeg', label: 'JPG Image', desc: t.exFormatJpgHint },
                { id: 'webp', label: 'WebP', desc: t.exFormatWebpHint },
                { id: 'svg', label: 'SVG Vector', desc: t.exFormatSvgHint },
                { id: 'pdf', label: 'PDF Document', desc: t.exFormatPdfHint },
                ...(onExportProject?[{id:'project',label:lang==='ar'?'مشروع قابل للتعديل':'Editable project',desc:'UniTool JSON'}]:[])
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`p-2 rounded-xl border text-right transition flex flex-col justify-between gap-1 ${
                    format === f.id
                      ? 'bg-[#0B132B] border-sky-400 text-white shadow-md ring-1 ring-sky-500/40'
                      : 'bg-[#0B132B]/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{f.label}</span>
                  <span className="text-[10px] text-slate-400">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {isPackaging&&format!=='project'&&<label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={guides} onChange={e=>setGuides(e.target.checked)}/>{lang==='ar'?'تضمين خطوط القص والطي':'Include cut and crease lines'}</label>}
          {format==='project'&&<p className="text-xs text-slate-300">{lang==='ar'?'يحفظ العناصر والنصوص والمقاسات لإعادة الاستيراد والتعديل. ليس ملف طباعة.':'Keeps editable objects, text and dimensions for re-import. Not a print file.'}</p>}
          {/* Resolution Multiplier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">{t.exResolution}</span>
              <span className="font-mono text-sky-400">{finalWidth} × {finalHeight} PX</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { m: 1, label: t.exRes1x, desc: t.exRes1xHint },
                { m: 2, label: t.exRes2x, desc: t.exRes2xHint },
                { m: 3, label: t.exRes3x, desc: t.exRes3xHint }
              ].map((item) => (
                <button
                  key={item.m}
                  type="button"
                  onClick={() => setMultiplier(item.m)}
                  className={`p-2 rounded-xl border text-center transition ${
                    multiplier === item.m
                      ? 'bg-sky-600 border-sky-400 text-white font-bold shadow-md'
                      : 'bg-[#0B132B] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-mono">{item.label}</div>
                  <div className="text-[9px] opacity-80 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {tooLarge && <p role="alert" className="text-xs text-amber-300">{lang === 'ar' ? 'حجم الصورة كبير جدًا. قلّل الدقة أو استخدم SVG/PDF. الحد 40 مليون بكسل و16384 بكسل لكل ضلع.' : 'Image too large. Reduce resolution or use SVG/PDF. Limit: 40 MP and 16384 px per side.'}</p>}
          {/* Quality Slider for JPG/WebP */}
          {(format === 'jpeg' || format === 'webp') && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>{t.exQuality}</span>
                <span className="font-mono text-sky-400">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60 bg-[#0B132B]">
          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{isCopied ? t.exCopyDone : t.exCopyBtn}</span>
          </button>

          <button
            type="button"
            disabled={exporting || tooLarge}
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{t.exDownload}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
