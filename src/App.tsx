/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Settings,
  History,
  Sparkles,
  Waves,
  Info,
  Loader2,
  AlertTriangle,
  Plus,
  Cpu,
  Zap,
  Activity,
  Download,
  Scissors,
  ImageIcon,
  Eraser,
  MessageSquareText,
  FileAudio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';

import { AudioUploader } from './components/AudioUploader';
import { AudioList } from './components/AudioList';
import { SettingsPanel } from './components/SettingsPanel';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { AudioSplitter } from './pages/AudioSplitter';
import { VideoLogo } from './pages/VideoLogo';
import { ImageCropper } from './pages/ImageCropper';
import { BackgroundRemover } from './pages/BackgroundRemover';
import { SpeechToText } from './pages/SpeechToText';
import { AudioTranscriber } from './pages/AudioTranscriber';
import { AudioFile, CompressionSettings } from './types';
import { compressAudio, loadFFmpeg } from './lib/ffmpeg';
import { cn } from './lib/utils';
import { translations } from './lib/translations';
import { playCompletionSound } from './lib/soundEffects';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'compress' | 'splitter' | 'videoLogo' | 'imageCropper' | 'bgRemover' | 'speechToText' | 'audioTranscriber'>('compress');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = translations[lang];

  const [files, setFiles] = useState<AudioFile[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    format: 'mp3',
    bitrate: '64k',
    normalize: true,
    bassBoost: false,
    noiseReduction: false,
    deEsser: false,
    voiceEnhance: false,
    humRemover: false,
    dynamicCompressor: false,
    windNoiseFilter: false,
  });
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const selectedFile = files.find(f => f.id === selectedFileId);

  useEffect(() => {
    const init = async () => {
      try {
        await loadFFmpeg();
        setIsFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setLoadingError(t.failureMsg);
      }
    };
    init();
  }, [lang]);

  const handleFilesAdded = (newFiles: File[]) => {
    const audioFiles: AudioFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'idle',
      progress: 0,
      startTime: 0,
    }));
    setFiles(prev => [...audioFiles, ...prev]);
    if (!selectedFileId && audioFiles.length > 0) {
      setSelectedFileId(audioFiles[0].id);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const processAll = async () => {
    const idleFiles = files.filter(f => f.status === 'idle');
    if (idleFiles.length === 0) return;

    // Process all files in parallel
    const processingPromises = idleFiles.map(async (fileObj) => {
      updateFileStatus(fileObj.id, { status: 'processing', progress: 0 });

      try {
        const trim = fileObj.startTime !== undefined && fileObj.endTime !== undefined 
          ? { start: fileObj.startTime, end: fileObj.endTime }
          : undefined;

        const resultBlob = await compressAudio(fileObj.file, settings, (progress) => {
          updateFileStatus(fileObj.id, { progress });
        }, trim);

        // Generate preview URL
        const previewUrl = URL.createObjectURL(resultBlob);

        updateFileStatus(fileObj.id, { 
          status: 'completed', 
          progress: 100, 
          resultBlob, 
          processedSize: resultBlob.size,
          previewUrl
        });

        // Play completion sound
        playCompletionSound();

        confetti({
          particleCount: 40,
          spread: 30,
          origin: { y: 0.9, x: lang === 'ar' ? 0.2 : 0.8 },
          colors: ['#3b82f6', '#10b981']
        });
      } catch (err) {
        console.error(`Error processing ${fileObj.name}:`, err);
        updateFileStatus(fileObj.id, { 
          status: 'error', 
          errorMessage: 'PROCESSING_ERROR_ST_01' 
        });
      }
    });

    // Wait for all files to complete processing
    await Promise.all(processingPromises);
  };

  const updateFileStatus = (id: string, updates: Partial<AudioFile>) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        // Cleanup old preview URL if needed
        if (updates.previewUrl && f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
        return { ...f, ...updates };
      }
      return f;
    }));
  };

  const downloadFile = (file: AudioFile) => {
    if (!file.resultBlob) return;
    const url = URL.createObjectURL(file.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    // Keep original filename, just change extension
    const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${originalNameWithoutExt}.${settings.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.resultBlob);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();
    completedFiles.forEach(file => {
      const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const fileName = `${originalNameWithoutExt}.${settings.format}`;
      zip.file(fileName, file.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonic_reduce_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.resultBlob);
    if (completedFiles.length === 0) return;

    completedFiles.forEach((file, index) => {
      // Add delay between downloads to prevent browser blocking
      setTimeout(() => {
        downloadFile(file);
      }, index * 300); // 300ms delay between each download
    });
  };

  const isAnyProcessing = files.some(f => f.status === 'processing');
  const hasIdleFiles = files.some(f => f.status === 'idle');
  const hasCompletedFiles = files.some(f => f.status === 'completed');

  const [activeTab, setActiveTab] = useState<'queue' | 'workstation' | 'settings'>('workstation');

  const handleTrimChange = (id: string, start: number, end: number) => {
    updateFileStatus(id, { startTime: start, endTime: end });
  };

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  if (loadingError) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center p-6 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-[#1A1D23] border border-red-900/30 p-8 rounded-sm">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-white font-mono text-lg mb-2">SYSTEM_FAILURE</h2>
          <p className="text-gray-500 text-[10px] font-mono uppercase mb-6 leading-relaxed">{loadingError}</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-red-600 text-white font-mono text-[10px] hover:bg-red-700">{t.reboot}</button>
        </div>
      </div>
    );
  }

  if (!isFfmpegLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center font-mono">
        <div className="text-center space-y-6">
          <div className="flex gap-1 justify-center h-8">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                className="w-1 bg-blue-500"
              />
            ))}
          </div>
          <div className="space-y-1 px-4">
            <div className="text-white text-[10px] tracking-widest uppercase">{t.initializing}</div>
            <div className="text-gray-600 text-[8px] uppercase">{t.wait}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0F1115] text-[#D1D5DB] font-sans selection:bg-blue-500/30 overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#1A1D23] border-b border-[#2D3139] shrink-0 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 flex items-center justify-center sm:w-8 sm:h-8">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" className="drop-shadow-lg" />
              <g fill="white">
                <motion.rect 
                  x="30" y="35" width="8" rx="3"
                  animate={{ height: [30, 15, 30] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.rect 
                  x="42" y="28" width="8" rx="3"
                  animate={{ height: [44, 22, 44] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                />
                <motion.rect 
                  x="54" y="32" width="8" rx="3"
                  animate={{ height: [36, 18, 36] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.rect 
                  x="66" y="38" width="8" rx="3"
                  animate={{ height: [24, 12, 24] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />
              </g>
            </svg>
          </div>
          <h1 className="text-xs font-bold tracking-tight text-white uppercase font-display italic sm:text-sm">
            {t.title} <span className="text-blue-500 text-[8px] align-top not-italic ml-0.5 sm:text-[10px]">{t.pro}</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('compress')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'compress'
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <Zap size={12} />
              {lang === 'ar' ? 'ضغط' : 'Compress'}
            </button>
            <button
              onClick={() => setCurrentPage('splitter')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'splitter'
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <Scissors size={12} />
              {lang === 'ar' ? 'قص' : 'Split'}
            </button>
            <button
              onClick={() => setCurrentPage('videoLogo')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'videoLogo'
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <Plus size={12} />
              {lang === 'ar' ? 'لوجو فيديو' : 'Video Logo'}
            </button>
            <button
              onClick={() => setCurrentPage('imageCropper')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'imageCropper'
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <ImageIcon size={12} />
              {lang === 'ar' ? 'قص الصور' : 'Crop'}
            </button>
            <button
              onClick={() => setCurrentPage('bgRemover')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'bgRemover'
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <Eraser size={12} />
              {lang === 'ar' ? 'خلفية' : 'Bg Remove'}
            </button>
            <button
              onClick={() => setCurrentPage('speechToText')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'speechToText'
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <MessageSquareText size={12} />
              {lang === 'ar' ? 'نص' : 'STT'}
            </button>
            <button
              onClick={() => setCurrentPage('audioTranscriber')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono uppercase transition-all rounded-sm flex items-center gap-1.5",
                currentPage === 'audioTranscriber'
                  ? "bg-cyan-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3139]"
              )}
            >
              <FileAudio size={12} />
              {lang === 'ar' ? 'تفريغ' : 'Transcribe'}
            </button>
          </div>

          <button 
            onClick={toggleLang}
            className="text-[9px] font-mono text-gray-400 hover:text-white bg-gradient-to-r from-[#1A1D23] to-[#14171C] border border-[#2D3139] hover:border-blue-500/50 px-3 py-1.5 rounded-sm transition-all uppercase sm:text-[10px] font-bold shadow-lg hover:shadow-blue-500/20"
          >
            {t.lang}
          </button>
          <div className="hidden sm:flex items-center gap-6 text-[10px] font-mono">
            <div className={`flex flex-col ${lang === 'ar' ? 'items-start' : 'items-end'}`}>
              <span className="text-[#6B7280]">{t.engineStatus}</span>
              <span className="text-green-400">{t.stable}</span>
            </div>
            <div className="h-5 w-[1px] bg-[#2D3139]"></div>
            <div className={`flex flex-col ${lang === 'ar' ? 'items-start' : 'items-end'}`}>
              <span className="text-[#6B7280]">{t.sandbox}</span>
              <span className="text-white">{t.active}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      {currentPage === 'audioTranscriber' ? (
        <AudioTranscriber t={t} lang={lang} />
      ) : currentPage === 'speechToText' ? (
        <SpeechToText t={t} lang={lang} />
      ) : currentPage === 'splitter' ? (
        <AudioSplitter t={t} lang={lang} />
      ) : currentPage === 'videoLogo' ? (
        <VideoLogo t={t} lang={lang} />
      ) : currentPage === 'imageCropper' ? (
        <ImageCropper t={t} lang={lang} />
      ) : currentPage === 'bgRemover' ? (
        <BackgroundRemover t={t} lang={lang} />
      ) : (
        <main className="flex flex-1 overflow-hidden relative flex-col sm:flex-row">
        
        {/* Mobile Navigation for Page Selection */}
        <div className="md:hidden flex border-b border-[#2D3139] bg-[#14171C] shrink-0">
          <button
            onClick={() => setCurrentPage('compress')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'compress' ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <Zap size={12} />
            {lang === 'ar' ? 'ضغط' : 'Compress'}
          </button>
          <button
            onClick={() => setCurrentPage('splitter')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'splitter' ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <Scissors size={12} />
            {lang === 'ar' ? 'قص' : 'Split'}
          </button>
          <button
            onClick={() => setCurrentPage('videoLogo')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'videoLogo' ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <Plus size={12} />
            {lang === 'ar' ? 'لوجو' : 'Logo'}
          </button>
          <button
            onClick={() => setCurrentPage('imageCropper')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'imageCropper' ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <ImageIcon size={12} />
            {lang === 'ar' ? 'قص' : 'Crop'}
          </button>
          <button
            onClick={() => setCurrentPage('bgRemover')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'bgRemover' ? "text-purple-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <Eraser size={12} />
            {lang === 'ar' ? 'خلفية' : 'Bg'}
          </button>
          <button
            onClick={() => setCurrentPage('speechToText')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'speechToText' ? "text-purple-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <MessageSquareText size={12} />
            {lang === 'ar' ? 'نص' : 'STT'}
          </button>
          <button
            onClick={() => setCurrentPage('audioTranscriber')}
            className={cn(
              "flex-1 py-3 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest",
              currentPage === 'audioTranscriber' ? "text-cyan-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <FileAudio size={12} />
            {lang === 'ar' ? 'تفريغ' : 'Transcribe'}
          </button>
        </div>
        
        {/* Mobile Navigation Tabs */}
        <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
          {[
            { id: 'workstation', label: t.workstation, icon: Activity },
            { id: 'queue', label: t.files, icon: History },
            { id: 'settings', label: t.engine, icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
                onClick={() => {
                  files.forEach(f => { if(f.previewUrl) URL.revokeObjectURL(f.previewUrl) });
                  setFiles([]);
                }}
                className="px-2 py-0.5 text-[8px] font-mono bg-[#2D3139] rounded-sm border border-[#374151] hover:bg-gray-700 text-gray-400"
              >
                {t.clear}
              </button>
            </div>
            
            {hasCompletedFiles && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={downloadAllFiles}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-500/50 text-white rounded-sm hover:from-blue-500 hover:to-blue-400 transition-all text-[9px] uppercase font-mono font-bold shadow-lg shadow-blue-500/20"
                >
                  <Download size={12} />
                  {t.downloadAll}
                </button>
                <button
                  onClick={downloadAllAsZip}
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
            selectedId={selectedFileId || undefined}
            onSelect={id => setSelectedFileId(id)}
            onRemove={removeFile} 
            onDownload={downloadFile} 
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
                    onTrimChange={(start, end) => handleTrimChange(selectedFile.id, start, end)}
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
                          handleFilesAdded(Array.from(e.target.files || []));
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <AudioUploader t={t} onFilesAdded={handleFilesAdded} />
              )}
            </div>

            {/* Execution Control */}
            {hasIdleFiles && (
              <div className="flex flex-col items-center gap-3 pt-4">
                <button
                  onClick={processAll}
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
            onChange={setSettings} 
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
      )}

      {/* Footer Status Bar */}
      <footer className="px-4 py-1.5 bg-[#0A0C0F] border-t border-[#1F2937] flex justify-between items-center text-[8px] text-gray-600 font-mono shrink-0 sm:px-6">
        <div className="flex gap-4 sm:gap-6">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            LIVE
          </span>
          <span className="hidden xs:inline">44.1kHz</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
             <span className="hidden xs:inline text-blue-500/80">WASM_THREADS:8</span>
          </div>
          <span className="text-gray-700 truncate">SONIC_CORE_SYS</span>
        </div>
      </footer>
    </div>
  );
}

