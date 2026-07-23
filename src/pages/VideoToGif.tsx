import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, Film, Trash2, Scissors, Settings2, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function VideoToGif({ t, lang }: Props) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview' | 'settings'>('upload');

  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(3);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [loop, setLoop] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (gifUrl) URL.revokeObjectURL(gifUrl);

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setGifUrl('');
    setError(null);
    setStartTime(0);
    setProgress(0);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    const handleLoaded = () => {
      if (vid.duration > 3) {
        setDuration(3);
      } else {
        setDuration(Math.floor(vid.duration));
      }
    };
    vid.addEventListener('loadedmetadata', handleLoaded);
    return () => vid.removeEventListener('loadedmetadata', handleLoaded);
  }, [videoUrl]);

  const maxDuration = videoRef.current?.duration || 10;

  const convertToGif = async () => {
    if (!videoFile) return;
    setConverting(true);
    setProgress(0);
    setError(null);
    setGifUrl('');

    try {
      const ffmpeg = await loadFFmpeg();
      const inputName = 'input_video';
      const paletteName = 'palette.png';
      const outputName = 'output.gif';

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      const startTimeStr = formatTime(startTime);

      await ffmpeg.exec([
        '-i', inputName,
        '-ss', startTimeStr,
        '-t', String(duration),
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
        '-y', paletteName
      ]);

      await ffmpeg.exec([
        '-i', inputName,
        '-i', paletteName,
        '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
        '-ss', startTimeStr,
        '-t', String(duration),
        '-loop', String(loop),
        '-y', outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      setGifUrl(url);
      setProgress(100);

      try { await ffmpeg.deleteFile(inputName); } catch {}
      try { await ffmpeg.deleteFile(paletteName); } catch {}
      try { await ffmpeg.deleteFile(outputName); } catch {}
    } catch (err) {
      console.error('GIF conversion error:', err);
      setError(lang === 'ar' ? 'فشل تحويل الفيديو لـ GIF' : 'Failed to convert video to GIF');
    } finally {
      setConverting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const downloadGif = () => {
    if (!gifUrl || !videoFile) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `${videoFile.name.replace(/\.[^.]+$/, '')}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearAll = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    setVideoFile(null);
    setVideoUrl('');
    setGifUrl('');
    setError(null);
    setStartTime(0);
    setDuration(3);
    setProgress(0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderSettingsContent = () => (
    <>
      {/* Upload */}
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        {!videoFile ? (
          <label
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors bg-[#0F1115]"
          >
            <Upload size={24} className="text-gray-500" />
            <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
              {lang === 'ar' ? 'اختر ملف فيديو' : 'Select a video file'}
            </span>
            <span className="text-[7px] font-mono text-gray-600">MP4, WebM, AVI, MOV</span>
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
              <span>{videoFile.type.split('/')[1]?.toUpperCase()}</span>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
        {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
      </div>

      {videoFile && (
        <>
          {/* Timing */}
          <div className="p-3 border-b border-[#2D3139] sm:p-4">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 sm:text-[10px]">
              <Scissors size={11} className="text-amber-500" />
              {lang === 'ar' ? 'التوقيت' : 'Timing'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                  {lang === 'ar' ? 'وقت البداية' : 'Start Time'}: {formatTime(startTime)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, maxDuration - 1)}
                  step="0.1"
                  value={startTime}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setStartTime(val);
                    if (val + duration > maxDuration) {
                      setDuration(Math.max(1, maxDuration - val));
                    }
                  }}
                  className="w-full mt-1.5 accent-amber-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                  {lang === 'ar' ? 'المدة' : 'Duration'}: {duration}s
                </label>
                <input
                  type="range"
                  min="1"
                  max={Math.min(10, maxDuration - startTime)}
                  step="0.5"
                  value={duration}
                  onChange={e => setDuration(parseFloat(e.target.value))}
                  className="w-full mt-1.5 accent-amber-500"
                />
                <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                  <span>1s</span>
                  <span>{Math.min(10, Math.floor(maxDuration - startTime))}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="p-3 border-b border-[#2D3139] sm:p-4">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 sm:text-[10px]">
              <Settings2 size={11} className="text-amber-500" />
              {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                  FPS: {fps}
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={fps}
                  onChange={e => setFps(parseInt(e.target.value))}
                  className="w-full mt-1.5 accent-amber-500"
                />
                <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                  <span>5</span>
                  <span className="text-amber-500/70">{fps >= 15 ? (lang === 'ar' ? 'سلس' : 'Smooth') : ''}</span>
                  <span>30</span>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                  {lang === 'ar' ? 'العرض' : 'Width'}: {width}px
                </label>
                <input
                  type="range"
                  min="240"
                  max="720"
                  step="40"
                  value={width}
                  onChange={e => setWidth(parseInt(e.target.value))}
                  className="w-full mt-1.5 accent-amber-500"
                />
                <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                  <span>240px</span>
                  <span>720px</span>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                  {lang === 'ar' ? 'التكرار' : 'Loop'}
                </label>
                <div className="flex gap-1 mt-1.5">
                  {[
                    { val: 0, label: lang === 'ar' ? 'أبدي' : 'Infinite' },
                    { val: 1, label: '1x' },
                    { val: 3, label: '3x' },
                    { val: 5, label: '5x' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setLoop(opt.val)}
                      className={cn(
                        "flex-1 py-2 text-[8px] font-mono uppercase tracking-wider rounded-md border transition-all",
                        loop === opt.val
                          ? "bg-amber-600/20 border-amber-500/40 text-amber-400"
                          : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Convert */}
          <div className="p-3 mt-auto space-y-2 sm:p-4">
            {converting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#2D3139] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-amber-400">{progress}%</span>
                </div>
              </div>
            )}
            <button
              onClick={convertToGif}
              disabled={converting}
              className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/20 disabled:opacity-60"
            >
              {converting ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
              {converting
                ? (lang === 'ar' ? 'جاري التحويل...' : 'Converting...')
                : (lang === 'ar' ? 'تحويل لـ GIF' : 'Convert to GIF')}
            </button>
            {gifUrl && (
              <button
                onClick={downloadGif}
                className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20"
              >
                <Download size={12} />
                {lang === 'ar' ? 'تحميل GIF' : 'Download GIF'}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );

  const renderPreviewContent = () => (
    <div className="flex-1 flex items-center justify-center bg-[#0A0C0F] p-6 overflow-y-auto">
      {!videoFile ? (
        <div className="text-center max-w-xs">
          <Film size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-[10px] font-mono text-gray-600">
            {lang === 'ar' ? 'اختر ملف فيديو للبدء' : 'Select a video file to start'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 max-w-full">
          {/* Video Preview */}
          <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl shadow-black/40 max-w-full">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="max-h-[50vh] max-w-full object-contain"
            />
          </div>

          {/* GIF Preview */}
          {gifUrl && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest">
                {lang === 'ar' ? 'المعاينة' : 'Preview'}
              </span>
              <div className="rounded-xl overflow-hidden bg-white p-2 shadow-2xl shadow-black/40">
                <img src={gifUrl} alt="GIF Preview" className="max-h-[40vh] max-w-full object-contain rounded-lg" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 sm:w-8 sm:h-8">
          <Film size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'فيديو لـ GIF' : 'Video to GIF'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'تحويل مقاطع الفيديو إلى صور متحركة' : 'Convert video clips to animated GIFs'}</p>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'إعدادات' : 'Settings', icon: Settings2 },
          { id: 'preview', label: lang === 'ar' ? 'معاينة' : 'Preview', icon: Eye },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-amber-500 bg-[#1A1D23]" : "text-gray-500")}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
        {/* Settings Panel */}
        <aside className={cn(
          "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
          mobileTab === 'upload' ? "flex" : "hidden sm:flex"
        )}>
          {renderSettingsContent()}
        </aside>

        {/* Preview */}
        <div className={cn(
          "flex flex-col",
          mobileTab === 'preview' ? "flex" : "hidden sm:flex"
        )}>
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}
