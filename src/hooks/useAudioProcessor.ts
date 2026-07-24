import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { AudioFile, CompressionSettings } from '../types';
import { compressAudio, loadFFmpeg } from '../lib/ffmpeg';
import { playCompletionSound } from '../lib/soundEffects';

export function useAudioProcessor(lang: 'ar' | 'en', t: any) {
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
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

  const selectedFile = files.find(f => f.id === selectedFileId);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          loadFFmpeg(),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
        setIsFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setLoadingError(t.failureMsg);
      }
    };
    init();
  }, [lang]);

  const updateFileStatus = useCallback((id: string, updates: Partial<AudioFile>) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        if (updates.previewUrl && f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
        return { ...f, ...updates };
      }
      return f;
    }));
  }, []);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
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
  }, [selectedFileId]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  }, [selectedFileId]);

  const processAll = useCallback(async () => {
    const idleFiles = files.filter(f => f.status === 'idle');
    if (idleFiles.length === 0) return;

    const processingPromises = idleFiles.map(async (fileObj) => {
      updateFileStatus(fileObj.id, { status: 'processing', progress: 0 });

      try {
        const trim = fileObj.startTime !== undefined && fileObj.endTime !== undefined 
          ? { start: fileObj.startTime, end: fileObj.endTime }
          : undefined;

        const resultBlob = await compressAudio(fileObj.file, settings, (progress) => {
          updateFileStatus(fileObj.id, { progress });
        }, trim);

        const previewUrl = URL.createObjectURL(resultBlob);

        updateFileStatus(fileObj.id, { 
          status: 'completed', 
          progress: 100, 
          resultBlob, 
          processedSize: resultBlob.size,
          previewUrl
        });

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

    await Promise.all(processingPromises);
  }, [files, settings, lang, updateFileStatus]);

  const downloadFile = useCallback((file: AudioFile) => {
    if (!file.resultBlob) return;
    const url = URL.createObjectURL(file.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${originalNameWithoutExt}.${settings.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings.format]);

  const downloadAllAsZip = useCallback(async () => {
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
  }, [files, settings.format]);

  const downloadAllFiles = useCallback(() => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.resultBlob);
    if (completedFiles.length === 0) return;

    completedFiles.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 300);
    });
  }, [files, downloadFile]);

  const clearFiles = useCallback(() => {
    files.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    setFiles([]);
  }, [files]);

  const handleTrimChange = useCallback((id: string, start: number, end: number) => {
    updateFileStatus(id, { startTime: start, endTime: end });
  }, [updateFileStatus]);

  const isAnyProcessing = files.some(f => f.status === 'processing');
  const hasIdleFiles = files.some(f => f.status === 'idle');
  const hasCompletedFiles = files.some(f => f.status === 'completed');

  return {
    isFfmpegLoaded,
    loadingError,
    files,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    settings,
    setSettings,
    handleFilesAdded,
    removeFile,
    processAll,
    downloadFile,
    downloadAllAsZip,
    downloadAllFiles,
    clearFiles,
    handleTrimChange,
    isAnyProcessing,
    hasIdleFiles,
    hasCompletedFiles,
  };
}
