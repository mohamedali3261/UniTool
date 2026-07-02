/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Clock, Play, Pause, SkipBack, SkipForward, Trash2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface WaveformPlayerProps {
  audioFile: File;
  onReady: (ws: WaveSurfer, regions: any) => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onClearAll: () => void;
  hasSegments: boolean;
  playingSegmentName: string | null;
  lang: 'ar' | 'en';
  segmentsCount: number;
}

export function WaveformPlayer({
  audioFile,
  onReady,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onClearAll,
  hasSegments,
  playingSegmentName,
  lang,
  segmentsCount,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure container has dimensions before initializing
    const container = containerRef.current;
    if (!container.offsetWidth || !container.offsetHeight) {
      console.warn('Container dimensions not ready');
      return;
    }

    const regions = RegionsPlugin.create();
    
    const ws = WaveSurfer.create({
      container: container,
      waveColor: 'rgba(75, 85, 99, 0.4)',
      progressColor: 'rgba(59, 130, 246, 0.6)',
      cursorColor: '#3b82f6',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: typeof window !== 'undefined' && window.innerWidth < 480 ? 80 : 180,
      normalize: true,
      backend: 'WebAudio',
      plugins: [regions],
    });

    let isDestroyed = false;

    ws.on('ready', () => {
      if (!isDestroyed) {
        onReady(ws, regions);
      }
    });

    ws.on('error', (error) => {
      // Suppress abort errors during cleanup
      if (!error.message?.includes('abort')) {
        console.error('WaveSurfer error:', error);
      }
    });

    ws.loadBlob(audioFile).catch((error) => {
      // Suppress abort errors during cleanup
      if (!error.message?.includes('abort') && !isDestroyed) {
        console.error('Error loading audio:', error);
      }
    });

    return () => {
      isDestroyed = true;
      try {
        ws.destroy();
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, [audioFile]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Waveform Container */}
      <div className="relative bg-gradient-to-br from-[#0A0C0F] to-[#14171C] rounded-xl border-2 border-[#2D3139] p-3 sm:p-5 lg:p-6 shadow-xl">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" 
                style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <span className="font-medium">{lang === 'ar' ? 'موجة الصوت' : 'Waveform'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-mono">
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 font-bold">
                {segmentsCount} {lang === 'ar' ? 'مقطع' : 'segments'}
              </span>
            </div>
          </div>
          
          {/* Waveform */}
          <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: typeof window !== 'undefined' && window.innerWidth < 480 ? '80px' : '180px' }} />
          
          {/* Time Display */}
          <div className="flex items-center justify-between mt-3 sm:mt-4 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock size={12} className="text-blue-500 sm:text-inherit" />
              <span className="text-sm sm:text-base font-mono text-blue-400 font-bold">
                {formatTime(currentTime)}
              </span>
            </div>
            <span className="text-sm sm:text-base font-mono text-gray-500">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-gradient-to-br from-[#1A1D23] to-[#14171C] border border-[#2D3139] rounded-xl p-3 sm:p-4 shadow-lg">
        <div className="flex items-center justify-center gap-1.5 sm:gap-3">
          <button
            onClick={onSkipBackward}
            className="p-2 sm:p-3 bg-[#0A0C0F] text-gray-400 rounded-lg border border-[#2D3139] hover:text-white hover:border-blue-500/50 transition-all hover:scale-105"
            title={lang === 'ar' ? 'رجوع 5 ثواني' : 'Back 5s'}
          >
            <SkipBack size={16} className="sm:size-[18px]" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="relative p-3 sm:p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105 shadow-xl shadow-blue-500/30"
          >
            {isPlaying ? <Pause size={20} className="sm:size-6" /> : <Play size={20} className="ml-0.5 sm:size-6" />}
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl bg-white opacity-20 animate-pulse" />
            )}
          </button>
          
          <button
            onClick={onSkipForward}
            className="p-2 sm:p-3 bg-[#0A0C0F] text-gray-400 rounded-lg border border-[#2D3139] hover:text-white hover:border-blue-500/50 transition-all hover:scale-105"
            title={lang === 'ar' ? 'تقديم 5 ثواني' : 'Forward 5s'}
          >
            <SkipForward size={16} className="sm:size-[18px]" />
          </button>

          {hasSegments && (
            <>
              <div className="h-6 w-px bg-[#2D3139] mx-0.5 sm:mx-1" />
              <button
                onClick={onClearAll}
                className="p-2 sm:p-3 bg-red-600/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-600/20 transition-all hover:scale-105"
                title={lang === 'ar' ? 'مسح الكل' : 'Clear All'}
              >
                <Trash2 size={16} className="sm:size-[18px]" />
              </button>
            </>
          )}
        </div>
        
        {/* Playing indicator */}
        {playingSegmentName && (
          <div className="mt-3 pt-3 border-t border-[#2D3139]">
            <div className="flex items-center justify-center gap-2 text-xs text-blue-400">
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">
                {lang === 'ar' ? 'يتم التشغيل: ' : 'Playing: '}
                <span className="text-white">{playingSegmentName}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
