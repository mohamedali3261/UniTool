import React from 'react';
import { SidebarTabType } from '../../../types';
import {
  Type,
  Shapes,
  SmilePlus,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Sliders
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface SidebarTabsProps {
  activeTab: SidebarTabType | null;
  onSelectTab: (tab: SidebarTabType) => void;
  variant?: 'rail' | 'bottom-bar';
  hasSelection?: boolean;
  onToggleProperties?: () => void;
  isPropertiesOpen?: boolean;
}

interface TabItem {
  id: SidebarTabType;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  activeTab,
  onSelectTab,
  variant = 'rail',
  hasSelection,
  onToggleProperties,
  isPropertiesOpen
}) => {
  const { t } = useDcLang();

  const TABS: TabItem[] = [
    { id: 'text', label: t.tabText, labelEn: 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'elements', label: t.tabElements, labelEn: 'Elements', icon: <Shapes className="w-4 h-4" /> },
    { id: 'ornaments', label: t.tabOrnaments, labelEn: 'Ornaments', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { id: 'icons', label: t.tabIcons, labelEn: 'Icons', icon: <SmilePlus className="w-4 h-4" /> },
    { id: 'images', label: t.tabImages, labelEn: 'Photo Library', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'layers', label: t.tabLayers, labelEn: 'Layers', icon: <Layers className="w-4 h-4" /> }
  ];
  // Mobile Bottom Bar Navigation
  if (variant === 'bottom-bar') {
    return (
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 inset-x-0 h-14 bg-[#0B132B]/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around z-30 px-1 select-none md:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.5)]"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] ${
                isActive
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg transition ${isActive ? 'bg-sky-500/20 scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[9px] tracking-tight truncate max-w-[44px]">{tab.label}</span>
            </button>
          );
        })}

        {/* Quick Properties Button on Mobile when element is selected */}
        {onToggleProperties && (
          <button
            type="button"
            onClick={onToggleProperties}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] ${
              isPropertiesOpen
                ? 'text-amber-400 font-bold'
                : hasSelection
                ? 'text-amber-300 animate-pulse'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg transition ${isPropertiesOpen ? 'bg-amber-500/20 scale-110' : ''}`}>
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight truncate max-w-[44px]">{t.tabProperties}</span>
          </button>
        )}
      </nav>
    );
  }

  // Desktop Vertical Rail
  return (
    <aside
      id="sidebar-nav-tabs"
      className="w-14 bg-[#0B132B] border-l border-slate-800 hidden md:flex flex-col items-center py-2 space-y-1 shrink-0 z-20 select-none"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            title={`${tab.label} (${tab.labelEn})`}
            className={`w-11 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              isActive
                ? 'bg-[#1C2541] text-sky-400 font-bold shadow-sm border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#1C2541]/40'
            }`}
          >
            <div className={isActive ? 'text-sky-400 scale-105 transition' : ''}>{tab.icon}</div>
            <span className="text-[9px] tracking-tight truncate max-w-[40px]">{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
