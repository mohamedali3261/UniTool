import React, { useEffect, useRef, useState } from 'react';
import { ProjectItem, DimensionPreset, ToastMessage } from './types';
import { NewDesignScreen } from './components/Dashboard/NewDesignScreen';
import { EditorLayout, EditorLayoutHandle } from './components/Editor/EditorLayout';
import { ToastContainer } from './components/Common/ToastContainer';
import { getSavedProjects, saveProjectToStorage } from './utils/fabricHelpers';
import { useDcLang } from './hooks/useDcLang';

const OPEN_TABS_KEY = 'designcraft_open_tabs_v1';

export default function App() {
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

  // Toast Notification Trigger
  const showToast = (
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
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const flushActiveTab = () => editorRef.current?.flushSave();

  // Open a design in its own tab (or focus its existing tab) and enter the editor.
  const openProjectInTab = (project: ProjectItem) => {
    const saved = getSavedProjects();
    setOpenTabs((prev) => {
      // Drop tabs whose projects were removed from the dashboard in the meantime.
      const alive = prev.filter((p) => saved.some((s) => s.id === p.id));
      return alive.some((p) => p.id === project.id)
        ? alive.map((p) => (p.id === project.id ? project : p))
        : [...alive, project];
    });
    setActiveTabId(project.id);
    setCurrentView('editor');
  };

  // 1. Create Design from Preset (Default White Background)
  const handleSelectPreset = (preset: DimensionPreset) => {
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

    saveProjectToStorage(newProject);
    openProjectInTab(newProject);
    showToast(
      t.appWorkspaceTitle,
      `${preset.width} × ${preset.height} px · ${t.appWorkspaceMsg}`,
      'info'
    );
  };

  // 2. Create Design from Custom Size (Default White Background)
  const handleCreateCustomDesign = (data: {
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

    saveProjectToStorage(newProject);
    openProjectInTab(newProject);
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
  const handleSelectTab = (id: string) => {
    if (id === activeTabId) return;

    const saved = flushActiveTab();
    const target = getSavedProjects().find((p) => p.id === id);
    if (!target) return;

    setOpenTabs((prev) => {
      const withSaved = saved ? prev.map((p) => (p.id === saved.id ? saved : p)) : prev;
      return withSaved.map((p) => (p.id === id ? target : p));
    });
    setActiveTabId(id);
  };

  // 5. Close a Tab (the design stays saved in "My Projects")
  const handleCloseTab = (id: string) => {
    const isActive = id === activeTabId;
    const saved = isActive ? flushActiveTab() : undefined;
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
  const handleBackToDashboard = () => {
    flushActiveTab();
    setCurrentView('dashboard');
  };

  const handleNewTab = () => {
    flushActiveTab();
    setCurrentView('dashboard');
  };

  return (
    <main dir={dir} className="min-h-screen bg-[#070D1E] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
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

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}
