import React from 'react';
import {
  Smartphone,
  Tablet,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Play,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface PresetSilhouetteProps {
  width: number;
  height: number;
  category?: string;
  icon?: string;
  className?: string;
  backgroundColor?: string;
}

export const PresetSilhouette: React.FC<PresetSilhouetteProps> = ({
  width,
  height,
  category = 'custom',
  icon,
  className = '',
  backgroundColor
}) => {
  const safeW = Math.max(10, width);
  const safeH = Math.max(10, height);
  const ratio = safeW / safeH;

  const isLandscape = safeW > safeH;
  const isSquare = Math.abs(safeW - safeH) < 5;
  const isPortrait = safeH > safeW;

  // Visual Theme styles based on platform/category
  const getThemeStyles = () => {
    switch (category) {
      case 'google-play':
        return {
          wrapperBorder: 'group-hover:border-emerald-400/60',
          frameBg: 'bg-emerald-950/40',
          frameBorder: 'border-emerald-500/50',
          iconColor: 'text-emerald-400',
          glow: 'shadow-emerald-500/10'
        };
      case 'social':
        if (icon === 'Instagram' || safeH > safeW) {
          return {
            wrapperBorder: 'group-hover:border-pink-400/60',
            frameBg: 'bg-pink-950/30',
            frameBorder: 'border-pink-500/50',
            iconColor: 'text-pink-400',
            glow: 'shadow-pink-500/10'
          };
        }
        if (icon === 'Facebook') {
          return {
            wrapperBorder: 'group-hover:border-blue-400/60',
            frameBg: 'bg-blue-950/30',
            frameBorder: 'border-blue-500/50',
            iconColor: 'text-blue-400',
            glow: 'shadow-blue-500/10'
          };
        }
        return {
          wrapperBorder: 'group-hover:border-sky-400/60',
          frameBg: 'bg-sky-950/30',
          frameBorder: 'border-sky-500/50',
          iconColor: 'text-sky-400',
          glow: 'shadow-sky-500/10'
        };
      case 'video':
        return {
          wrapperBorder: 'group-hover:border-rose-400/60',
          frameBg: 'bg-rose-950/40',
          frameBorder: 'border-rose-500/50',
          iconColor: 'text-rose-400',
          glow: 'shadow-rose-500/10'
        };
      default:
        return {
          wrapperBorder: 'group-hover:border-sky-400/60',
          frameBg: 'bg-slate-900/60',
          frameBorder: 'border-sky-500/40',
          iconColor: 'text-sky-400',
          glow: 'shadow-sky-500/10'
        };
    }
  };

  const theme = getThemeStyles();

  // Render Platform specific inside icon or wireframe
  const renderInnerDecoration = () => {
    if (category === 'google-play' && icon === 'Play') {
      return (
        <div className="flex items-center justify-center gap-1 w-full px-1">
          <Play className={`w-3 h-3 fill-current ${theme.iconColor} shrink-0`} />
          <div className="hidden sm:flex flex-col gap-0.5 flex-1 max-w-[20px]">
            <div className="h-0.5 bg-emerald-400/40 rounded-full w-full" />
            <div className="h-0.5 bg-emerald-400/20 rounded-full w-2/3" />
          </div>
        </div>
      );
    }

    if (icon === 'Youtube' || category === 'video') {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-3 rounded-sm bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shadow-xs">
            <Play className="w-2 h-2 fill-current text-rose-400 ml-0.5" />
          </div>
        </div>
      );
    }

    if (icon === 'Instagram') {
      return <Instagram className={`w-3.5 h-3.5 ${theme.iconColor}`} />;
    }

    if (icon === 'Facebook') {
      return <Facebook className={`w-3.5 h-3.5 ${theme.iconColor}`} />;
    }

    if (icon === 'Twitter') {
      return <Twitter className={`w-3.5 h-3.5 ${theme.iconColor}`} />;
    }

    if (icon === 'Smartphone' || (isPortrait && ratio <= 0.6)) {
      return (
        <div className="flex flex-col items-center justify-between h-full py-0.5">
          <div className="w-2 h-0.5 bg-slate-400/40 rounded-full" />
          <Smartphone className={`w-3 h-3 ${theme.iconColor}`} />
          <div className="w-2.5 h-0.5 bg-slate-400/40 rounded-full" />
        </div>
      );
    }

    if (icon === 'Tablet' || (isPortrait && ratio > 0.6)) {
      return (
        <div className="flex flex-col items-center justify-between h-full py-0.5">
          <div className="w-1.5 h-0.5 bg-slate-400/40 rounded-full" />
          <Tablet className={`w-3.5 h-3.5 ${theme.iconColor}`} />
          <div className="w-2 h-0.5 bg-slate-400/40 rounded-full" />
        </div>
      );
    }

    if (isSquare) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-1">
          <div className="w-full h-full rounded-sm border border-dashed border-sky-400/40 flex items-center justify-center">
            <Sparkles className={`w-3 h-3 ${theme.iconColor}`} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center">
        <Maximize2 className={`w-3 h-3 ${theme.iconColor}`} />
      </div>
    );
  };

  // Percentage sizing to fit nicely inside the fixed outer container
  let widthPercent = '100%';
  let heightPercent = '100%';

  if (isLandscape) {
    widthPercent = '100%';
    heightPercent = `${Math.max(38, Math.min(100, Math.round((1 / ratio) * 100)))}%`;
  } else if (isPortrait) {
    heightPercent = '100%';
    widthPercent = `${Math.max(36, Math.min(100, Math.round(ratio * 100)))}%`;
  } else {
    // Square
    widthPercent = '92%';
    heightPercent = '92%';
  }

  return (
    <div
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#070D1E] border border-slate-800 p-1.5 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner transition-colors duration-200 ${theme.wrapperBorder} ${className}`}
    >
      {/* Subtle blueprint grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:6px_6px] opacity-50 pointer-events-none" />

      {/* Miniature Canvas Frame matching actual Aspect Ratio */}
      <div
        className={`relative rounded-md border flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-sm overflow-hidden ${theme.frameBg} ${theme.frameBorder} ${theme.glow}`}
        style={{
          aspectRatio: `${safeW} / ${safeH}`,
          maxWidth: '100%',
          maxHeight: '100%',
          width: widthPercent,
          height: heightPercent,
          backgroundColor: backgroundColor || undefined
        }}
      >
        {/* Subtle grid corner markings */}
        <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-white/30" />
        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-white/30" />

        {renderInnerDecoration()}
      </div>
    </div>
  );
};
