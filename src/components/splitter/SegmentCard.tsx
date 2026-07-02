/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Pause, Download, Trash2, Loader2, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface Segment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  color: string;
}

interface SegmentCardProps {
  segment: Segment;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: () => void;
  onProcess: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isProcessing: boolean;
  lang: 'ar' | 'en';
}

export function SegmentCard({
  segment,
  isPlaying,
  isSelected,
  onPlay,
  onProcess,
  onDownload,
  onDelete,
  isProcessing,
  lang,
}: SegmentCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "relative bg-[#14171C] border-2 rounded-xl overflow-hidden transition-all hover:border-[#3D4149] group",
        isSelected ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#2D3139]"
      )}
    >
      {/* Top accent bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: segment.color }}
      />

      <div className="p-2.5 sm:p-3">
        {/* Header with play button */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <button
            onClick={onPlay}
            className={cn(
              "shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all relative",
              isPlaying
                ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50"
                : segment.status === 'completed' 
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-[#2D3139] text-gray-400 hover:bg-blue-500/20 hover:text-blue-400"
            )}
          >
            {segment.status === 'processing' ? (
              <Loader2 size={14} className="sm:size-4 animate-spin" />
            ) : isPlaying ? (
              <>
                <Pause size={14} className="sm:size-4" />
                <div className="absolute inset-0 rounded-lg bg-white opacity-20 animate-pulse" />
              </>
            ) : (
              <Play size={14} className="ml-0.5 sm:size-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-[10px] sm:text-xs truncate mb-0.5">
              {segment.name}
            </h3>
            <div className="flex items-center gap-1 text-[8px] sm:text-[10px]">
              <span className="px-1 sm:px-1.5 py-0.5 bg-[#2D3139] text-blue-400 rounded font-mono">
                {formatTime(segment.startTime)}
              </span>
              <span className="text-gray-600">→</span>
              <span className="px-1 sm:px-1.5 py-0.5 bg-[#2D3139] text-blue-400 rounded font-mono">
                {formatTime(segment.endTime)}
              </span>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="shrink-0 p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={12} className="sm:size-[14px]" />
          </button>
        </div>

        {/* Progress bar */}
        {segment.status === 'processing' && (
          <div className="mb-1.5 sm:mb-2">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1 text-[8px] sm:text-[10px]">
              <span className="text-blue-400 font-medium">
                {lang === 'ar' ? 'معالجة' : 'Processing'}
              </span>
              <span className="text-blue-400 font-mono">{segment.progress}%</span>
            </div>
            <div className="h-1 sm:h-1.5 bg-[#2D3139] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${segment.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 sm:gap-1.5">
          {segment.status === 'idle' && (
            <button
              onClick={onProcess}
              disabled={isProcessing}
              className="flex-1 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-[9px] sm:text-[10px] font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <Scissors size={10} className="sm:size-3" />
              {lang === 'ar' ? 'قص' : 'Cut'}
            </button>
          )}
          
          {segment.status === 'completed' && (
            <button
              onClick={onDownload}
              className="flex-1 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-400 text-[9px] sm:text-[10px] font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <Download size={10} className="sm:size-3" />
              {lang === 'ar' ? 'تحميل' : 'Download'}
            </button>
          )}
          
          {segment.status === 'error' && (
            <div className="flex-1 py-1.5 sm:py-2 bg-red-500/20 text-red-400 rounded-lg text-[9px] sm:text-[10px] font-medium text-center">
              {lang === 'ar' ? 'فشل' : 'Failed'}
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      {segment.status === 'completed' && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50" 
            style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        </div>
      )}
    </div>
  );
}
