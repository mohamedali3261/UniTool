import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileSignature, Upload, Loader2, AlertTriangle, X,
  PenLine, Type, Eraser, MousePointerClick, FileText, Check,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { cn } from '../../lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate?: (page: string) => void;
}

interface PageThumb {
  dataUrl: string;
  width: number;
  height: number;
}

interface Placement {
  id: number;
  page: number;
  xPct: number; // center, % of page width
  yPct: number; // center, % of page height (from top)
  widthPct: number; // width, % of page width
}

const SIG_FONTS = [
  { id: 'cursive', labelAr: 'كتابة يدوية', css: 'italic bold 72px cursive' },
  { id: 'script', labelAr: 'قلم رفيع', css: 'italic 64px "Comic Sans MS", cursive' },
  { id: 'serif', labelAr: 'كلاسيكي', css: 'italic 64px Georgia, serif' },
  { id: 'bold', labelAr: 'عريض واضح', css: 'bold 66px "Segoe UI", sans-serif' },
] as const;

const SIG_COLORS = [
  { id: 'ink', label: 'أزرق حبر', hex: '#1e40af' },
  { id: 'black', label: 'أسود', hex: '#111111' },
  { id: 'red', label: 'أحمر', hex: '#b91c1c' },
];

let nextId = 1;
const uid = () => nextId++;

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

export function PdfSigner({ t, lang, onNavigate }: Props) {
  const ar = (a: string, e: string) => (lang === 'ar' ? a : e);

  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sigMode, setSigMode] = useState<'text' | 'draw'>('text');
  const [sigText, setSigText] = useState('');
  const [sigFont, setSigFont] = useState('cursive');
  const [sigColor, setSigColor] = useState('ink');
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [sigAspect, setSigAspect] = useState(0.35); // h / w
  const [widthPct, setWidthPct] = useState(30);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  // ---------- PDF loading ----------
  const loadPdf = useCallback(async (f: File) => {
    setLoadingPdf(true);
    setError(null);
    setPlacements([]);
    setCurrentPage(0);
    try {
      const arrayBuffer = await f.arrayBuffer();
      setBytes(arrayBuffer.slice(0));
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const first = await pdf.getPage(1); // 1-based
      setPageImg(first, 0, pdf);
    } catch (err: any) {
      setError(err?.message || ar('فشل تحميل PDF', 'Failed to load PDF'));
    } finally {
      setLoadingPdf(false);
    }

    async function setPageImg(page: any, idx: number, pdf: any) {
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await (page.render as any)({ canvas, canvasContext: ctx, viewport }).promise;
      const thumb: PageThumb = { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: viewport.width, height: viewport.height };
      setPages(prev => { const n = [...prev]; n[idx] = thumb; return n; });
      if (idx === pdf.numPages - 1) return;
      const next = await pdf.getPage(idx + 1);
      setPageImg(next, idx + 1, pdf);
    }
  }, [ar]);

  const acceptFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError(ar('اختر ملف PDF', 'Choose a PDF file'));
      return;
    }
    setPages([]);
    setFile(f);
    setBytes(null);
    loadPdf(f);
  };

  // ---------- signature generation (text mode) ----------
  useEffect(() => {
    if (sigMode !== 'text') return;
    if (!sigText.trim()) { setSigDataUrl(null); return; }
    const SCALE = 3;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    const css = SIG_FONTS.find(f => f.id === sigFont)?.css || SIG_FONTS[0].css;
    const hex = SIG_COLORS.find(cc => cc.id === sigColor)?.hex || SIG_COLORS[0].hex;
    ctx.font = css;
    const m = ctx.measureText(sigText.trim());
    const w = Math.ceil(m.width) + 40;
    const h = 110;
    c.width = w * SCALE;
    c.height = h * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.fillStyle = hex;
    ctx.font = css;
    ctx.textBaseline = 'middle';
    ctx.fillText(sigText.trim(), 20, h / 2 + 6);
    setSigDataUrl(c.toDataURL('image/png'));
    setSigAspect(h / w);
  }, [sigText, sigFont, sigColor, sigMode]);

  // auto re-render draw signature into dataUrl when leaving draw tab
  useEffect(() => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const blank = isEmptyCanvas(c);
    setSigDataUrl(blank ? null : c.toDataURL('image/png'));
    setSigAspect(c.height / c.width);
    function isEmptyCanvas(cc: HTMLCanvasElement) {
      const ctx = cc.getContext('2d')!;
      const d = ctx.getImageData(0, 0, cc.width, cc.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return false;
      return true;
    }
  }, [sigMode]);

  // ---------- drawing board ----------
  const drawPos = (e: React.PointerEvent) => {
    const c = drawCanvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * c.width,
      y: ((e.clientY - rect.top) / rect.height) * c.height,
    };
  };

  const startDraw = (e: React.PointerEvent) => {
    const c = drawCanvasRef.current!;
    const ctx = c.getContext('2d')!;
    const { x, y } = drawPos(e);
    ctx.strokeStyle = SIG_COLORS.find(cc => cc.id === sigColor)?.hex || '#1e40af';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
    c.setPointerCapture(e.pointerId);
  };

  const moveDraw = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = drawCanvasRef.current!.getContext('2d')!;
    const { x, y } = drawPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    const c = drawCanvasRef.current!;
    setSigDataUrl(c.toDataURL('image/png'));
    setSigAspect(c.height / c.width);
  };

  const clearDraw = () => {
    const c = drawCanvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setSigDataUrl(null);
  };

  // ---------- placement ----------
  const placeSignature = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sigDataUrl) {
      setError(ar('أنشئ التوقيع أولًا (نص أو رسم)', 'Create a signature first (text or draw)'));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
    setPlacements(prev => [...prev, { id: uid(), page: currentPage, xPct, yPct, widthPct }]);
    setError(null);
  };

  // ---------- signing ----------
  const signPdf = async () => {
    if (!bytes || !sigDataUrl || !placements.length) return;
    setBusy(true);
    setError(null);
    try {
      const pdfDoc = await PDFDocument.load(bytes);
      const img = await pdfDoc.embedPng(sigDataUrl);
      for (const pl of placements) {
        const page = pdfDoc.getPage(pl.page);
        const { width, height } = page.getSize();
        const w = (width * pl.widthPct) / 100;
        const h = w * sigAspect;
        const x = (width * pl.xPct) / 100 - w / 2;
        const y = height - (height * pl.yPct) / 100 - h / 2;
        page.drawImage(img, { x, y, width: w, height: h });
      }
      const out = await pdfDoc.save();
      const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(file?.name || 'document.pdf').replace(/\.pdf$/i, '')}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6000);
    } catch (err: any) {
      setError(err?.message || ar('فشل توقيع الملف', 'Signing failed'));
    } finally {
      setBusy(false);
    }
  };

  const current = pages[currentPage];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .ps-scroll { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .ps-scroll::-webkit-scrollbar { width: 4px; }
        .ps-scroll::-webkit-scrollbar-track { background: transparent; }
        .ps-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .ps-draw { touch-action: none; cursor: crosshair; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lime-600 to-green-600 flex items-center justify-center shadow-lg shadow-lime-500/20 sm:w-8 sm:h-8">
          <FileSignature size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{ar('توقيع PDF', 'PDF Signer')}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {ar('توقيع نص أو رسم — مواضع متعددة — يتم في المتصفح بالكامل', 'Text or drawn signature — multiple placements — fully in-browser')}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('pdfTools')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-red-600/15 border border-white/[0.06] hover:border-red-500/30 transition-colors"
          >
            <FileText size={10} className="text-red-400" />
            <span className="text-[9px] font-mono text-gray-400 hover:text-red-300">{ar('أدوات PDF', 'PDF Tools')}</span>
          </button>
        )}
      </div>

      <div className="flex-1 ps-scroll">
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">

          {/* Drop zone */}
          {!file ? (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) acceptFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                  dragOver ? 'border-lime-500 bg-lime-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
                )}
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', dragOver ? 'bg-lime-500/30' : 'bg-white/[0.05]')}>
                  <Upload size={18} className={dragOver ? 'text-lime-300' : 'text-gray-500'} />
                </div>
                <p className="text-[10px] font-mono text-gray-400">{ar('افلِت ملف PDF هنا أو انقر للاختيار', 'Drop a PDF here or click to browse')}</p>
                <p className="text-[8px] text-gray-600 font-mono">PDF · 100% {ar('محلي بدون رفع', 'local, no upload')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) acceptFile(f);
                  e.target.value = '';
                }}
              />
            </>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <FileSignature size={14} className="text-lime-400 shrink-0" />
              <span className="text-[10px] text-gray-300 flex-1 truncate">{file.name}</span>
              <span className="text-[8px] font-mono text-gray-600">{fmtBytes(file.size)}</span>
              <button
                onClick={() => { setFile(null); setBytes(null); setPages([]); setPlacements([]); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title={ar('إزالة', 'Remove')}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Signature builder + page preview */}
          {file && (
            <div className="grid md:grid-cols-[minmax(0,300px)_1fr] gap-3 items-start">
              {/* Signature builder */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 order-2 md:order-1">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  {([
                    { id: 'text' as const, label: ar('نص', 'Text'), icon: Type },
                    { id: 'draw' as const, label: ar('رسم', 'Draw'), icon: PenLine },
                  ]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSigMode(m.id)}
                      className={cn(
                        'flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-mono transition-colors',
                        sigMode === m.id ? 'bg-lime-600/20 text-lime-300 ring-1 ring-lime-500/30' : 'text-gray-500 hover:text-gray-300'
                      )}
                    >
                      <m.icon size={11} />
                      {m.label}
                    </button>
                  ))}
                </div>

                {sigMode === 'text' ? (
                  <>
                    <input
                      type="text"
                      value={sigText}
                      onChange={e => setSigText(e.target.value)}
                      placeholder={ar('اكتب التوقيع…', 'Type signature…')}
                      className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-500 transition"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {SIG_FONTS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSigFont(f.id)}
                          className={cn(
                            'px-2 py-1 rounded-md text-[9px] font-mono border transition-colors',
                            sigFont === f.id ? 'bg-lime-600/20 border-lime-500/30 text-lime-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                          )}
                        >
                          {ar(f.labelAr, f.id)}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <canvas
                      ref={drawCanvasRef}
                      width={320}
                      height={128}
                      className="ps-draw w-full rounded-lg border border-dashed border-slate-600 bg-[#0B0E17]"
                      onPointerDown={startDraw}
                      onPointerMove={moveDraw}
                      onPointerUp={endDraw}
                      onPointerLeave={endDraw}
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={clearDraw}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[9px] font-mono text-gray-500 hover:text-red-300 transition-colors"
                      >
                        <Eraser size={10} />
                        {ar('مسح', 'Clear')}
                      </button>
                      <span className="text-[8px] text-gray-600 font-mono">{ar('اسحب بالماوس أو الإصبع', 'Mouse or finger')}</span>
                    </div>
                  </div>
                )}

                {/* color */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono text-gray-500">{ar('الحبر', 'Ink')}</span>
                  {SIG_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSigColor(c.id)}
                      title={c.label}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-colors',
                        sigColor === c.id ? 'border-lime-400 scale-110' : 'border-white/20'
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {/* live signature preview */}
                {sigDataUrl && (
                  <div className="p-2 rounded-lg bg-white border border-white/10 flex items-center justify-center">
                    <img src={sigDataUrl} alt="signature" className="max-h-14 object-contain" />
                  </div>
                )}

                {/* size */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-gray-500 w-16 shrink-0">{ar('الحجم', 'Size')}</span>
                  <input
                    type="range" min={10} max={60} value={widthPct}
                    onChange={e => setWidthPct(Number(e.target.value))}
                    className="flex-1 h-1 accent-lime-500"
                  />
                  <span className="text-[9px] font-mono text-lime-300 w-8 text-right">{widthPct}%</span>
                </div>

                {/* placements list */}
                <div className="pt-1 border-t border-white/[0.04] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-gray-500">
                      {ar('المواضع', 'Placements')} ({placements.length})
                    </span>
                    {placements.length > 0 && (
                      <button
                        onClick={() => setPlacements([])}
                        className="text-[9px] font-mono text-gray-600 hover:text-red-400 transition-colors"
                      >
                        {ar('مسح الكل', 'Clear all')}
                      </button>
                    )}
                  </div>
                  {placements.length === 0 ? (
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                      <MousePointerClick size={10} />
                      {ar('انقر على الصفحة لوضع التوقيع', 'Click the page to place')}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {placements.map(p => (
                        <span key={p.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-lime-600/15 border border-lime-500/25 text-[9px] font-mono text-lime-300">
                          {ar('صفحة', 'P.')} {p.page + 1}
                          <button
                            onClick={() => setPlacements(prev => prev.filter(q => q.id !== p.id))}
                            className="text-lime-400/60 hover:text-red-400"
                          >
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={signPdf}
                  disabled={busy || !sigDataUrl || placements.length === 0}
                  className={cn(
                    'w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold transition-colors',
                    busy || !sigDataUrl || placements.length === 0
                      ? 'bg-white/[0.03] text-gray-600 border border-white/[0.06]'
                      : 'bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg shadow-lime-500/20 hover:brightness-110'
                  )}
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {busy ? ar('جارٍ التوقيع…', 'Signing…') : ar('توقيع وتنزيل', 'Sign & download')}
                </button>
              </div>

              {/* Page preview */}
              <div className="order-1 md:order-2 space-y-2">
                {loadingPdf && !current && (
                  <div className="flex items-center justify-center gap-2 py-16 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <Loader2 size={16} className="text-lime-400 animate-spin" />
                    <span className="text-[10px] font-mono text-gray-500">{ar('جارٍ تحليل الملف…', 'Analyzing…')}</span>
                  </div>
                )}
                {current && (
                  <>
                    <div
                      onClick={placeSignature}
                      className="relative inline-block rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-crosshair select-none max-w-full"
                    >
                      <img src={current.dataUrl} alt={`page ${currentPage + 1}`} className="block max-w-full h-auto" />
                      {placements.filter(p => p.page === currentPage).map(p => (
                        <img
                          key={p.id}
                          src={sigDataUrl || ''}
                          alt=""
                          className="absolute pointer-events-none opacity-90"
                          style={{
                            left: `${p.xPct}%`,
                            top: `${p.yPct}%`,
                            width: `${p.widthPct}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      ))}
                    </div>

                    {/* page thumbnails */}
                    {pages.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {pages.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={cn(
                              'relative shrink-0 rounded-md overflow-hidden border transition-colors',
                              i === currentPage ? 'border-lime-500 ring-1 ring-lime-500/40' : 'border-white/10 hover:border-white/30',
                              placements.some(pl => pl.page === i) && i !== currentPage && 'ring-1 ring-amber-500/50'
                            )}
                          >
                            <img src={p.dataUrl} alt={"" + (i + 1)} className="h-20 w-auto block" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-mono text-white text-center py-0.5">
                              {i + 1}
                            </span>
                            {placements.some(pl => pl.page === i) && (
                              <span className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-amber-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[8px] text-gray-600 font-mono flex items-center gap-1">
                      <MousePointerClick size={9} />
                      {ar(`انقر على الصفحة ${currentPage + 1} لوضع التوقيع — صدّق المعاينة الفورية`, `Click page ${currentPage + 1} to place — live preview`)}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
