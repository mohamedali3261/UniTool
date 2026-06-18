/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Scissors,
  Loader2,
  AlertCircle,
  HardDrive,
  Zap,
} from 'lucide-react';
import JSZip from 'jszip';
import { AudioCutter } from './AudioCutter';
import { compressAudio } from '../lib/ffmpeg';
import { cn } from '../lib/utils';

interface CutSegment {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
  duration: number;
}

interface CutSegmentResult extends CutSegment {
  blob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface CutterWorkstationProps {
  file: File;
  t: any;
  lang: 'ar' | 'en';
  format: string;
  bitrate: string;
}

export function CutterWorkstation({
  file,
  t,
  lang,
  format,
  bitrate,
}: CutterWorkstationProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<CutSegmentResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  };

  const handleAddSegments = (newSegments: CutSegment[]) => {
    const results: CutSegmentResult[] = newSegments.map((seg) => ({
      ...seg,
      status: 'pending',
      progress: 0,
    }));
    setSegments((prev) => [...prev, ...results]);
  };

  const handleProcessAllSegments = async () => {
    const pendingSegments = segments.filter((s) => s.status === 'pending');
    if (pendingSegments.length === 0) return;

    setIsProcessing(true);

    const settings = {
      quality: 'medium' as const,
      format: format as 'mp3' | 'aac' | 'opus',
      bitrate,
      normalize: true,
      bassBoost: false,
      noiseReduction: false,
      deEsser: false,
      voiceEnhance: false,
      humRemover: false,
      dynamicCompressor: false,
      windNoiseFilter: false,
    };

    for (const segment of pendingSegments) {
      try {
        const idx = segments.findIndex((s) => s.id === segment.id);
        if (idx === -1) continue;

        // Update status to processing
        setSegments((prev) => {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], status: 'processing', progress: 0 };
          return updated;
        });

        // Process the segment
        const resultBlob = await compressAudio(
          file,
          settings,
          (progress) => {
            setSegments((prev) => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], progress };
              return updated;
            });
          },
          { start: segment.startTime, end: segment.endTime }
        );

        // Update status to completed
        setSegments((prev) => {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            status: 'completed',
            progress: 100,
            blob: resultBlob,
          };
          return updated;
        });

        setProcessedCount((p) => p + 1);
      } catch (error) {
        console.error(`Error processing segment ${segment.name}:`, error);
        const idx = segments.findIndex((s) => s.id === segment.id);
        if (idx !== -1) {
          setSegments((prev) => {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              status: 'error',
              error: String(error),
            };
            return updated;
          });
        }
      }
    }

    setIsProcessing(false);
  };

  const handleDownloadAll = async () => {
    const completedSegments = segments.filter(
      (s) => s.status === 'completed' && s.blob
    );
    if (completedSegments.length === 0) return;

    if (completedSegments.length === 1) {
      // Download single file directly
      const segment = completedSegments[0];
      const url = URL.createObjectURL(segment.blob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${segment.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Download as ZIP
      const zip = new JSZip();
      completedSegments.forEach((segment) => {
        zip.file(`${segment.name}.${format}`, segment.blob!);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio-cuts-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleRemoveSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = () => {
    setSegments([]);
    setProcessedCount(0);
  };

  const totalSize = segments.reduce((acc, s) => acc + (s.blob?.size || 0), 0);
  const completedCount = segments.filter((s) => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <div className="bg-[#1A1D23] border border-[#2D3139] rounded-sm p-4 space-y-3 sm:p-6">
        <audio
          ref={audioRef}
          src={URL.createObjectURL(file)}
          className="w-full h-8 rounded cursor-pointer"
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Audio Cutter */}
      <AudioCutter
        file={file}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        t={t}
        lang={lang}
      />

      {/* Process Button */}
      {segments.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={handleProcessAllSegments}
            disabled={isProcessing || segments.every((s) => s.status !== 'pending')}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white transition-colors rounded-sm font-mono text-[10px] font-bold uppercase tracking-widest disabled:text-gray-600"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {lang === 'ar' ? 'معالجة' : 'Processing'} ({processedCount}/
                {segments.length})
              </>
            ) : (
              <>
                <Scissors size={14} />
                {lang === 'ar' ? 'معالجة القطع' : 'Process Cuts'}
              </>
            )}
          </button>
          {completedCount > 0 && (
            <button
              onClick={handleDownloadAll}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors rounded-sm font-mono text-[10px] font-bold uppercase tracking-widest"
            >
              <Download size={14} />
              {lang === 'ar' ? 'تحميل الكل' : 'Download All'} ({completedCount})
            </button>
          )}
        </div>
      )}

      {/* Segments Status */}
      {segments.length > 0 && (
        <div className="bg-[#14171C] border border-[#2D3139] rounded-sm p-4 space-y-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest sm:text-[10px]">
              {lang === 'ar' ? 'حالة القطع' : 'Cuts Status'}
            </div>
            <button
              onClick={handleClearAll}
              className="text-[8px] font-mono text-gray-500 hover:text-red-400 uppercase transition-colors"
            >
              {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-[#0F1115] border border-[#2D3139] rounded-sm text-center">
              <div className="text-[8px] text-gray-500 font-mono uppercase mb-1">
                {lang === 'ar' ? 'إجمالي' : 'Total'}
              </div>
              <div className="text-[12px] font-mono font-bold text-blue-400">
                {segments.length}
              </div>
            </div>
            <div className="p-2 bg-[#0F1115] border border-[#2D3139] rounded-sm text-center">
              <div className="text-[8px] text-gray-500 font-mono uppercase mb-1">
                {lang === 'ar' ? 'مكتمل' : 'Done'}
              </div>
              <div className="text-[12px] font-mono font-bold text-green-400">
                {completedCount}
              </div>
            </div>
            <div className="p-2 bg-[#0F1115] border border-[#2D3139] rounded-sm text-center">
              <div className="text-[8px] text-gray-500 font-mono uppercase mb-1">
                {lang === 'ar' ? 'الحجم' : 'Size'}
              </div>
              <div className="text-[12px] font-mono font-bold text-yellow-400">
                {(totalSize / 1024 / 1024).toFixed(2)}MB
              </div>
            </div>
          </div>

          {/* Segments List */}
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {segments.map((segment, idx) => (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-[#0F1115] border border-[#2D3139] rounded-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-mono text-white font-bold truncate">
                      {idx + 1}. {segment.name}
                    </p>
                    <p className="text-[8px] text-gray-500 mt-0.5">
                      {Math.round(segment.startTime * 1000) / 1000}s -{' '}
                      {Math.round(segment.endTime * 1000) / 1000}s
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex flex-col items-end gap-1">
                    {segment.status === 'pending' && (
                      <span className="text-[7px] font-mono text-gray-500 uppercase">
                        {lang === 'ar' ? 'معلق' : 'Pending'}
                      </span>
                    )}
                    {segment.status === 'processing' && (
                      <div className="flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin text-blue-400" />
                        <span className="text-[7px] font-mono text-blue-400 uppercase">
                          {segment.progress}%
                        </span>
                      </div>
                    )}
                    {segment.status === 'completed' && (
                      <span className="text-[7px] font-mono text-green-400 uppercase">
                        ✓ {lang === 'ar' ? 'مكتمل' : 'Done'}
                      </span>
                    )}
                    {segment.status === 'error' && (
                      <span className="text-[7px] font-mono text-red-400 uppercase">
                        ✕ {lang === 'ar' ? 'خطأ' : 'Error'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {segment.status === 'processing' && (
                  <div className="w-full h-1 bg-[#1A1D23] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${segment.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Delete Button */}
                {segment.status !== 'processing' && (
                  <button
                    onClick={() => handleRemoveSegment(segment.id)}
                    className="mt-2 text-[7px] font-mono text-gray-500 hover:text-red-400 uppercase transition-colors"
                  >
                    {lang === 'ar' ? 'حذف' : 'Remove'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      {segments.length === 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-sm">
          <div className="flex gap-3">
            <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-blue-300 font-mono font-bold mb-1 uppercase">
                {lang === 'ar' ? 'كيفية الاستخدام' : 'How to Use'}
              </p>
              <p className="text-[8px] text-blue-300/80 font-mono leading-relaxed">
                {lang === 'ar'
                  ? 'استخدم أداة التقطيع أعلاه لاختيار أجزاء الصوت المراد قصها. ستتم إضافة كل جزء إلى قائمة القطع. بعد إضافة جميع الأجزاء المطلوبة، اضغط "معالجة القطع" لمعالجتها جميعاً.'
                  : 'Use the cutter tool above to select the audio segments you want to cut. Each segment will be added to the cuts list. After adding all segments, click "Process Cuts" to process them all at once.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
