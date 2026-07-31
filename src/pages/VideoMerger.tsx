import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import {
  Upload,
  Download,
  Loader2,
  Film,
  Trash2,
  ArrowUp,
  ArrowDown,
  Combine,
  Settings2,
  Eye,
  Play,
  Pause,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { VIDEO_ACCEPT, getFileExtension, isVideoFile } from '../utils/video-formats';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

type TransitionType =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'wipeleft'
  | 'wiperight'
  | 'slideleft'
  | 'slideright'
  | 'circleopen'
  | 'circleclose'
  | 'pixelize';

type Quality = 'fast' | 'balanced' | 'high';

interface VideoItem {
  id: number;
  file: File;
  name: string;
  size: number;
  ext: string;
  url: string;
  duration: number;
  transition: TransitionType;
}

const QUALITY: Record<Quality, { crf: string; preset: string; labelAr: string; labelEn: string }> = {
  fast: { crf: '28', preset: 'ultrafast', labelAr: 'سريع', labelEn: 'Fast' },
  balanced: { crf: '23', preset: 'veryfast', labelAr: 'متوازن', labelEn: 'Balanced' },
  high: { crf: '18', preset: 'fast', labelAr: 'جودة عالية', labelEn: 'High' },
};

const TRANSITIONS: { id: TransitionType; labelAr: string; labelEn: string }[] = [
  { id: 'none', labelAr: 'بدون', labelEn: 'None' },
  { id: 'fade', labelAr: 'تلاشي', labelEn: 'Fade' },
  { id: 'dissolve', labelAr: 'ذوبان', labelEn: 'Dissolve' },
  { id: 'wipeleft', labelAr: 'مسح يسار', labelEn: 'Wipe Left' },
  { id: 'wiperight', labelAr: 'مسح يمين', labelEn: 'Wipe Right' },
  { id: 'slideleft', labelAr: 'انزلاق يسار', labelEn: 'Slide Left' },
  { id: 'slideright', labelAr: 'انزلاق يمين', labelEn: 'Slide Right' },
  { id: 'circleopen', labelAr: 'دائرة مفتوحة', labelEn: 'Circle Open' },
  { id: 'circleclose', labelAr: 'دائرة مغلقة', labelEn: 'Circle Close' },
  { id: 'pixelize', labelAr: 'بكسل', labelEn: 'Pixelize' },
];

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function readVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    const done = (d: number) => {
      video.src = '';
      resolve(Number.isFinite(d) && d > 0 ? d : 0);
    };
    video.onloadedmetadata = () => done(video.duration);
    video.onerror = () => done(0);
  });
}

function liveTransitionStyle(
  type: TransitionType,
  progress: number,
  role: 'outgoing' | 'incoming'
): CSSProperties {
  const p = Math.min(1, Math.max(0, progress));
  if (type === 'none') {
    return role === 'outgoing' ? { opacity: p < 1 ? 1 : 0 } : { opacity: p > 0 ? 1 : 0 };
  }

  if (type === 'fade' || type === 'dissolve' || type === 'pixelize' || type === 'circleopen' || type === 'circleclose') {
    return role === 'outgoing' ? { opacity: 1 - p } : { opacity: p };
  }

  if (type === 'wipeleft') {
    return role === 'outgoing'
      ? { clipPath: `inset(0 ${p * 100}% 0 0)` }
      : { clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` };
  }
  if (type === 'wiperight') {
    return role === 'outgoing'
      ? { clipPath: `inset(0 0 0 ${p * 100}%)` }
      : { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
  }
  if (type === 'slideleft') {
    return role === 'outgoing'
      ? { transform: `translateX(${-p * 100}%)`, opacity: 1 }
      : { transform: `translateX(${(1 - p) * 100}%)`, opacity: 1 };
  }
  if (type === 'slideright') {
    return role === 'outgoing'
      ? { transform: `translateX(${p * 100}%)`, opacity: 1 }
      : { transform: `translateX(${(p - 1) * 100}%)`, opacity: 1 };
  }

  return role === 'outgoing' ? { opacity: 1 - p } : { opacity: p };
}

export function VideoMerger({ lang }: Props) {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [resultSize, setResultSize] = useState(0);
  const [quality, setQuality] = useState<Quality>('balanced');
  const [transitionDuration, setTransitionDuration] = useState(0.8);
  const [defaultTransition, setDefaultTransition] = useState<TransitionType>('fade');
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview'>('upload');
  const [nextId, setNextId] = useState(1);

  // Live preview state
  const [livePlaying, setLivePlaying] = useState(false);
  const [liveIndex, setLiveIndex] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [xfadeProgress, setXfadeProgress] = useState(0);
  const [inTransition, setInTransition] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outVideoRef = useRef<HTMLVideoElement>(null);
  const inVideoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const itemsRef = useRef(items);
  const resultUrlRef = useRef(resultUrl);
  itemsRef.current = items;
  resultUrlRef.current = resultUrl;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const totalDuration = items.reduce((sum, item, i) => {
    const t =
      i < items.length - 1 && item.transition !== 'none'
        ? Math.min(transitionDuration, Math.max(0.1, item.duration / 3))
        : 0;
    return sum + item.duration - (i < items.length - 1 ? t : 0);
  }, 0);

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl('');
    setResultSize(0);
  };

  const stopLive = useCallback(() => {
    setLivePlaying(false);
    setInTransition(false);
    setXfadeProgress(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    outVideoRef.current?.pause();
    inVideoRef.current?.pause();
  }, []);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);
    stopLive();

    const added: VideoItem[] = [];
    let id = nextId;

    for (const file of Array.from(fileList)) {
      if (!isVideoFile(file)) continue;
      const url = URL.createObjectURL(file);
      const duration = await readVideoDuration(url);
      added.push({
        id: id++,
        file,
        name: file.name,
        size: file.size,
        ext: getFileExtension(file),
        url,
        duration,
        transition: defaultTransition,
      });
    }

    if (added.length === 0) {
      setError(lang === 'ar' ? 'لم يتم العثور على ملفات فيديو مدعومة' : 'No supported video files found');
      return;
    }

    setItems((prev) => [...prev, ...added]);
    setNextId(id);
    clearResult();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeItem = (id: number) => {
    stopLive();
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
    clearResult();
  };

  const moveItem = (id: number, dir: -1 | 1) => {
    stopLive();
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    clearResult();
  };

  const setItemTransition = (id: number, transition: TransitionType) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, transition } : i)));
    clearResult();
  };

  const applyTransitionToAll = (transition: TransitionType) => {
    setDefaultTransition(transition);
    setItems((prev) => prev.map((i) => ({ ...i, transition })));
    clearResult();
  };

  const clearAll = () => {
    stopLive();
    items.forEach((i) => URL.revokeObjectURL(i.url));
    clearResult();
    setItems([]);
    setError(null);
    setProgress(0);
    setStatus('');
    setLiveIndex(0);
    setLiveTime(0);
  };

  const getTransitionSeconds = (item: VideoItem) => {
    if (item.transition === 'none' || item.duration <= 0) return 0;
    return Math.min(transitionDuration, Math.max(0.15, item.duration / 3));
  };

  // Live preview loop
  useEffect(() => {
    if (!livePlaying || items.length === 0) return;

    const out = outVideoRef.current;
    const inn = inVideoRef.current;
    if (!out) return;

    const tick = () => {
      const current = items[liveIndex];
      if (!current) {
        stopLive();
        return;
      }

      const t = out.currentTime || 0;
      setLiveTime(t);
      const td = liveIndex < items.length - 1 ? getTransitionSeconds(current) : 0;
      const startXfade = current.duration > 0 ? Math.max(0, current.duration - td) : 0;

      if (td > 0 && liveIndex < items.length - 1 && t >= startXfade) {
        const next = items[liveIndex + 1];
        const p = td > 0 ? Math.min(1, (t - startXfade) / td) : 1;
        setInTransition(true);
        setXfadeProgress(p);

        if (inn && inn.src !== next.url) {
          inn.src = next.url;
          inn.currentTime = 0;
          inn.play().catch(() => {});
        }

        if (p >= 1) {
          setLiveIndex((i) => i + 1);
          setInTransition(false);
          setXfadeProgress(0);
          if (inn) {
            out.src = inn.src;
            out.currentTime = inn.currentTime;
            out.play().catch(() => {});
            inn.pause();
            inn.removeAttribute('src');
            inn.load();
          }
        }
      } else if (out.ended || (current.duration > 0 && t >= current.duration - 0.05)) {
        if (liveIndex >= items.length - 1) {
          stopLive();
          setLiveTime(current.duration);
          return;
        }
        const next = items[liveIndex + 1];
        setLiveIndex((i) => i + 1);
        setInTransition(false);
        setXfadeProgress(0);
        out.src = next.url;
        out.currentTime = 0;
        out.play().catch(() => {});
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [livePlaying, liveIndex, items, transitionDuration, stopLive]);

  const startLive = async () => {
    if (items.length === 0) return;
    clearResult();
    setMobileTab('preview');
    setLiveIndex(0);
    setLiveTime(0);
    setInTransition(false);
    setXfadeProgress(0);

    const out = outVideoRef.current;
    const inn = inVideoRef.current;
    if (!out) return;

    out.src = items[0].url;
    out.currentTime = 0;
    if (inn) {
      inn.pause();
      inn.removeAttribute('src');
      inn.load();
    }

    try {
      await out.play();
      setLivePlaying(true);
    } catch {
      setError(lang === 'ar' ? 'تعذر تشغيل المعاينة الحية' : 'Could not start live preview');
    }
  };

  const toggleLive = () => {
    if (livePlaying) {
      stopLive();
    } else {
      startLive();
    }
  };

  const mergeVideos = async () => {
    if (items.length < 2) {
      setError(lang === 'ar' ? 'أضف فيديوهين على الأقل للدمج' : 'Add at least 2 videos to merge');
      return;
    }

    stopLive();
    setMerging(true);
    setProgress(0);
    setError(null);
    setStatus(lang === 'ar' ? 'جاري التحضير...' : 'Preparing...');
    clearResult();

    const q = QUALITY[quality];
    const normalized: string[] = [];
    const durations: number[] = [];
    const hasTransitions = items.slice(0, -1).some((i) => i.transition !== 'none');

    try {
      const ffmpeg = await loadFFmpeg();
      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      });

      for (let i = 0; i < items.length; i++) {
        setStatus(
          lang === 'ar'
            ? `توحيد الفيديو ${i + 1} من ${items.length}...`
            : `Normalizing video ${i + 1} of ${items.length}...`
        );
        setProgress(Math.round((i / items.length) * 55));

        const item = items[i];
        const inputName = `merge_in_${i}.${item.ext}`;
        const outName = `merge_norm_${i}.mp4`;
        normalized.push(outName);
        durations.push(item.duration > 0 ? item.duration : 3);

        await ffmpeg.writeFile(inputName, await fetchFile(item.file));

        let code = await ffmpeg.exec([
          '-i', inputName,
          '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30',
          '-c:v', 'libx264', '-preset', q.preset, '-crf', q.crf,
          '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '128k',
          '-movflags', '+faststart',
          '-y', outName,
        ]);

        if (code !== 0) {
          code = await ffmpeg.exec([
            '-i', inputName,
            '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30',
            '-c:v', 'libx264', '-preset', q.preset, '-crf', q.crf,
            '-c:a', 'aac', '-shortest',
            '-movflags', '+faststart',
            '-y', outName,
          ]);
        }

        if (code !== 0) throw new Error(`Failed to process video ${i + 1}`);
        try { await ffmpeg.deleteFile(inputName); } catch {}
      }

      setStatus(lang === 'ar' ? 'جاري الدمج مع الانتقالات...' : 'Merging with transitions...');
      setProgress(60);

      const outputName = 'merged_output.mp4';
      let code = 1;

      if (!hasTransitions) {
        const listContent = normalized.map((n) => `file '${n}'`).join('\n');
        await ffmpeg.writeFile('concat_list.txt', listContent);
        code = await ffmpeg.exec([
          '-f', 'concat', '-safe', '0',
          '-i', 'concat_list.txt',
          '-c', 'copy',
          '-movflags', '+faststart',
          '-y', outputName,
        ]);
        if (code !== 0) {
          code = await ffmpeg.exec([
            '-f', 'concat', '-safe', '0',
            '-i', 'concat_list.txt',
            '-c:v', 'libx264', '-preset', q.preset, '-crf', q.crf,
            '-c:a', 'aac',
            '-movflags', '+faststart',
            '-y', outputName,
          ]);
        }
        try { await ffmpeg.deleteFile('concat_list.txt'); } catch {}
      } else {
        // Build xfade + acrossfade chain
        const inputs: string[] = [];
        normalized.forEach((n) => {
          inputs.push('-i', n);
        });

        const n = normalized.length;
        const tds = items.slice(0, -1).map((item) => getTransitionSeconds(item));

        const filters: string[] = [];
        let lastV = '[0:v]';
        let lastA = '[0:a]';
        let offsetAcc = durations[0];

        for (let i = 0; i < n - 1; i++) {
          const wantsTransition = items[i].transition !== 'none';
          const td = wantsTransition ? Math.max(0.15, tds[i] || 0.15) : 0.01;
          const safeTr = wantsTransition ? items[i].transition : 'fade';
          const outV = i === n - 2 ? '[vout]' : `[vx${i}]`;
          const outA = i === n - 2 ? '[aout]' : `[ax${i}]`;
          const useOffset = Math.max(0.05, offsetAcc - td);

          filters.push(
            `${lastV}[${i + 1}:v]xfade=transition=${safeTr}:duration=${td.toFixed(3)}:offset=${useOffset.toFixed(3)}${outV}`
          );
          filters.push(
            `${lastA}[${i + 1}:a]acrossfade=d=${td.toFixed(3)}${outA}`
          );

          offsetAcc = useOffset + durations[i + 1];
          lastV = outV;
          lastA = outA;
        }

        const filterComplex = filters.join(';');
        code = await ffmpeg.exec([
          ...inputs,
          '-filter_complex', filterComplex,
          '-map', '[vout]',
          '-map', '[aout]',
          '-c:v', 'libx264', '-preset', q.preset, '-crf', q.crf,
          '-c:a', 'aac', '-b:a', '128k',
          '-movflags', '+faststart',
          '-y', outputName,
        ]);

        // Fallback: video xfade only
        if (code !== 0) {
          const vFilters: string[] = [];
          let lv = '[0:v]';
          let off = durations[0] - Math.max(0.1, tds[0] || 0.1);
          for (let i = 0; i < n - 1; i++) {
            const td = Math.max(0.1, tds[i] || 0.1);
            const safeTr = items[i].transition === 'none' ? 'fade' : items[i].transition;
            const outV = i === n - 2 ? '[vout]' : `[vx${i}]`;
            vFilters.push(
              `${lv}[${i + 1}:v]xfade=transition=${safeTr}:duration=${td.toFixed(3)}:offset=${Math.max(0.05, off).toFixed(3)}${outV}`
            );
            off = Math.max(0.05, off) + durations[i + 1] - td;
            lv = outV;
          }
          code = await ffmpeg.exec([
            ...inputs,
            '-filter_complex', vFilters.join(';'),
            '-map', '[vout]',
            '-map', '0:a?',
            '-c:v', 'libx264', '-preset', q.preset, '-crf', q.crf,
            '-c:a', 'aac', '-shortest',
            '-movflags', '+faststart',
            '-y', outputName,
          ]);
        }
      }

      if (code !== 0) throw new Error('Merge failed');

      const raw = await ffmpeg.readFile(outputName);
      const bytes = typeof raw === 'string'
        ? new TextEncoder().encode(raw)
        : new Uint8Array(raw);
      const blob = new Blob([bytes], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
      setStatus(lang === 'ar' ? 'اكتمل الدمج' : 'Merge complete');
      setMobileTab('preview');

      for (const n of normalized) {
        try { await ffmpeg.deleteFile(n); } catch {}
      }
      try { await ffmpeg.deleteFile(outputName); } catch {}
    } catch (err) {
      console.error('Video merge error:', err);
      setError(lang === 'ar' ? 'فشل دمج الفيديوهات' : 'Failed to merge videos');
      setStatus('');
    } finally {
      setMerging(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'merged_video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentTransition =
    inTransition && liveIndex < items.length - 1
      ? items[liveIndex].transition
      : 'none';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-600 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 sm:w-8 sm:h-8">
          <Combine size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">
            {lang === 'ar' ? 'دمج الفيديوهات' : 'Merge Videos'}
          </h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {lang === 'ar'
              ? 'معاينة حية + انتقالات بين المقاطع ثم تصدير نهائي'
              : 'Live preview + transitions between clips, then final export'}
          </p>
        </div>
      </div>

      <div className="md:hidden flex border-b border-[#2D3139] shrink-0">
        {([
          { id: 'upload' as const, labelAr: 'الملفات', labelEn: 'Files', icon: Settings2 },
          { id: 'preview' as const, labelAr: 'معاينة حية', labelEn: 'Live', icon: Eye },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors',
              mobileTab === tab.id ? 'text-sky-400 bg-[#1A1D23]' : 'text-gray-500'
            )}
          >
            <tab.icon size={12} />
            {lang === 'ar' ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
        <aside
          className={cn(
            'w-full sm:w-[22rem] max-h-[55vh] sm:max-h-none bg-[#14171C] border-e border-[#2D3139] flex flex-col shrink-0 overflow-hidden',
            mobileTab === 'upload' ? 'flex' : 'hidden sm:flex'
          )}
        >
          <div className="p-3 border-b border-[#2D3139] sm:p-4">
            <label
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-sky-500/50 transition-colors bg-[#0F1115]"
            >
              <Upload size={20} className="text-gray-500" />
              <span className="text-[9px] font-mono text-gray-400 text-center">
                {lang === 'ar' ? 'أضف فيديوهات للدمج' : 'Add videos to merge'}
              </span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={VIDEO_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {items.length === 0 ? (
              <p className="text-[8px] font-mono text-gray-600 text-center py-6">
                {lang === 'ar' ? 'لا توجد ملفات بعد' : 'No files yet'}
              </p>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="rounded-lg bg-[#0F1115] border border-[#2D3139] overflow-hidden">
                  <div className="flex items-center gap-2 p-2">
                    <span className="w-5 h-5 rounded-md bg-sky-600/20 text-sky-400 text-[9px] font-mono flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono text-gray-300 truncate">{item.name}</p>
                      <p className="text-[7px] font-mono text-gray-600">
                        {formatBytes(item.size)} · {formatClock(item.duration)} · {item.ext.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => moveItem(item.id, -1)} disabled={index === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => moveItem(item.id, 1)} disabled={index === items.length - 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-gray-500 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {index < items.length - 1 && (
                    <div className="px-2 pb-2 pt-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={10} className="text-violet-400" />
                        <span className="text-[7px] font-mono text-violet-400 uppercase tracking-wider">
                          {lang === 'ar' ? 'انتقال إلى التالي' : 'Transition to next'}
                        </span>
                      </div>
                      <select
                        value={item.transition}
                        onChange={(e) => setItemTransition(item.id, e.target.value as TransitionType)}
                        className="w-full bg-[#14171C] border border-[#2D3139] rounded-md text-[8px] font-mono text-gray-300 px-2 py-1.5 outline-none focus:border-violet-500/50"
                      >
                        {TRANSITIONS.map((tr) => (
                          <option key={tr.id} value={tr.id}>
                            {lang === 'ar' ? tr.labelAr : tr.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-3 border-t border-[#2D3139] space-y-3 sm:p-4 overflow-y-auto max-h-[45%]">
              <div>
                <p className="text-[8px] font-mono text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} />
                  {lang === 'ar' ? 'انتقال افتراضي للجميع' : 'Default transition'}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['none', 'fade', 'wipeleft', 'slideleft', 'circleopen', 'pixelize'] as TransitionType[]).map((id) => {
                    const tr = TRANSITIONS.find((t) => t.id === id)!;
                    return (
                      <button
                        key={id}
                        onClick={() => applyTransitionToAll(id)}
                        className={cn(
                          'py-1.5 text-[7px] font-mono rounded-md border transition-all',
                          defaultTransition === id
                            ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                            : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500'
                        )}
                      >
                        {lang === 'ar' ? tr.labelAr : tr.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[8px] font-mono text-gray-500">
                  {lang === 'ar' ? 'مدة الانتقال' : 'Transition duration'}: {transitionDuration.toFixed(1)}s
                </label>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  value={transitionDuration}
                  onChange={(e) => {
                    setTransitionDuration(parseFloat(e.target.value));
                    clearResult();
                  }}
                  className="w-full mt-1 accent-violet-500"
                />
              </div>

              <div>
                <p className="text-[8px] font-mono text-gray-500 mb-1.5 uppercase tracking-wider">
                  {lang === 'ar' ? 'الجودة' : 'Quality'}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(QUALITY) as Quality[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setQuality(key)}
                      className={cn(
                        'py-2 text-[8px] font-mono rounded-md border transition-all',
                        quality === key
                          ? 'bg-sky-600/20 border-sky-500/40 text-sky-400'
                          : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500'
                      )}
                    >
                      {lang === 'ar' ? QUALITY[key].labelAr : QUALITY[key].labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {merging && (
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-[#1A1D23] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-600 to-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[8px] font-mono text-gray-500 text-center">
                    {progress}% — {status}
                  </p>
                </div>
              )}

              <button
                onClick={toggleLive}
                disabled={items.length === 0 || merging}
                className="w-full py-2.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 disabled:opacity-40"
              >
                {livePlaying ? <Pause size={13} /> : <Play size={13} />}
                {livePlaying
                  ? (lang === 'ar' ? 'إيقاف المعاينة' : 'Stop Preview')
                  : (lang === 'ar' ? 'معاينة حية' : 'Live Preview')}
              </button>

              <button
                onClick={mergeVideos}
                disabled={merging || items.length < 2}
                className={cn(
                  'w-full py-3 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2',
                  merging || items.length < 2
                    ? 'bg-sky-600/30 text-sky-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:shadow-lg hover:shadow-sky-500/25'
                )}
              >
                {merging ? <Loader2 size={14} className="animate-spin" /> : <Combine size={14} />}
                {lang === 'ar' ? 'تصدير الدمج النهائي' : 'Export Final Merge'}
              </button>

              {resultUrl && (
                <button
                  onClick={downloadResult}
                  className="w-full py-2.5 rounded-lg font-mono text-[9px] uppercase tracking-wider bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={12} />
                  {lang === 'ar' ? 'تحميل النتيجة' : 'Download Result'}
                  {resultSize > 0 && <span className="opacity-60">({formatBytes(resultSize)})</span>}
                </button>
              )}

              <button
                onClick={clearAll}
                className="w-full py-2 text-[8px] font-mono text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={11} />
                {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
              </button>
            </div>
          )}
        </aside>

        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden bg-[#0A0C0F]',
            mobileTab === 'preview' ? 'flex' : 'hidden sm:flex'
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 && !resultUrl ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Film size={40} className="text-gray-700 mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'أضف فيديوهات ثم شغّل المعاينة الحية' : 'Add videos then start live preview'}
                </p>
              </div>
            ) : (
              <>
                {/* Live stage */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] overflow-hidden">
                  <div className="px-3 py-2 border-b border-violet-500/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Eye size={12} className="text-violet-400" />
                      <span className="text-[9px] font-mono text-violet-300 uppercase tracking-wider">
                        {lang === 'ar' ? 'معاينة حية' : 'Live Preview'}
                      </span>
                      {livePlaying && (
                        <span className="text-[7px] font-mono text-emerald-400 animate-pulse">
                          ● LIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-gray-500">
                      {lang === 'ar' ? `مقطع ${liveIndex + 1}/${Math.max(items.length, 1)}` : `Clip ${liveIndex + 1}/${Math.max(items.length, 1)}`}
                      {' · '}
                      {formatClock(liveTime)}
                      {totalDuration > 0 && ` / ~${formatClock(totalDuration)}`}
                    </span>
                  </div>

                  <div className="relative aspect-video bg-black overflow-hidden">
                    <video
                      ref={outVideoRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      playsInline
                      style={inTransition ? liveTransitionStyle(currentTransition, xfadeProgress, 'outgoing') : { opacity: 1 }}
                    />
                    <video
                      ref={inVideoRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      playsInline
                      muted
                      style={
                        inTransition
                          ? liveTransitionStyle(currentTransition, xfadeProgress, 'incoming')
                          : { opacity: 0, pointerEvents: 'none' }
                      }
                    />

                    {items.length > 0 && !livePlaying && !resultUrl && (
                      <button
                        onClick={startLive}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-full bg-violet-600/90 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-2">
                          <Play size={22} className="text-white ms-0.5" />
                        </div>
                        <span className="text-[10px] font-mono text-white/90">
                          {lang === 'ar' ? 'تشغيل المعاينة الحية' : 'Play live preview'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Timeline */}
                  {items.length > 0 && (
                    <div className="px-3 py-2.5 border-t border-violet-500/15">
                      <div className="flex gap-1 items-stretch h-8">
                        {items.map((item, index) => (
                          <div key={item.id} className="contents">
                            <button
                              onClick={() => {
                                stopLive();
                                setLiveIndex(index);
                                setLiveTime(0);
                                if (outVideoRef.current) {
                                  outVideoRef.current.src = item.url;
                                  outVideoRef.current.currentTime = 0;
                                }
                              }}
                              className={cn(
                                'flex-1 min-w-0 rounded-md border text-[7px] font-mono px-1 truncate transition-all',
                                liveIndex === index
                                  ? 'bg-violet-600/30 border-violet-500/50 text-violet-200'
                                  : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500'
                              )}
                              title={item.name}
                            >
                              {index + 1}. {formatClock(item.duration)}
                            </button>
                            {index < items.length - 1 && (
                              <div
                                className={cn(
                                  'w-5 shrink-0 rounded-sm flex items-center justify-center text-[6px] font-mono border',
                                  item.transition === 'none'
                                    ? 'border-[#2D3139] text-gray-600'
                                    : 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                                )}
                                title={TRANSITIONS.find((t) => t.id === item.transition)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
                              >
                                ✦
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {resultUrl && (
                  <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 overflow-hidden">
                    <div className="px-3 py-2 border-b border-sky-500/20 flex items-center gap-2">
                      <Combine size={12} className="text-sky-400" />
                      <span className="text-[9px] font-mono text-sky-400 uppercase tracking-wider">
                        {lang === 'ar' ? 'النتيجة النهائية' : 'Final Result'}
                      </span>
                    </div>
                    <video src={resultUrl} controls className="w-full max-h-[45vh] object-contain bg-black" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
