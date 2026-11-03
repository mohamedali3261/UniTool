import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Database, Download, FolderOpen, HardDrive, History, ShieldCheck, Trash2 } from 'lucide-react';
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
    <section data-testid="storage-manager" className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-[#141E38] border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/30">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-300 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white">{t.storageTitle}</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-3xl">{t.storageDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-[#0B132B] border border-slate-700/70 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]"><HardDrive className="w-3.5 h-3.5" />{t.storageEngine}</div>
            <div className={`mt-2 text-xs font-bold leading-relaxed ${engine === 'memory' ? 'text-amber-300' : 'text-emerald-300'}`}>{engineLabel}</div>
            <div className="mt-1 text-[10px] text-slate-500">{t.storageLocalOnly}</div>
          </div>
          <div className="rounded-2xl bg-[#0B132B] border border-slate-700/70 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]"><FolderOpen className="w-3.5 h-3.5" />{t.storageProjectsSize}</div>
            <div className="mt-2 text-lg font-bold text-white font-mono" dir="ltr">{formatStorageBytes(totalProjectBytes)}</div>
            <div className="mt-1 text-[10px] text-slate-500">{projects.length} {t.statProjects}</div>
          </div>
          <div className="rounded-2xl bg-[#0B132B] border border-slate-700/70 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]"><History className="w-3.5 h-3.5" />{t.storageRecovery}</div>
            <div className="mt-2 text-lg font-bold text-white font-mono" dir="ltr">{formatStorageBytes(recovery.bytes)}</div>
            <div className="mt-1 text-[10px] text-slate-500">{recovery.count} · {t.storageRecoveryHint}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#0B132B] border border-slate-700/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-semibold">{t.storageBrowserUsage}</span>
            {estimate ? (
              <span className="text-slate-400 font-mono" dir="ltr">{formatStorageBytes(estimate.usage)} / {formatStorageBytes(estimate.quota)}</span>
            ) : (
              <span className="text-slate-500 text-[11px]">{t.storageUsageUnknown}</span>
            )}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-label={t.storageBrowserUsage} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(usagePercent)}>
            <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">{t.storageBrowserUsageHint}</p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          {persisted ? (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="w-4 h-4" />{t.storageProtected}</span>
          ) : (
            <button type="button" disabled={busy || engine === 'memory'} onClick={protectStorage} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-200 text-xs font-semibold hover:bg-sky-500/20 disabled:opacity-50 transition">
              <ShieldCheck className="w-4 h-4" />{t.storageProtect}
            </button>
          )}
          <p className="text-[10px] text-slate-500 leading-relaxed flex-1">{t.storageProtectHint}</p>
        </div>
      </div>

      <div className="bg-[#141E38] border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white">{t.storageSavedProjects} <span className="text-sky-300 font-mono">({projects.length})</span></h3>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">{t.storageNoProjects}</div>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => {
              const copies = recovery.byProject[project.id]?.count || 0;
              const objects = Array.isArray(project.canvasData?.objects) ? project.canvasData.objects.length : 0;
              return (
                <li key={project.id} data-testid="storage-project" className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl bg-[#0B132B] border border-slate-700/70 p-3">
                  <button type="button" onClick={() => onOpenProject(project)} title={t.storageOpen} className="w-full md:w-20 h-20 shrink-0 rounded-xl bg-white/[0.04] border border-slate-700/60 overflow-hidden flex items-center justify-center">
                    {project.thumbnail ? <img src={project.thumbnail} alt="" className="w-full h-full object-contain p-1.5" /> : <PresetSilhouette width={project.width} height={project.height} category={project.category} className="w-10 h-10" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => onOpenProject(project)} className="block max-w-full text-start text-sm font-bold text-white hover:text-sky-300 truncate transition">{project.title}</button>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                      <span dir="ltr" className="font-mono">{Math.round(project.width)} × {Math.round(project.height)} px</span>
                      <span>{objects} {t.storageObjects}</span>
                      <span dir="ltr" className="font-mono text-sky-300">{formatStorageBytes(projectBytes(project))}</span>
                      <span>{t.storageRecoveryCount}: {copies}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">{t.storageLastSaved}: {dateLabel(project.updatedAt || project.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button type="button" onClick={() => onOpenProject(project)} title={t.storageOpen} aria-label={`${t.storageOpen}: ${project.title}`} className="p-2 rounded-lg text-slate-300 hover:text-sky-300 hover:bg-slate-800 transition"><FolderOpen className="w-4 h-4" /></button>
                    <button type="button" onClick={() => downloadBackup(project)} title={t.storageDownload} aria-label={`${t.storageDownload}: ${project.title}`} className="p-2 rounded-lg text-slate-300 hover:text-emerald-300 hover:bg-slate-800 transition"><Download className="w-4 h-4" /></button>
                    <button type="button" disabled={busy} onClick={() => setAction({ kind: 'delete', project })} title={t.storageDelete} aria-label={`${t.storageDelete}: ${project.title}`} className="p-2 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-slate-800 disabled:opacity-50 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-[#141E38] border border-rose-500/25 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/30">
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{t.storageBackupHint}</p>
        <div className="flex flex-col lg:flex-row gap-3">
          <button type="button" disabled={busy || recovery.count === 0} onClick={() => setAction({ kind: 'recovery' })} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-200 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition">
            <History className="w-4 h-4" />{t.storageClearRecovery}
          </button>
          <button type="button" disabled={busy} onClick={() => setAction({ kind: 'all' })} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-200 text-xs font-bold hover:bg-rose-500/20 disabled:opacity-50 transition">
            <Trash2 className="w-4 h-4" />{t.storageClearAll}
          </button>
        </div>
        <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">{t.storageClearAllHint}</p>
      </div>

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
