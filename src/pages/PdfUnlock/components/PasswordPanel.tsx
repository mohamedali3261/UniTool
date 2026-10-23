import { Eye, EyeOff } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  password: string;
  showPassword: boolean;
  onPasswordChange: (password: string) => void;
  onToggleShow: () => void;
}

export function PasswordPanel({ lang, password, showPassword, onPasswordChange, onToggleShow }: Props) {
  return (
    <>
      <label className="block text-[9px] font-mono text-gray-400 mb-2">{lang === 'ar' ? 'كلمة المرور (إن وُجدت)' : 'Password (if known)'}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          placeholder={lang === 'ar' ? 'أدخل كلمة المرور...' : 'Enter password...'}
          className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40"
        />
        <button onClick={onToggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </>
  );
}
