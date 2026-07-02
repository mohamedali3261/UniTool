/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, MouseEvent, WheelEvent, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Play, 
  Download, 
  X, 
  Plus,
  Loader2,
  Video,
  CheckCircle2,
  AlertCircle,
  Move,
  Maximize2,
  Minimize2,
  Hand,
  Scissors,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { loadFFmpeg } from '../lib/ffmpeg';

interface VideoLogoProps {
  t: any;
  lang: 'ar' | 'en';
}

interface LogoPosition {
  x: number; // pixels
  y: number; // pixels
  scale: number; // 0.1 to 2.0
}

interface TrimSettings {
  enabled: boolean;
  startTime: number; // seconds
  endTime: number; // seconds
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialLogoX: number;
  initialLogoY: number;
}

export function VideoLogo({ t, lang }: VideoLogoProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>({ x: 1088, y: 0, scale: 0.39 });
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({ 
    enabled: false, 
    startTime: 0, 
    endTime: 0 
  });
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLogoX: 0,
    initialLogoY: 0
  });
  const [videoMetadata, setVideoMetadata] = useState<{ width: number; height: number } | null>(null);
  const [logoNaturalSize, setLogoNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [showInstruction, setShowInstruction] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const logoImageRef = useRef<HTMLImageElement>(null);

  // Load FFmpeg on mount
  useEffect(() => {
    loadFFmpeg();
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      if (resultBlob) URL.revokeObjectURL(URL.createObjectURL(resultBlob));
    };
  }, [videoUrl, logoUrl, resultBlob]);

  const handleVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setError(null);
      setResultBlob(null);
      
      // Reset video metadata
      setVideoMetadata(null);
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      setLogoFile(file);
      setLogoUrl(URL.createObjectURL(file));
      setError(null);
      setShowInstruction(true);
    }
  };

  // Load video metadata
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        const duration = video.duration;
        setVideoMetadata({
          width: video.videoWidth,
          height: video.videoHeight
        });
        setVideoDuration(duration);
        // Set initial logo position to center of video
        setLogoPosition({
          x: video.videoWidth / 2,
          y: video.videoHeight / 2,
          scale: 0.37
        });
        // Set initial trim settings
        setTrimSettings({
          enabled: false,
          startTime: 0,
          endTime: duration
        });
      };
      
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      } else {
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    }
  }, [videoUrl]);

  const processVideo = async () => {
    if (!videoFile || !logoFile || !videoMetadata || !logoNaturalSize) {
      setError(lang === 'ar' ? 'الرجاء اختيار فيديو ولوجو' : 'Please select video and logo');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        setProgress(Math.min(99, Math.max(1, Math.round(prog * 100))));
      });

      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      });

      // Write input files
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
      await ffmpeg.writeFile('logo.png', await fetchFile(logoFile));

      // Calculate logo position (offset by half scaled size since preview uses translate(-50%, -50%))
      const logoScale = logoPosition.scale;
      const scaledLogoW = logoNaturalSize.width * logoScale;
      const scaledLogoH = logoNaturalSize.height * logoScale;
      const logoX = Math.round(logoPosition.x - scaledLogoW / 2);
      const logoY = Math.round(logoPosition.y - scaledLogoH / 2);

      // Build FFmpeg command with optional trim
      const ffmpegArgs = ['-i', 'input.mp4', '-i', 'logo.png'];
      
      // Add trim filter if enabled
      if (trimSettings.enabled) {
        ffmpegArgs.push('-ss', trimSettings.startTime.toString());
        ffmpegArgs.push('-to', trimSettings.endTime.toString());
      }

      // FFmpeg overlay filter with balanced quality/speed
      ffmpegArgs.push(
        '-filter_complex',
        `[1:v]scale=iw*${logoScale}:ih*${logoScale}[logo];[0:v][logo]overlay=${logoX}:${logoY}:format=auto`,
        '-c:v', 'libx264',
        '-crf', '20',             // Good quality (lower = better, 20 is great, 18 is overkill)
        '-preset', 'medium',      // Balanced speed/quality (slow was too heavy for WASM)
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        '-y',
        'output.mp4'
      );

      await ffmpeg.exec(ffmpegArgs);

      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      // @ts-ignore - FFmpeg FileData type compatibility
      const blob = new Blob([data], { type: 'video/mp4' });
      setResultBlob(blob);
      setProgress(100);
    } catch (err) {
      console.error('Error processing video:', err);
      setError(lang === 'ar' 
        ? 'حدث خطأ أثناء معالجة الفيديو' 
        : 'Error processing video: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_with_logo_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-download when processing completes
  useEffect(() => {
    if (resultBlob && progress === 100) {
      // Wait a moment then auto-download
      const timer = setTimeout(() => {
        downloadResult();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultBlob, progress]);

  const removeVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setResultBlob(null);
  };

  const removeLogo = () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoFile(null);
    setLogoUrl(null);
  };

  // Handle mouse down on logo
  const handleLogoMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLogoX: logoPosition.x,
      initialLogoY: logoPosition.y
    });
  };

  // Handle touch start on logo
  const handleLogoTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      initialLogoX: logoPosition.x,
      initialLogoY: logoPosition.y
    });
  };

  // Handle mouse/touch move
  useEffect(() => {
    const getClientX = (e: globalThis.MouseEvent | globalThis.TouchEvent): number => {
      return 'touches' in e ? e.touches[0].clientX : e.clientX;
    };
    const getClientY = (e: globalThis.MouseEvent | globalThis.TouchEvent): number => {
      return 'touches' in e ? e.touches[0].clientY : e.clientY;
    };

    const handleMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!dragState.isDragging || !videoMetadata || !videoRef.current) return;

      const video = videoRef.current;
      const rect = video.getBoundingClientRect();
      
      const scaleX = videoMetadata.width / rect.width;
      const scaleY = videoMetadata.height / rect.height;
      
      const deltaX = (getClientX(e) - dragState.startX) * scaleX;
      const deltaY = (getClientY(e) - dragState.startY) * scaleY;
      
      const newX = Math.max(0, Math.min(videoMetadata.width, dragState.initialLogoX + deltaX));
      const newY = Math.max(0, Math.min(videoMetadata.height, dragState.initialLogoY + deltaY));
      
      setLogoPosition(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    };

    const handleEnd = () => {
      setDragState(prev => ({ ...prev, isDragging: false }));
    };

    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [dragState, videoMetadata]);

  // Handle mouse wheel for scaling (finer control)
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.005 : 0.005;
    setLogoPosition(prev => ({
      ...prev,
      scale: Math.max(0.05, Math.min(2.0, prev.scale + delta))
    }));
  };

  // Scale controls (finer: 1% per click)
  const scaleUp = () => {
    setLogoPosition(prev => ({
      ...prev,
      scale: Math.min(2.0, prev.scale + 0.01)
    }));
  };

  const scaleDown = () => {
    setLogoPosition(prev => ({
      ...prev,
      scale: Math.max(0.05, prev.scale - 0.01)
    }));
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update video preview when trim changes
  useEffect(() => {
    if (videoRef.current && trimSettings.enabled) {
      const video = videoRef.current;
      // Jump to start time when trim is enabled or changed
      video.currentTime = trimSettings.startTime;
    }
  }, [trimSettings.enabled, trimSettings.startTime]);

  // Keep video within trim bounds during playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !trimSettings.enabled) return;

    const handleTimeUpdate = () => {
      if (video.currentTime < trimSettings.startTime || video.currentTime > trimSettings.endTime) {
        video.currentTime = trimSettings.startTime;
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [trimSettings]);

  // Track video display size (for logo positioning)
  // Reset logo natural size when logo changes
  useEffect(() => {
    if (!logoUrl) {
      setLogoNaturalSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setLogoNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = logoUrl;
  }, [logoUrl]);

  // Auto-hide instruction after 3 seconds
  useEffect(() => {
    if (!showInstruction) return;
    const timer = setTimeout(() => setShowInstruction(false), 3000);
    return () => clearTimeout(timer);
  }, [showInstruction]);

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Plus size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'لوجو فيديو' : 'Video Logo'}</h1>
          <p className="text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'إضافة شعار مخصص على مقاطع الفيديو' : 'Add custom logos and watermarks to videos'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 sm:p-4 max-w-5xl mx-auto w-full">
        
        {/* Left Section: Upload & Preview */}
        <div className="flex-1 space-y-3">
          
          {/* Video Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Video size={14} className="text-blue-500" />
                {lang === 'ar' ? 'الفيديو' : 'Video'}
              </h2>
              {videoFile && (
                  <button
                    onClick={removeVideo}
                    className="p-1.5 sm:p-1 hover:bg-red-500/20 rounded-sm text-red-500 transition-colors"
                  >
                    <X size={14} />
                </button>
              )}
            </div>

            {!videoFile ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 p-5 sm:p-6 bg-[#14171C] border-2 border-dashed border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={16} className="text-blue-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-300 font-medium">
                    {lang === 'ar' ? 'انقر لاختيار فيديو' : 'Click to select video'}
                  </p>
                  <p className="text-[8px] text-gray-500 font-mono uppercase">
                    MP4, MOV, AVI, WebM
                  </p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div 
                ref={previewContainerRef}
                className="relative bg-[#14171C] rounded-lg overflow-hidden border border-[#2D3139]"
                onWheel={handleWheel}
              >
                <video
                  ref={videoRef}
                  src={videoUrl!}
                  controls
                  className="w-full h-auto"
                />
                {/* Logo overlay on video - pixel-based to avoid CSS circular % issues */}
                {logoUrl && videoMetadata && logoNaturalSize && (() => {
                  const video = videoRef.current;
                  if (!video) return null;
                  const videoRect = video.getBoundingClientRect();
                  const scaleX = videoRect.width / videoMetadata.width;
                  const scaleY = videoRect.height / videoMetadata.height;
                  const uniformScale = logoPosition.scale * scaleX;
                  const logoW = logoNaturalSize.width * uniformScale;
                  const logoH = logoNaturalSize.height * uniformScale;
                  const leftPx = logoPosition.x * scaleX;
                  const topPx = logoPosition.y * scaleY;
                  return (
                    <div
                      className="absolute group z-10"
                      style={{
                        left: leftPx,
                        top: topPx,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                      }}
                    >
                      <img
                        ref={logoImageRef}
                        src={logoUrl}
                        alt="Logo"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          setLogoNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                        }}
                        className={cn(
                          "pointer-events-auto",
                          dragState.isDragging ? "cursor-grabbing" : "cursor-grab"
                        )}
                        style={{
                          width: logoW,
                          height: logoH,
                          minWidth: 40,
                          maxWidth: 400,
                          maxHeight: 400,
                          touchAction: 'none',
                        }}
                        onMouseDown={handleLogoMouseDown}
                        onTouchStart={handleLogoTouchStart}
                        draggable={false}
                      />
                      {/* Hover drag indicator */}
                      <div className="absolute inset-0 -m-3 border-2 border-dashed border-blue-500/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                        <div className="bg-blue-500/80 text-white p-1 rounded-full backdrop-blur-sm">
                          <Hand size={12} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Instruction overlay - centered, auto-hides after 3s */}
                {showInstruction && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-black/80 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3"
                    >
                      <Hand size={18} className="text-blue-400" />
                      <span className="text-xs text-gray-200 font-medium">
                        {lang === 'ar' ? 'اسحب اللوجو • استخدم العجلة للتكبير/التصغير' : 'Drag logo • Scroll to zoom'}
                      </span>
                    </motion.div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-purple-500" />
                {lang === 'ar' ? 'اللوجو' : 'Logo'}
              </h2>
              {logoFile && (
                <button
                  onClick={removeLogo}
                  className="p-1.5 hover:bg-red-500/20 rounded-sm text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {!logoFile ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-[#14171C] border-2 border-dashed border-[#2D3139] hover:border-purple-500/50 rounded-lg transition-all cursor-pointer">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <ImageIcon size={14} className="text-purple-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-300 font-medium">
                    {lang === 'ar' ? 'انقر لاختيار لوجو' : 'Click to select logo'}
                  </p>
                  <p className="text-[8px] text-gray-500 font-mono uppercase">
                    PNG, JPG, SVG
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative bg-[#14171C] rounded-lg overflow-hidden border border-[#2D3139] p-2 flex items-center justify-center">
                <img
                  src={logoUrl!}
                  alt="Logo"
                  className="max-h-16 object-contain"
                />
              </div>
            )}
          </div>

          {/* Video Trim Controls */}
          {videoFile && videoDuration > 0 && (
            <div className="bg-[#14171C] border border-[#2D3139] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2D3139]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Scissors size={12} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                    {lang === 'ar' ? 'قص الفيديو' : 'Trim'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trimSettings.enabled}
                    onChange={(e) => setTrimSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#2D3139] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500"></div>
                </label>
              </div>

              {trimSettings.enabled && (
                <div className="p-3 space-y-3">
                  {/* Timeline */}
                  <div className="relative h-10 bg-[#0F1115] rounded-lg border border-[#2D3139] overflow-hidden">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, #2D3139 0px, #2D3139 1px, transparent 1px, transparent ' + (Math.max(8, videoDuration > 60 ? videoDuration / 3 : 20)) + 'px)',
                      opacity: 0.2
                    }} />
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-x-2 border-orange-500"
                      style={{
                        left: `${(trimSettings.startTime / videoDuration) * 100}%`,
                        width: `${((trimSettings.endTime - trimSettings.startTime) / videoDuration) * 100}%`
                      }}
                    />
                  </div>

                  {/* Time display */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500">
                      <span className="text-green-400 font-bold">{formatTime(trimSettings.startTime)}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-red-400 font-bold">{formatTime(trimSettings.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-orange-400">
                      <Clock size={10} />
                      <span className="font-bold">{formatTime(trimSettings.endTime - trimSettings.startTime)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setTrimSettings(prev => ({ ...prev, startTime: 0, endTime: videoDuration }));
                      }}
                      className="text-[8px] font-mono text-gray-500 hover:text-white transition-colors"
                    >
                      {lang === 'ar' ? 'إعادة' : 'Reset'}
                    </button>
                  </div>

                  {/* Single combined range slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={trimSettings.startTime}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setTrimSettings(prev => ({ ...prev, startTime: Math.min(v, prev.endTime - 1) }));
                      }}
                      className="w-full h-1.5 bg-[#2D3139] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(74,222,128,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={trimSettings.endTime}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setTrimSettings(prev => ({ ...prev, endTime: Math.max(v, prev.startTime + 1) }));
                      }}
                      className="w-full h-1.5 bg-[#2D3139] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(248,113,113,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Preview button */}
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = trimSettings.startTime;
                        videoRef.current.play();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-[9px] font-bold uppercase transition-all"
                  >
                    <Play size={12} />
                    {lang === 'ar' ? 'تشغيل من البداية' : 'Play from Start'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-400 font-mono">{error}</p>
            </div>
          )}

          {/* Result Preview */}
          {resultBlob && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-mono text-green-400 uppercase tracking-widest">
                <CheckCircle2 size={12} />
                {lang === 'ar' ? 'اكتمل! جاري التحميل...' : 'Completed! Downloading...'}
              </div>
              <div className="relative bg-[#14171C] rounded-lg overflow-hidden border border-green-500/30">
                <video
                src={URL.createObjectURL(resultBlob)}
                controls
                className="w-full h-auto max-h-48 sm:max-h-72"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Controls */}
        <div className="lg:w-64 space-y-3">
          
          {/* Logo Position Controls */}
          <div className="bg-[#14171C] border border-[#2D3139] rounded-lg p-2.5 space-y-2.5">
            <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Move size={12} className="text-yellow-500" />
              {lang === 'ar' ? 'موضع اللوجو' : 'Logo Position'}
            </h3>

            {/* Video Info */}
            {videoMetadata && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded p-1.5 space-y-0.5">
                <div className="text-[7px] text-gray-500 font-mono uppercase">
                  {lang === 'ar' ? 'أبعاد الفيديو' : 'Video Dimensions'}
                </div>
                <div className="text-[9px] text-blue-400 font-mono">
                  {videoMetadata.width} × {videoMetadata.height}
                </div>
              </div>
            )}

            {/* X Position */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[8px] text-gray-500 font-mono uppercase">
                  {lang === 'ar' ? 'الموضع الأفقي' : 'Horizontal (X)'}
                </label>
                <span className="text-[8px] text-blue-400 font-mono">
                  {videoMetadata ? `${Math.round(logoPosition.x)}px` : '-'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={videoMetadata?.width || 100}
                value={logoPosition.x}
                onChange={(e) => setLogoPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                disabled={!videoMetadata}
                className="w-full h-1 bg-[#2D3139] rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Y Position */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[8px] text-gray-500 font-mono uppercase">
                  {lang === 'ar' ? 'الموضع الرأسي' : 'Vertical (Y)'}
                </label>
                <span className="text-[8px] text-blue-400 font-mono">
                  {videoMetadata ? `${Math.round(logoPosition.y)}px` : '-'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={videoMetadata?.height || 100}
                value={logoPosition.y}
                onChange={(e) => setLogoPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                disabled={!videoMetadata}
                className="w-full h-1 bg-[#2D3139] rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[8px] text-gray-500 font-mono uppercase flex items-center gap-1">
                  <Maximize2 size={9} />
                  {lang === 'ar' ? 'الحجم' : 'Scale'}
                </label>
                <span className="text-[8px] text-purple-400 font-mono">{(logoPosition.scale * 100).toFixed(0)}%</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={scaleDown}
                  className="p-1.5 sm:p-1 bg-[#2D3139] hover:bg-red-500/20 hover:border-red-500/50 border border-transparent rounded-sm transition-all text-red-400 hover:text-red-300"
                  title={lang === 'ar' ? 'تصغير' : 'Zoom Out'}
                >
                  <Minimize2 size={13} />
                </button>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={logoPosition.scale * 100}
                  onChange={(e) => setLogoPosition(prev => ({ ...prev, scale: parseFloat(e.target.value) / 100 }))}
                  className="flex-1 h-1 bg-[#2D3139] rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <button
                  onClick={scaleUp}
                  className="p-1.5 sm:p-1 bg-[#2D3139] hover:bg-green-500/20 hover:border-green-500/50 border border-transparent rounded-sm transition-all text-green-400 hover:text-green-300"
                  title={lang === 'ar' ? 'تكبير' : 'Zoom In'}
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={processVideo}
            disabled={!videoFile || !logoFile || processing}
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'} {progress}%
              </>
            ) : (
              <>
                <Play size={14} />
                {lang === 'ar' ? 'إضافة اللوجو' : 'Add Logo'}
              </>
            )}
          </button>

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                <span>{lang === 'ar' ? 'التقدم' : 'Progress'}</span>
                <span className="text-blue-400">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#2D3139] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
