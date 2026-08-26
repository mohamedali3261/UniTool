import React, { useState } from 'react';
import { ProjectItem, DimensionPreset, ToastMessage } from './types';
import { NewDesignScreen } from './components/Dashboard/NewDesignScreen';
import { EditorLayout } from './components/Editor/EditorLayout';
import { ToastContainer } from './components/Common/ToastContainer';
import { saveProjectToStorage } from './utils/fabricHelpers';
import { getDcTranslation, DCLang } from './translations';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lang] = useState<DCLang>(() => {
    const shared = localStorage.getItem('unitool-lang');
    return shared === 'en' ? 'en' : 'ar';
  });
  const t = getDcTranslation(lang);
  const dir = 'ltr';

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
    setActiveProject(newProject);
    setCurrentView('editor');
    showToast(
      lang === 'ar' ? 'تم فتح مساحة العمل' : 'Workspace opened',
      `${preset.width} × ${preset.height} px (${lang === 'ar' ? 'خلفية بيضاء' : 'white background'})`,
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
    setActiveProject(newProject);
    setCurrentView('editor');
    showToast(
      lang === 'ar' ? 'تم تجهيز مساحة التصميم' : 'Design workspace ready',
      `${data.width} × ${data.height} px`,
      'success'
    );
  };

  // 3. Open Existing Project
  const handleOpenProject = (project: ProjectItem) => {
    setActiveProject(project);
    setCurrentView('editor');
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
          initialProject={activeProject}
          onBackToDashboard={() => {
            setCurrentView('dashboard');
            setActiveProject(null);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}
