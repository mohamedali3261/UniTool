import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera, CameraOff, Copy, Check, ExternalLink, ImagePlus, History,
  Trash2, X, Link, Wifi, Mail, Phone, MessageSquare, MapPin, Text,
  ScanQrCode, RefreshCw, Loader2, AlertTriangle, QrCode,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate?: (page: string) => void;
}

interface HistoryItem {
  id: number;
  text: string;
  ts: number;
}

const HISTORY_KEY = 'unitool_qr_history';
const HISTORY_LIMIT = 50;

type ScanMode = 'camera' | 'image';

export function QrScanner({ t, lang, onNavigate }: Props) {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanningVisual, setScanningVisual] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ar = (a: string, e: string) => (lang === 'ar' ? a : e);

  // ---------- helpers ----------

  const beep = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      osc.onended = () => ctx.close();
    } catch { /* ignore */ }
  }, []);

  const detectType = (text: string): { ar: string; en: string; icon: any } => {
    const v = text.trim().toLowerCase();
    if (/^https?:\/\//.test(v)) return { ar: 'رابط', en: 'Link', icon: Link };
    if (/^wifi:/i.test(v)) return { ar: 'شبكة Wi-Fi', en: 'Wi-Fi', icon: Wifi };
    if (/^mailto:|^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(v)) return { ar: 'بريد إلكتروني', en: 'Email', icon: Mail };
    if (/^(tel|phone):/.test(v)) return { ar: 'هاتف', en: 'Phone', icon: Phone };
    if (/^smsto?:/.test(v)) return { ar: 'رسالة SMS', en: 'SMS', icon: MessageSquare };
    if (/^geo:/.test(v)) return { ar: 'موقع جغرافي', en: 'Location', icon: MapPin };
    if (/^(begin:vcard|mecard:)/i.test(v)) return { ar: 'بطاقة تواصل', en: 'Contact card', icon: Text };
    return { ar: 'نص', en: 'Text', icon: Text };
  };

  const isLink = (text: string) => /^https?:\/\//i.test(text.trim());

  const pushHistory = useCallback((text: string) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.text !== text);
      const next = [{ id: Date.now(), text, ts: Date.now() }, ...filtered].slice(0, HISTORY_LIMIT);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const onFound = useCallback((text: string) => {
    setResult(text);
    setError(null);
    setCopied(false);
    setScanningVisual(false);
    pushHistory(text);
    beep();
    try { navigator.vibrate?.(120); } catch { /* ignore */ }
    stopCamera();
  }, [beep, pushHistory]);

  // ---------- camera ----------

  const stopCamera = useCallback(() => {
    if (loopRef.current !== null) { clearInterval(loopRef.current); loopRef.current = null; }
    streamRef.current?.getTracks().forEach(tr => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setScanningVisual(false);
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facing) => {
    setError(null);
    setCameraLoading(true);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setFacing(mode);
      setCameraOn(true);
      setScanningVisual(true);

      // clear loop when stream dies
      stream.getVideoTracks()[0].addEventListener('ended', () => stopCamera());

      // scan loop: throttled ~8 fps scaled-down frames
      const tick = () => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.readyState < 2 || !v.videoWidth) return;
        const scale = 640 / v.videoWidth;
        c.width = 640;
        c.height = Math.round(v.videoHeight * scale) || 360;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        try {
          const img = ctx.getImageData(0, 0, c.width, c.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (code?.data) onFound(code.data);
        } catch { /* ignore frame errors */ }
      };
      loopRef.current = window.setInterval(tick, 150);
    } catch (e: any) {
      const name = e?.name || '';
      if (name === 'NotAllowedError') setError(ar('تم رفض الإذن — اسمح بالوصول للكاميرا من إعدادات المتصفح', 'Permission denied — allow camera access in your browser settings'));
      else if (name === 'NotFoundError') setError(ar('لا توجد كاميرا متصلة بالجهاز', 'No camera found on this device'));
      else if (!window.isSecureContext) setError(ar('الكاميرا تتطلب اتصالاً آمناً (HTTPS)', 'Camera requires a secure context (HTTPS)'));
      else setError(ar('تعذر تشغيل الكاميرا. تأكد من دعم المتصفح', 'Could not start camera. Check browser support'));
      stopCamera();
    }
    setCameraLoading(false);
  };

  const flipCamera = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    startCamera(next);
  };

  // ---------- image scanning ----------

  const scanImage = async (file: File) => {
    setError(null);
    setResult(null);
    setCopied(false);
    if (!file.type.startsWith('image/')) {
      setError(ar('الملف المرفوع ليس صورة', 'The uploaded file is not an image'));
      return;
    }
    try {
      const bitmap = await createImageBitmap(file).catch(async () => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
        URL.revokeObjectURL(url);
        return img;
      });
      const w = (bitmap as any).width ?? 0, h = (bitmap as any).height ?? 0;
      if (!w || !h) throw new Error('bad image');
      const scale = Math.min(1, 1400 / Math.max(w, h));
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(bitmap as any, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
      if (code?.data) onFound(code.data);
      else setError(ar('مفيش كود QR في الصورة — جرّب صورة أوضح أو أكبّر جزء الكود', 'No QR code found in the image — try a clearer photo or crop closer to the code'));
    } catch {
      setError(ar('تعذر قراءة الصورة', 'Could not read the image'));
    }
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        e.preventDefault();
        setMode('image');
        scanImage(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  // stop camera on unmount + when switching to image mode
  useEffect(() => { if (mode !== 'camera') stopCamera(); }, [mode, stopCamera]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ---------- history ----------

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  };

  const clearHistory = () => saveHistory([]);
  const removeHistoryItem = (id: number) => saveHistory(history.filter(h => h.id !== id));

  const copyResult = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); } catch {
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const typeInfo = result ? detectType(result) : null;
  const TypeIcon = typeInfo?.icon ?? Text;

  const wifiData = result && /^wifi:/i.test(result) ? (() => {
    try {
      return {
        ssid: decodeURIComponent(result.match(/S:(.*?)(?:;[A-Za-z]+?:|;;|$)/)?.[1] || ''),
        password: result.match(/P:(.*?)(?:;|$)/)?.[1] || '',
        enc: result.match(/T:(.*?)(?:;|$)/)?.[1]?.toUpperCase() || '',
      };
    } catch { return null; }
  })() : null;

  const fmtDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return new Date(ts).toLocaleString(); }
  };

  // ---------- render ----------

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .qr-scan-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .qr-scan-scroll::-webkit-scrollbar { width: 4px; }
        .qr-scan-scroll::-webkit-scrollbar-track { background: transparent; }
        .qr-scan-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .qr-scan-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
        @keyframes qr-scanline {
          0%, 100% { top: 0%; }
          50% { top: calc(100% - 2px); }
        }
        .qr-scanline { animation: qr-scanline 2.2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 sm:w-8 sm:h-8">
          <ScanQrCode size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{ar('قارئ رمز QR', 'QR Code Scanner')}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{ar('امسح بالكاميرا أو من صورة', 'Scan with camera or from an image')}</p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('qrCode')}
            title={ar('مولّد QR', 'QR Generator')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-600/15 border border-white/[0.06] hover:border-cyan-500/30 transition-colors"
          >
            <QrCode size={10} className="text-cyan-400" />
            <span className="text-[9px] font-mono text-gray-400 hover:text-cyan-300">{ar('مولّد QR', 'QR Generator')}</span>
          </button>
        )}
      </div>

      <div className="flex-1 qr-scan-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {([
              { id: 'camera' as ScanMode, label: ar('الكاميرا', 'Camera'), icon: Camera },
              { id: 'image' as ScanMode, label: ar('من صورة', 'From Image'), icon: ImagePlus },
            ]).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono transition-colors',
                  mode === m.id ? 'bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <m.icon size={12} />
                {m.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Camera view */}
          {mode === 'camera' && (
            <div>
              <div className={cn(
                'relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-black border border-white/[0.08]',
                !cameraOn && 'bg-[#0D0F13]'
              )}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* frame overlay */}
                {cameraOn && scanningVisual && (
                  <>
                    <div className="absolute inset-x-8 inset-y-[12%] pointer-events-none">
                      <div className="qr-scanline absolute left-0 right-0 h-0.5 bg-blue-400/70 shadow-[0_0_12px_rgba(96,165,250,0.6)]" />
                    </div>
                    {/* corner brackets */}
                    <div className="absolute top-3 start-3 w-8 h-8 border-t-2 border-s-2 border-blue-400 rounded-tl-xl pointer-events-none" />
                    <div className="absolute top-3 end-3 w-8 h-8 border-t-2 border-e-2 border-blue-400 rounded-tr-xl pointer-events-none" />
                    <div className="absolute bottom-3 start-3 w-8 h-8 border-b-2 border-s-2 border-blue-400 rounded-bl-xl pointer-events-none" />
                    <div className="absolute bottom-3 end-3 w-8 h-8 border-b-2 border-e-2 border-blue-400 rounded-br-xl pointer-events-none" />
                  </>
                )}

                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {cameraLoading ? (
                      <>
                        <Loader2 size={22} className="animate-spin text-blue-400" />
                        <p className="text-[10px] text-gray-500 font-mono">{ar('جاري تشغيل الكاميرا...', 'Starting camera...')}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Camera size={22} className="text-blue-400" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono max-w-[240px] text-center px-4">
                          {ar('شغّل الكاميرا وجهّز الكود لإطار السكانر', 'Turn on the camera and fit the code inside the frame')}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mt-4">
                {!cameraOn ? (
                  <button
                    onClick={() => startCamera()}
                    disabled={cameraLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait"
                  >
                    {cameraLoading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                    {ar('تشغيل الكاميرا والسكانر', 'Start Camera & Scan')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setResult(null); setError(null); startCamera(facing); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-[10px] font-mono hover:bg-white/[0.07] transition-colors"
                    >
                      <Camera size={12} />
                      {ar('مسح كود آخر', 'Scan another')}
                    </button>
                    <button
                      onClick={flipCamera}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-[10px] font-mono hover:bg-white/[0.07] transition-colors"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-mono hover:bg-red-500/20 transition-colors"
                    >
                      <CameraOff size={12} />
                      {ar('إيقاف', 'Stop')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Image mode */}
          {mode === 'image' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) scanImage(f); e.target.value = ''; }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) scanImage(f);
                }}
                className={cn(
                  'w-full p-8 rounded-xl border-2 border-dashed transition-all text-center',
                  dragOver
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5'
                )}
              >
                <ScanQrCode size={24} className={cn('mx-auto mb-2', dragOver ? 'text-blue-400' : 'text-gray-500')} />
                <p className="text-[10px] text-gray-400 font-mono">{ar('اسحب صورة فيها QR هنا · أو اضغط للاختيار', 'Drop an image with QR here · or click to browse')}</p>
                <p className="text-[8px] text-gray-600 font-mono mt-1">PNG · JPG · WebP — {ar('أو الصق صورة بـ Ctrl+V', 'or paste an image with Ctrl+V')}</p>
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-500/10 bg-emerald-500/[0.04]">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <TypeIcon size={11} className="text-emerald-400 shrink-0" />
                  <span className="text-[9px] font-mono text-emerald-300">{typeInfo ? ar(typeInfo.ar, typeInfo.en) : ''}</span>
                </div>
                <button onClick={() => setResult(null)} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors" title={ar('إغلاق', 'Close')}>
                  <X size={12} />
                </button>
              </div>

              <div className="p-3 space-y-2">
                {wifiData ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-500 font-mono w-16 shrink-0">{ar('الشبكة', 'SSID')}</span>
                      <span className="text-white font-bold truncate">{wifiData.ssid || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-500 font-mono w-16 shrink-0">{ar('كلمة السر', 'Password')}</span>
                      <span className="text-white font-bold truncate font-mono">{wifiData.password || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-500 font-mono w-16 shrink-0">{ar('التشفير', 'Encryption')}</span>
                      <span className="text-white font-bold font-mono">{wifiData.enc || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-200 break-all font-mono leading-relaxed bg-black/20 rounded-lg p-2.5">{result}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={copyResult}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono border transition-colors',
                      copied ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.07]'
                    )}
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? ar('تم النسخ', 'Copied') : ar('نسخ', 'Copy')}
                  </button>
                  <button
                    onClick={() => { setResult(null); setError(null); setMode(mode); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.07] transition-colors"
                  >
                    <ScanQrCode size={10} />
                    {ar('امسح كود تاني', 'Scan another')}
                  </button>
                </div>

                {isLink(result) && (
                  <a
                    href={result}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-300 text-[9px] font-mono hover:bg-blue-600/25 transition-colors mt-1"
                  >
                    <ExternalLink size={10} />
                    {ar('فتح الرابط في نافذة جديدة', 'Open link in new tab')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* History */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
              <History size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold text-white flex-1">{ar('سجل المسح', 'Scan History')}</span>
              <span className="text-[8px] font-mono text-gray-500">{history.length}</span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="flex items-center gap-1 text-[8px] font-mono text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 size={9} />
                  {ar('مسح الكل', 'Clear all')}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[9px] text-gray-600 font-mono">{ar('لسه مفيش نتايج محفوظة — كل كود تمسحه هيظهر هنا', 'No saved scans yet — every code you scan shows up here')}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {history.map(h => {
                  const ht = detectType(h.text);
                  const HIcon = ht.icon;
                  return (
                    <div key={h.id} className="flex items-center gap-2 px-3 py-2 group hover:bg-white/[0.02]">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                        <HIcon size={10} className="text-blue-400" />
                      </div>
                      <button
                        onClick={() => { setResult(h.text); setCopied(false); setError(null); }}
                        title={ar('إعادة فتح النتيجة', 'Reopen result')}
                        className="flex-1 min-w-0 text-start"
                      >
                        <p className="text-[9px] text-gray-200 truncate font-mono">{h.text}</p>
                        <p className="text-[7px] font-mono text-gray-600">{fmtDate(h.ts)} · {ar(ht.ar, ht.en)}</p>
                      </button>
                      {isLink(h.text) && (
                        <a
                          href={h.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-md text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
                          title={ar('فتح', 'Open')}
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                      <button
                        onClick={() => removeHistoryItem(h.id)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        title={ar('حذف', 'Delete')}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-center text-[7px] font-mono text-gray-700 pt-1">
            {ar('المسح والسجل كله بيتم على جهازك — مفيش أي بيانات بتترفع للسيرفر', 'Scanning and history run entirely on your device — no data is uploaded')}
          </p>
        </div>
      </div>
    </div>
  );
}
