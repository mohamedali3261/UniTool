/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Scissors, MoveHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

interface WaveformVisualizerProps {
  url: string;
  onTrimChange?: (start: number, end: number) => void;
  startTime?: number;
  endTime?: number;
  t: any;
}

export function WaveformVisualizer({ url, onTrimChange, startTime = 0, endTime, t }: WaveformVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure container has dimensions before initializing
    const container = containerRef.current;
    if (!container.offsetWidth) {
      console.warn('Container width not ready');
      return;
    }

    const ws = WaveSurfer.create({
      container: container,
      waveColor: '#1e293b',
      progressColor: '#3b82f6',
      cursorColor: '#3b82f6',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      hideScrollbar: true,
    });

    let isDestroyed = false;

    ws.on('ready', () => {
      if (!isDestroyed) {
        setDuration(ws.getDuration());
        if (onTrimChange && !endTime) {
          onTrimChange(0, ws.getDuration());
        }
      }
    });

    ws.on('play', () => {
      if (!isDestroyed) {
        setIsPlaying(true);
      }
    });
    
    ws.on('pause', () => {
      if (!isDestroyed) {
        setIsPlaying(false);
      }
    });

    ws.on('error', (error) => {
      // Suppress abort errors during cleanup
      if (!error.message?.includes('abort')) {
        console.error('WaveSurfer error:', error);
      }
    });

    ws.load(url).catch((error) => {
      // Suppress abort errors during cleanup
      if (!error.message?.includes('abort') && !isDestroyed) {
        console.error('Error loading audio:', error);
      }
    });

    wavesurferRef.current = ws;

    return () => {
      isDestroyed = true;
      try {
        ws.destroy();
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, [url]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const handleStartTrim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (endTime !== undefined && val >= endTime) return;
    onTrimChange?.(val, endTime || duration);
  };

  const handleEndTrim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val <= startTime) return;
    onTrimChange?.(startTime, val);
  };

  return (
    <div className="bg-[#111418] border border-[#1A1D23] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
        </button>
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
          <div className="flex flex-col items-end">
            <span>{t.dur}</span>
            <span className="text-white">{duration.toFixed(2)}s</span>
          </div>
          <div className="w-[1px] h-6 bg-[#2D3139]" />
          <div className="flex flex-col items-end">
            <span>{t.seqs}</span>
            <span className="text-blue-400">{startTime.toFixed(2)}s - {(endTime || duration).toFixed(2)}s</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full" style={{ minHeight: '80px' }} />

      {onTrimChange && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
            <Scissors size={12} className="text-blue-500" />
            {t.trimming}
          </div>
          <div className="grid gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono uppercase">
                <span className="text-gray-500">{t.inPoint}</span>
                <span className="text-blue-400">{startTime.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={startTime}
                onChange={handleStartTrim}
                className="w-full accent-blue-600 h-1 bg-gray-800 rounded-full appearance-none"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono uppercase">
                <span className="text-gray-500">{t.outPoint}</span>
                <span className="text-emerald-400">{(endTime || duration).toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={endTime || duration}
                onChange={handleEndTrim}
                className="w-full accent-emerald-600 h-1 bg-gray-800 rounded-full appearance-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
