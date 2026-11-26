/**
 * القسم ١٠ — المشاريع.
 * حفظ/استرجاع/حذف مشاريع محلية، تنزيل المشروع كملف JSON واستيراده، مع ملخص
 * لما يحتويه المشروع قبل استرجاعه.
 */
import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Save, Trash2, Download, Upload, HardDrive, FileJson } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import {
  describeDocument,
  parseProject,
  readStoredProjects,
  saveProjectToList,
  serializeProject,
  writeStoredProjects,
  type StoredProject,
} from '../../core/project';
import { downloadBlob } from '../../core/exporter';
import { ActionButton, EmptyHint, PanelCard } from '../../ui/controls';

export function ProjectsPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const { state, dispatch, ar } = useFontLab();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setProjects(readStoredProjects());

  useEffect(() => {
    refresh();
  }, []);

  const save = () => {
    const list = saveProjectToList(projects, name || `${state.doc.family} ${new Date().toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}`, state.doc);
    setProjects(list);
    const ok = writeStoredProjects(list);
    dispatch({ type: 'saved', count: list.length });
    onNotice(ok ? (ar ? 'تم حفظ المشروع محلياً.' : 'Project saved locally.') : ar ? 'تعذر الحفظ — مساحة التخزين ممتلئة.' : 'Could not save — storage is full.');
  };

  const remove = (id: string) => {
    const list = projects.filter((entry) => entry.id !== id);
    setProjects(list);
    writeStoredProjects(list);
    onNotice(ar ? 'تم حذف المشروع.' : 'Project deleted.');
  };

  const open = (entry: StoredProject) => {
    dispatch({ type: 'document', doc: entry.document, labelAr: `فتح: ${entry.name}`, labelEn: `Opened: ${entry.name}` });
    onNotice(ar ? `تم فتح ${entry.name}` : `Opened ${entry.name}`);
  };

  const downloadJson = () => {
    downloadBlob(serializeProject(state.doc), `${state.doc.family.replace(/\s+/g, '-')}.fontlab.json`, 'application/json');
    onNotice(ar ? 'تم تنزيل المشروع كملف JSON.' : 'Project JSON downloaded.');
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = await file.text();
      const doc = parseProject(raw);
      dispatch({ type: 'document', doc, labelAr: 'استيراد مشروع', labelEn: 'Project imported' });
      onNotice(ar ? 'تم استيراد المشروع.' : 'Project imported.');
    } catch (cause) {
      onNotice(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <div className="fl-projects">
      <PanelCard
        title={ar ? 'المشاريع المحلية' : 'Local projects'}
        subtitle={ar ? 'تُخزَّن في هذا المتصفح فقط' : 'Stored in this browser only'}
        icon={<FolderOpen size={15} />}
        actions={<span className="fl-chip">{projects.length}</span>}
      >
        <div className="fl-save-row">
          <input
            type="text"
            value={name}
            placeholder={ar ? 'اسم المشروع' : 'Project name'}
            aria-label={ar ? 'اسم المشروع' : 'Project name'}
            onChange={(event) => setName(event.target.value)}
          />
          <ActionButton onClick={save} tone="primary" icon={<Save size={14} />}>{ar ? 'حفظ' : 'Save'}</ActionButton>
        </div>

        {projects.length === 0 ? (
          <EmptyHint>{ar ? 'لا مشاريع محفوظة بعد — احفظ أول مشروع لتجده هنا.' : 'No saved projects yet — save one to see it here.'}</EmptyHint>
        ) : (
          <ul className="fl-project-list">
            {projects.map((entry) => (
              <li key={entry.id}>
                <button type="button" className="fl-project-main" onClick={() => open(entry)}>
                  <HardDrive size={15} />
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{describeDocument(entry.document)}</small>
                  </span>
                  <em>{new Date(entry.updatedAt).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}</em>
                </button>
                <button type="button" className="fl-project-del" onClick={() => remove(entry.id)} aria-label={ar ? 'حذف' : 'Delete'}>
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title={ar ? 'ملف المشروع' : 'Project file'} icon={<FileJson size={15} />}>
        <p className="fl-hint-note">
          {ar
            ? 'ملف JSON صغير يحوي التعديلات فقط (منحنيات، عروض، كرننغ، مقاييس) — بدون نسخ الخط كاملاً.'
            : 'A small JSON file holding only your edits (outlines, advances, kerning, metrics) — no font copy.'}
        </p>
        <div className="fl-op-row">
          <ActionButton onClick={downloadJson} icon={<Download size={14} />}>{ar ? 'تنزيل JSON' : 'Download JSON'}</ActionButton>
          <ActionButton onClick={() => inputRef.current?.click()} icon={<Upload size={14} />}>{ar ? 'استيراد JSON' : 'Import JSON'}</ActionButton>
          <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={(event) => void importJson(event.target.files?.[0] || undefined)} />
        </div>
        <div className="fl-project-summary">
          <span>{describeDocument(state.doc)}</span>
          <span>{Object.keys(state.doc.kerning).length} {ar ? 'زوج كرننغ' : 'kerning pairs'}</span>
        </div>
      </PanelCard>
    </div>
  );
}
