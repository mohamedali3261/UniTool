/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Scissors, Divide } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SplitControlsProps {
  splitMode: 'manual' | 'auto';
  autoSplitCount: number;
  onSplitModeChange: (mode: 'manual' | 'auto') => void;
  onAutoSplitCountChange: (count: number) => void;
  onAddSegment: () => void;
  onSplitAtCurrentTime: () => void;
  onAutoSplit: () => void;
  disabled: boolean;
  lang: 'ar' | 'en';
}

export function SplitControls({
  splitMode,
  autoSplitCount,
  onSplitModeChange,
  onAutoSplitCountChange,
  onAddSegment,
  onSplitAtCurrentTime,
  onAutoSplit,
  disabled,
  lang,
}: SplitControlsProps) {
  return (
    <div className="bg-gradient-to-br from-[#14171C] to-[#0A0C0F] border border-[#2D3139] rounded-xl p-3 sm:p-4 shadow-lg">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <Divide size={12} className="text-blue-500 sm:size-[14px]" />
        <h3 className="text-xs sm:text-sm font-bold text-white">
          {lang === 'ar' ? 'أدوات القص' : 'Split Tools'}
        </h3>
      </div>
      
      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <button
          onClick={() => onSplitModeChange('manual')}
          className={cn(
            "px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs rounded-lg border transition-all font-medium",
            splitMode === 'manual'
              ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30"
              : "bg-[#0A0C0F] text-gray-400 border-[#2D3139] hover:border-blue-500/50"
          )}
        >
          {lang === 'ar' ? 'يدوي' : 'Manual'}
        </button>
        <button
          onClick={() => onSplitModeChange('auto')}
          className={cn(
            "px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs rounded-lg border transition-all font-medium",
            splitMode === 'auto'
              ? "bg-gradient-to-br from-purple-600 to-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/30"
              : "bg-[#0A0C0F] text-gray-400 border-[#2D3139] hover:border-purple-500/50"
          )}
        >
          {lang === 'ar' ? 'تلقائي' : 'Auto'}
        </button>
      </div>

      {/* Manual Mode Controls */}
      {splitMode === 'manual' && (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            onClick={onAddSegment}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-[10px] sm:text-xs font-medium transition-all shadow-lg"
          >
            <Plus size={12} className="sm:size-[14px]" />
            {lang === 'ar' ? 'إضافة' : 'Add'}
          </button>
          <button
            onClick={onSplitAtCurrentTime}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-[10px] sm:text-xs font-medium transition-all shadow-lg"
          >
            <Scissors size={12} className="sm:size-[14px]" />
            {lang === 'ar' ? 'قص' : 'Split'}
          </button>
        </div>
      )}

      {/* Auto Mode Controls */}
      {splitMode === 'auto' && (
        <div className="space-y-2 sm:space-y-3">
          <div>
            <label className="text-[10px] sm:text-xs text-gray-400 mb-1.5 sm:mb-2 block font-medium">
              {lang === 'ar' ? 'عدد المقاطع:' : 'Number of segments:'}
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="range"
                min="2"
                max="20"
                value={autoSplitCount}
                onChange={(e) => onAutoSplitCountChange(Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-white text-sm sm:text-base font-bold min-w-[30px] sm:min-w-[35px] text-center bg-[#0A0C0F] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-[#2D3139]">
                {autoSplitCount}
              </span>
            </div>
          </div>
          <button
            onClick={onAutoSplit}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-[10px] sm:text-xs font-medium transition-all shadow-lg"
          >
            <Scissors size={12} className="sm:size-[14px]" />
            {lang === 'ar' ? 'تقسيم تلقائي' : 'Auto Split'}
          </button>
        </div>
      )}
    </div>
  );
}
