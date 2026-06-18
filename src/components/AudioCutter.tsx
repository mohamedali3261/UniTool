/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scissors,
  Plus,
  Trash2,
  Download,
  Copy,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CutSegment {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
  duration: number;
}

interface AudioCutterProps {
  file: File;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  t: any;
  lang: 'ar' | 'en';
}

export function AudioCutter({
  file,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  t,
  lang,
}: AudioCutterProps) {
  const [segments, setSegments] = useState<CutSegment[]>([]);
  const [startPoint, setStartPoint] = useState<number | null>(null);
  const [endPoint, setEndPoint] = useState<number | null>(null);
  const [segmentName, setSegmentName] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  const handleSetStart = () => {
    setStartPoint(Math.round(currentTime * 100) / 100);
  };

  const handleSetEnd = () => {
    setEndPoint(Math.round(currentTime * 100) / 100);
  };

  const handleAddSegment = () => {
    if (startPoint === null || endPoint === null) {
      alert(lang === 'ar' ? 'حدد نقطة البداية والنهاية' : 'Please set start and end points');
      return;
    }

    if (startPoint >= endPoint) {
      alert(lang === 'ar' ? 'نقطة البداية يجب أن تكون قبل النهاية' : 'Start point must be before end point');
      return;
    }

    const name = segmentName.trim() || `${lang === 'ar' ? 'القطعة' : 'Segment'} ${segments.length + 1}`;
    const newSegment: CutSegment = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: startPoint,
      endTime: endPoint,
      name,
      duration: endPoint - startPoint,
    };

    setSegments([...segments, newSegment]);
    setStartPoint(null);
    setEndPoint(null);
    setSegmentName('');
  };

  const handleRemoveSegment = (id: string) => {
    setSegments(segments.filter((s) => s.id !== id));
    if (selectedSegmentId === id) setSelectedSegmentId(null);
  };

  const handlePlaySegment = (segment: CutSegment) => {
    onSeek(segment.startTime);
    if (!isPlaying) onPlayPause();
  };

  const handleDuplicateSegment = (segment: CutSegment) => {
    const newSegment: CutSegment = {
      ...segment,
      id: Math.random().toString(36).substr(2, 9),
      name: `${segment.name} (${lang === 'ar' ? 'نسخة' : 'Copy'})`,
    };
    setSegments([...segments, newSegment]);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timelineProgress = (currentTime / duration) * 100;
  const startPointPercent = startPoint !== null ? (startPoint / duration) * 100 : 0;
  const endPointPercent = endPoint !== null ? (endPoint / duration) * 100 : 0;

  return (
    <div className="space-y-6 p-4 bg-[#14171C] border border-[#2D3139] rounded-sm sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest sm:text-[10px]">
        <Scissors size={14} className="text-blue-500" />
        {lang === 'ar' ? 'قاطع الصوت' : 'Audio Cutter'}
      </div>

      {/* Timeline Visualization */}
      <div className="space-y-3">
        <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex justify-between sm:text-[10px]">
          <span>{lang === 'ar' ? 'الموضع الحالي' : 'Current Position'}</span>
          <span className="text-blue-400">{formatTime(currentTime)}</span>
        </div>

        <div
          ref={waveformRef}
          className="relative h-16 bg-[#0F1115] border border-[#2D3139] rounded-sm overflow-hidden cursor-pointer group"
          onClick={(e) => {
            const rect = waveformRef.current?.getBoundingClientRect();
            if (rect) {
              const percent = (e.clientX - rect.left) / rect.width;
              onSeek(percent * duration);
            }
          }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10" />

          {/* Segment ranges */}
          <AnimatePresence>
            {segments.map((segment) => {
              const left = (segment.startTime / duration) * 100;
              const width = ((segment.endTime - segment.startTime) / duration) * 100;
              return (
                <motion.div
                  key={segment.id}
                  className={cn(
                    'absolute top-0 h-full bg-green-500/30 border-l-2 border-r-2 border-green-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer',
                    selectedSegmentId === segment.id ? 'border-green-400 opacity-100' : ''
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSegmentId(segment.id);
                  }}
                />
              );
            })}
          </AnimatePresence>

          {/* Start point marker */}
          {startPoint !== null && (
            <div
              className="absolute top-0 h-full w-1 bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.5)]"
              style={{ left: `${startPointPercent}%` }}
            />
          )}

          {/* End point marker */}
          {endPoint !== null && (
            <div
              className="absolute top-0 h-full w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              style={{ left: `${endPointPercent}%` }}
            />
          )}

          {/* Current time indicator */}
          <motion.div
            className="absolute top-0 h-full w-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            style={{ left: `${timelineProgress}%` }}
          />

          {/* Tooltip */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-[#1A1D23] px-2 py-1 rounded text-[8px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {formatTime((duration / 100) * ((startPoint !== null ? startPointPercent : 0) || timelineProgress))}
          </div>
        </div>

        <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex justify-between sm:text-[10px]">
          <span>{lang === 'ar' ? 'المدة الكلية' : 'Total Duration'}</span>
          <span className="text-gray-500">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex gap-2">
        <button
          onClick={onPlayPause}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1A1D23] border border-[#2D3139] rounded-sm hover:bg-[#21262E] transition-colors text-[9px] text-gray-400 hover:text-white font-mono uppercase sm:text-[10px]"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? (lang === 'ar' ? 'إيقاف' : 'Pause') : lang === 'ar' ? 'تشغيل' : 'Play'}
        </button>
        <button
          onClick={() => onSeek(0)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1A1D23] border border-[#2D3139] rounded-sm hover:bg-[#21262E] transition-colors text-[9px] text-gray-400 hover:text-white font-mono uppercase sm:text-[10px]"
        >
          <RotateCcw size={12} />
          {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
        </button>
      </div>

      {/* Cut Points */}
      <div className="space-y-2">
        <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest sm:text-[10px]">
          {lang === 'ar' ? 'تحديد نقاط القطع' : 'Set Cut Points'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSetStart}
            className={cn(
              'py-2 px-3 rounded-sm border font-mono text-[9px] uppercase transition-colors font-bold sm:text-[10px]',
              startPoint !== null
                ? 'bg-orange-600/20 border-orange-500/50 text-orange-400'
                : 'bg-[#1A1D23] border-[#2D3139] text-gray-400 hover:text-white'
            )}
          >
            {startPoint !== null ? formatTime(startPoint) : (lang === 'ar' ? 'تعيين البداية' : 'Set Start')}
          </button>
          <button
            onClick={handleSetEnd}
            className={cn(
              'py-2 px-3 rounded-sm border font-mono text-[9px] uppercase transition-colors font-bold sm:text-[10px]',
              endPoint !== null
                ? 'bg-red-600/20 border-red-500/50 text-red-400'
                : 'bg-[#1A1D23] border-[#2D3139] text-gray-400 hover:text-white'
            )}
          >
            {endPoint !== null ? formatTime(endPoint) : (lang === 'ar' ? 'تعيين النهاية' : 'Set End')}
          </button>
        </div>
      </div>

      {/* Segment Name Input */}
      <div className="space-y-2">
        <label className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block sm:text-[10px]">
          {lang === 'ar' ? 'اسم القطعة' : 'Segment Name'}
        </label>
        <input
          type="text"
          value={segmentName}
          onChange={(e) => setSegmentName(e.target.value)}
          placeholder={lang === 'ar' ? 'مثال: المقدمة' : 'e.g., Intro'}
          className="w-full px-3 py-2 bg-[#1A1D23] border border-[#2D3139] rounded-sm text-[9px] text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Add Segment Button */}
      <button
        onClick={handleAddSegment}
        disabled={startPoint === null || endPoint === null}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors rounded-sm font-mono text-[9px] font-bold uppercase tracking-widest sm:text-[10px]"
      >
        <Plus size={14} />
        {lang === 'ar' ? 'إضافة القطعة' : 'Add Segment'}
      </button>

      {/* Segments List */}
      {segments.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex justify-between sm:text-[10px]">
            <span>{lang === 'ar' ? 'القطع المضافة' : 'Added Segments'} ({segments.length})</span>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {segments.map((segment) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'p-3 bg-[#1A1D23] border rounded-sm transition-all cursor-pointer group',
                    selectedSegmentId === segment.id
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-[#2D3139] hover:border-[#3D4149]'
                  )}
                  onClick={() => setSelectedSegmentId(segment.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono text-white truncate font-bold">
                        {segment.name}
                      </p>
                      <p className="text-[8px] text-gray-500 font-mono mt-1">
                        {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                      </p>
                    </div>
                    <span className="text-[8px] font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded whitespace-nowrap">
                      {formatTime(segment.duration)}
                    </span>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySegment(segment);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0F1115] border border-[#2D3139] hover:border-blue-500/50 rounded-sm text-[8px] text-gray-400 hover:text-blue-400 transition-colors font-mono uppercase"
                    >
                      <Play size={10} />
                      {lang === 'ar' ? 'تشغيل' : 'Play'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSegment(segment);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0F1115] border border-[#2D3139] hover:border-emerald-500/50 rounded-sm text-[8px] text-gray-400 hover:text-emerald-400 transition-colors font-mono uppercase"
                    >
                      <Copy size={10} />
                      {lang === 'ar' ? 'نسخ' : 'Dup'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSegment(segment.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0F1115] border border-[#2D3139] hover:border-red-500/50 rounded-sm text-[8px] text-gray-400 hover:text-red-400 transition-colors font-mono uppercase"
                    >
                      <Trash2 size={10} />
                      {lang === 'ar' ? 'حذف' : 'Del'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Info Message */}
      {segments.length === 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm">
          <p className="text-[8px] text-blue-300 font-mono leading-relaxed">
            {lang === 'ar'
              ? '1. استخدم أزرار التشغيل لتنقل عبر الصوت\n2. حدد نقطة البداية والنهاية\n3. أضف اسم للقطعة (اختياري)\n4. اضغط "إضافة القطعة" لحفظها'
              : '1. Use play controls to navigate\n2. Set start and end points\n3. Add a name (optional)\n4. Click "Add Segment" to save'}
          </p>
        </div>
      )}
    </div>
  );
}
