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

    const regions = RegionsPlugin.create();
    
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(75, 85, 99, 0.4)',
      progressColor: 'rgba(59, 130, 246, 0.6)',
      cursorColor: '#3b82f6',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 110,
      normalize: true,
      backend: 'WebAudio',
      plugins: [regions],
    });

    ws.on('ready', () => {
      onReady(ws, regions);
    });

    ws.loadBlob(audioFile);

    return () => {
      ws.destroy();
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
      <div className="relative bg-gradient-to-br from-[#0A0C0F] to-[#14171C] rounded-xl border-2 border-[#2D3139] p-3 shadow-xl">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" 
                style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <span className="font-medium">{lang === 'ar' ? 'موجة الصوت' : 'Waveform'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 font-bold">
                {segmentsCount} {lang === 'ar' ? 'مقطع' : 'segments'}
              </span>
            </div>
          </div>
          
          {/* Waveform */}
          <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
          
          {/* Time Display */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-blue-500" />
              <span className="text-sm font-mono text-blue-400 font-bold">
                {formatTime(currentTime)}
              </span>
            </div>
            <span className="text-sm font-mono text-gray-500">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-gradient-to-br from-[#1A1D23] to-[#14171C] border border-[#2D3139] rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onSkipBackward}
            className="p-2 bg-[#0A0C0F] text-gray-400 rounded-lg border border-[#2D3139] hover:text-white hover:border-blue-500/50 transition-all hover:scale-105"
            title={lang === 'ar' ? 'رجوع 5 ثواني' : 'Back 5s'}
          >
            <SkipBack size={14} />
          </button>
          
          <button
            onClick={onPlayPause}
            className="relative p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105 shadow-xl shadow-blue-500/30"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl bg-white opacity-20 animate-pulse" />
            )}
          </button>
          
          <button
            onClick={onSkipForward}
            className="p-2 bg-[#0A0C0F] text-gray-400 rounded-lg border border-[#2D3139] hover:text-white hover:border-blue-500/50 transition-all hover:scale-105"
            title={lang === 'ar' ? 'تقديم 5 ثواني' : 'Forward 5s'}
          >
            <SkipForward size={14} />
          </button>

          {hasSegments && (
            <>
              <div className="h-6 w-px bg-[#2D3139] mx-1" />
              <button
                onClick={onClearAll}
                className="p-2 bg-red-600/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-600/20 transition-all hover:scale-105"
                title={lang === 'ar' ? 'مسح الكل' : 'Clear All'}
              >
                <Trash2 size={14} />
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
