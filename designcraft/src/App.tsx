import {useDesignerTheme} from './hooks/useDesignerTheme';
import { enqueueToast } from './utils/toastQueue';
import {ProjectImport} from './components/Common/ProjectImport';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ProjectItem, DimensionPreset, ToastMessage } from './types';
import { NewDesignScreen } from './components/Dashboard/NewDesignScreen';
import { EditorLayout, EditorLayoutHandle } from './components/Editor/EditorLayout';
import { ToastContainer } from './components/Common/ToastContainer';
import { getSavedProjects, saveProjectToStorage } from './utils/fabricHelpers';
import { useDcLang } from './hooks/useDcLang';
import { STORAGE_CHANGED_EVENT, type StorageChange } from './utils/projectStorage';

const OPEN_TABS_KEY = 'designcraft_open_tabs_v1';

export default function App() {
  const {theme}=useDesignerTheme();
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [openTabs, setOpenTabs] = useState<ProjectItem[]>(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(OPEN_TABS_KEY) || '[]') as string[];
      const saved = getSavedProjects();
      return ids
        .map((id) => saved.find((p) => p.id === id))
        .filter((p): p is ProjectItem => !!p);
    } catch {
      return [];
    }
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const editorRef = useRef<EditorLayoutHandle | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { lang, t } = useDcLang();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const activeProject = openTabs.find((p) => p.id === activeTabId) || null;

  // Keep the open-tab list across reloads; the full project data stays in storage.
  useEffect(() => {
    try {
      localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(openTabs.map((p) => p.id)));
    } catch {
      /* storage full or unavailable — tabs still work for this session */
    }
  }, [openTabs]);

  // Storage management can delete projects while their tabs are still in memory.
  useEffect(() => {
    const onStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<StorageChange>).detail;
      if (detail?.kind === 'clear') {
        setOpenTabs([]);
        setActiveTabId(null);
      } else if (detail?.kind === 'delete' && detail.id) {
        setOpenTabs((prev) => prev.filter((p) => p.id !== detail.id));
        setActiveTabId((prev) => (prev === detail.id ? null : prev));
      }
    };
    window.addEventListener(STORAGE_CHANGED_EVENT, onStorageChange);
    return () => window.removeEventListener(STORAGE_CHANGED_EVENT, onStorageChange);
  }, []);

  // Toast Notification Trigger
  const showToast = useCallback((
    title: string,
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type
    };
    setToasts((prev) => enqueueToast(prev, newToast));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Open a design in its own tab (or focus its existing tab) and enter the editor.
  const openProjectInTab = async (project: ProjectItem, skipLeaveCheck = false) => {
    if(!skipLeaveCheck && editorRef.current && !(await editorRef.current.confirmLeave()))return;
    const saved = getSavedProjects();
    setOpenTabs((prev) => {
      // Drop tabs whose projects were removed from the dashboard in the meantime.
      const alive = prev.filter((p) => p.sessionOnly || saved.some((s) => s.id === p.id));
      return alive.some((p) => p.id === project.id)
        ? alive.map((p) => (p.id === project.id ? project : p))
        : [...alive, project];
    });
    setActiveTabId(project.id);
    setCurrentView('editor');
  };

  // 1. Create Design from Preset (Default White Background)
  const handleSelectPreset = async (preset: DimensionPreset) => {
    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: `${lang === 'ar' ? preset.titleAr : preset.title} ${lang === 'ar' ? 'جديد' : 'New'}`,
      width: preset.width,
      height: preset.height,
      category: preset.category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvasData: {
        background: '#FFFFFF',
        objects: []
      }
    };

    if (!(await saveProjectToStorage(newProject))) {
      showToast(lang === 'ar' ? 'تعذر حفظ المشروع في المتصفح' : 'Could not save the project in this browser', lang === 'ar' ? 'حرّر مساحة من صفحة الحفظ والتخزين ثم أعد المحاولة.' : 'Free space on the Save & storage page, then try again.', 'error');
      return;
    }
    await openProjectInTab(newProject);
    showToast(
      t.appWorkspaceTitle,
      `${preset.width} × ${preset.height} px · ${t.appWorkspaceMsg}`,
      'info'
    );
  };

  // 2. Create Design from Custom Size (Default White Background)
  const handleCreateCustomDesign = async (data: {
    title: string;
    width: number;
    height: number;
    backgroundColor: string;
  }) => {
    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: data.title || t.newDesignDefault,
      width: data.width,
      height: data.height,
      category: 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvasData: {
        background: data.backgroundColor || '#FFFFFF',
        objects: []
      }
    };

    if (!(await saveProjectToStorage(newProject))) {
      showToast(lang === 'ar' ? 'تعذر حفظ المشروع في المتصفح' : 'Could not save the project in this browser', lang === 'ar' ? 'حرّر مساحة من صفحة الحفظ والتخزين ثم أعد المحاولة.' : 'Free space on the Save & storage page, then try again.', 'error');
      return;
    }
    await openProjectInTab(newProject);
    showToast(
      t.appDesignReadyTitle,
      `${data.width} × ${data.height} px · ${t.appDesignReadyMsg}`,
      'success'
    );
  };

  // 3. Open Existing Project
  const handleOpenProject = (project: ProjectItem) => {
    openProjectInTab(project);
  };

  // 4. Switch Between Open Design Tabs (save the current canvas first)
  const handleSelectTab = async (id: string) => {
    if (id === activeTabId) return;
    if(editorRef.current && !(await editorRef.current.confirmLeave()))return;

    const saved = getSavedProjects().find((p) => p.id === activeTabId);
    const target = getSavedProjects().find((p) => p.id === id);
    if (!target) return;

    setOpenTabs((prev) => {
      const withSaved = saved ? prev.map((p) => (p.id === saved.id ? saved : p)) : prev;
      return withSaved.map((p) => (p.id === id ? target : p));
    });
    setActiveTabId(id);
  };

  // 5. Close a Tab (the design stays saved in "My Projects")
  const handleCloseTab = async (id: string) => {
    const isActive = id === activeTabId;
    if(isActive&&editorRef.current && !(await editorRef.current.confirmLeave()))return;
    const saved = isActive ? getSavedProjects().find((p) => p.id === id) : undefined;
    const closingIndex = openTabs.findIndex((p) => p.id === id);
    if (closingIndex === -1) return;

    const base = saved ? openTabs.map((p) => (p.id === saved.id ? saved : p)) : openTabs;
    const remaining = base.filter((p) => p.id !== id);
    setOpenTabs(remaining);

    if (!isActive) return;

    const next = remaining[Math.min(closingIndex, remaining.length - 1)];
    if (next) {
      const fresh = getSavedProjects().find((p) => p.id === next.id) || next;
      setOpenTabs((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
      setActiveTabId(fresh.id);
    } else {
      setActiveTabId(null);
      setCurrentView('dashboard');
    }
  };

  // 6. Back to Dashboard / New Tab (both keep the current design saved)
  const handleBackToDashboard = async () => {
    if(editorRef.current && !(await editorRef.current.confirmLeave()))return;
    window.location.hash=activeProject?.packaging?'packaging':'projects';
    setCurrentView('dashboard');
  };

  const handleNewTab = async () => {
    if(editorRef.current && !(await editorRef.current.confirmLeave()))return;
    setCurrentView('dashboard');
  };

  return (
    <main dir={dir} className={`dc-studio-root min-h-screen bg-[#070D1E] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white ${theme==='light'?'packaging-daylight':''}`} >
      {currentView === 'dashboard' && (
        <NewDesignScreen
          onSelectPreset={handleSelectPreset}
          onCreateCustom={handleCreateCustomDesign}
          onOpenProject={handleOpenProject}
          onShowToast={showToast}
        />
      )}

      {currentView === 'editor' && activeProject && (
        <EditorLayout
          key={activeProject.id}
          ref={editorRef}
          initialProject={activeProject}
          onBackToDashboard={handleBackToDashboard}
          onShowToast={showToast}
          tabs={openTabs.map(({ id, title, width, height }) => ({ id, title, width:Math.round(width), height:Math.round(height) }))}
          activeTabId={activeProject.id}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onOpenPackagingProject={openProjectInTab}
          onProjectUpdated={(project) => {
            setOpenTabs((prev) => prev.map((p) => (p.id === project.id ? project : p)));
          }}
        />
      )}

      <ProjectImport hideButton onImport={async project=>{
        if(editorRef.current && !(await editorRef.current.confirmLeave())) return null;
        const stored = await saveProjectToStorage(project);
        if (!stored) {
          showToast(lang==='ar'?'تعذر حفظ المشروع في المتصفح':'Could not save the project in this browser', lang==='ar'?'لم نستبدل التصميم الحالي. حرّر مساحة من صفحة الحفظ والتخزين ثم أعد المحاولة.':'The current design was not replaced. Free space on the Save & storage page and retry.', 'error');
          return null;
        }
        await openProjectInTab(project, true);
        showToast(lang==='ar'?'تم فتح المشروع وحفظه في المتصفح':'Project opened and saved in this browser', undefined, 'success');
        return true;
      }}/>
      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}
