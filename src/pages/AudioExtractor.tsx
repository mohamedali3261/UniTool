import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Loader2,
  Film,
  Trash2,
  Music2,
  Settings2,
  Eye,
  AudioLines,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { VIDEO_ACCEPT, getFileExtension, isVideoFile } from '../utils/video-formats';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

type AudioFormat = 'mp3' | 'aac' | 'wav' | 'ogg';

const FORMAT_OPTIONS: {
  id: AudioFormat;
  label: string;
  mime: string;
  ext: string;
  args: string[];
}[] = [
  { id: 'mp3', label: 'MP3', mime: 'audio/mpeg', ext: 'mp3', args: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { id: 'aac', label: 'AAC', mime: 'audio/aac', ext: 'm4a', args: ['-c:a', 'aac', '-b:a', '192k'] },
  { id: 'wav', label: 'WAV', mime: 'audio/wav', ext: 'wav', args: ['-c:a', 'pcm_s16le'] },
  { id: 'ogg', label: 'OGG', mime: 'audio/ogg', ext: 'ogg', args: ['-c:a', 'libvorbis', '-q:a', '5'] },
];

export function AudioExtractor({ lang }: Props) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview'>('upload');
  const [format, setFormat] = useState<AudioFormat>('mp3');
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resultSize, setResultSize] = useState(0);
  const [previewFailed, setPreviewFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [videoUrl, audioUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isVideoFile(file)) {
      setError(lang === 'ar' ? 'الملف ليس بصيغة فيديو مدعومة' : 'File is not a supported video format');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setAudioUrl('');
    setError(null);
    setProgress(0);
    setResultSize(0);
    setTrimEnabled(false);
    setStartTime(0);
    setEndTime(0);
    setDuration(0);
    setPreviewFailed(false);
    e.target.value = '';
  };

  const onVideoLoaded = () => {
    const vid = videoRef.current;
    if (!vid || !Number.isFinite(vid.duration)) return;
    setDuration(vid.duration);
    setEndTime(vid.duration);
    setPreviewFailed(false);
  };

  const extractAudio = async () => {
    if (!videoFile) return;
    setExtracting(true);
    setProgress(0);
    setError(null);
    setAudioUrl('');
    setResultSize(0);

    try {
      const ffmpeg = await loadFFmpeg();
      const fmt = FORMAT_OPTIONS.find((f) => f.id === format)!;
      const ext = getFileExtension(videoFile);
      const inputName = `extract_input.${ext}`;
      const outputName = `extract_output.${fmt.ext}`;

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      });

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      const command = ['-i', inputName, '-vn', '-sn', '-dn', ...fmt.args];

      if (trimEnabled && duration > 0) {
        const start = Math.max(0, startTime);
        const end = Math.min(duration, Math.max(start + 0.1, endTime));
        command.push('-ss', String(start), '-to', String(end));
      }

      command.push('-y', outputName);

      let code = await ffmpeg.exec(command);

      // Some containers need stream copy first attempt fallback without -dn
      if (code !== 0) {
        const fallback = ['-i', inputName, '-vn', '-map', '0:a:0', ...fmt.args, '-y', outputName];
        if (trimEnabled && duration > 0) {
          const start = Math.max(0, startTime);
          const end = Math.min(duration, Math.max(start + 0.1, endTime));
          fallback.splice(2, 0, '-ss', String(start), '-to', String(end));
        }
        code = await ffmpeg.exec(fallback);
      }

      if (code !== 0) throw new Error('FFmpeg failed');

      const raw = await ffmpeg.readFile(outputName);
      const bytes = typeof raw === 'string'
        ? new TextEncoder().encode(raw)
        : new Uint8Array(raw);
      const blob = new Blob([bytes], { type: fmt.mime });
      setResultSize(blob.size);
      setAudioUrl(URL.createObjectURL(blob));
      setProgress(100);

      try { await ffmpeg.deleteFile(inputName); } catch {}
      try { await ffmpeg.deleteFile(outputName); } catch {}
    } catch (err) {
      console.error('Audio extract error:', err);
      setError(lang === 'ar' ? 'فشل استخراج الصوت من الفيديو' : 'Failed to extract audio from video');
    } finally {
      setExtracting(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl || !videoFile) return;
    const fmt = FORMAT_OPTIONS.find((f) => f.id === format)!;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${videoFile.name.replace(/\.[^.]+$/, '')}.${fmt.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearAll = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setVideoFile(null);
    setVideoUrl('');
    setAudioUrl('');
    setError(null);
    setProgress(0);
    setResultSize(0);
    setTrimEnabled(false);
    setStartTime(0);
    setEndTime(0);
    setDuration(0);
    setPreviewFailed(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const settingsPanel = (
    <>
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        {!videoFile ? (
          <label
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors bg-[#0F1115]"
          >
            <Upload size={24} className="text-gray-500" />
            <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
              {lang === 'ar' ? 'اختر أي ملف فيديو' : 'Select any video file'}
            </span>
            <span className="text-[7px] font-mono text-gray-600 text-center leading-relaxed px-2">
              MP4, MOV, MKV, WebM, AVI, WMV, FLV, M4V, 3GP, TS, MPEG...
            </span>
          </label>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-400 truncate max-w-[180px]">{videoFile.name}</span>
              <button onClick={clearAll} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex gap-2 text-[8px] font-mono text-gray-500">
              <span>{formatBytes(videoFile.size)}</span>
              <span className="text-gray-700">|</span>
              <span className="uppercase">{getFileExtension(videoFile)}</span>
              {duration > 0 && (
                <>
                  <span className="text-gray-700">|</span>
                  <span>{formatClock(duration)}</span>
                </>
              )}
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFileSelect} />
        {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
      </div>

      {videoFile && (
        <>
          <div className="p-3 border-b border-[#2D3139] sm:p-4">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 sm:text-[10px]">
              <Settings2 size={11} className="text-emerald-500" />
              {lang === 'ar' ? 'صيغة الصوت' : 'Audio Format'}
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={cn(
                    'py-2 text-[8px] font-mono rounded-md border transition-all',
                    format === opt.id
                      ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-b border-[#2D3139] sm:p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trimEnabled}
                onChange={(e) => setTrimEnabled(e.target.checked)}
                disabled={duration <= 0}
                className="accent-emerald-500"
              />
              <span className="text-[8px] font-mono text-gray-400">
                {lang === 'ar' ? 'قص جزء من الفيديو فقط' : 'Extract a trimmed segment only'}
              </span>
            </label>
            {trimEnabled && duration <= 0 && (
              <p className="text-[7px] font-mono text-amber-500/80">
                {lang === 'ar'
                  ? 'المعاينة غير متاحة لهذه الصيغة — سيتم استخراج الملف كاملاً'
                  : 'Preview unavailable for this format — full file will be extracted'}
              </p>
            )}

            {trimEnabled && duration > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-mono text-gray-500">
                    {lang === 'ar' ? 'البداية' : 'Start'}: {formatClock(startTime)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, duration - 0.1)}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setStartTime(val);
                      if (val >= endTime) setEndTime(Math.min(duration, val + 0.5));
                    }}
                    className="w-full mt-1.5 accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-gray-500">
                    {lang === 'ar' ? 'النهاية' : 'End'}: {formatClock(endTime)}
                  </label>
                  <input
                    type="range"
                    min={Math.min(duration, startTime + 0.1)}
                    max={duration}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value))}
                    className="w-full mt-1.5 accent-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 mt-auto space-y-2 sm:p-4">
            {extracting && (
              <div className="space-y-2">
                <div className="h-1.5 bg-[#1A1D23] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[8px] font-mono text-gray-500 text-center">
                  {progress}% — {lang === 'ar' ? 'جاري الاستخراج...' : 'Extracting...'}
                </p>
              </div>
            )}

            <button
              onClick={extractAudio}
              disabled={extracting}
              className={cn(
                'w-full py-3 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2',
                extracting
                  ? 'bg-emerald-600/30 text-emerald-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/25'
              )}
            >
              {extracting ? <Loader2 size={14} className="animate-spin" /> : <Music2 size={14} />}
              {lang === 'ar' ? 'استخراج الصوت' : 'Extract Audio'}
            </button>

            {audioUrl && (
              <button
                onClick={downloadAudio}
                className="w-full py-2.5 rounded-lg font-mono text-[9px] uppercase tracking-wider bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Download size={12} />
                {lang === 'ar' ? 'تحميل الصوت' : 'Download Audio'}
                {resultSize > 0 && <span className="opacity-60">({formatBytes(resultSize)})</span>}
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
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 sm:w-8 sm:h-8">
          <AudioLines size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">
            {lang === 'ar' ? 'استخراج الصوت من الفيديو' : 'Extract Audio from Video'}
          </h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {lang === 'ar'
              ? 'يدعم كل صيغ الفيديو الشائعة — MP4, MKV, AVI, MOV والمزيد'
              : 'Supports all common video formats — MP4, MKV, AVI, MOV and more'}
          </p>
        </div>
      </div>

      <div className="md:hidden flex border-b border-[#2D3139] shrink-0">
        {([
          { id: 'upload' as const, labelAr: 'إعدادات', labelEn: 'Settings', icon: Settings2 },
          { id: 'preview' as const, labelAr: 'معاينة', labelEn: 'Preview', icon: Eye },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors',
              mobileTab === tab.id ? 'text-emerald-400 bg-[#1A1D23]' : 'text-gray-500'
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
            'w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-e border-[#2D3139] flex flex-col shrink-0 overflow-y-auto',
            mobileTab === 'upload' ? 'flex' : 'hidden sm:flex'
          )}
        >
          {settingsPanel}
        </aside>

        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden bg-[#0A0C0F]',
            mobileTab === 'preview' ? 'flex' : 'hidden sm:flex'
          )}
        >
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto">
            {!videoFile ? (
              <div className="text-center">
                <Film size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'ارفع أي صيغة فيديو لاستخراج الصوت' : 'Upload any video format to extract audio'}
                </p>
              </div>
            ) : (
              <>
                <div className="w-full max-w-2xl rounded-xl overflow-hidden bg-black border border-[#2D3139]">
                  {previewFailed ? (
                    <div className="p-8 text-center">
                      <Film size={28} className="text-gray-600 mx-auto mb-2" />
                      <p className="text-[9px] font-mono text-gray-500">
                        {lang === 'ar'
                          ? 'المعاينة غير مدعومة في المتصفح لهذه الصيغة، لكن الاستخراج يعمل عبر FFmpeg'
                          : 'Browser preview unavailable for this format, but extraction still works via FFmpeg'}
                      </p>
                      <p className="text-[8px] font-mono text-gray-600 mt-1 uppercase">{getFileExtension(videoFile)}</p>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      onLoadedMetadata={onVideoLoaded}
                      onError={() => setPreviewFailed(true)}
                      className="w-full max-h-[45vh] object-contain"
                    />
                  )}
                </div>

                {audioUrl && (
                  <div className="w-full max-w-2xl rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Music2 size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                        {lang === 'ar' ? 'الصوت المستخرج' : 'Extracted Audio'}
                      </span>
                    </div>
                    <audio src={audioUrl} controls className="w-full" />
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
