import { DesignerThemeToggle } from '../Common/DesignerThemeToggle';
import { SiteNavbar } from '../../../../src/components/SiteNavbar';
import { FileMenu } from './FileMenu';
import type { DesignTabItem } from './DesignTabs';
import React, { useState } from 'react';
import {
  ArrowRight,
  Undo2,
  Redo2,
  Eye,
  Save,
  Check,
  Edit2,
  Grid,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Plus,
  X,
  Box,
  Ruler,
  Printer,
} from 'lucide-react';
import { setDcLang, useDcLang } from '../../hooks/useDcLang';
import type { CartonSize } from '../../packaging/geometry';

interface TopBarProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  onBackToDashboard: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onSave: () => void;
  onQuickDownload?: () => void;
  onOpenShortcuts: () => void;
  isSaving?: boolean;
  width: number;
  height: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isPropertiesOpen?: boolean;
  onToggleProperties?: () => void;
  isPanMode?: boolean;
  onTogglePanMode?: () => void;
  tabs?: DesignTabItem[];
  activeTabId?: string;
  onSwitchTab?: (tabId: string) => void;
  onCloseTab?: (tabId: string) => void;
  onNewTab?: () => void;
  packagingSize?: CartonSize | null;
  onOpenResizeCarton?: () => void;
  onOpenCarton3D?: () => void;
  onOpenPrintExport?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onUpdateTitle,
  onBackToDashboard,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  onToggleGrid,
  onOpenPreview,
  onOpenExport,
  onSave,
  onQuickDownload,
  isSaving,
  width,
  height,
  isSidebarOpen,
  onToggleSidebar,
  isPropertiesOpen,
  onToggleProperties,
  tabs = [],
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  packagingSize,
  onOpenResizeCarton,
  onOpenCarton3D,
  onOpenPrintExport,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const { lang, t } = useDcLang();
  const isAr = lang === 'ar';
  const roundedW = Math.round(width);
  const roundedH = Math.round(height);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <>
      <SiteNavbar
        actions={<DesignerThemeToggle />}
        lang={lang}
        onToggleLang={() => setDcLang(lang === 'ar' ? 'en' : 'ar')}
      />
      <nav
        id="editor-top-bar"
        dir="ltr"
        className="dc-unified-topbar"
      >
        <div className="dc-unified-topbar__main">
          {/* Group 1: Navigation, Project Title & Inline Tabs */}
          <div className="dc-unified-topbar__group">
            <div className="dc-unified-pill">
              <button
                type="button"
                onClick={onBackToDashboard}
                className="dc-unified-icon-btn"
                title={t.backHome}
                aria-label={t.backHome}
              >
                <ArrowRight style={{ width: 14, height: 14 }} />
                <span className="hidden 2xl:inline">{t.home}</span>
              </button>

              {onToggleSidebar && (
                <>
                  <span className="dc-unified-sep" />
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="dc-unified-icon-btn"
                    title={isSidebarOpen ? t.closeSidebar : t.openSidebar}
                    aria-label={isSidebarOpen ? t.closeSidebar : t.openSidebar}
                  >
                    {isSidebarOpen ? (
                      <PanelLeftClose style={{ width: 14, height: 14 }} />
                    ) : (
                      <PanelLeftOpen style={{ width: 14, height: 14 }} />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Editable Project Title */}
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="dc-unified-title-form">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  autoFocus
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setTempTitle(title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="dc-unified-title-input"
                />
                <button type="submit" className="dc-unified-title-save" aria-label={t.save}>
                  <Check style={{ width: 12, height: 12 }} />
                </button>
              </form>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTempTitle(title);
                    setIsEditingTitle(true);
                  }
                }}
                title={`${title} (${roundedW} × ${roundedH} px)`}
                className="dc-unified-title-chip hidden md:inline-flex"
              >
                <span className="dc-unified-title-chip__text">{title}</span>
                <Edit2 style={{ width: 10, height: 10, opacity: 0.65, flexShrink: 0 }} />
                <span className="dc-unified-title-chip__dim hidden 2xl:inline" dir="ltr">
                  {roundedW}×{roundedH}
                </span>
              </div>
            )}

            {/* Inline Multi-Design Tabs + Compact New Tab Button */}
            {tabs.length > 1 && onSwitchTab && onCloseTab && (
              <div className="dc-inline-tabs hidden lg:flex" role="tablist" aria-label={t.tabsLabel}>
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  return (
                    <div
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onSwitchTab(tab.id)}
                      className={`dc-inline-tab ${isActive ? 'is-active' : ''}`}
                      title={tab.title}
                    >
                      <span className="dc-inline-tab__label">{tab.title}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseTab(tab.id);
                        }}
                        className="dc-inline-tab__close"
                        title={t.closeTab}
                        aria-label={`${t.closeTab} ${tab.title}`}
                      >
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {onNewTab && (
              <button
                type="button"
                onClick={onNewTab}
                className="dc-unified-icon-btn dc-new-tab-btn hidden sm:inline-flex"
                title={t.newTab}
                aria-label={t.newTab}
              >
                <Plus style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>

          {/* Group 2: Inline Carton & 3D Studio Bar (merged into unified navbar!) */}
          {packagingSize && (
            <div className="carton-editor-bar" dir={isAr ? 'rtl' : 'ltr'}>
              <span className="carton-editor-bar__dims" dir="ltr">
                {packagingSize.height} × {packagingSize.width} × {packagingSize.depth} mm
              </span>
              {onOpenResizeCarton && (
                <button type="button" onClick={onOpenResizeCarton}>
                  <Ruler style={{ width: 11, height: 11 }} />
                  {isAr ? 'تعديل المقاسات' : 'Edit dimensions'}
                </button>
              )}
              {onOpenCarton3D && (
                <button
                  type="button"
                  className="carton-editor-bar__3d"
                  onClick={onOpenCarton3D}
                  aria-label={isAr ? 'معاينة ثلاثية الأبعاد 360°' : '3D preview · 360°'}
                >
                  <Box style={{ width: 11, height: 11 }} />
                  {isAr ? 'معاينة 3D' : '3D'}
                </button>
              )}
              {onOpenPrintExport && (
                <button type="button" onClick={onOpenPrintExport}>
                  <Printer style={{ width: 11, height: 11 }} />
                  {isAr ? 'تصدير للطباعة' : 'Print export'}
                </button>
              )}
            </div>
          )}

          {/* Group 3: History, Grid, Inspector, Preview, Save & Export */}
          <div className="dc-unified-topbar__actions">
            <div className="dc-unified-pill hidden sm:inline-flex">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title={t.undo}
                aria-label={t.undo}
                className="dc-unified-icon-btn"
              >
                <Undo2 style={{ width: 13, height: 13 }} />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title={t.redo}
                aria-label={t.redo}
                className="dc-unified-icon-btn"
              >
                <Redo2 style={{ width: 13, height: 13 }} />
              </button>
              <span className="dc-unified-sep hidden lg:inline-block" />
              <button
                type="button"
                onClick={onToggleGrid}
                title={t.toggleGrid}
                aria-label={t.toggleGrid}
                className={`dc-unified-icon-btn hidden lg:inline-flex ${showGrid ? 'is-active' : ''}`}
              >
                <Grid style={{ width: 13, height: 13 }} />
              </button>
            </div>

            {onToggleProperties && (
              <button
                type="button"
                onClick={onToggleProperties}
                title={isPropertiesOpen ? t.hideProps : t.showProps}
                aria-label={isPropertiesOpen ? t.hideProps : t.showProps}
                className={`dc-unified-btn ${isPropertiesOpen ? 'is-active' : ''}`}
              >
                <SlidersHorizontal style={{ width: 13, height: 13 }} />
                <span className="hidden xl:inline">{isAr ? 'الخصائص' : 'Properties'}</span>
              </button>
            )}

            <button
              type="button"
              data-studio-button="secondary"
              onClick={onOpenPreview}
              title={t.previewDesign}
              aria-label={t.preview}
              className="dc-unified-btn"
            >
              <Eye style={{ width: 13, height: 13 }} />
              <span className="hidden lg:inline">{t.preview}</span>
            </button>

            <button
              type="button"
              data-studio-button="primary"
              onClick={onSave}
              disabled={isSaving}
              title={t.saveProject}
              aria-label={t.save}
              className="dc-unified-btn"
            >
              {isSaving ? (
                <Check style={{ width: 13, height: 13, color: '#34d399' }} />
              ) : (
                <Save style={{ width: 13, height: 13 }} />
              )}
              <span className="hidden lg:inline">{isSaving ? '...' : t.save}</span>
            </button>

            <FileMenu onExport={onOpenExport} onQuickDownload={onQuickDownload} />
          </div>
        </div>
      </nav>
    </>
  );
};
