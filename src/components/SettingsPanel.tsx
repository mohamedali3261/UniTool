import { Settings2, Zap, ShieldCheck, Info, Waves, Music, Activity, Volume2, AudioWaveform, Mic, Zap as Lightning, Gauge, Wind } from 'lucide-react';
import { CompressionSettings } from '../types';
import { cn } from '../lib/utils';

interface SettingsPanelProps {
  settings: CompressionSettings;
  onChange: (settings: CompressionSettings) => void;
  isProcessing: boolean;
  t: any;
}

export function SettingsPanel({ settings, onChange, isProcessing, t }: SettingsPanelProps) {
  const qualities = [
    { id: 'high', label: t.highQuality, description: t.highDesc, bitrate: '128k', icon: ShieldCheck },
    { id: 'medium', label: t.mediumQuality, description: t.mediumDesc, bitrate: '64k', icon: Zap },
    { id: 'low', label: t.lowQuality, description: t.lowDesc, bitrate: '32k', icon: Info },
  ];

  const formats = ['mp3', 'aac', 'opus'];

  return (
    <div className="flex flex-col h-full bg-[#14171C]">
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest sm:text-[10px]">{t.compressionParams}</span>
      </div>
      
      <div className="p-4 flex-1 space-y-6 overflow-y-auto scrollbar-hide sm:p-5">
        {/* Algorithm Select */}
        <div className="space-y-3">
          <label className="text-[9px] text-gray-500 uppercase block mb-1 font-mono sm:text-[10px]">{t.precisionEngine}</label>
          <div className="grid gap-2">
            {qualities.map((q) => (
              <button
                key={q.id}
                disabled={isProcessing}
                onClick={() => onChange({ ...settings, quality: q.id as any, bitrate: q.bitrate })}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-sm transition-all border group sm:p-3",
                  settings.quality === q.id 
                    ? "bg-[#1E2229] border-blue-500/50 ring-1 ring-blue-500/20" 
                    : "bg-[#0F1115] border-[#2D3139] hover:bg-[#1A1D23] grayscale opacity-70 hover:opacity-100 hover:grayscale-0"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-sm flex items-center justify-center shrink-0 transition-colors sm:w-8 sm:h-8",
                  settings.quality === q.id ? "bg-blue-600 text-white" : "bg-[#2D3139] text-gray-500"
                )}>
                  <q.icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-bold text-[9px] tracking-wider mb-0.5 sm:text-[10px]",
                    settings.quality === q.id ? "text-white" : "text-gray-400 font-mono"
                  )}>{q.label}</div>
                  <p className="text-[8px] text-gray-500 truncate font-mono uppercase">{q.description}</p>
                </div>
                <div className="text-[8px] font-mono text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {q.bitrate}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Format Select */}
        <div className="space-y-3">
          <label className="text-[9px] text-gray-500 uppercase block font-mono sm:text-[10px]">{t.outputContainer}</label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map((format) => (
              <button
                key={format}
                disabled={isProcessing}
                onClick={() => onChange({ ...settings, format: format as any })}
                className={cn(
                  "py-2 rounded-sm border font-mono text-[9px] uppercase transition-all sm:py-2.5 sm:text-[10px]",
                  settings.format === format
                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                    : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-600 hover:text-gray-400"
                )}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

