import React, { useState } from 'react';
import {
  ArrowRight,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Download,
  Save,
  Check,
  Edit2,
  Grid,
  Keyboard,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Hand,
  Globe
} from 'lucide-react';
import { getDcTranslation, DCLang } from '../../translations';

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
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onUpdateTitle,
  onBackToDashboard,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid,
  onToggleGrid,
  onOpenPreview,
  onOpenExport,
  onSave,
  onOpenShortcuts,
  isSaving,
  width,
  height,
  isSidebarOpen,
  onToggleSidebar,
  isPropertiesOpen,
  onToggleProperties,
  isPanMode,
  onTogglePanMode
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [lang] = useState<DCLang>(() => {
    const shared = localStorage.getItem('unitool-lang');
    return shared === 'en' ? 'en' : 'ar';
  });
  const t = getDcTranslation(lang);
  const dir = 'ltr';

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <nav
      id="editor-top-bar"
      dir={dir}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(7,8,11,.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid #1e2028', userSelect: 'none',
      }}
    >
      {/* Left Section: Logo + Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <a href="/index.html" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', margin: 0, padding: 0, lineHeight: 0 }}>
          <img src="/UniTool_logo.png" alt="UniTool" style={{ width: 128, height: 'auto', objectFit: 'contain', margin: 0, padding: 0, border: 0, outline: 'none', display: 'block' }} />
        </a>

        <div style={{ width: 1, height: 16, background: '#1e2028' }} />

        <button
          type="button"
          onClick={onBackToDashboard}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: 6,
            background: 'none', border: 'none', color: '#7c7f8a',
            cursor: 'pointer', transition: 'color .2s', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e4e6eb'}
          onMouseLeave={e => e.currentTarget.style.color = '#7c7f8a'}
          title={t.backHome}

        >
          <ArrowRight style={{ width: 16, height: 16 }} />
          <span className="hidden md:inline">{t.home}</span>
        </button>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? t.closeSidebar : t.openSidebar}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 6, borderRadius: 8, background: 'none', border: 'none',
              color: '#7c7f8a', cursor: 'pointer', transition: 'color .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#e4e6eb'}
            onMouseLeave={e => e.currentTarget.style.color = '#7c7f8a'}
          >
            {isSidebarOpen ? <PanelLeftClose style={{ width: 16, height: 16 }} /> : <PanelLeftOpen style={{ width: 16, height: 16 }} />}
          </button>
        )}

        <div style={{ width: 1, height: 16, background: '#1e2028' }} />

        {/* Project Title */}
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              autoFocus
              onBlur={handleTitleSubmit}
              style={{
                background: '#0d0f14', border: '1px solid #6366f1', borderRadius: 6,
                padding: '2px 8px', fontSize: 12, color: '#e4e6eb', outline: 'none',
                width: 120, fontWeight: 500,
              }}
            />
            <button
              type="submit"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 4, background: '#4f46e5', color: '#fff', borderRadius: 6,
                border: 'none', cursor: 'pointer',
              }}
            >
              <Check style={{ width: 12, height: 12 }} />
            </button>
          </form>
        ) : (
          <div
            onClick={() => { setTempTitle(title); setIsEditingTitle(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              padding: '2px 6px', borderRadius: 6, transition: 'background .2s',
              maxWidth: 180,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e4e6eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <Edit2 style={{ width: 10, height: 10, color: '#7c7f8a', flexShrink: 0 }} className="hidden sm:inline" />
            <span className="hidden lg:inline" style={{ fontSize: 9, fontFamily: 'monospace', padding: '1px 4px', borderRadius: 4, background: '#0d0f14', color: '#818cf8', flexShrink: 0 }}>
              {width}×{height}
            </span>
          </div>
        )}
      </div>

      {/* Center Section: Canvas Tools (Undo/Redo, Zoom, Pan, Grid) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#0d0f14', padding: 2, borderRadius: 8, border: '1px solid #1e2028' }}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={t.undo}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 4, background: 'none', border: 'none',
              color: '#7c7f8a', cursor: 'pointer', transition: 'all .2s', opacity: canUndo ? 1 : 0.25,
            }}
            onMouseEnter={e => { if (canUndo) { e.currentTarget.style.color = '#e4e6eb'; e.currentTarget.style.background = 'rgba(255,255,255,.05)'; } }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7c7f8a'; e.currentTarget.style.background = 'none'; }}
          >
            <Undo2 style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={t.redo}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 4, background: 'none', border: 'none',
              color: '#7c7f8a', cursor: 'pointer', transition: 'all .2s', opacity: canRedo ? 1 : 0.25,
            }}
            onMouseEnter={e => { if (canRedo) { e.currentTarget.style.color = '#e4e6eb'; e.currentTarget.style.background = 'rgba(255,255,255,.05)'; } }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7c7f8a'; e.currentTarget.style.background = 'none'; }}
          >
            <Redo2 style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Pan Mode Toggle */}
        {onTogglePanMode && (
          <button
            type="button"
            onClick={onTogglePanMode}
            title={isPanMode ? t.panOff : t.panOn}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: 6, borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
              border: `1px solid ${isPanMode ? 'rgba(245,158,11,.5)' : '#1e2028'}`,
              background: isPanMode ? 'rgba(245,158,11,.15)' : '#0d0f14',
              color: isPanMode ? '#fbbf24' : '#7c7f8a', cursor: 'pointer', transition: 'all .2s',
            }}
          >
            <Hand style={{ width: 14, height: 14 }} />
          </button>
        )}

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#0d0f14', padding: 2, borderRadius: 8, border: '1px solid #1e2028', fontSize: 12 }}>
          <button
            type="button"
            onClick={onZoomOut}
            title={t.zoomOut}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 4, background: 'none', border: 'none',
              color: '#7c7f8a', cursor: 'pointer', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e4e6eb'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7c7f8a'; }}
          >
            <ZoomOut style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            title={t.fitScreen}
            style={{
              padding: '2px 4px', fontFamily: 'monospace', fontWeight: 700,
              color: '#818cf8', background: 'none', border: 'none', borderRadius: 4,
              cursor: 'pointer', fontSize: 11, transition: 'background .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            title={t.zoomIn}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 4, background: 'none', border: 'none',
              color: '#7c7f8a', cursor: 'pointer', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e4e6eb'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7c7f8a'; }}
          >
            <ZoomIn style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Grid Toggle */}
        <button
          type="button"
          onClick={onToggleGrid}
          title={t.toggleGrid}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 6, borderRadius: 8, fontSize: 12,
            border: `1px solid ${showGrid ? 'rgba(99,102,241,.5)' : '#1e2028'}`,
            background: showGrid ? 'rgba(99,102,241,.15)' : '#0d0f14',
            color: showGrid ? '#818cf8' : '#7c7f8a', cursor: 'pointer', transition: 'all .2s',
          }}
        >
          <Grid style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Right Section: Actions (Preview, Save, Export) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Nav Links */}
        <div className="hidden xl:flex items-center" style={{ gap: 6, marginRight: 8 }}>
          {[
            { href: '/index.html', label: t.home },
            { href: '/app.html', label: t.tools },
            { href: '/designcraft.html', label: t.designCraft },
            { href: '/the-audio-reader.html', label: t.audioReader },
          ].map(p => {
            const active = window.location.pathname.endsWith(p.href);
            return (
              <a
                key={p.href}
                href={p.href}
                style={{
                  fontSize: 13, textDecoration: 'none', padding: '6px 14px', borderRadius: 16,
                  transition: 'all .25s', fontWeight: active ? 600 : 500,
                  color: active ? '#a5b4fc' : '#7c7f8a',
                  background: active ? 'rgba(99,102,241,.12)' : 'transparent',
                  boxShadow: active ? '0 0 16px rgba(99,102,241,.35), inset 0 0 0 1px rgba(99,102,241,.25)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e4e6eb'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#7c7f8a'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {p.label}
              </a>
            );
          })}
        </div>

        {/* Language Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = lang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('unitool-lang', next);
            window.location.reload();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
            borderRadius: 20, border: '1px solid #1e2028', background: 'transparent',
            color: '#7c7f8a', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'all .2s', fontFamily: 'inherit', marginRight: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2028'; e.currentTarget.style.color = '#7c7f8a'; }}
          title={t.switchLang}
        >
          <Globe style={{ width: 14, height: 14, opacity: 0.6 }} />
          <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {onToggleProperties && (
          <button
            type="button"
            onClick={onToggleProperties}
            title={isPropertiesOpen ? t.hideProps : t.showProps}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 6, borderRadius: 8, fontSize: 12,
              border: `1px solid ${isPropertiesOpen ? 'rgba(99,102,241,.4)' : '#1e2028'}`,
              background: isPropertiesOpen ? 'rgba(99,102,241,.15)' : '#0d0f14',
              color: isPropertiesOpen ? '#818cf8' : '#7c7f8a', cursor: 'pointer', transition: 'all .2s',
            }}
          >
            <SlidersHorizontal style={{ width: 14, height: 14 }} />
          </button>
        )}

        {/* Preview Button */}
        <button
          type="button"
          onClick={onOpenPreview}
          title={t.previewDesign}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1px solid #1e2028', background: '#0d0f14',
            color: '#e4e6eb', cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0d0f14'; }}
        >
          <Eye style={{ width: 14, height: 14, color: '#818cf8' }} />
          <span className="hidden sm:inline">{t.preview}</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          title={t.saveProject}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1px solid #1e2028', background: '#0d0f14',
            color: '#e4e6eb', cursor: 'pointer', transition: 'all .2s',
            fontFamily: 'inherit', opacity: isSaving ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!isSaving) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0d0f14'; }}
        >
          <Save style={{ width: 14, height: 14, color: '#34d399' }} />
          <span className="hidden sm:inline">{isSaving ? '...' : t.save}</span>
        </button>

        {/* Export CTA */}
        <button
          type="button"
          onClick={onOpenExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: 'none', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            color: '#fff', cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Download style={{ width: 14, height: 14 }} />
          <span>{t.export}</span>
        </button>
      </div>
    </nav>
  );
};
