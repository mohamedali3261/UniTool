/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Play, Pause, Scissors, Plus, Download, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioSlice {
  id: string;
  start: number;
  end: number;
  name: string;
  blob?: Blob;
  color: string;
}

interface AudioSlicerProps {
  t: any;
  onExportSlices: (slices: AudioSlice[], file: File) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AudioSlicer({ t, onExportSlices }: AudioSlicerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [slices, setSlices] = useState<AudioSlice[]>([]);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#1e293b',
      progressColor: '#3b82f6',
      cursorColor: '#3b82f6',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 120,
      normalize: true,
      hideScrollbar: true,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;

    // Track region selection
    regions.on('region-updated', (region: any) => {
      setSelectionStart(region.start);
      setSelectionEnd(region.end);
    });

    ws.load(URL.createObjectURL(audioFile));

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setSlices([]);
      setSelectionStart(0);
      setSelectionEnd(0);
    }
  };

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const addRegion = () => {
    if (!regionsRef.current || !duration) return;
    
    const start = duration * 0.3;
    const end = duration * 0.6;
    const color = COLORS[slices.length % COLORS.length];
    
    regionsRef.current.addRegion({
      start,
      end,
      color: color + '40',
      drag: true,
      resize: true,
    });

    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const saveSlice = () => {
    if (!audioFile || selectionEnd <= selectionStart) return;

    const sliceId = Math.random().toString(36).substr(2, 9);
    const color = COLORS[slices.length % COLORS.length];
    
    const newSlice: AudioSlice = {
      id: sliceId,
      start: selectionStart,
      end: selectionEnd,
      name: `${audioFile.name.split('.')[0]}_slice_${slices.length + 1}`,
      color,
    };

    setSlices(prev => [...prev, newSlice]);

    // Clear all regions
    regionsRef.current?.clearRegions();
    setSelectionStart(0);
    setSelectionEnd(0);
  };

  const removeSlice = (id: string) => {
    setSlices(prev => prev.filter(s => s.id !== id));
  };

  const clearFile = () => {
    setAudioFile(null);
    setSlices([]);
    setSelectionStart(0);
    setSelectionEnd(0);
  };

  const exportSlices = () => {
    if (!audioFile || slices.length === 0) return;
    onExportSlices(slices, audioFile);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3139] bg-[#1A1D23]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <Scissors size={14} className="text-purple-500" />
            {t.audioSlicer}
          </div>
          {audioFile && (
            <button
              onClick={clearFile}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {!audioFile ? (
          <label className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors group">
            <Plus size={24} className="text-gray-600 group-hover:text-purple-500 transition-colors" />
            <span className="text-[10px] font-mono text-gray-500 uppercase">{t.loadAudioFile}</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        ) : (
          <div className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-3 py-2 rounded truncate">
            {audioFile.name}
          </div>
        )}
      </div>

      {/* Waveform Area */}
      {audioFile && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-[#111418] border border-[#1A1D23] rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              </button>
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                <div className="flex flex-col items-end">
                  <span>{t.totalDuration}</span>
                  <span className="text-white">{duration.toFixed(2)}s</span>
                </div>
              </div>
            </div>

            <div ref={containerRef} className="w-full" />

            <div className="flex gap-2">
              <button
                onClick={addRegion}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1A1D23] border border-[#2D3139] text-gray-400 hover:text-purple-400 hover:border-purple-500/30 rounded-sm transition-colors text-[9px] uppercase font-mono"
              >
                <Plus size={12} />
                {t.createRegion}
              </button>
              <button
                onClick={saveSlice}
                disabled={selectionEnd <= selectionStart}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 text-white hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-sm transition-colors text-[9px] uppercase font-mono font-bold"
              >
                <Scissors size={12} />
                {t.saveSlice}
              </button>
            </div>

            {selectionEnd > selectionStart && (
              <div className="text-[8px] font-mono text-gray-500 text-center">
                {t.selection}: {selectionStart.toFixed(2)}s - {selectionEnd.toFixed(2)}s ({(selectionEnd - selectionStart).toFixed(2)}s)
              </div>
            )}
          </div>

          {/* Slices List */}
          {slices.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                  {t.savedSlices} ({slices.length})
                </span>
              </div>
              <div className="space-y-2">
                {slices.map((slice) => (
                  <div
                    key={slice.id}
                    className="bg-[#1A1D23] border border-[#2D3139] rounded-lg p-3 flex items-center justify-between group hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: slice.color }}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-white truncate">
                          {slice.name}
                        </span>
                        <span className="text-[8px] font-mono text-gray-500">
                          {slice.start.toFixed(2)}s - {slice.end.toFixed(2)}s
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSlice(slice.id)}
                      className="p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      {slices.length > 0 && (
        <div className="p-4 border-t border-[#2D3139] bg-[#1A1D23]">
          <button
            onClick={exportSlices}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white hover:bg-purple-500 rounded-sm transition-colors text-[10px] uppercase font-mono font-bold"
          >
            <Download size={14} />
            {t.exportSlices} ({slices.length})
          </button>
        </div>
      )}
    </div>
  );
}
