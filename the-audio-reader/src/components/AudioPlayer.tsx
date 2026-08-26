import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Gauge, 
  Sliders, 
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  BookOpen,
  Clock,
  CloudRain,
  Wind,
  Trees,
  Coffee,
  Music,
  Volume1
} from 'lucide-react';
import { PlaybackState, ReaderSettings, UILanguage } from '../types';
import { getTranslation } from '../translations';
import { calculateEstimatedTime } from '../utils/textProcessor';
import { getThemeConfig } from '../utils/theme';

interface AudioPlayerProps {
  uiLang: UILanguage;
  playbackState: PlaybackState;
  settings: ReaderSettings;
  activeChunkText: string;
  totalWordsRemaining: number;
  activeVoiceName?: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNextChunk: () => void;
  onPrevChunk: () => void;
  onSeekChunk: (chunkIndex: number) => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (volume: number) => void;
  onOpenVoiceModal: () => void;
  onOpenSettingsModal: () => void;
  sleepTimerLeft: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  uiLang,
  playbackState,
  settings,
  activeChunkText,
  totalWordsRemaining,
  activeVoiceName,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNextChunk,
  onPrevChunk,
  onSeekChunk,
  onSpeedChange,
  onPitchChange,
  onVolumeChange,
  onOpenVoiceModal,
  onOpenSettingsModal,
  sleepTimerLeft,
  onSetSleepTimer,
}) => {
  const t = getTranslation(uiLang);

  // Ambient Sound Preset configuration
  const AMBIENT_PRESETS = [
    { id: 'rain', labelAr: 'مطر هادئ', labelEn: 'Gentle Rain', url: 'https://raw.githubusercontent.com/jsgrrchg/MoodistMac/refs/heads/main/Moodist/sounds/rain/light-rain.mp3', icon: CloudRain, color: 'text-blue-400 bg-blue-500/10' },
    { id: 'wind', labelAr: 'رياح طبيعية', labelEn: 'Quiet Wind', url: 'https://raw.githubusercontent.com/jsgrrchg/MoodistMac/refs/heads/main/Moodist/sounds/nature/wind.mp3', icon: Wind, color: 'text-teal-400 bg-teal-500/10' },
    { id: 'forest', labelAr: 'أصوات الغابة', labelEn: 'Forest Birds', url: 'https://raw.githubusercontent.com/jsgrrchg/MoodistMac/refs/heads/main/Moodist/sounds/animals/birds.mp3', icon: Trees, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'cafe', labelAr: 'مقهى هادئ', labelEn: 'Quiet Cafe', url: 'https://raw.githubusercontent.com/jsgrrchg/MoodistMac/refs/heads/main/Moodist/sounds/places/cafe.mp3', icon: Coffee, color: 'text-amber-400 bg-amber-500/10' },
  ];

  const [activeAmbientId, setActiveAmbientId] = useState<string | null>(null);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.3); // Default 30% volume
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync ambient volume
  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  // Handle ambient loop playback
  const handleToggleAmbient = (id: string, url: string) => {
    if (activeAmbientId === id) {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      setActiveAmbientId(null);
    } else {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = ambientVolume;
      audio.play().catch((err) => console.log('Ambient play error:', err));
      
      ambientAudioRef.current = audio;
      setActiveAmbientId(id);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, []);

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Format sleep timer seconds left to MM:SS
  const formatSleepTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isPlaying = playbackState.status === 'playing';
  const isPaused = playbackState.status === 'paused';
  const hasStarted = isPlaying || isPaused;

  const timeRemaining = calculateEstimatedTime(totalWordsRemaining, settings.speechRate);
  const progressPercent = playbackState.totalChunksInBook > 0
    ? Math.min(100, Math.round(((playbackState.globalChunkIndex + 1) / playbackState.totalChunksInBook) * 100))
    : 0;

  const handlePlayPauseToggle = () => {
    if (isPlaying) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onPlay();
    }
  };

  const themeConfig = getThemeConfig(settings.theme);

  return (
    <div 
      className={`fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-2xl px-3 py-2 sm:px-6 sm:py-3 shadow-2xl transition-all duration-300 ${themeConfig.player}`}
      id="bottom-audio-player"
    >
      <div className="mx-auto max-w-7xl">
        
        {/* Progress Bar / Scrubber */}
        <div className="mb-2 flex items-center gap-3">
          <span className="text-[10px] sm:text-xs font-medium text-slate-400 tabular-nums">
            {playbackState.globalChunkIndex + 1} / {Math.max(1, playbackState.totalChunksInBook)}
          </span>

          <div className="group relative flex-1 cursor-pointer py-1">
            <div className="h-1.5 w-full rounded-full bg-slate-800 group-hover:h-2 transition-all">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 relative transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, playbackState.totalChunksInBook - 1)}
              value={playbackState.globalChunkIndex}
              onChange={(e) => onSeekChunk(parseInt(e.target.value, 10))}
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
              title="Seek progress"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400">
            <span className="tabular-nums font-semibold text-indigo-400">{progressPercent}%</span>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Active Sentence Preview & Soundwave */}
          <div className="flex items-center gap-3 min-w-0 max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md">
            {/* Visualizer bars */}
            <div className="flex items-center gap-0.5 h-6 w-5 shrink-0 px-0.5">
              {isPlaying ? (
                <>
                  <div className="w-1 bg-indigo-400 rounded-full soundwave-bar-1" />
                  <div className="w-1 bg-indigo-500 rounded-full soundwave-bar-2" />
                  <div className="w-1 bg-purple-400 rounded-full soundwave-bar-3" />
                  <div className="w-1 bg-purple-500 rounded-full soundwave-bar-4" />
                </>
              ) : (
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1.5 bg-slate-600 rounded-full" />
                  <div className="w-1 h-3 bg-slate-600 rounded-full" />
                  <div className="w-1 h-2 bg-slate-600 rounded-full" />
                  <div className="w-1 h-1.5 bg-slate-600 rounded-full" />
                </div>
              )}
            </div>

            {/* Currently spoken snippet */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-200 font-medium truncate font-cairo" title={activeChunkText}>
                {activeChunkText || (isPlaying ? 'جاري القراءة...' : t.play)}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={onOpenVoiceModal}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 truncate transition"
                  title={t.voiceSelect}
                  id="active-voice-btn"
                >
                  <Sparkles className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                  <span className="truncate">{activeVoiceName || t.activeVoice}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center: Main Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-3">
            
            {/* Skip Previous Chunk */}
            <button
              onClick={onPrevChunk}
              className="rounded-full p-2 text-slate-300 hover:bg-slate-850 hover:text-white active:scale-95 transition focus-ring"
              title={t.previousChunk}
              id="prev-chunk-btn"
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Big Play / Pause Action Button */}
            <button
              onClick={handlePlayPauseToggle}
              className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all focus-ring"
              title={isPlaying ? t.pause : hasStarted ? t.resume : t.play}
              id="main-play-pause-btn"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
              ) : (
                <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Skip Next Chunk */}
            <button
              onClick={onNextChunk}
              className="rounded-full p-2 text-slate-300 hover:bg-slate-850 hover:text-white active:scale-95 transition focus-ring"
              title={t.nextChunk}
              id="next-chunk-btn"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Stop Button */}
            {hasStarted && (
              <button
                onClick={onStop}
                className="hidden sm:inline-flex rounded-full p-2 text-slate-400 hover:bg-slate-850 hover:text-red-400 active:scale-95 transition focus-ring"
                title={t.stop}
                id="stop-playback-btn"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Speed, Volume & Modals */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Speed Control Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition focus-ring"
                title={t.speed}
                id="speed-menu-btn"
              >
                <Gauge className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-mono">{settings.speechRate.toFixed(1)}x</span>
              </button>

              {showSpeedMenu && (
                <div 
                  className="absolute bottom-full mb-2 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl z-50 space-y-3"
                  id="speed-picker-dropdown"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Gauge className="h-4 w-4 text-indigo-400" />
                      <span>{uiLang === 'ar' ? 'مؤشر سرعة القراءة' : 'Speech Speed Gauge'}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {settings.speechRate.toFixed(2)}x
                    </span>
                  </div>

                  {/* Range Slider / Gauge Indicator */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0.5}
                      max={3.0}
                      step={0.05}
                      value={settings.speechRate}
                      onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg transition-all"
                      title={uiLang === 'ar' ? 'مؤشر التحكم في السرعة' : 'Speed Slider'}
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>0.5x</span>
                      <span>1.0x</span>
                      <span>2.0x</span>
                      <span>3.0x</span>
                    </div>
                  </div>

                  {/* Preset Speed Buttons */}
                  <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800">
                    {[0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => onSpeedChange(speed)}
                        className={`rounded-lg py-1 text-[11px] font-mono font-medium transition ${
                          Math.abs(settings.speechRate - speed) < 0.02
                            ? 'bg-indigo-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Volume Control Popover */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowVolumeMenu(!showVolumeMenu)}
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition focus-ring"
                title={t.volume}
                id="volume-menu-btn"
              >
                {settings.volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-red-400" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              {showVolumeMenu && (
                <div className="absolute bottom-full mb-2 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto w-36 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>{t.volume}</span>
                      <span>{Math.round(settings.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>{t.pitch}</span>
                      <span>{settings.pitch}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={settings.pitch}
                      onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Settings Dialog Trigger */}
            <button
              onClick={onOpenSettingsModal}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition focus-ring"
              title={t.settingsTitle}
              id="audio-settings-quick-btn"
            >
              <Sliders className="h-4 w-4" />
            </button>

            {/* Ambient Nature Soundscapes Popover */}
            <div className="relative">
              <button
                onClick={() => setShowAmbientMenu(!showAmbientMenu)}
                className={`rounded-lg p-2 transition focus-ring flex items-center gap-1 ${
                  activeAmbientId !== null
                    ? 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={uiLang === 'ar' ? 'خلفيات القراءة الطبيعية (صوت المطر، الغابة...)' : 'Ambient Background Sounds (Rain, Forest...)'}
                id="ambient-soundscape-btn"
              >
                <CloudRain className={`h-4 w-4 ${activeAmbientId ? 'animate-bounce' : ''}`} />
                {activeAmbientId !== null && (
                  <span className="text-[10px] font-bold bg-teal-500/20 px-1 rounded border border-teal-500/30">
                    {uiLang === 'ar' ? 'نشط' : 'ON'}
                  </span>
                )}
              </button>

              {showAmbientMenu && (
                <div
                  className="absolute bottom-full mb-2 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl z-50 space-y-3.5"
                  id="ambient-soundscape-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-200">
                      <CloudRain className="h-4 w-4 text-teal-400 animate-pulse" />
                      <span>{uiLang === 'ar' ? 'أصوات الطبيعة المساعدة للتركيز' : 'Zen Ambient Soundscapes'}</span>
                    </div>
                    {activeAmbientId !== null && (
                      <button
                        onClick={() => {
                          if (ambientAudioRef.current) ambientAudioRef.current.pause();
                          setActiveAmbientId(null);
                        }}
                        className="text-[10px] font-bold text-red-400 hover:underline"
                      >
                        {uiLang === 'ar' ? 'إيقاف الكل' : 'Stop All'}
                      </button>
                    )}
                  </div>

                  {/* Volume Slider for Ambient Noise */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Volume1 className="w-3.5 h-3.5" />
                        {uiLang === 'ar' ? 'حجم صوت الخلفية' : 'Background Volume'}
                      </span>
                      <span className="font-mono">{Math.round(ambientVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      title={uiLang === 'ar' ? 'مؤشر حجم الخلفية' : 'Ambient Volume Slider'}
                    />
                  </div>

                  {/* Selection Buttons Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    {AMBIENT_PRESETS.map((preset) => {
                      const PresetIcon = preset.icon;
                      const isActive = activeAmbientId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleToggleAmbient(preset.id, preset.url)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 gap-1.5 relative ${
                            isActive
                              ? 'border-teal-500 bg-teal-500/10 text-white font-bold shadow-lg shadow-teal-500/5'
                              : 'border-slate-800/80 bg-slate-950/20 hover:border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <PresetIcon className={`w-5 h-5 ${isActive ? 'text-teal-400 animate-pulse' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-semibold">
                            {uiLang === 'ar' ? preset.labelAr : preset.labelEn}
                          </span>
                          
                          {/* Playing Dot */}
                          {isActive && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sleep Timer Popover */}
            <div className="relative">
              <button
                onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)}
                className={`rounded-lg p-2 transition focus-ring flex items-center gap-1 ${
                  sleepTimerLeft !== null
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={uiLang === 'ar' ? 'مؤقت النوم الإيقاف التلقائي' : 'Sleep Timer Auto-Stop'}
                id="sleep-timer-btn"
              >
                <Clock className="h-4 w-4" />
                {sleepTimerLeft !== null && (
                  <span className="text-[10px] font-mono tabular-nums bg-amber-500/20 px-1 rounded border border-amber-500/30">
                    {formatSleepTime(sleepTimerLeft)}
                  </span>
                )}
              </button>

              {showSleepTimerMenu && (
                <div
                  className="absolute bottom-full mb-2 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl z-50 space-y-3"
                  id="sleep-timer-dropdown"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                      <span>{uiLang === 'ar' ? 'مؤقت النوم' : 'Sleep Timer'}</span>
                    </div>
                    {sleepTimerLeft !== null && (
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {formatSleepTime(sleepTimerLeft)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium">
                    {uiLang === 'ar'
                      ? 'سيتم إيقاف القراءة تلقائياً بعد مرور الوقت المحدد:'
                      : 'Audio playback will automatically pause after the specified time:'}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[5, 15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          onSetSleepTimer(mins);
                          setShowSleepTimerMenu(false);
                        }}
                        className="rounded-lg py-1.5 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80 transition"
                      >
                        {mins} {uiLang === 'ar' ? 'دقيقة' : 'mins'}
                      </button>
                    ))}
                  </div>

                  {sleepTimerLeft !== null && (
                    <button
                      onClick={() => {
                        onSetSleepTimer(null);
                        setShowSleepTimerMenu(false);
                      }}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition"
                    >
                      {uiLang === 'ar' ? 'إلغاء مؤقت النوم' : 'Cancel Sleep Timer'}
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
