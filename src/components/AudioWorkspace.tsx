import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  History,
  Loader2,
  Plus,
  Zap,
  Activity,
  Download,
} from 'lucide-react';
import { AudioUploader } from './AudioUploader';
import { AudioList } from './AudioList';
import { SettingsPanel } from './SettingsPanel';
import { WaveformVisualizer } from './WaveformVisualizer';
import type { AudioFile, CompressionSettings } from '../types';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  files: AudioFile[];
  settings: CompressionSettings;
  onSettingsChange: (s: CompressionSettings) => void;
  activeTab: 'queue' | 'workstation' | 'settings';
  onActiveTabChange: (tab: 'queue' | 'workstation' | 'settings') => void;
  selectedFile: AudioFile | undefined;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onDownloadFile: (f: AudioFile) => void;
  onFilesAdded: (files: File[]) => void;
  onProcessAll: () => void;
  onClearFiles: () => void;
  onDownloadAllFiles: () => void;
  onDownloadAllAsZip: () => void;
  onTrimChange: (id: string, start: number, end: number) => void;
  isAnyProcessing: boolean;
  hasIdleFiles: boolean;
  hasCompletedFiles: boolean;
}

export function AudioWorkspace({
  t,
  lang,
  files,
  settings,
  onSettingsChange,
  activeTab,
  onActiveTabChange,
  selectedFile,
  onSelectFile,
  onRemoveFile,
  onDownloadFile,
  onFilesAdded,
  onProcessAll,
  onClearFiles,
  onDownloadAllFiles,
  onDownloadAllAsZip,
  onTrimChange,
  isAnyProcessing,
  hasIdleFiles,
  hasCompletedFiles,
}: Props) {
  return (
    <>
      {/* Page Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'ضغط الصوت' : 'Audio Compressor'}</h1>
          <p className="text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'ضغط وتحسين جودة الملفات الصوتية' : 'Compress and enhance audio files'}</p>
        </div>
      </div>
      <main className="flex flex-1 overflow-hidden relative flex-col sm:flex-row">
      
      {/* Mobile Navigation Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'workstation', label: t.workstation, icon: Activity },
          { id: 'queue', label: t.files, icon: History },
          { id: 'settings', label: t.engine, icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onActiveTabChange(tab.id as any)}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              activeTab === tab.id ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sidebar Left: Queue */}
      <aside className={cn(
        "w-full sm:w-72 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 transition-all",
        activeTab === 'queue' ? "flex flex-1" : "hidden sm:flex"
      )}>
        <div className="p-3 border-b border-[#2D3139] flex flex-col gap-2 bg-[#1A1D23] sm:p-4">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-2 sm:text-[10px]">
              <History size={12} />
              {t.fileQueue} ({files.length})
            </span>
            <button 
              onClick={onClearFiles}
              className="px-2 py-0.5 text-[8px] font-mono bg-[#2D3139] rounded-sm border border-[#374151] hover:bg-gray-700 text-gray-400"
            >
              {t.clear}
            </button>
          </div>
          
          {hasCompletedFiles && (
            <div className="flex flex-col gap-2">
              <button
                onClick={onDownloadAllFiles}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-500/50 text-white rounded-sm hover:from-blue-500 hover:to-blue-400 transition-all text-[9px] uppercase font-mono font-bold shadow-lg shadow-blue-500/20"
              >
                <Download size={12} />
                {t.downloadAll}
              </button>
              <button
                onClick={onDownloadAllAsZip}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-500/50 text-white rounded-sm hover:from-emerald-500 hover:to-emerald-400 transition-all text-[9px] uppercase font-mono font-bold shadow-lg shadow-emerald-500/20"
              >
                <Download size={12} />
                {t.downloadBatch}
              </button>
            </div>
          )}
        </div>
        
        <AudioList 
          files={files} 
          selectedId={selectedFile?.id}
          onSelect={onSelectFile}
          onRemove={onRemoveFile} 
          onDownload={onDownloadFile} 
          lang={lang}
          t={t}
        />

        <div className="p-3 bg-[#0F1115] mt-auto border-t border-[#2D3139] sm:p-4">
          <div className="flex justify-between items-center text-[8px] text-gray-500 mb-2 uppercase font-mono sm:text-[9px]">
            <span>{t.queueStatus}</span>
            <span className="text-blue-400">{files.length > 0 ? t.waiting : t.idle}</span>
          </div>
          <div className="w-full h-1 bg-[#2D3139] rounded-full overflow-hidden">
            <div className={cn("h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-500", files.length > 0 ? "w-1/2" : "w-0")}></div>
          </div>
        </div>
      </aside>

      {/* Center Section: Workstation */}
      <section className={cn(
        "flex-1 flex flex-col bg-[#0A0C0F] relative overflow-y-auto scrollbar-hide",
        activeTab === 'workstation' ? "flex" : "hidden sm:flex"
      )}>
        <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full space-y-8 sm:p-8 sm:space-y-12">
          
          {/* Visualizer Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest sm:text-[10px]">
                <Activity size={12} className="text-blue-500" />
                {t.workstation}
              </div>
              {selectedFile && (
                <div className="text-[8px] font-mono text-blue-500 flex items-center gap-2 max-w-[50%] overflow-hidden">
                  <span className="bg-blue-500/10 px-2 py-0.5 rounded italic truncate">{selectedFile.name}</span>
                </div>
              )}
            </div>
            
            {selectedFile ? (
              <div className="space-y-4">
                <WaveformVisualizer 
                  url={selectedFile.previewUrl || URL.createObjectURL(selectedFile.file)}
                  startTime={selectedFile.startTime}
                  endTime={selectedFile.endTime}
                  onTrimChange={(start, end) => onTrimChange(selectedFile.id, start, end)}
                  t={t}
                />
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#1A1D23] to-[#14171C] border border-[#2D3139] hover:border-blue-500/50 rounded-sm text-gray-400 hover:text-blue-400 transition-all text-[10px] font-mono uppercase cursor-pointer group shadow-lg hover:shadow-blue-500/20">
                    <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t.addMore}
                    <input 
                      type="file" 
                      multiple 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={(e) => {
                        onFilesAdded(Array.from(e.target.files || []));
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <AudioUploader t={t} onFilesAdded={onFilesAdded} />
            )}
          </div>

          {/* Execution Control */}
          {hasIdleFiles && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <button
                onClick={onProcessAll}
                disabled={isAnyProcessing}
                className="group relative w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 text-white transition-all overflow-hidden rounded-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none"
              >
                <div className="relative z-10 flex items-center justify-center gap-3 font-bold text-[11px] uppercase tracking-[0.2em] sm:text-sm">
                  {isAnyProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t.processing} ({files.filter(f => f.status === 'processing').length}/{files.filter(f => f.status === 'idle' || f.status === 'processing').length})
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="animate-pulse" />
                      {t.executepass} ({files.filter(f => f.status === 'idle').length})
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </button>
              {isAnyProcessing && (
                <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  ⚡ {lang === 'ar' ? 'معالجة متعددة نشطة' : 'Parallel Processing Active'}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sidebar Right: Controls */}
      <aside className={cn(
        "w-full sm:w-80 bg-[#14171C] border-l border-[#2D3139] flex flex-col shrink-0 transition-all",
        activeTab === 'settings' ? "flex flex-1" : "hidden lg:flex"
      )}>
        <SettingsPanel 
          settings={settings} 
          onChange={onSettingsChange} 
          isProcessing={isAnyProcessing} 
          t={t}
        />
        
        <div className="p-4 border-t border-[#2D3139] bg-[#1A1D23] mt-auto">
          <div className="flex items-start gap-3 p-3 bg-[#0F1115] border border-[#2D3139] rounded-sm mb-3">
            <Zap size={14} className="text-yellow-500 mt-1 shrink-0" />
            <p className="text-[8px] text-gray-600 leading-relaxed font-mono uppercase sm:text-[9px]">
              {t.hwAccel}
            </p>
          </div>
          <div className="text-center text-[8px] text-gray-700 font-mono tracking-widest uppercase mb-1">
            HWCORE_2.4
          </div>
        </div>
      </aside>
    </main>
    </>
  );
}
