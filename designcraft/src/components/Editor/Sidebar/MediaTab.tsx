import React, { useState } from 'react';
import { useDcLang } from '../../../hooks/useDcLang';
import { Image as ImageIcon, SmilePlus, Sparkles } from 'lucide-react';

export type MediaSubTab = 'images' | 'icons' | 'ornaments';

interface MediaTabProps {
  imagesContent: React.ReactNode;
  iconsContent: React.ReactNode;
  ornamentsContent: React.ReactNode;
}

/**
 * Merged "Media" section: photo library, icons and ornamental calligraphy
 * live behind one segmented control instead of three separate rail tabs.
 */
export const MediaTab: React.FC<MediaTabProps> = ({
  imagesContent,
  iconsContent,
  ornamentsContent
}) => {
  const { t } = useDcLang();
  const [sub, setSub] = useState<MediaSubTab>('images');

  const SUBTABS: { id: MediaSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'images', label: t.mediaImages, icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'icons', label: t.mediaIcons, icon: <SmilePlus className="w-3.5 h-3.5" /> },
    { id: 'ornaments', label: t.mediaOrnaments, icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> }
  ];

  return (
    <div className="flex flex-col h-full space-y-3 overflow-hidden">
      {/* Segmented control */}
      <div className="grid grid-cols-3 p-1 bg-[#0B132B] rounded-xl border border-slate-800 text-xs shrink-0">
        {SUBTABS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSub(s.id)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg font-bold transition ${
              sub === s.id
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.icon}
            <span className="text-[10px]">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        {sub === 'images' && imagesContent}
        {sub === 'icons' && iconsContent}
        {sub === 'ornaments' && ornamentsContent}
      </div>
    </div>
  );
};
