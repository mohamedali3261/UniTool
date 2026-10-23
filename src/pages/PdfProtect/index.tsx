import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { PdfProtectProps, PdfProtectTab, ProtectFile } from './types';
import { readPdfFile, protectPdfFile } from './utils';
import { Header } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { PasswordPanel } from './components/PasswordPanel';
import { ProtectPanel } from './components/ProtectPanel';

export function PdfProtect({ t, lang }: PdfProtectProps) {
  const [file, setFile] = useState<ProtectFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protecting, setProtecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<PdfProtectTab>('upload');

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

  const protect = async () => {
    if (!file || !password) return;
    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError(lang === 'ar' ? 'كلمة المرور 4 أحرف على الأقل' : 'Password must be at least 4 characters');
      return;
    }
    setProtecting(true);
    setError(null);
    setSuccess(false);
    try {
      await protectPdfFile(file);
      setSuccess(true);
    } catch {
      setError(lang === 'ar' ? 'خطأ في حماية الملف' : 'Error protecting file');
    }
    setProtecting(false);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-protect-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf-protect-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-protect-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-protect-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-protect-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-protect-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <Header lang={lang} mobileTab={mobileTab} onTabChange={setMobileTab} />

      <div className="flex-1 pdf-protect-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <UploadPanel lang={lang} file={file} loading={loading} fileInputRef={fileInputRef} onLoad={loadFile} />
          </div>

          {file && (
            <div className={cn("md:block", mobileTab !== 'settings' && 'hidden')} style={{ direction: 'ltr' }}>
              <PasswordPanel
                lang={lang}
                password={password}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirmPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />
            </div>
          )}

          {file && (
            <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
              <ProtectPanel
                lang={lang}
                protecting={protecting}
                error={error}
                success={success}
                canProtect={!!password && !!confirmPassword}
                onProtect={protect}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
