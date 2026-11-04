import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Database, Download, FolderOpen, HardDrive, History, ShieldCheck, Trash2, Search } from 'lucide-react';
import type { ProjectItem } from '../../types';
import { useDcLang } from '../../hooks/useDcLang';
import {
  STORAGE_CHANGED_EVENT,
  browserStorageEstimate,
  clearAllProjectData,
  getStorageEngine,
  isStoragePersisted,
  projectBytes,
  projectsBytes,
  removeProject,
  requestPersistentStorage,
} from '../../utils/projectStorage';
import { RECOVERY_CHANGED_EVENT, clearAllRecovery, recoveryStats } from '../../advanced/core/recovery';
import { parseProjectFile } from '../../utils/projectFile';
import { downloadFile } from '../../utils/download';
import './storage.css';
import { PresetSilhouette } from './PresetSilhouette';

type Stats = Awaited<ReturnType<typeof recoveryStats>>;
const EMPTY_STATS: Stats = { count: 0, bytes: 0, byProject: {} };
type ConfirmAction = { kind: 'delete'; project: ProjectItem } | { kind: 'recovery' } | { kind: 'all' };

interface StorageManagerProps {
  projects: ProjectItem[];
  onOpenProject: (project: ProjectItem) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ projects, onOpenProject, onShowToast }) => {
  const { lang, t } = useDcLang();
  const ar = lang === 'ar';
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const [recovery, setRecovery] = useState<Stats>(EMPTY_STATS);
  const [persisted, setPersisted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState<'newest'|'size'>('newest');
  const visibleProjects=projects.filter(p=>p.title.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>sort==='size'?projectBytes(b)-projectBytes(a):(b.updatedAt||b.createdAt)-(a.updatedAt||a.createdAt));
  const [action, setAction] = useState<ConfirmAction | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const engine = getStorageEngine();
  const totalProjectBytes = projectsBytes();

  const refresh = useCallback(async () => {
    const [nextEstimate, nextRecovery, nextPersisted] = await Promise.all([
      browserStorageEstimate(),
      recoveryStats().catch(() => EMPTY_STATS),
      isStoragePersisted(),
    ]);
    setEstimate(nextEstimate);
    setRecovery(nextRecovery);
    setPersisted(nextPersisted);
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(STORAGE_CHANGED_EVENT, refresh);
    window.addEventListener(RECOVERY_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(STORAGE_CHANGED_EVENT, refresh);
      window.removeEventListener(RECOVERY_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (action && !dialog.open) dialog.showModal();
    if (!action && dialog.open) dialog.close();
  }, [action]);

  const usagePercent = estimate && estimate.quota > 0 ? Math.min(100, (estimate.usage / estimate.quota) * 100) : 0;
  const engineLabel = engine === 'indexeddb' ? t.storageEngineIDB : engine === 'localstorage' ? t.storageEngineLocal : t.storageEngineMemory;
  const dateLabel = (value: number) => new Date(value).toLocaleString(ar ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const downloadBackup = (project: ProjectItem) => {
    try {
      const raw = {
        format: 'unitool-designcraft',
        version: 1,
        project: {
          title: project.title,
          width: project.width,
          height: project.height,
          category: project.category,
          packaging: project.packaging,
          studio: project.studio,
          canvasData: project.canvasData,
        },
      };
      parseProjectFile(raw);
      const name = project.title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'design';
      downloadFile(new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' }), `${name}.unitool.json`);
      onShowToast?.(t.storageDownloaded, project.title, 'success');
    } catch {
      onShowToast?.(t.storageDownloadFailed, project.title, 'error');
    }
  };

  const confirmAction = async () => {
    if (!action || busy) return;
    setBusy(true);
    try {
      if (action.kind === 'delete') {
        if (!(await removeProject(action.project.id))) throw Error('DELETE');
        onShowToast?.(t.storageProjectDeleted, action.project.title, 'info');
      } else if (action.kind === 'recovery') {
        await clearAllRecovery();
        onShowToast?.(t.storageRecoveryCleared, undefined, 'info');
      } else {
        await clearAllProjectData();
        onShowToast?.(t.storageAllCleared, undefined, 'info');
      }
      setAction(null);
      await refresh();
    } catch {
      onShowToast?.(t.storageActionFailed, undefined, 'error');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const protectStorage = async () => {
    setBusy(true);
    const granted = await requestPersistentStorage();
    setPersisted(granted);
    onShowToast?.(granted ? t.storageProtectGranted : t.storageProtectDenied, undefined, granted ? 'success' : 'info');
    setBusy(false);
  };

  const confirmTitle = action?.kind === 'delete' ? t.storageConfirmDeleteTitle : action?.kind === 'recovery' ? t.storageConfirmRecoveryTitle : t.storageConfirmClearTitle;
  const confirmBody = action?.kind === 'delete' ? t.storageConfirmDeleteBody : action?.kind === 'recovery' ? t.storageConfirmRecoveryBody : t.storageConfirmClearBody;

  return (
    <section data-testid="storage-manager" className="storage-workspace" dir={ar?'rtl':'ltr'}>
      <header className="storage-heading"><div><span className="storage-eyebrow">YOUR CREATIVE LIBRARY</span><h1>{ar?'مساحتك الإبداعية':'Your creative space'}</h1><span className="storage-local" data-temporary={engine==='memory'}><span/> {engine==='memory'?(ar?'مؤقت — احفظ نسخة احتياطية':'Temporary — download a backup'):(ar?'محفوظ على هذا الجهاز':'Saved on this device')}</span></div><a href="/storage.html" title={ar?'نسخة احتياطية للموقع بالكامل':'Back up the entire site'}><Download size={16}/>{ar?'نسخة احتياطية':'Site backup'}</a></header>
      <div className="storage-overview">
        <article><div className="storage-stat-icon"><FolderOpen size={19}/></div><div><span>{t.storageSavedProjects}</span><strong>{projects.length}</strong><small dir="ltr">{formatStorageBytes(totalProjectBytes)}</small></div></article>
        <article><div className="storage-stat-icon storage-mint"><History size={19}/></div><div><span>{t.storageRecovery}</span><strong>{recovery.count}</strong><small dir="ltr">{formatStorageBytes(recovery.bytes)}</small></div></article>
        <article className="storage-device"><div className="storage-stat-icon"><HardDrive size={19}/></div><div><span title={engineLabel}>{engine==='indexeddb'?'IndexedDB':engine==='localstorage'?'LocalStorage':(ar?'مؤقت — احفظ نسخة':'Temporary — back up now')}</span><strong className="storage-device-value" dir="ltr">{estimate?formatStorageBytes(estimate.usage):'—'}</strong><small>{ar?'استخدام المتصفح':'Browser usage'}</small></div></article>
      </div>
      <div className="storage-capacity"><div><span title={t.storageBrowserUsageHint}>{t.storageBrowserUsage}</span><span dir="ltr">{estimate?`${formatStorageBytes(estimate.usage)} / ${formatStorageBytes(estimate.quota)}`:t.storageUsageUnknown}</span></div><div className="storage-meter" role="progressbar" aria-label={t.storageBrowserUsage} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(usagePercent)}><i style={{width:`${usagePercent}%`}}/></div><div className="storage-protection">{persisted?<span><ShieldCheck size={14}/>{t.storageProtected}</span>:<button type="button" title={t.storageProtectHint} disabled={busy||engine==='memory'} onClick={protectStorage}><ShieldCheck size={14}/>{t.storageProtect}</button>}<span>{ar?'الحفظ محلي، وليس سحابيًا':'Local storage, not cloud sync'}</span></div></div>
      <section className="storage-library"><div className="storage-library-head"><h2>{ar?'تصميماتك':'Your designs'} <span>{projects.length}</span></h2><div className="storage-library-tools"><label><Search size={15}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} aria-label={ar?'بحث في التصميمات المحفوظة':'Search saved designs'} placeholder={ar?'بحث…':'Search…'}/></label><select aria-label={ar?'ترتيب التصميمات':'Sort designs'} value={sort} onChange={e=>setSort(e.target.value as 'newest'|'size')}><option value="newest">{ar?'الأحدث':'Newest'}</option><option value="size">{ar?'الأكبر حجمًا':'Largest first'}</option></select></div></div>
      {projects.length===0?<div className="storage-empty"><FolderOpen size={30}/><p>{t.storageNoProjects}</p></div>:visibleProjects.length===0?<div className="storage-empty">{ar?'لا توجد نتائج':'No matching designs'}</div>:<ul className="storage-project-grid">{visibleProjects.map(project=>{
        const copies=recovery.byProject[project.id]?.count||0;
        return <li key={project.id} data-testid="storage-project" className="storage-project-card"><button type="button" className="storage-thumbnail" onClick={()=>onOpenProject(project)} aria-label={`${t.storageOpen}: ${project.title}`}>{project.thumbnail?<img src={project.thumbnail} alt="" loading="lazy"/>:<PresetSilhouette width={project.width} height={project.height} category={project.category} className="w-16 h-16"/>}<span dir="ltr">{project.packaging?`${project.packaging.size.height} × ${project.packaging.size.width} × ${project.packaging.size.depth} mm`:`${Math.round(project.width)} × ${Math.round(project.height)} px`}</span></button><div className="storage-project-info"><button type="button" className="storage-project-title" onClick={()=>onOpenProject(project)}>{project.title}</button><div className="storage-project-details"><span dir="ltr">{formatStorageBytes(projectBytes(project))}</span><span title={t.storageRecoveryCount}><History size={12}/>{copies}</span></div><footer><time title={t.storageLastSaved} dateTime={new Date(project.updatedAt||project.createdAt).toISOString()}>{dateLabel(project.updatedAt||project.createdAt)}</time><div className="storage-project-actions"><button type="button" onClick={()=>downloadBackup(project)} title={t.storageDownload} aria-label={`${t.storageDownload}: ${project.title}`}><Download size={15}/></button><button type="button" disabled={busy} onClick={()=>setAction({kind:'delete',project})} title={t.storageDelete} aria-label={`${t.storageDelete}: ${project.title}`}><Trash2 size={15}/></button></div></footer></div></li>;
      })}</ul>}
      </section>
      <section className="storage-cleanup"><div><Trash2 size={17}/><h2>{ar?'تنظيف المساحة':'Free up space'}</h2></div><div><button type="button" disabled={busy||recovery.count===0} onClick={()=>setAction({kind:'recovery'})}><History size={15}/>{t.storageClearRecovery}</button><button type="button" className="storage-danger" disabled={busy} onClick={()=>setAction({kind:'all'})}><Trash2 size={15}/>{t.storageClearAll}</button></div></section>

      <dialog
        ref={dialogRef}
        aria-labelledby="storage-confirm-title"
        aria-describedby="storage-confirm-body"
        onCancel={(event) => { if (busy) event.preventDefault(); else setAction(null); }}
        className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-slate-600 bg-[#141E38] text-slate-100 p-5 shadow-2xl backdrop:bg-black/70"
      >
        <h3 id="storage-confirm-title" className="text-base font-bold text-white">{confirmTitle}</h3>
        <p id="storage-confirm-body" className="mt-3 text-xs text-slate-300 leading-relaxed">{confirmBody}</p>
        {action?.kind === 'delete' && <p className="mt-2 text-xs font-bold text-sky-200 break-words">{action.project.title}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" autoFocus disabled={busy} onClick={() => setAction(null)} className="px-4 py-2 rounded-xl border border-slate-600 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50">{t.storageCancel}</button>
          <button type="button" disabled={busy} onClick={confirmAction} className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50">{busy ? t.storageWorking : t.storageConfirm}</button>
        </div>
      </dialog>
    </section>
  );
};
