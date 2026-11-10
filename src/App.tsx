/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useToolsAppearance } from './hooks/useToolsAppearance';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { FileHandoff, FileHandoffTarget, PageId } from './types/app';
import { translations } from './lib/translations';
import { navItems } from './config/navigation';
import { toolCategories } from './pages/ToolsHome/data';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileMenu } from './components/MobileMenu';
import { PageRouter } from './components/PageRouter';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { ToolErrorBoundary } from './components/ToolErrorBoundary';
import { ToolNavigationBar } from './components/ToolNavigationBar';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import {
  recordPageVisit,
  stepBackInSession,
  syncStackOnPopState,
} from './utils/navigationHistory';

// Every navigable page: sidebar entries plus tools that live inside hubs
const knownPageIds = new Set([
  ...navItems.map(i => i.id),
  ...toolCategories.flatMap(c => c.tools.map(t => t.id)),
  'compress',
]);

function resolvePageFromHash(): PageId {
  const hashId = window.location.hash.replace('#', '').trim();
  return (knownPageIds.has(hashId) ? hashId : 'toolsHome') as PageId;
}

export default function App() {
  const { theme, toggleTheme } = useToolsAppearance();
  const [currentPage, setCurrentPage] = useState<PageId>(resolvePageFromHash);
  const [fileHandoff, setFileHandoff] = useState<FileHandoff | null>(null);
  const fileHandoffId = useRef(0);
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    try {
      return localStorage.getItem('unitool-lang') === 'en' ? 'en' : 'ar';
    } catch { return 'ar'; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('unitool.tools.splash') === '1') return true;
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        sessionStorage.setItem('unitool.tools.splash', '1');
        return true;
      }
    } catch {
      /* ignore blocked storage */
    }
    return false;
  });
  const t = translations[lang];

  useEffect(() => {
    if (String(currentPage) === 'excelStudio') window.location.assign('/excel-studio/');
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === 'siteStorage') window.location.assign('/storage.html');
  }, [currentPage]);

  useEffect(() => {
    if (minDelayDone) return;
    const timer = setTimeout(() => {
      try { sessionStorage.setItem('unitool.tools.splash', '1'); } catch { /* ignore */ }
      setMinDelayDone(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [minDelayDone]);

  // Keep React tool state synchronized with browser Back / Forward & URL hash changes
  useEffect(() => {
    const onHistoryChange = () => {
      syncStackOnPopState();
      setCurrentPage(resolvePageFromHash());
    };
    window.addEventListener('popstate', onHistoryChange);
    window.addEventListener('hashchange', onHistoryChange);
    return () => {
      window.removeEventListener('popstate', onHistoryChange);
      window.removeEventListener('hashchange', onHistoryChange);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'queue' | 'workstation' | 'settings'>('workstation');

  const navigateToPage = useCallback((page: string) => {
    if (page === 'siteStorage') { window.location.assign('/storage.html'); return; }
    if (page === 'excelStudio') { window.location.assign('/excel-studio/'); return; }
    if (page === 'cvStudio') { window.location.assign('/cv-studio/'); return; }
    if (!knownPageIds.has(page)) return;

    const currentHash = window.location.hash.slice(1);
    const nextHash = `#${page}`;
    if (currentHash !== page && !(page === 'toolsHome' && currentHash === '')) {
      history.pushState({ utToolPage: page }, '', nextHash);
      recordPageVisit();
    }
    setCurrentPage(page as PageId);
  }, []);

  const handleBackNavigation = useCallback(() => {
    if (currentPage === 'toolsHome') {
      stepBackInSession('/index.html');
      return;
    }
    stepBackInSession('/app.html#toolsHome', () => navigateToPage('toolsHome'));
  }, [currentPage, navigateToPage]);

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('unitool-lang', next); } catch { /* Keep the in-memory choice. */ }
      return next;
    });
  };

  const sendFilesToTool = (target: FileHandoffTarget, files: File[]) => {
    if (files.length === 0) return;
    const handoff: FileHandoff = { id: ++fileHandoffId.current, target, files };
    setFileHandoff(handoff);
    if (window.location.hash.slice(1) !== target) {
      history.pushState({ utToolPage: target }, '', `#${target}`);
      recordPageVisit();
    }
    setCurrentPage(target);
  };

  const consumeFileHandoff = (id: number) => {
    setFileHandoff(current => current?.id === id ? null : current);
  };

  const {
    files,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    settings,
    setSettings,
    handleFilesAdded,
    removeFile,
    processAll,
    downloadFile,
    downloadAllAsZip,
    downloadAllFiles,
    clearFiles,
    handleTrimChange,
    isAnyProcessing,
    hasIdleFiles,
    hasCompletedFiles,
  } = useAudioProcessor(lang, t);

  if (!minDelayDone) {
    return <LoadingScreen />;
  }

  return (
    <div className="tools-app-shell flex flex-col h-screen bg-[#0F1115] text-[#D1D5DB] font-sans selection:bg-emerald-500/30 overflow-hidden pt-16" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onBack={handleBackNavigation}
      />

      <MobileMenu
        open={mobileMenuOpen}
        lang={lang}
        t={t}
        currentPage={currentPage}
        onNavigate={navigateToPage}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          lang={lang}
          currentPage={currentPage}
          onNavigate={navigateToPage}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <ToolNavigationBar
            currentPage={currentPage}
            lang={lang}
            onBack={handleBackNavigation}
            onGoToolsHome={() => navigateToPage('toolsHome')}
          />

          <ToolErrorBoundary lang={lang} pageKey={currentPage} onNavigate={navigateToPage}>
          <PageRouter
            currentPage={currentPage}
            lang={lang}
            t={t}
            onNavigate={navigateToPage}
            fileHandoff={fileHandoff?.target === currentPage ? fileHandoff : null}
            onSendFilesToTool={sendFilesToTool}
            onFileHandoffConsumed={consumeFileHandoff}
            files={files}
            settings={settings}
            onSettingsChange={setSettings}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFileId}
            onRemoveFile={removeFile}
            onDownloadFile={downloadFile}
            onFilesAdded={handleFilesAdded}
            onProcessAll={processAll}
            onClearFiles={clearFiles}
            onDownloadAllFiles={downloadAllFiles}
            onDownloadAllAsZip={downloadAllAsZip}
            onTrimChange={handleTrimChange}
            isAnyProcessing={isAnyProcessing}
            hasIdleFiles={hasIdleFiles}
            hasCompletedFiles={hasCompletedFiles}
          />
          </ToolErrorBoundary>
        </div>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
