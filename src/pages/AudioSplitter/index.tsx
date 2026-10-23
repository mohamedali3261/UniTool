/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, Scissors, AudioWaveform, ListMusic, AlertTriangle, RotateCcw, Settings2 } from 'lucide-react';
import JSZip from 'jszip';
import WaveSurfer from 'wavesurfer.js';

import { CompressionSettings } from '../../types';
import { cn } from '../../lib/utils';
import { compressAudio, loadFFmpeg } from '../../lib/ffmpeg';
import { WaveformPlayer } from '../../components/splitter/WaveformPlayer';
import { SegmentsSidebar } from '../../components/splitter/SegmentsSidebar';
import { SplitControls, type SplitMode } from '../../components/splitter/SplitControls';

type OutputFormat = 'mp3' | 'aac' | 'wav' | 'ogg';

const OUTPUT_FORMATS: { id: OutputFormat; label: string }[] = [
  { id: 'mp3', label: 'MP3' },
  { id: 'aac', label: 'AAC' },
  { id: 'wav', label: 'WAV' },
  { id: 'ogg', label: 'OGG' },
];

const BITRATES = ['96k', '128k', '192k', '256k', '320k'];

interface SplitSegment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  resultBlob?: Blob;
  color: string;
}

interface AudioSplitterProps {
  t: any;
  lang: 'ar' | 'en';
}

const SEGMENT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

export function AudioSplitter({ t, lang }: AudioSplitterProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<SplitSegment[]>([]);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [regionsPlugin, setRegionsPlugin] = useState<any>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [ffmpegError, setFfmpegError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('manual');
  const [autoSplitCount, setAutoSplitCount] = useState(4);
  const playbackIntervalRef = useRef<any>(null);
  const [mobileTab, setMobileTab] = useState<'waveform' | 'segments'>('waveform');

  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [bitrate, setBitrate] = useState('192k');
  const [normalize, setNormalize] = useState(true);
  const [silenceThresholdDb, setSilenceThresholdDb] = useState(-35);
  const [minSilenceSec, setMinSilenceSec] = useState(0.4);
  const [detectingSilence, setDetectingSilence] = useState(false);
  const [splitNotice, setSplitNotice] = useState<string | null>(null);

  const settings: CompressionSettings = {
    quality: 'medium',
    format: outputFormat,
    bitrate,
    normalize,
    bassBoost: false,
    noiseReduction: false,
    deEsser: false,
    voiceEnhance: false,
    humRemover: false,
    dynamicCompressor: false,
    windNoiseFilter: false,
  };

  const retryFfmpeg = () => {
    setFfmpegError(false);
    setIsFfmpegLoaded(false);
    loadFFmpeg()
      .then(() => setIsFfmpegLoaded(true))
      .catch((err) => {
        console.error('Audio splitter: FFmpeg load failed', err);
        setFfmpegError(true);
      });
  };

  useEffect(() => {
    retryFfmpeg();
  }, []);

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, []);

  const handleWaveformReady = (ws: WaveSurfer, regions: any) => {
    setWavesurfer(ws);
    setRegionsPlugin(regions);
    setDuration(ws.getDuration());

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => {
      setIsPlaying(true);
    });
    
    ws.on('pause', () => {
      setIsPlaying(false);
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      setPlayingSegmentId(null);
    });

    regions.on('region-created', (region: any) => {
      const index = Math.max(0, regions.getRegions().findIndex((r: any) => r.id === region.id));
      const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
      const newSegment: SplitSegment = {
        id: region.id,
        name: `${lang === 'ar' ? 'مقطع' : 'Segment'} ${index + 1}`,
        startTime: region.start,
        endTime: region.end,
        status: 'idle',
        progress: 0,
        color,
      };
      setSegments(prev => [...prev, newSegment]);

      region.setOptions({
        color: color + '50',
        resize: true,
        drag: true,
      });
    });

    regions.on('region-updated', (region: any) => {
      console.log('Region updated:', {
        id: region.id,
        start: region.start.toFixed(3),
        end: region.end.toFixed(3),
        duration: (region.end - region.start).toFixed(3)
      });
      
      setSegments(prev => prev.map(seg => 
        seg.id === region.id 
          ? { ...seg, startTime: region.start, endTime: region.end }
          : seg
      ));
    });

    regions.on('region-clicked', (region: any, e: any) => {
      e.stopPropagation();
      setSelectedRegionId(region.id);
      playSegmentById(region.id);
    });
  };

  const handleFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setSegments([]);
      setSelectedRegionId(null);
      setPlayingSegmentId(null);
    }
  };

  const playSegmentById = (segmentId: string) => {
    if (!wavesurfer) {
      console.warn('WaveSurfer is not initialized');
      return;
    }
    
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    try {
      if (playingSegmentId === segmentId && isPlaying) {
        wavesurfer.pause();
        setPlayingSegmentId(null);
        return;
      }

      wavesurfer.setTime(segment.startTime);
      wavesurfer.play();
      setPlayingSegmentId(segmentId);
      setSelectedRegionId(segmentId);
      
      playbackIntervalRef.current = setInterval(() => {
        if (!wavesurfer) {
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
          return;
        }
        
        const current = wavesurfer.getCurrentTime();
        if (current >= segment.endTime) {
          wavesurfer.pause();
          setPlayingSegmentId(null);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
        }
      }, 50);
    } catch (error) {
      console.error('Error playing segment:', error);
      setPlayingSegmentId(null);
    }
  };

  const addSegment = () => {
    if (!regionsPlugin || !wavesurfer || !duration) {
      console.warn('WaveSurfer is not initialized');
      return;
    }
    
    // Check if wavesurfer is ready
    try {
      const wsDuration = wavesurfer.getDuration();
      if (!wsDuration || wsDuration === 0) {
        console.warn('WaveSurfer duration not available yet');
        return;
      }
    } catch (error) {
      console.warn('WaveSurfer not ready:', error);
      return;
    }

    const lastSegment = segments[segments.length - 1];
    const start = lastSegment ? lastSegment.endTime : 0;
    const end = Math.min(start + 30, duration);

    if (start >= duration) return;

    const color = SEGMENT_COLORS[segments.length % SEGMENT_COLORS.length];
    
    try {
      regionsPlugin.addRegion({
        start,
        end,
        color: color + '50',
        drag: true,
        resize: true,
      });
    } catch (error) {
      console.error('Error adding segment:', error);
    }
  };

  const autoSplit = () => {
    if (!regionsPlugin || !wavesurfer || !duration || autoSplitCount < 2) {
      console.warn('WaveSurfer is not initialized or invalid split count');
      return;
    }
    
    // Check if wavesurfer is ready
    try {
      const wsDuration = wavesurfer.getDuration();
      if (!wsDuration || wsDuration === 0) {
        console.warn('WaveSurfer duration not available yet');
        return;
      }
    } catch (error) {
      console.warn('WaveSurfer not ready:', error);
      return;
    }

    try {
      const regions = regionsPlugin.getRegions();
      regions.forEach((region: any) => region.remove());
      setSegments([]);

      const segmentDuration = duration / autoSplitCount;

      for (let i = 0; i < autoSplitCount; i++) {
        const start = i * segmentDuration;
        const end = (i + 1) * segmentDuration;
        const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

        regionsPlugin.addRegion({
          start,
          end,
          color: color + '50',
          drag: true,
          resize: true,
        });
      }
    } catch (error) {
      console.error('Error auto-splitting:', error);
    }
  };

  const autoSplitBySilence = async () => {
    if (!audioFile || !regionsPlugin || !duration) return;
    setDetectingSilence(true);
    setSplitNotice(null);

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      await audioCtx.close();

      const channel = decoded.getChannelData(0);
      const frameSec = 0.02;
      const frameSize = Math.max(1, Math.floor(decoded.sampleRate * frameSec));
      const frameCount = Math.ceil(channel.length / frameSize);
      const rms: number[] = new Array(frameCount);
      let maxRms = 0;

      for (let i = 0; i < frameCount; i++) {
        const start = i * frameSize;
        const end = Math.min(start + frameSize, channel.length);
        let sum = 0;
        for (let j = start; j < end; j++) sum += channel[j] * channel[j];
        const value = Math.sqrt(sum / Math.max(1, end - start));
        rms[i] = value;
        if (value > maxRms) maxRms = value;
      }

      const threshold = Math.max(0.0005, maxRms * Math.pow(10, silenceThresholdDb / 20));
      const minFrames = Math.max(1, Math.ceil(minSilenceSec / frameSec));
      const total = decoded.duration || duration;
      const cuts: number[] = [];
      let runStart = -1;

      for (let i = 0; i <= frameCount; i++) {
        const silent = i < frameCount && rms[i] <= threshold;
        if (silent && runStart === -1) runStart = i;
        if (!silent && runStart !== -1) {
          const runEnd = i - 1;
          const length = runEnd - runStart + 1;
          if (length >= minFrames && runStart > 0 && runEnd < frameCount - 1) {
            cuts.push(((runStart + runEnd + 1) / 2) * frameSec);
          }
          runStart = -1;
        }
      }

      const boundaries = [0, ...cuts.filter(t => t > 0.2 && t < total - 0.2), total];
      const existingRegions = regionsPlugin.getRegions();
      existingRegions.forEach((region: any) => region.remove());
      setSegments([]);

      let created = 0;
      for (let i = 0; i < boundaries.length - 1 && created < 60; i++) {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        if (end - start < 0.15) continue;
        regionsPlugin.addRegion({
          start,
          end,
          color: SEGMENT_COLORS[created % SEGMENT_COLORS.length] + '50',
          drag: true,
          resize: true,
        });
        created++;
      }

      setSplitNotice(
        created > 0
          ? (lang === 'ar' ? `تم إنشاء ${created} مقطع حسب الصمت` : `Created ${created} segments from pauses`)
          : (lang === 'ar' ? 'لم يتم العثور على صمت كافٍ — جرّب حساسية أعلى' : 'No clear pauses found — try higher sensitivity')
      );
    } catch (error) {
      console.error('Silence detection failed:', error);
      setSplitNotice(lang === 'ar' ? 'تعذّر تحليل الصوت' : 'Could not analyze the audio');
    } finally {
      setDetectingSilence(false);
    }
  };

  const splitAtCurrentTime = () => {
    if (!regionsPlugin || !wavesurfer || !duration) {
      console.warn('WaveSurfer is not initialized');
      return;
    }
    
    // Check if wavesurfer is ready
    try {
      const wsDuration = wavesurfer.getDuration();
      if (!wsDuration || wsDuration === 0) {
        console.warn('WaveSurfer duration not available yet');
        return;
      }
      
      const current = wavesurfer.getCurrentTime();
      if (current <= 0 || current >= duration) return;

      const regions = regionsPlugin.getRegions();
      let regionToSplit: any = null;

      for (const region of regions) {
        if (current > region.start && current < region.end) {
          regionToSplit = region;
          break;
        }
      }

      if (regionToSplit) {
        const oldEnd = regionToSplit.end;
        regionToSplit.setOptions({ end: current });

        const color = SEGMENT_COLORS[segments.length % SEGMENT_COLORS.length];
        regionsPlugin.addRegion({
          start: current,
          end: oldEnd,
          color: color + '50',
          drag: true,
          resize: true,
        });
      } else {
        const end = Math.min(current + 30, duration);
        const color = SEGMENT_COLORS[segments.length % SEGMENT_COLORS.length];
        
        regionsPlugin.addRegion({
          start: current,
          end,
          color: color + '50',
          drag: true,
          resize: true,
        });
      }
    } catch (error) {
      console.error('Error splitting at current time:', error);
    }
  };

  const togglePlayPause = () => {
    if (!wavesurfer) {
      console.warn('WaveSurfer is not initialized');
      return;
    }
    
    try {
      if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
      } else {
        wavesurfer.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const skipBackward = () => {
    if (!wavesurfer) {
      console.warn('WaveSurfer is not initialized');
      return;
    }
    
    try {
      const newTime = Math.max(0, wavesurfer.getCurrentTime() - 5);
      wavesurfer.setTime(newTime);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const skipForward = () => {
    if (!wavesurfer) {
      console.warn('WaveSurfer is not initialized');
      return;
    }
    
    try {
      const newTime = Math.min(duration, wavesurfer.getCurrentTime() + 5);
      wavesurfer.setTime(newTime);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const clearAllSegments = () => {
    if (!regionsPlugin) return;
    
    const regions = regionsPlugin.getRegions();
    regions.forEach((region: any) => region.remove());
    setSegments([]);
    setSelectedRegionId(null);
    setPlayingSegmentId(null);
  };

  const removeSegment = (id: string) => {
    if (!regionsPlugin) return;
    
    const regions = regionsPlugin.getRegions();
    regions.forEach((region: any) => {
      if (region.id === id) {
        region.remove();
      }
    });
    
    setSegments(prev => prev.filter(seg => seg.id !== id));
    if (selectedRegionId === id) setSelectedRegionId(null);
    if (playingSegmentId === id) setPlayingSegmentId(null);
  };

  const processSegment = async (segment: SplitSegment) => {
    if (!audioFile || !isFfmpegLoaded) return;

    // Log segment times for debugging
    console.log(`Processing segment: ${segment.name}`, {
      start: segment.startTime.toFixed(3),
      end: segment.endTime.toFixed(3),
      duration: (segment.endTime - segment.startTime).toFixed(3)
    });

    setSegments(prev => prev.map(seg =>
      seg.id === segment.id ? { ...seg, status: 'processing', progress: 0 } : seg
    ));

    try {
      const resultBlob = await compressAudio(
        audioFile,
        settings,
        (progress) => {
          setSegments(prev => prev.map(seg =>
            seg.id === segment.id ? { ...seg, progress } : seg
          ));
        },
        { start: segment.startTime, end: segment.endTime }
      );

      setSegments(prev => prev.map(seg =>
        seg.id === segment.id 
          ? { ...seg, status: 'completed', progress: 100, resultBlob } 
          : seg
      ));
    } catch (error) {
      console.error('Processing error:', error);
      setSegments(prev => prev.map(seg =>
        seg.id === segment.id
          ? { ...seg, status: 'error', progress: 0, error: error instanceof Error ? error.message : String(error) }
          : seg
      ));
    }
  };

  const processAllSegments = async () => {
    const idleSegments = segments.filter(seg => seg.status === 'idle');
    
    for (const segment of idleSegments) {
      await processSegment(segment);
    }
  };

  const downloadSegment = (segment: SplitSegment, index?: number) => {
    if (!segment.resultBlob) return;

    const url = URL.createObjectURL(segment.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // Use index if provided, otherwise find segment index
    const segmentIndex = index !== undefined ? index + 1 : segments.findIndex(s => s.id === segment.id) + 1;
    a.download = `audio${segmentIndex}.${settings.format}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const downloadAllSegments = () => {
    const completedSegments = segments.filter(s => s.status === 'completed' && s.resultBlob);
    
    completedSegments.forEach((segment, index) => {
      setTimeout(() => {
        downloadSegment(segment, index);
      }, index * 300);
    });
  };

  const downloadAllAsZip = async () => {
    const completedSegments = segments.filter(s => s.status === 'completed' && s.resultBlob);
    if (completedSegments.length === 0) return;

    const zip = new JSZip();
    completedSegments.forEach((segment, index) => {
      zip.file(`audio${index + 1}.${settings.format}`, segment.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio_segments_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const isAnyProcessing = segments.some(s => s.status === 'processing');
  const hasIdleSegments = segments.some(s => s.status === 'idle');
  const hasCompletedSegments = segments.some(s => s.status === 'completed');
  const playingSegment = segments.find(s => s.id === playingSegmentId);

  if (ffmpegError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0C0F] p-6">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-sm font-semibold text-white">
            {lang === 'ar' ? 'تعذّر تحميل محرك الصوت' : 'Audio engine failed to load'}
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-gray-500">
            {lang === 'ar'
              ? 'تأكد من اتصال الإنترنت ثم أعد المحاولة. باقي الأدوات لا تتأثر.'
              : 'Check your internet connection and try again. Other tools are unaffected.'}
          </p>
          <button
            onClick={retryFfmpeg}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[10px] font-semibold text-white hover:bg-indigo-500"
          >
            <RotateCcw size={12} />
            {lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  if (!isFfmpegLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0C0F]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Scissors size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'قص الملفات الصوتية' : 'Audio Splitter'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'قص وتقسيم ملفاتك الصوتية' : 'Cut and split your audio files'}</p>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Mobile Tab Bar */}
        {audioFile && (
          <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
            <button
              onClick={() => setMobileTab('waveform')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
                mobileTab === 'waveform' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'
              }`}
            >
              <AudioWaveform size={14} />
              {lang === 'ar' ? 'موجة' : 'Waveform'}
            </button>
            <button
              onClick={() => setMobileTab('segments')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
                mobileTab === 'segments' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'
              }`}
            >
              <ListMusic size={14} />
              {lang === 'ar' ? 'مقاطع' : 'Segments'}
              {segments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-bold">{segments.length}</span>
              )}
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 ${
          audioFile && mobileTab === 'segments' ? 'hidden lg:flex' : ''
        }`}>
        {audioFile && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2 text-xs text-blue-400">
            💡 {lang === 'ar'
              ? 'انقر على المقطع الملون لتشغيله • اسحب الحواف للتعديل'
              : 'Click colored segment to play • Drag edges to resize'}
          </div>
        )}

        {/* File Upload */}
        {!audioFile ? (
          <div className="border-2 border-dashed border-[#2D3139] rounded-2xl p-6 sm:p-12 lg:p-16 text-center hover:border-blue-500/50 transition-all">
            <label className="cursor-pointer block">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                  <Plus className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm sm:text-lg mb-1 sm:mb-2">
                    {lang === 'ar' ? 'اختر ملف صوتي' : 'Choose Audio File'}
                  </p>
                  <p className="text-[11px] sm:text-sm text-gray-500">
                    {lang === 'ar' ? 'اسحب وأفلت أو انقر للتحميل' : 'Drag and drop or click to upload'}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        ) : (
          <>
            {/* File Info */}
            <div className="bg-gradient-to-br from-[#14171C] to-[#0A0C0F] border border-[#2D3139] rounded-2xl p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-white font-medium mb-1 truncate max-w-[160px] xs:max-w-full sm:max-w-full">{audioFile.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAudioFile(null);
                    setSegments([]);
                    if (wavesurfer) wavesurfer.destroy();
                  }}
                  className="px-4 py-2 text-xs bg-red-600/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/20 transition-all"
                >
                  {lang === 'ar' ? 'إزالة' : 'Remove'}
                </button>
              </div>
            </div>

            {/* Split Controls */}
            <SplitControls
              splitMode={splitMode}
              autoSplitCount={autoSplitCount}
              onSplitModeChange={setSplitMode}
              onAutoSplitCountChange={setAutoSplitCount}
              onAddSegment={addSegment}
              onSplitAtCurrentTime={splitAtCurrentTime}
              onAutoSplit={autoSplit}
              onSilenceSplit={autoSplitBySilence}
              silenceThresholdDb={silenceThresholdDb}
              onSilenceThresholdChange={setSilenceThresholdDb}
              minSilenceSec={minSilenceSec}
              onMinSilenceChange={setMinSilenceSec}
              detectingSilence={detectingSilence}
              disabled={!duration}
              lang={lang}
            />

            {splitNotice && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 text-xs text-emerald-300">
                {splitNotice}
              </div>
            )}

            {/* Output Settings */}
            <div className="bg-gradient-to-br from-[#14171C] to-[#0A0C0F] border border-[#2D3139] rounded-xl p-3 sm:p-4 shadow-lg">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Settings2 size={12} className="text-blue-500 sm:size-[14px]" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {lang === 'ar' ? 'إعدادات التصدير' : 'Export Settings'}
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {OUTPUT_FORMATS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOutputFormat(opt.id)}
                    className={cn(
                      'py-1.5 text-[10px] font-mono rounded-md border transition-all',
                      outputFormat === opt.id
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                        : 'bg-[#0A0C0F] border-[#2D3139] text-gray-500 hover:border-gray-500'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {outputFormat !== 'wav' && (
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {BITRATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setBitrate(rate)}
                      className={cn(
                        'py-1 text-[9px] font-mono rounded border transition-all',
                        bitrate === rate
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#0A0C0F] border-[#2D3139] text-gray-500 hover:border-gray-500'
                      )}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className="text-[10px] text-gray-400">
                  {lang === 'ar' ? 'تطبيع مستوى الصوت (Normalize)' : 'Normalize loudness'}
                </span>
              </label>
            </div>

            {/* Waveform Player */}
            <WaveformPlayer
              audioFile={audioFile}
              onReady={handleWaveformReady}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlayPause={togglePlayPause}
              onSkipBackward={skipBackward}
              onSkipForward={skipForward}
              onClearAll={clearAllSegments}
              hasSegments={segments.length > 0}
              playingSegmentName={playingSegment?.name || null}
              lang={lang}
              segmentsCount={segments.length}
            />
          </>
        )}
        </div>

        {/* Sidebar */}
        {audioFile && (
          <div className={`${mobileTab === 'waveform' ? 'hidden' : 'flex-1 flex flex-col'} lg:flex-initial lg:block`}>
            <SegmentsSidebar
            segments={segments}
            playingSegmentId={playingSegmentId}
            selectedSegmentId={selectedRegionId}
            onPlaySegment={playSegmentById}
            onProcessSegment={processSegment}
            onDownloadSegment={downloadSegment}
            onDeleteSegment={removeSegment}
            onDownloadAll={downloadAllSegments}
            onDownloadZip={downloadAllAsZip}
            onProcessAll={processAllSegments}
            isProcessing={isAnyProcessing}
            hasCompleted={hasCompletedSegments}
            hasIdle={hasIdleSegments}
            lang={lang}
          />
          </div>
        )}
      </div>
    </div>
  );
}
