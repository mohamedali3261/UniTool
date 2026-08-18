/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

import type { PageId } from './types/app';
import { translations } from './lib/translations';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileMenu } from './components/MobileMenu';
import { PageRouter } from './components/PageRouter';
import { Footer } from './components/Footer';
import { ErrorScreen, LoadingScreen } from './components/LoadingScreen';
import { useAudioProcessor } from './hooks/useAudioProcessor';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('videoToGif');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'queue' | 'workstation' | 'settings'>('workstation');

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const {
    isFfmpegLoaded,
    loadingError,
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

  if (loadingError) {
    return <ErrorScreen error={loadingError} />;
  }

  if (!isFfmpegLoaded) {
    return <LoadingScreen lang={lang} t={t} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#0F1115] text-[#D1D5DB] font-sans selection:bg-blue-500/30 overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Header
        lang={lang}
        t={t}
        onToggleLang={toggleLang}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <MobileMenu
        open={mobileMenuOpen}
        lang={lang}
        t={t}
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page as PageId)}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          lang={lang}
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page as PageId)}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <PageRouter
            currentPage={currentPage}
            lang={lang}
            t={t}
            onNavigate={(page) => setCurrentPage(page as PageId)}
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
        </div>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
