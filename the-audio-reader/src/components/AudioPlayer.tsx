import React, { useState } from 'react';
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
  BookOpen
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
}) => {
  const t = getTranslation(uiLang);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

          </div>

        </div>

      </div>
    </div>
  );
};
