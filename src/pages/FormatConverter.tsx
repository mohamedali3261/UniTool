import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight, Upload, Download, Trash2, Loader2, AlertTriangle,
  Check, X, FileImage, FileAudio, Zap, Image as ImageIcon, Music4,
  FileDown, Repeat,
} from 'lucide-react';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate?: (page: string) => void;
}

interface ConvItem {
  id: number;
  kind: 'image' | 'audio';
  file: File;
  name: string;
  size: number;
  status: 'ready' | 'working' | 'done' | 'error';
  progress: number; // 0..100
  outBlob?: Blob;
  outName?: string;
  thumb?: string;
  error?: string;
}

const IMG_FORMATS = [
  { id: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp' },
  { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg', ext: 'jpg' },
  { id: 'png', label: 'PNG', mime: 'image/png', ext: 'png' },
] as const;

const AUDIO_FORMATS = [
  { id: 'mp3', label: 'MP3', ext: 'mp3', bitrate: true },
  { id: 'ogg', label: 'OGG', ext: 'ogg', bitrate: true },
  { id: 'm4a', label: 'M4A (AAC)', ext: 'm4a', bitrate: true },
  { id: 'opus', label: 'Opus', ext: 'opus', bitrate: true },
  { id: 'wav', label: 'WAV', ext: 'wav', bitrate: false },
] as const;

const BITRATES = ['128k', '192k', '256k', '320k'] as const;

const MAXDIM_OPTIONS = [
  { id: 0, label: 'الأصلي' }, { id: 1920, label: '1920px' },
  { id: 1280, label: '1280px' }, { id: 800, label: '800px' },
];

let nextId = 1;
const uid = () => nextId++;

const fmtBytes = (b: number) => {
  if (!b && b !== 0) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const getExt = (name: string) => {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name);
  return m ? m[1].toLowerCase() : 'bin';
};

export function FormatConverter({ t, lang, onNavigate }: Props) {
  const ar = (a: string, e: string) => (lang === 'ar' ? a : e);

  const [tab, setTab] = useState<'image' | 'audio'>('image');
  const [items, setItems] = useState<ConvItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [imgFormat, setImgFormat] = useState('webp');
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [quality, setQuality] = useState(90);
  const [maxDim, setMaxDim] = useState(0);
  const [bitrate, setBitrate] = useState('192k');
  const [autoConvert, setAutoConvert] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ConvItem[]>([]);

  itemsRef.current = items;

  const visible = items.filter(i => i.kind === tab);
  const working = items.some(i => i.status === 'working');
  const doneItems = items.filter(i => i.status === 'done');
  const totalIn = items.reduce((s, i) => s + i.size, 0);
  const totalOut = doneItems.reduce((s, i) => s + (i.outBlob?.size || 0), 0);

  const patch = useCallback((id: number, fields: Partial<ConvItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...fields } : it)));
  }, []);

  // ---------- picking files ----------
  const acceptFiles = useCallback((files: File[]) => {
    setLoadingFiles(true);
    const added: ConvItem[] = [];
    for (const f of files) {
      const isImage = f.type.startsWith('image/') || /\.(heic|heif|avif)$/i.test(f.name);
      const isAudio = f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|opus|flac|wma|aiff)$/i.test(f.name);
      if (tab === 'image' && isImage) {
        added.push({ id: uid(), kind: 'image', file: f, name: f.name, size: f.size, status: 'ready', progress: 0 });
      } else if (tab === 'audio' && isAudio) {
        added.push({ id: uid(), kind: 'audio', file: f, name: f.name, size: f.size, status: 'ready', progress: 0 });
      }
    }
    setItems(prev => [...prev, ...added]);
    setLoadingFiles(false);
    return added;
  }, [tab]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) acceptFiles(files);
  };

  // ---------- image conversion ----------
  const convertImage = async (item: ConvItem): Promise<{ blob: Blob; outName: string }> => {
    const fmt = IMG_FORMATS.find(f => f.id === imgFormat) || IMG_FORMATS[0];
    const url = URL.createObjectURL(item.file);
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error(ar('فشل فك ترميز الصورة (الصيغة غير مدعومة)', 'Failed to decode image (unsupported format)')));
        img.src = url;
      });
      let w = img.naturalWidth || 0, h = img.naturalHeight || 0;
      if (!w || !h) throw new Error(ar('أبعاد الصورة غير صالحة', 'Invalid image dimensions'));
      if (maxDim && Math.max(w, h) > maxDim) {
        const s = maxDim / Math.max(w, h);
        w = Math.max(1, Math.round(w * s));
        h = Math.max(1, Math.round(h * s));
      }
      // safety cap for canvas limits
      const CAP = 8192;
      if (Math.max(w, h) > CAP) {
        const s = CAP / Math.max(w, h);
        w = Math.round(w * s); h = Math.round(h * s);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(ar('فشل إنشاء لوحة الرسم', 'Canvas unavailable'));
      if (fmt.id === 'jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => (b ? res(b) : rej(new Error(ar('فشل ترميز المخرج', 'Encode failed')))), fmt.mime, fmt.id === 'png' ? undefined : quality / 100)
      );
      const base = item.name.replace(/\.[^.]+$/, '');
      return { blob, outName: `${base}.${fmt.ext}` };
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // ---------- audio conversion ----------
  const convertAudio = async (item: ConvItem): Promise<{ blob: Blob; outName: string }> => {
    const fmt = AUDIO_FORMATS.find(f => f.id === audioFormat) || AUDIO_FORMATS[0];
    const ffmpeg = await loadFFmpeg();
    const inExt = getExt(item.name);
    const inName = `in_${item.id}.${inExt}`;
    const outName = `out_${item.id}.${fmt.ext}`;
    let args: string[];
    switch (fmt.id) {
      case 'mp3': args = ['-c:a', 'libmp3lame', '-b:a', bitrate]; break;
      case 'm4a': args = ['-c:a', 'aac', '-b:a', bitrate]; break;
      case 'opus': args = ['-c:a', 'libopus', '-b:a', bitrate]; break;
      case 'ogg': args = ['-c:a', 'libvorbis', '-b:a', bitrate]; break;
      default: args = ['-c:a', 'pcm_s16le'];
    }
    try {
      await ffmpeg.writeFile(inName, await fetchFile(item.file));
      const onProg = ({ progress }: { progress: number }) => {
        const p = Math.max(0, Math.min(100, Math.round(progress * 100)));
        patch(item.id, { progress: p });
      };
      ffmpeg.on('progress', onProg);
      try {
        await ffmpeg.exec(['-i', inName, ...args, outName]);
      } finally {
        ffmpeg.off('progress', onProg);
      }
      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data as Uint8Array], { type: `audio/${fmt.ext}` });
      const finalName = `${item.name.replace(/\.[^.]+$/, '')}.${fmt.ext}`;
      // cleanup virtual FS
      try { await ffmpeg.deleteFile(inName); } catch { /* ignore */ }
      try { await ffmpeg.deleteFile(outName); } catch { /* ignore */ }
      return { blob, outName: finalName };
    } catch (err: any) {
      try { await ffmpeg.deleteFile(inName); } catch { /* ignore */ }
      throw new Error(err?.message || ar('فشل تحويل الصوت', 'Audio conversion failed'));
    }
  };

  // ---------- run ----------
  const runConversion = useCallback(async (list?: ConvItem[]) => {
    const source = (list || itemsRef.current.filter(i => i.kind === tab && i.status !== 'working'));
    if (!source.length || busy) return;
    setBusy(true);
    for (const snapshot of source) {
      const item = itemsRef.current.find(i => i.id === snapshot.id);
      if (!item || item.status === 'working') continue;
      patch(item.id, { status: 'working', progress: 0, error: undefined, thumb: undefined, outBlob: undefined });
      try {
        const { blob, outName } = item.kind === 'image'
          ? await convertImage(item)
          : await convertAudio(item);
        const thumb = item.kind === 'image' ? URL.createObjectURL(blob) : undefined;
        patch(item.id, { status: 'done', progress: 100, outBlob: blob, outName, thumb });
      } catch (err: any) {
        patch(item.id, { status: 'error', progress: 0, error: err?.message || String(err) });
      }
    }
    setBusy(false);
  }, [tab, busy, patch, imgFormat, audioFormat, quality, maxDim, bitrate, ar]);

  // auto-convert when files are dropped in
  const didAutoRef = useRef<ConvItem[]>([]);
  useEffect(() => {
    if (!autoConvert) return;
    const fresh = didAutoRef.current;
    if (fresh.length) {
      didAutoRef.current = [];
      const ready = fresh.filter(i => i.status === 'ready' || i.status === 'error');
      if (ready.length) setTimeout(() => { runConversion(itemsRef.current.filter(i => ready.some(r => r.id === i.id))); }, 60);
    }
  }, [items, autoConvert, runConversion]);

  // ---------- downloads ----------
  const downloadOne = (item: ConvItem) => {
    if (!item.outBlob || !item.outName) return;
    const url = URL.createObjectURL(item.outBlob);
    const a = document.createElement('a');
    a.href = url; a.download = item.outName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const downloadAll = () => {
    for (const item of doneItems) setTimeout(() => downloadOne(item), 150);
  };

  const clearAll = () => {
    for (const i of items) if (i.thumb) URL.revokeObjectURL(i.thumb);
    setItems([]);
  };

  const removeItem = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item?.thumb) URL.revokeObjectURL(item.thumb);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const currentFmt = tab === 'image' ? IMG_FORMATS.find(f => f.id === imgFormat) : AUDIO_FORMATS.find(f => f.id === audioFormat);
  const totalProgress = items.length ? items.reduce((s, i) => s + (i.status === 'done' ? 100 : i.progress), 0) / (items.length * 100) : 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .fc-scroll { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .fc-scroll::-webkit-scrollbar { width: 4px; }
        .fc-scroll::-webkit-scrollbar-track { background: transparent; }
        .fc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 sm:w-8 sm:h-8">
          <ArrowLeftRight size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{ar('محول الصيغ الشامل', 'Universal Format Converter')}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {ar('صور: PNG / JPEG / WebP — صوت: MP3 / OGG / M4A / Opus / WAV', 'Images: PNG / JPEG / WebP — Audio: MP3 / OGG / M4A / Opus / WAV')}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('imageTools')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-violet-600/15 border border-white/[0.06] hover:border-violet-500/30 transition-colors"
          >
            <ImageIcon size={10} className="text-violet-400" />
            <span className="text-[9px] font-mono text-gray-400 hover:text-violet-300">{ar('أدوات الصور', 'Image Tools')}</span>
          </button>
        )}
      </div>

      <div className="flex-1 fc-scroll">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {([
              { id: 'image' as const, label: ar('الصور', 'Images'), icon: FileImage },
              { id: 'audio' as const, label: ar('الصوت', 'Audio'), icon: FileAudio },
            ]).map(m => (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono transition-colors',
                  tab === m.id ? 'bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <m.icon size={12} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            {tab === 'image' ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {IMG_FORMATS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setImgFormat(f.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-colors',
                        imgFormat === f.id ? 'bg-violet-600/20 border-violet-500/30 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {imgFormat !== 'png' && (
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-gray-500 w-24 shrink-0">{ar('الجودة', 'Quality')}</span>
                    <input
                      type="range" min={30} max={100} value={quality}
                      onChange={e => setQuality(Number(e.target.value))}
                      className="flex-1 h-1 accent-violet-500"
                    />
                    <span className="text-[9px] font-mono text-violet-300 w-8 text-right">{quality}%</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono text-gray-500">{ar('أقصى بُعد', 'Max size')}</span>
                  {MAXDIM_OPTIONS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setMaxDim(o.id)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[9px] font-mono border transition-colors',
                        maxDim === o.id ? 'bg-violet-600/20 border-violet-500/30 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {o.id === 0 ? ar('الأصلي', 'Original') : o.label}
                    </button>
                  ))}
                  <span className="text-[8px] text-gray-600 font-mono">
                    {ar('(تصغير متوافق مع الحفاظ على النسب)', '(aspect preserved)')}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIO_FORMATS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setAudioFormat(f.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-colors',
                        audioFormat === f.id ? 'bg-violet-600/20 border-violet-500/30 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {(currentFmt as any)?.bitrate && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-gray-500">{ar('معدل البت', 'Bitrate')}</span>
                    {BITRATES.map(b => (
                      <button
                        key={b}
                        onClick={() => setBitrate(b)}
                        className={cn(
                          'px-2 py-1 rounded-md text-[9px] font-mono border transition-colors',
                          bitrate === b ? 'bg-violet-600/20 border-violet-500/30 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[8px] text-gray-600 font-mono">
                  {ar('يعمل بالمتصفح عبر FFmpeg — بدون رفع أي ملف للسيرفر', 'Runs in-browser via FFmpeg — nothing is uploaded')}
                </p>
              </>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
              <button
                onClick={() => setAutoConvert(a => !a)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono border transition-colors',
                  autoConvert ? 'bg-emerald-600/15 border-emerald-500/25 text-emerald-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500'
                )}
              >
                <Repeat size={10} />
                {ar('تحويل تلقائي عند الإفلات', 'Auto-convert on drop')}
              </button>
              <button
                onClick={() => runConversion()}
                disabled={!visible.length || busy}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-colors',
                  !visible.length || busy
                    ? 'bg-white/[0.03] text-gray-600 border border-white/[0.06]'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:brightness-110'
                )}
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {busy ? ar('جارٍ التحويل…', 'Converting…') : ar('تحويل الكل', 'Convert all')}
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
            )}
          >
            {loadingFiles ? (
              <Loader2 size={20} className="text-violet-400 animate-spin" />
            ) : (
              <>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', dragOver ? 'bg-violet-500/30' : 'bg-white/[0.05]')}>
                  <Upload size={16} className={dragOver ? 'text-violet-300' : 'text-gray-500'} />
                </div>
                <p className="text-[10px] font-mono text-gray-400">
                  {ar('افلِت الملفات هنا أو انقر للاختيار', 'Drop files here or click to browse')}
                </p>
                <p className="text-[8px] text-gray-600 font-mono">
                  {tab === 'image'
                    ? ar('JPG · PNG · WebP · AVIF · HEIC (حسب المتصفح)', 'JPG · PNG · WebP · AVIF · HEIC (browser dependent)')
                    : ar('MP3 · WAV · OGG · M4A · AAC · Opus · FLAC · WMA', 'MP3 · WAV · OGG · M4A · AAC · Opus · FLAC · WMA')}
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={tab === 'image' ? 'image/*' : 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.opus,.flac,.wma'}
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files || []);
                if (files.length) {
                  const added = acceptFiles(files);
                  didAutoRef.current = added;
                  // trigger the auto-convert effect even if state reference is equal
                  setItems(prev => [...prev]);
                }
                e.target.value = '';
              }}
            />
          </div>

          {/* Global progress */}
          {(busy || items.length > 0) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                <span>
                  {doneItems.length}/{items.filter(i => i.kind === tab).length} {ar('ملف', 'files')}
                </span>
                <span>{Math.round(totalProgress * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-200"
                  style={{ width: `${totalProgress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* File list */}
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                {tab === 'image' ? <ImageIcon size={18} className="text-gray-600" /> : <Music4 size={18} className="text-gray-600" />}
              </div>
              <p className="text-[10px] font-mono text-gray-600">{ar('لا ملفات بعد', 'No files yet')}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map(item => (
                <div key={item.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                  {/* thumb / icon */}
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center overflow-hidden shrink-0">
                    {item.thumb ? (
                      <img src={item.thumb} alt="" className="w-full h-full object-cover" />
                    ) : item.kind === 'image' ? (
                      <FileImage size={14} className="text-gray-600" />
                    ) : (
                      <FileAudio size={14} className="text-gray-600" />
                    )}
                  </div>
                  {/* name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-300 truncate">{item.name}</p>
                    <p className="text-[8px] font-mono text-gray-600">
                      {fmtBytes(item.size)}
                      {item.status === 'done' && item.outBlob && (
                        <span className="text-emerald-400"> → {fmtBytes(item.outBlob.size)} {(item.outBlob.size < item.size) ? `(-${Math.round((1 - item.outBlob.size / item.size) * 100)}%)` : ''}</span>
                      )}
                      {item.status === 'working' && <span className="text-violet-400"> {item.progress}%</span>}
                      {item.status === 'ready' && <span> · {ar('بانتظار التحويل', 'pending')}</span>}
                    </p>
                    {item.status === 'working' && (
                      <div className="h-0.5 mt-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}
                    {item.status === 'error' && item.error && (
                      <p className="text-[8px] text-red-400 truncate" title={item.error}>{item.error}</p>
                    )}
                  </div>
                  {/* actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'done' && (
                      <button
                        onClick={() => downloadOne(item)}
                        className="p-1.5 rounded-lg bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25 transition-colors"
                        title={ar('تنزيل', 'Download')}
                      >
                        <Download size={11} />
                      </button>
                    )}
                    {item.status === 'working' && <Loader2 size={11} className="text-violet-400 animate-spin" />}
                    {item.status === 'error' && <AlertTriangle size={11} className="text-red-400" />}
                    {item.status === 'ready' && <Check size={11} className="text-gray-600" />}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={item.status === 'working'}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                      title={ar('إزالة', 'Remove')}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer actions */}
          {doneItems.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[9px] font-mono text-gray-500">
                {ar('الإجمالي', 'Total')}:{' '}
                <span className="text-gray-300">{fmtBytes(totalIn)}</span>
                {' → '}
                <span className="text-emerald-400">{fmtBytes(totalOut)}</span>
                {totalOut < totalIn && totalIn > 0 && (
                  <span className="text-emerald-400"> ({Math.round((1 - totalOut / totalIn) * 100)}% {ar('وفّرت', 'saved')})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={downloadAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110 transition"
                >
                  <FileDown size={11} />
                  {ar('تنزيل الكل', 'Download all')} ({doneItems.length})
                </button>
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title={ar('مسح الكل', 'Clear all')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
