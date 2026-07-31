import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Loader2,
  Film,
  Trash2,
  Eraser,
  Settings2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

type MarkType = 'auto' | 'diamond' | 'veo';
type ProcessMode = 'engine' | 'ffmpeg';
type MediaType = 'image' | 'video';

export function WatermarkRemover({ lang }: Props) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview' | 'settings'>('upload');
  const [markType, setMarkType] = useState<MarkType>('auto');
  const [legacyMode, setLegacyMode] = useState(false);
  const [mlMode, setMlMode] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [lastMode, setLastMode] = useState<ProcessMode | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = mediaType === 'image';
  const isVideo = mediaType === 'video';

  useEffect(() => {
    fetch('/api/watermark/health')
      .then((r) => r.json())
      .then((data) => setApiAvailable(Boolean(data.available)))
      .catch(() => setApiAvailable(false));
  }, []);

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [mediaUrl, resultUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type: MediaType | null = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : null;
    if (!type) return;

    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setMediaFile(file);
    setMediaType(type);
    setMediaUrl(URL.createObjectURL(file));
    setResultUrl('');
    setError(null);
    setProgress(0);
    setLastMode(null);
    if (type === 'image' && markType === 'veo') setMarkType('auto');
  };

  const getDelogoFilter = (width: number, height: number, mark: MarkType) => {
    const margin = Math.round(Math.min(width, height) * 0.02);
    if (mark === 'veo') {
      const w = Math.round(width * 0.12);
      const h = Math.round(height * 0.05);
      const x = width - w - margin;
      const y = height - h - margin;
      return `delogo=x=${x}:y=${y}:w=${w}:h=${h}`;
    }
    const size = width >= 1280 ? 96 : 48;
    const x = width - size - margin;
    const y = height - size - margin;
    return `delogo=x=${x}:y=${y}:w=${size}:h=${size}`;
  };

  const processWithEngine = async () => {
    if (!mediaFile || !mediaType) return;

    const formData = new FormData();
    formData.append('file', mediaFile);
    formData.append('mediaType', mediaType);
    formData.append('mark', markType);
    formData.append('legacy', String(legacyMode));
    formData.append('ml', String(mlMode));

    const response = await fetch('/api/watermark/remove', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || (lang === 'ar' ? 'فشلت المعالجة' : 'Processing failed'));
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const getImageDimensions = (file: File) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });

  const processWithFfmpeg = async () => {
    if (!mediaFile || !mediaType) return;

    const ffmpeg = await loadFFmpeg();
    const ext = mediaFile.name.split('.').pop() || (mediaType === 'image' ? 'png' : 'mp4');
    const inputName = `wm_input.${ext}`;
    const outputName = mediaType === 'image' ? `wm_output.${ext}` : 'wm_output.mp4';

    ffmpeg.on('progress', ({ progress: p }) => {
      setProgress(Math.round(p * 100));
    });

    await ffmpeg.writeFile(inputName, await fetchFile(mediaFile));

    let width = 1920;
    let height = 1080;

    if (mediaType === 'image') {
      const dims = await getImageDimensions(mediaFile);
      width = dims.width;
      height = dims.height;
    } else {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(mediaFile);
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      width = video.videoWidth || width;
      height = video.videoHeight || height;
      URL.revokeObjectURL(video.src);
    }

    const delogo = getDelogoFilter(width, height, markType);
    const command = mediaType === 'image'
      ? ['-i', inputName, '-vf', delogo, '-y', outputName]
      : [
          '-i', inputName,
          '-vf', delogo,
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
          '-c:a', 'copy',
          '-movflags', '+faststart',
          '-y', outputName,
        ];

    const result = await ffmpeg.exec(command);
    if (result !== 0) throw new Error('FFmpeg failed');

    const raw = await ffmpeg.readFile(outputName);
    const bytes = typeof raw === 'string'
      ? new TextEncoder().encode(raw)
      : new Uint8Array(raw);
    const mime = mediaType === 'image'
      ? (mediaFile.type || `image/${ext}`)
      : `video/${ext}`;
    const blob = new Blob([bytes], { type: mime });

    try { await ffmpeg.deleteFile(inputName); } catch {}
    try { await ffmpeg.deleteFile(outputName); } catch {}

    return URL.createObjectURL(blob);
  };

  const removeWatermark = async () => {
    if (!mediaFile) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl('');

    try {
      let url: string | undefined;

      if (apiAvailable) {
        setLastMode('engine');
        url = await processWithEngine();
        setProgress(100);
      } else {
        setLastMode('ffmpeg');
        url = await processWithFfmpeg();
      }

      if (url) setResultUrl(url);
    } catch (err) {
      console.error('Watermark removal error:', err);
      setError(
        err instanceof Error
          ? err.message
          : lang === 'ar'
            ? 'فشلت إزالة العلامة المائية'
            : 'Failed to remove watermark'
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl || !mediaFile) return;
    const ext = mediaFile.name.split('.').pop() || (isImage ? 'png' : 'mp4');
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${mediaFile.name.replace(/\.[^.]+$/, '')}_processed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearAll = () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setMediaFile(null);
    setMediaType(null);
    setMediaUrl('');
    setResultUrl('');
    setError(null);
    setProgress(0);
    setLastMode(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderSettings = () => (
    <>
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        {!mediaFile ? (
          <label
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-violet-500/50 transition-colors bg-[#0F1115]"
          >
            <Upload size={24} className="text-gray-500" />
            <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
              {lang === 'ar' ? 'اختر صورة أو فيديو Gemini / Veo' : 'Select a Gemini / Veo image or video'}
            </span>
            <span className="text-[7px] font-mono text-gray-600">JPG, PNG, WebP, MP4, MOV, MKV</span>
          </label>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-400 truncate max-w-[180px]">{mediaFile.name}</span>
              <button onClick={clearAll} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex gap-2 text-[8px] font-mono text-gray-500">
              <span>{formatBytes(mediaFile.size)}</span>
              <span className="text-gray-700">|</span>
              <span>{isImage ? (lang === 'ar' ? 'صورة' : 'Image') : (lang === 'ar' ? 'فيديو' : 'Video')}</span>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
      </div>

      {apiAvailable !== null && (
        <div className={cn(
          'mx-3 mt-3 p-2.5 rounded-lg border text-[8px] font-mono sm:mx-4',
          apiAvailable
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
        )}>
          {apiAvailable
            ? (lang === 'ar' ? 'محرك GWT نشط — جودة عالية' : 'GWT engine active — high quality')
            : (lang === 'ar' ? 'المحرك المحلي غير متاح — سيتم استخدام FFmpeg' : 'Local engine unavailable — using FFmpeg fallback')}
        </div>
      )}

      {mediaFile && (
        <>
          <div className="p-3 border-b border-[#2D3139] sm:p-4">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 sm:text-[10px]">
              <Settings2 size={11} className="text-violet-500" />
              {lang === 'ar' ? 'نوع العلامة' : 'Watermark Type'}
            </h3>
            <div className={cn('grid gap-1.5', isVideo ? 'grid-cols-3' : 'grid-cols-2')}>
              {([
                { val: 'auto' as const, labelAr: 'تلقائي', labelEn: 'Auto' },
                { val: 'diamond' as const, labelAr: 'ماسة', labelEn: 'Diamond' },
                ...(isVideo ? [{ val: 'veo' as const, labelAr: 'نص Veo', labelEn: 'Veo Text' }] : []),
              ]).map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setMarkType(opt.val)}
                  className={cn(
                    'py-2 text-[8px] font-mono rounded-md border transition-all',
                    markType === opt.val
                      ? 'bg-violet-600/20 border-violet-500/40 text-violet-400'
                      : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500'
                  )}
                >
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {apiAvailable && (
            <div className="p-3 border-b border-[#2D3139] sm:p-4 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legacyMode}
                  onChange={(e) => setLegacyMode(e.target.checked)}
                  className="accent-violet-500"
                />
                <span className="text-[8px] font-mono text-gray-400">
                  {lang === 'ar' ? 'وضع Legacy (علامات قديمة)' : 'Legacy mode (older watermarks)'}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mlMode}
                  onChange={(e) => setMlMode(e.target.checked)}
                  className="accent-violet-500"
                />
                <span className="text-[8px] font-mono text-gray-400 flex items-center gap-1">
                  <Sparkles size={10} className="text-violet-400" />
                  {lang === 'ar' ? 'AlphaJudge ML (دقة أعلى)' : 'AlphaJudge ML (higher accuracy)'}
                </span>
              </label>
            </div>
          )}

          <div className="p-3 mt-auto space-y-2 sm:p-4">
            {processing && (
              <div className="space-y-2">
                <div className="h-1.5 bg-[#1A1D23] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[8px] font-mono text-gray-500 text-center">
                  {progress}% — {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </p>
              </div>
            )}

            <button
              onClick={removeWatermark}
              disabled={processing}
              className={cn(
                'w-full py-3 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2',
                processing
                  ? 'bg-violet-600/30 text-violet-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25'
              )}
            >
              {processing ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
              {lang === 'ar' ? 'إزالة العلامة المائية' : 'Remove Watermark'}
            </button>

            {resultUrl && (
              <button
                onClick={downloadResult}
                className="w-full py-2.5 rounded-lg font-mono text-[9px] uppercase tracking-wider bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Download size={12} />
                {lang === 'ar' ? 'تحميل النتيجة' : 'Download Result'}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 sm:w-8 sm:h-8">
          <Eraser size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">
            {lang === 'ar' ? 'إزالة علامة Veo/Gemini' : 'Veo/Gemini Watermark Remover'}
          </h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {lang === 'ar'
              ? 'إزالة علامة Gemini و Veo من الصور والفيديو'
              : 'Remove Gemini & Veo watermarks from images and video'}
          </p>
        </div>
      </div>

      <div className="md:hidden flex border-b border-[#2D3139] shrink-0">
        {(['upload', 'preview', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 py-2 text-[8px] font-mono uppercase tracking-wider transition-colors',
              mobileTab === tab ? 'text-violet-400 border-b-2 border-violet-500' : 'text-gray-500'
            )}
          >
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload')
              : tab === 'preview' ? (lang === 'ar' ? 'معاينة' : 'Preview')
              : (lang === 'ar' ? 'إعدادات' : 'Settings')}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn(
          'w-full md:w-72 lg:w-80 border-l border-[#2D3139] bg-[#14171C] flex flex-col overflow-y-auto shrink-0',
          mobileTab !== 'settings' && mobileTab !== 'upload' ? 'hidden md:flex' : 'flex'
        )}>
          {renderSettings()}
        </div>

        <div className={cn(
          'flex-1 flex flex-col overflow-hidden bg-[#0A0C0F]',
          mobileTab !== 'preview' ? 'hidden md:flex' : 'flex'
        )}>
          <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 sm:p-4 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Eye size={11} className="text-gray-500" />
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                  {lang === 'ar' ? 'الأصلي' : 'Original'}
                </span>
              </div>
              <div className="flex-1 bg-[#0F1115] rounded-xl border border-[#2D3139] flex items-center justify-center overflow-hidden min-h-[200px]">
                {mediaUrl ? (
                  isImage ? (
                    <img src={mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <video ref={videoRef} src={mediaUrl} controls className="max-w-full max-h-full object-contain" />
                  )
                ) : (
                  <div className="text-center p-6">
                    <Film size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-[9px] font-mono text-gray-600">
                      {lang === 'ar' ? 'ارفع صورة أو فيديو للمعاينة' : 'Upload an image or video to preview'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1.5 mb-2">
                {resultUrl ? (
                  <CheckCircle2 size={11} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={11} className="text-gray-600" />
                )}
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                  {lang === 'ar' ? 'النتيجة' : 'Result'}
                  {lastMode && (
                    <span className="text-gray-600 ml-1">
                      ({lastMode === 'engine' ? 'GWT' : 'FFmpeg'})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex-1 bg-[#0F1115] rounded-xl border border-[#2D3139] flex items-center justify-center overflow-hidden min-h-[200px]">
                {resultUrl ? (
                  isImage ? (
                    <img src={resultUrl} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <video ref={resultVideoRef} src={resultUrl} controls className="max-w-full max-h-full object-contain" />
                  )
                ) : (
                  <div className="text-center p-6">
                    <Eraser size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-[9px] font-mono text-gray-600">
                      {lang === 'ar' ? 'ستظهر النتيجة هنا' : 'Result will appear here'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
