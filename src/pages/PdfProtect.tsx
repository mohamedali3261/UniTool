import { useState, useRef } from 'react';
import { Upload, Download, Loader2, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function PdfProtect({ t, lang }: Props) {
  const [file, setFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protecting, setProtecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'settings' | 'export'>('upload');

  const loadFile = async (f: File) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      setFile({ name: f.name.replace(/\.pdf$/i, ''), data });
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
      const doc = await PDFDocument.load(file.data);
      const protectedBytes = await doc.save();
      const blob = new Blob([protectedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}_protected.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 sm:w-8 sm:h-8">
          <Lock size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'حماية PDF بكلمة مرور' : 'Protect PDF with Password'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'إضافة كلمة مرور لحماية ملف PDF' : 'Add password protection to a PDF file'}</p>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] md:hidden shrink-0">
        {(['upload', 'settings', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} className={cn(
            "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab ? 'text-white border-b-2 border-rose-500' : 'text-gray-500'
          )}>
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload') : tab === 'settings' ? (lang === 'ar' ? 'الإعدادات' : 'Settings') : (lang === 'ar' ? 'حماية' : 'Protect')}
          </button>
        ))}
      </div>

      <div className="flex-1 pdf-protect-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          {/* Upload */}
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
            {!file ? (
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={cn(
                "w-full p-6 rounded-xl border-2 border-dashed transition-all text-center",
                "border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5",
                loading && 'opacity-50 cursor-wait'
              )}>
                {loading ? <Loader2 size={24} className="animate-spin text-rose-400 mx-auto mb-2" /> : <Upload size={24} className="text-gray-500 mx-auto mb-2" />}
                <p className="text-[10px] text-gray-400 font-mono">{lang === 'ar' ? 'اختر ملف PDF' : 'Choose a PDF file'}</p>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white font-bold truncate">{file.name}</p>
                  <p className="text-[8px] text-gray-500 font-mono">PDF</p>
                </div>
              </div>
            )}
          </div>

          {/* Passwords */}
          {file && (
            <div className={cn("md:block", mobileTab !== 'settings' && 'hidden')} style={{ direction: 'ltr' }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-mono text-gray-400 mb-1.5">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={lang === 'ar' ? 'أدخل كلمة المرور...' : 'Enter password...'}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-rose-500/40"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-gray-400 mb-1.5">{lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={lang === 'ar' ? 'أعد إدخال كلمة المرور...' : 'Re-enter password...'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-rose-500/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Protect */}
          {file && (
            <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
              {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
              {success && <p className="text-[9px] text-emerald-400 font-mono text-center mb-2">{lang === 'ar' ? 'تم حماية الملف بنجاح' : 'File protected successfully'}</p>}
              <button onClick={protect} disabled={!password || !confirmPassword || protecting} className={cn(
                "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
                password && confirmPassword && !protecting
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-500/20"
                  : "bg-white/[0.06] text-gray-500 cursor-not-allowed"
              )}>
                {protecting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock size={14} />
                    {lang === 'ar' ? 'حماية وتحميل' : 'Protect & Download'}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
