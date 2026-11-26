/**
 * القسم ١ — الشريط العلوي.
 * هوية الاستوديو، مختارات الملف (مشروع/خط/تصدير)، وحالة العمل.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Undo2, Redo2, Save, Upload, Download, Sun, Moon, Languages, FolderOpen, FileType2, Check, Loader2, Menu, X, Cloud,
} from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { ActionButton } from '../../ui/controls';

export function TopBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onOpenProjects,
  onImportFont,
  onExport,
  onOpenDocs,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onOpenProjects: () => void;
  onImportFont: () => void;
  onExport: () => void;
  onOpenDocs: () => void;
}) {
  const { state, dispatch, font, ar, loading } = useFontLab();
  const [savedFlash, setSavedFlash] = useState(false);
  const [menu, setMenu] = useState(false);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  const save = () => {
    onSave();
    setSavedFlash(true);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <header className="fl-topbar">
      <div className="fl-brand">
        <span className="fl-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <path d="M6 26V9h5c4 0 6 2 6 5s-2 5-6 5H9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M18 26c0-7 3-12 8-15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 4" />
          </svg>
        </span>
        <div>
          <strong>{ar ? 'معمل الخطوط' : 'Font Lab'}</strong>
          <small>{ar ? 'تصميم عربي ولاتيني' : 'Arabic & Latin type design'}</small>
        </div>
      </div>

      <div className="fl-topbar-file">
        <button type="button" className="fl-file-chip" onClick={onOpenProjects} title={ar ? 'المشاريع المحفوظة' : 'Saved projects'}>
          <FolderOpen size={14} />
          <span>{state.doc.family}</span>
          <em>{state.doc.style}</em>
          {state.dirty ? <i className="fl-dirty" title={ar ? 'تغييرات غير محفوظة' : 'Unsaved changes'} /> : <Check size={12} className="fl-saved-tick" />}
        </button>
        <button type="button" className="fl-file-chip is-muted" onClick={onImportFont} title={ar ? 'استيراد خط TTF/OTF' : 'Import a TTF/OTF font'}>
          <FileType2 size={14} />
          <span className="fl-file-name">{font?.fileName || (loading ? '…' : '—')}</span>
        </button>
      </div>

      <div className="fl-topbar-actions fl-desktop-only">
        <ActionButton onClick={onOpenDocs} icon={<Cloud size={14} />} title={ar ? 'كيف يعمل الاستوديو' : 'How the studio works'}>
          {ar ? 'دليل' : 'Guide'}
        </ActionButton>
        <span className="fl-divider" />
        <ActionButton onClick={onUndo} disabled={!canUndo} icon={<Undo2 size={14} />} title={ar ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'} />
        <ActionButton onClick={onRedo} disabled={!canRedo} icon={<Redo2 size={14} />} title={ar ? 'إعادة (Ctrl+Shift+Z)' : 'Redo (Ctrl+Shift+Z)'} />
        <ActionButton onClick={onImportFont} icon={<Upload size={14} />}>{ar ? 'استيراد' : 'Import'}</ActionButton>
        <ActionButton onClick={save} icon={savedFlash ? <Check size={14} /> : <Save size={14} />} active={savedFlash}>
          {savedFlash ? (ar ? 'تم الحفظ' : 'Saved') : ar ? 'حفظ' : 'Save'}
        </ActionButton>
        <ActionButton onClick={onExport} icon={state.exporting ? <Loader2 size={14} className="fl-spin" /> : <Download size={14} />} tone="primary">
          {ar ? 'تصدير الخط' : 'Export font'}
        </ActionButton>
        <span className="fl-divider" />
        <button
          type="button"
          className="fl-icon-btn"
          aria-label={ar ? 'تبديل اللغة' : 'Switch language'}
          title={ar ? 'English' : 'العربية'}
          onClick={() => dispatch({ type: 'lang', value: ar ? 'en' : 'ar' })}
        >
          <Languages size={16} />
        </button>
        <button
          type="button"
          className="fl-icon-btn"
          aria-label={ar ? 'تبديل الوضع الليلي' : 'Toggle theme'}
          onClick={() => dispatch({ type: 'theme', value: state.theme === 'dark' ? 'light' : 'dark' })}
        >
          {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="fl-topbar-actions fl-mobile-only">
        <ActionButton onClick={onExport} icon={<Download size={14} />} tone="primary">{ar ? 'تصدير' : 'Export'}</ActionButton>
        <button type="button" className="fl-icon-btn" aria-label={ar ? 'القائمة' : 'Menu'} onClick={() => setMenu((value) => !value)}>
          {menu ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menu ? (
        <div className="fl-mobile-menu">
          <ActionButton full onClick={onUndo} disabled={!canUndo} icon={<Undo2 size={14} />}>{ar ? 'تراجع' : 'Undo'}</ActionButton>
          <ActionButton full onClick={onRedo} disabled={!canRedo} icon={<Redo2 size={14} />}>{ar ? 'إعادة' : 'Redo'}</ActionButton>
          <ActionButton full onClick={save} icon={<Save size={14} />}>{ar ? 'حفظ المشروع' : 'Save project'}</ActionButton>
          <ActionButton full onClick={onImportFont} icon={<Upload size={14} />}>{ar ? 'استيراد خط' : 'Import font'}</ActionButton>
          <ActionButton full onClick={onOpenProjects} icon={<FolderOpen size={14} />}>{ar ? 'المشاريع' : 'Projects'}</ActionButton>
          <ActionButton full onClick={onOpenDocs} icon={<Cloud size={14} />}>{ar ? 'الدليل' : 'Guide'}</ActionButton>
          <ActionButton full onClick={() => dispatch({ type: 'lang', value: ar ? 'en' : 'ar' })} icon={<Languages size={14} />}>
            {ar ? 'English' : 'العربية'}
          </ActionButton>
          <ActionButton full onClick={() => dispatch({ type: 'theme', value: state.theme === 'dark' ? 'light' : 'dark' })} icon={state.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}>
            {ar ? 'الوضع' : 'Theme'}
          </ActionButton>
        </div>
      ) : null}
    </header>
  );
}
