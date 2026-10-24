import React from 'react';
import { LayoutDashboard, Plus, X } from 'lucide-react';
import { useDcLang } from '../../hooks/useDcLang';

export interface DesignTabItem {
  id: string;
  title: string;
  width: number;
  height: number;
}

interface DesignTabsProps {
  tabs: DesignTabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onBackToDashboard: () => void;
}

/**
 * Browser-like strip for open designs. Lives between the top bar and the
 * workspace so every design keeps its own tab while editing.
 */
export const DesignTabs: React.FC<DesignTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onBackToDashboard
}) => {
  const { t } = useDcLang();

  return (
    <div
      id="editor-design-tabs"
      className="flex items-center gap-1.5 bg-[#0B132B] border-b border-slate-800 px-2 py-1.5 shrink-0 overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label={t.tabsLabel}
    >
      <button
        type="button"
        onClick={onBackToDashboard}
        title={t.backHome}
        aria-label={t.backHome}
        className="p-2 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-[#16223F] transition shrink-0"
      >
        <LayoutDashboard className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-700/70 shrink-0" />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`group flex items-center gap-1 ps-3 pe-1 py-1 rounded-lg border text-xs shrink-0 max-w-[220px] transition ${
              isActive
                ? 'bg-[#1C2541] border-sky-500/60 text-white shadow-md shadow-sky-950/40'
                : 'bg-[#0F1730] border-slate-700/60 text-slate-400 hover:bg-[#16223F] hover:text-slate-200'
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              title={`${tab.title} · ${tab.width} × ${tab.height}`}
              className="flex items-center gap-1.5 min-w-0 py-0.5"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isActive ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'bg-slate-600'
                }`}
              />
              <span className="truncate font-semibold max-w-[110px] sm:max-w-[150px]">{tab.title}</span>
              <span dir="ltr" className="hidden lg:inline text-[9px] font-mono text-slate-500 shrink-0">
                {tab.width}×{tab.height}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onCloseTab(tab.id)}
              title={t.closeTab}
              aria-label={`${t.closeTab} ${tab.title}`}
              className={`p-1 rounded-md transition shrink-0 ${
                isActive
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                  : 'text-slate-500 hover:text-rose-300 hover:bg-slate-800 opacity-60 group-hover:opacity-100'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNewTab}
        title={t.newTab}
        aria-label={t.newTab}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/60 hover:bg-[#16223F] text-[11px] font-semibold transition shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t.newTab}</span>
      </button>
    </div>
  );
};
