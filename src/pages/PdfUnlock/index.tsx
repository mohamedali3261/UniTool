import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { PdfUnlockProps, PdfUnlockTab, UnlockFile } from './types';
import { readPdfFile, unlockPdfFile, PdfPasswordRequiredError } from './utils';
import { Header } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { PasswordPanel } from './components/PasswordPanel';
import { UnlockPanel } from './components/UnlockPanel';

export function PdfUnlock({ t, lang }: PdfUnlockProps) {
  const [file, setFile] = useState<UnlockFile | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<PdfUnlockTab>('upload');

  const loadFile = async (f: File) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const loaded = await readPdfFile(f);
      setFile(loaded);
    } catch {
      setError(lang === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file');
    }
    setLoading(false);
  };

  const unlock = async () => {
    if (!file) return;
    setUnlocking(true);
    setError(null);
    setSuccess(false);
    try {
      await unlockPdfFile(file, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof PdfPasswordRequiredError) {
        setError(lang === 'ar' ? 'الملف محمي بكلمة مرور' : 'File is password protected');
      } else {
        setError(lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
      }
    }
    setUnlocking(false);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-unlock-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf-unlock-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-unlock-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-unlock-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-unlock-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-unlock-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <Header lang={lang} mobileTab={mobileTab} onTabChange={setMobileTab} />

      <div className="flex-1 pdf-unlock-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <UploadPanel lang={lang} file={file} loading={loading} fileInputRef={fileInputRef} onLoad={loadFile} />
          </div>

          {file && (
            <div className={cn("md:block", mobileTab !== 'settings' && 'hidden')}>
              <PasswordPanel
                lang={lang}
                password={password}
                showPassword={showPassword}
                onPasswordChange={setPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />
            </div>
          )}

          {file && (
            <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
              <UnlockPanel lang={lang} unlocking={unlocking} error={error} success={success} onUnlock={unlock} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
