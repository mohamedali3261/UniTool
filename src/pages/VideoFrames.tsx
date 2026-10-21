import { useState, useRef } from 'react';
import {
  Images, Upload, Download, Loader2, AlertTriangle, X, Film,
  FileImage, FileDown, Trash2, Clock, Grid3x3, Play,
} from 'lucide-react';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate?: (page: string) => void;
}

interface FrameItem {
  id: number;
  url: string;
  blob: Blob;
  name: string;
  size: number;
  time: number; // seconds in source
}

const COUNT_OPTIONS = [4, 6, 8, 12, 16, 24];

let nextId = 1;
const uid = () => nextId++;

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

const GIF_WIDTHS = [240, 320, 480, 640, 800];

export function VideoFrames({ t, lang, onNavigate }: Props) {
  const ar = (a: string, e: string) => (lang === 'ar' ? a : e);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<'frames' | 'gif'>('frames');
  const [frameFormat, setFrameFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [count, setCount] = useState(8);
  const [gifStart, setGifStart] = useState(0);
  const [gifDuration, setGifDuration] = useState(3);
  const [gifFps, setGifFps] = useState(10);
  const [gifWidth, setGifWidth] = useState(480);
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    for (const f of frames) URL.revokeObjectURL(f.url);
    setFrames([]);
    setVideoFile(null);
    setVideoUrl('');
    setDuration(0);
    setProgress(0);
    setError(null);
  };

  const acceptVideo = (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i.test(file.name);
    if (!isVideo) {
      setError(ar('هذا الملف ليس فيديو', 'Not a video file'));
      return;
    }
    clearVideo();
    setError(null);
    setFrames([]);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  // ---------- extract frames ----------
  const extractFrames = async () => {
    if (!videoFile || !duration) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    for (const f of frames) URL.revokeObjectURL(f.url);
    setFrames([]);
    try {
      const ffmpeg = await loadFFmpeg();
      const inputName = `vf_in_${uid()}.${getExt(videoFile.name)}`;
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      const out: FrameItem[] = [];
      for (let i = 0; i < count; i++) {
        const time = ((i + 0.5) * duration) / count;
        const isPng = frameFormat === 'png';
        const outName = `vf_out_${i}.${isPng ? 'png' : 'jpg'}`;
        const args = isPng
          ? ['-ss', time.toFixed(2), '-i', inputName, '-frames:v', '1', '-y', outName]
          : ['-ss', time.toFixed(2), '-i', inputName, '-frames:v', '1', '-q:v', '3', '-y', outName];
        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile(outName);
        const blob = new Blob([data as Uint8Array], { type: isPng ? 'image/png' : 'image/jpeg' });
        out.push({
          id: uid(),
          url: URL.createObjectURL(blob),
          blob,
          name: `${videoFile.name.replace(/\.[^.]+$/, '')}_frame_${String(i + 1).padStart(2, '0')}.${isPng ? 'png' : 'jpg'}`,
          size: blob.size,
          time,
        });
        try { await ffmpeg.deleteFile(outName); } catch { /* ignore */ }
        setProgress(Math.round(((i + 1) / count) * 100));
      }
      try { await ffmpeg.deleteFile(inputName); } catch { /* ignore */ }
      setFrames(out);
    } catch (err: any) {
      setError(err?.message || ar('فشل استخراج الإطارات', 'Frame extraction failed'));
    } finally {
      setBusy(false);
    }
  };

  // ---------- make gif ----------
  const makeGif = async () => {
    if (!videoFile) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    for (const f of frames) URL.revokeObjectURL(f.url);
    setFrames([]);
    try {
      const ffmpeg = await loadFFmpeg();
      const inputName = `vf_in_${uid()}.${getExt(videoFile.name)}`;
      const paletteName = 'palette.png';
      const outputName = 'output.gif';
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
      });

      await ffmpeg.exec([
        '-i', inputName,
        '-ss', fmtTimePlain(gifStart),
        '-t', String(gifDuration),
        '-vf', `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,palettegen=stats_mode=diff`,
        '-y', paletteName,
      ]);
      await ffmpeg.exec([
        '-i', inputName,
        '-i', paletteName,
        '-lavfi', `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
        '-ss', fmtTimePlain(gifStart),
        '-t', String(gifDuration),
        '-loop', '0',
        '-y', outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as Uint8Array], { type: 'image/gif' });
      const frame: FrameItem = {
        id: uid(),
        url: URL.createObjectURL(blob),
        blob,
        name: `${videoFile.name.replace(/\.[^.]+$/, '')}_clip.gif`,
        size: blob.size,
        time: gifStart,
      };
      setFrames([frame]);
      // cleanup
      for (const n of [inputName, paletteName, outputName]) {
        try { await ffmpeg.deleteFile(n); } catch { /* ignore */ }
      }
    } catch (err: any) {
      setError(err?.message || ar('فشل إنشاء GIF', 'GIF creation failed'));
    } finally {
      setBusy(false);
    }
  };

  const downloadOne = (f: FrameItem) => {
    const a = document.createElement('a');
    a.href = f.url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAll = () => {
    frames.forEach((f, i) => setTimeout(() => downloadOne(f), i * 200));
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .vf-scroll { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .vf-scroll::-webkit-scrollbar { width: 4px; }
        .vf-scroll::-webkit-scrollbar-track { background: transparent; }
        .vf-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        input[type=range] { accent-color: #f43f5e; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 sm:w-8 sm:h-8">
          <Images size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{ar('استخراج إطارات الفيديو', 'Video Frame Extractor')}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {ar('إطارات PNG/JPEG موزعة بالتساوي أو مقطع GIF — بالكامل في المتصفح', 'Evenly spread PNG/JPEG frames or a GIF clip — fully in-browser')}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('videoToGif')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-600/15 border border-white/[0.06] hover:border-amber-500/30 transition-colors"
          >
            <Film size={10} className="text-amber-400" />
            <span className="text-[9px] font-mono text-gray-400 hover:text-amber-300">{ar('فيديو لـ GIF', 'Video to GIF')}</span>
          </button>
        )}
      </div>

      <div className="flex-1 vf-scroll">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {([
              { id: 'frames' as const, label: ar('إطارات متعددة', 'Multiple frames'), icon: Grid3x3 },
              { id: 'gif' as const, label: ar('مقطع GIF', 'GIF clip'), icon: Film },
            ]).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono transition-colors',
                  mode === m.id ? 'bg-rose-600/20 text-rose-300 ring-1 ring-rose-500/30' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <m.icon size={12} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Drop zone / video preview */}
          {!videoFile ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) acceptVideo(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                dragOver ? 'border-rose-500 bg-rose-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', dragOver ? 'bg-rose-500/30' : 'bg-white/[0.05]')}>
                <Upload size={18} className={dragOver ? 'text-rose-300' : 'text-gray-500'} />
              </div>
              <p className="text-[10px] font-mono text-gray-400">{ar('افلِت الفيديو هنا أو انقر للاختيار', 'Drop a video here or click to browse')}</p>
              <p className="text-[8px] text-gray-600 font-mono">MP4 · WebM · MOV · MKV · AVI</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
              <video
                src={videoUrl}
                controls
                onLoadedMetadata={e => {
                  const d = e.currentTarget.duration;
                  if (isFinite(d)) {
                    setDuration(d);
                    setGifDuration(s => Math.min(s, Math.max(1, Math.floor(d))));
                  }
                }}
                onSeeked={e => setGifStart(e.currentTarget.currentTime)}
                className="w-full max-h-64 bg-black"
              />
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-[9px] font-mono text-gray-500 truncate">
                  {videoFile.name} · {fmtBytes(videoFile.size)}
                  {duration > 0 && <span> · {fmtTime(duration)}</span>}
                </div>
                <button
                  onClick={clearVideo}
                  disabled={busy}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                  title={ar('إزالة الفيديو', 'Remove video')}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) acceptVideo(f);
              e.target.value = '';
            }}
          />

          {/* Options */}
          {videoFile && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              {mode === 'frames' ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-gray-500">{ar('الصيغة', 'Format')}</span>
                    {(['jpeg', 'png'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFrameFormat(f)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[9px] font-mono border transition-colors',
                          frameFormat === f ? 'bg-rose-600/20 border-rose-500/30 text-rose-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        )}
                      >
                        {f === 'jpeg' ? 'JPEG' : 'PNG'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-gray-500">{ar('عدد الإطارات', 'Frame count')}</span>
                    {COUNT_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => setCount(c)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[9px] font-mono border transition-colors',
                          count === c ? 'bg-rose-600/20 border-rose-500/30 text-rose-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                    <span className="text-[8px] text-gray-600 font-mono">
                      {ar('(موزعة بالتساوي على مدة الفيديو)', '(spread evenly across the video)')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="text-[8px] text-gray-600 font-mono flex items-center gap-1">
                      <Clock size={9} />
                      {count} {ar('إطار ×', 'frames ×')} {duration ? (duration / count).toFixed(1) : '—'}{ar('ث', 's')}
                    </span>
                    <button
                      onClick={extractFrames}
                      disabled={busy}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-colors',
                        busy ? 'bg-white/[0.03] text-gray-600 border border-white/[0.06]' : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110'
                      )}
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Images size={12} />}
                      {busy ? ar('جارٍ الاستخراج…', 'Extracting…') : ar('استخراج الإطارات', 'Extract frames')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-gray-500">{ar('البداية', 'Start')}</span>
                        <span className="text-[9px] font-mono text-rose-300">{fmtTime(gifStart)}</span>
                      </div>
                      <input
                        type="range" min={0} max={Math.max(0, duration - 1)} step={0.1} value={gifStart}
                        onChange={e => setGifStart(Number(e.target.value))}
                        className="w-full h-1"
                      />
                      <p className="text-[8px] text-gray-600 font-mono">
                        {ar('(يتحدث تلقائيًا عند تحريك الفيديو)', '(follows video seek)')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-gray-500">{ar('المدة', 'Duration')}</span>
                        <span className="text-[9px] font-mono text-rose-300">{gifDuration}{ar('ث', 's')}</span>
                      </div>
                      <input
                        type="range" min={1} max={Math.max(2, Math.min(20, duration || 20))} step={0.5} value={gifDuration}
                        onChange={e => setGifDuration(Number(e.target.value))}
                        className="w-full h-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-gray-500">FPS</span>
                    {[5, 10, 15, 20].map(f => (
                      <button
                        key={f}
                        onClick={() => setGifFps(f)}
                        className={cn(
                          'px-2 py-1 rounded-md text-[9px] font-mono border transition-colors',
                          gifFps === f ? 'bg-rose-600/20 border-rose-500/30 text-rose-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                    <span className="text-[9px] font-mono text-gray-500 ml-2">{ar('العرض', 'Width')}</span>
                    {GIF_WIDTHS.map(w => (
                      <button
                        key={w}
                        onClick={() => setGifWidth(w)}
                        className={cn(
                          'px-2 py-1 rounded-md text-[9px] font-mono border transition-colors',
                          gifWidth === w ? 'bg-rose-600/20 border-rose-500/30 text-rose-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="text-[8px] text-gray-600 font-mono flex items-center gap-1">
                      <Play size={9} />
                      {fmtTime(gifStart)} → {fmtTime(Math.min(gifStart + gifDuration, duration || gifStart + gifDuration))}
                    </span>
                    <button
                      onClick={makeGif}
                      disabled={busy}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-colors',
                        busy ? 'bg-white/[0.03] text-gray-600 border border-white/[0.06]' : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110'
                      )}
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
                      {busy ? ar('جارٍ الإنشاء…', 'Creating…') : ar('إنشاء GIF', 'Create GIF')}
                    </button>
                  </div>
                </>
              )}

              {/* Progress */}
              {busy && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                    <span>{ar('معالجة…', 'Processing…')}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Results */}
          {frames.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-gray-400">
                  {frames.length} {frames.length === 1 && frames[0].name.endsWith('.gif')
                    ? ar('مقطع GIF', 'GIF clip')
                    : ar('إطار مستخرج', 'extracted frames')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110 transition"
                  >
                    <FileDown size={11} />
                    {ar('تنزيل الكل', 'Download all')}
                  </button>
                  <button
                    onClick={() => setFrames([])}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={ar('مسح النتائج', 'Clear results')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className={cn('grid gap-2', frames.length > 1 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1')}>
                {frames.map(f => (
                  <div key={f.id} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                    <div className="aspect-video rounded-lg overflow-hidden bg-black/40">
                      {f.name.endsWith('.gif') ? (
                        <img src={f.url} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <img src={f.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[8px] font-mono text-gray-500 truncate">
                        {f.name.endsWith('.gif') ? `${fmtBytes(f.size)}` : `${fmtTime(f.time)} · ${fmtBytes(f.size)}`}
                      </span>
                      <button
                        onClick={() => downloadOne(f)}
                        className="p-1 rounded-md bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25 transition-colors shrink-0"
                        title={ar('تنزيل', 'Download')}
                      >
                        <Download size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {videoFile && frames.length === 0 && !busy && !error && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                <FileImage size={18} className="text-gray-600" />
              </div>
              <p className="text-[10px] font-mono text-gray-600">
                {mode === 'frames'
                  ? ar('اضبط الخصائص ثم اضغط "استخراج الإطارات"', 'Set options then press "Extract frames"')
                  : ar('اكتشف المقطع ثم اضغط "إنشاء GIF"', 'Scrub the clip then press "Create GIF"')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ffmpeg-friendly plain seconds (no leading-zero formatting)
const fmtTimePlain = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return `${String(m).padStart(2, '0')}:${sec.padStart(5, '0')}`;
};

const getExt = (name: string) => {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name);
  return m ? m[1].toLowerCase() : 'mp4';
};
