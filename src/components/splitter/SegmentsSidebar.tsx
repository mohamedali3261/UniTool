/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createElement } from 'react';
import { Download, Scissors } from 'lucide-react';
import { SegmentCard } from './SegmentCard';

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

interface SegmentsSidebarProps {
  segments: Segment[];
  playingSegmentId: string | null;
  selectedSegmentId: string | null;
  onPlaySegment: (id: string) => void;
  onProcessSegment: (segment: Segment) => void;
  onDownloadSegment: (segment: Segment) => void;
  onDeleteSegment: (id: string) => void;
  onDownloadAll: () => void;
  onDownloadZip: () => void;
  onProcessAll: () => void;
  isProcessing: boolean;
  hasCompleted: boolean;
  hasIdle: boolean;
  lang: 'ar' | 'en';
}

export function SegmentsSidebar({
  segments,
  playingSegmentId,
  selectedSegmentId,
  onPlaySegment,
  onProcessSegment,
  onDownloadSegment,
  onDeleteSegment,
  onDownloadAll,
  onDownloadZip,
  onProcessAll,
  isProcessing,
  hasCompleted,
  hasIdle,
  lang,
}: SegmentsSidebarProps) {
  return (
    <div className="w-full lg:w-80 bg-[#0A0C0F] lg:border-l border-[#2D3139] flex flex-col shrink-0 flex-1 lg:flex-none">
      {/* Header */}
      <div className="p-2.5 sm:p-4 border-b border-[#2D3139] bg-gradient-to-br from-[#14171C] to-[#0A0C0F]">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Scissors className="text-white" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-xs sm:text-sm truncate">
              {lang === 'ar' ? 'المقاطع' : 'Segments'}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500">
              {segments.length} {lang === 'ar' ? 'مقطع' : 'items'}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {hasCompleted && (
          <div className="flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <button
              onClick={onDownloadAll}
              className="flex-1 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-[9px] sm:text-[10px] font-medium flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <Download size={10} className="sm:size-3" />
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              onClick={onDownloadZip}
              className="flex-1 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-[9px] sm:text-[10px] font-medium flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <Download size={10} className="sm:size-3" />
              ZIP
            </button>
          </div>
        )}

        {hasIdle && (
          <button
            onClick={onProcessAll}
            disabled={isProcessing}
            className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-[10px] sm:text-xs font-medium flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <Scissors size={12} className="sm:size-[14px]" />
            {isProcessing 
              ? `${lang === 'ar' ? 'معالجة' : 'Processing'}...`
              : `${lang === 'ar' ? 'قص الكل' : 'Cut All'} (${segments.filter(s => s.status === 'idle').length})`
            }
          </button>
        )}
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-3 segments-list-scroll">
        <style>{`
          .segments-list-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .segments-list-scroll::-webkit-scrollbar-track {
            background: rgba(45, 49, 57, 0.3);
            border-radius: 10px;
            margin: 4px 0;
          }
          .segments-list-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
            border-radius: 10px;
            border: 1px solid rgba(10, 12, 15, 0.5);
            box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
          }
          .segments-list-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
          }
          .segments-list-scroll::-webkit-scrollbar-thumb:active {
            background: linear-gradient(180deg, #2563eb 0%, #7c3aed 50%, #db2777 100%);
          }
          .segments-list-scroll {
            scrollbar-width: thin;
            scrollbar-color: #3b82f6 rgba(45, 49, 57, 0.3);
          }
        `}</style>
        <div className="space-y-1.5 sm:space-y-2">
        {segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#14171C] rounded-2xl flex items-center justify-center mb-2 sm:mb-3">
              <Scissors className="text-gray-600" size={20} />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mb-1">
              {lang === 'ar' ? 'لا توجد مقاطع' : 'No segments yet'}
            </p>
            <p className="text-gray-700 text-[10px] sm:text-xs">
              {lang === 'ar' ? 'أضف مقاطع للبدء' : 'Add segments to start'}
            </p>
          </div>
        ) : (
          segments.map((segment) => 
            createElement(SegmentCard, {
              key: segment.id,
              segment,
              isPlaying: playingSegmentId === segment.id,
              isSelected: selectedSegmentId === segment.id,
              onPlay: () => onPlaySegment(segment.id),
              onProcess: () => onProcessSegment(segment),
              onDownload: () => onDownloadSegment(segment),
              onDelete: () => onDeleteSegment(segment.id),
              isProcessing,
              lang,
            })
          )
        )}
        </div>
      </div>

      {/* Footer Stats */}
      {segments.length > 0 && (
        <div className="p-1.5 sm:p-3 border-t border-[#2D3139] bg-[#14171C]">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
            <div className="bg-[#0A0C0F] rounded-lg p-1.5 sm:p-2">
              <div className="text-[9px] sm:text-xs text-gray-600 mb-0.5">{lang === 'ar' ? 'معلق' : 'Pending'}</div>
              <div className="text-xs sm:text-sm font-bold text-yellow-400">
                {segments.filter(s => s.status === 'idle').length}
              </div>
            </div>
            <div className="bg-[#0A0C0F] rounded-lg p-1.5 sm:p-2">
              <div className="text-[9px] sm:text-xs text-gray-600 mb-0.5">{lang === 'ar' ? 'معالجة' : 'Active'}</div>
              <div className="text-xs sm:text-sm font-bold text-blue-400">
                {segments.filter(s => s.status === 'processing').length}
              </div>
            </div>
            <div className="bg-[#0A0C0F] rounded-lg p-1.5 sm:p-2">
              <div className="text-[9px] sm:text-xs text-gray-600 mb-0.5">{lang === 'ar' ? 'مكتمل' : 'Done'}</div>
              <div className="text-xs sm:text-sm font-bold text-green-400">
                {segments.filter(s => s.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
