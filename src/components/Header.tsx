import { Menu } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  t: any;
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
}

export function Header({ lang, t, onToggleLang, onOpenMobileMenu }: Props) {
  return (
    <header className="flex items-center justify-between bg-[#0F1115]/90 backdrop-blur-xl border-b border-white/[0.06] shrink-0 overflow-visible">
      <div className="flex items-center">
        <img src="/UniTool_logo.png" alt="UniTool Logo" className="w-32 h-32 sm:w-40 sm:h-40 object-contain -my-8 sm:-my-12" />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4">
        <button
          onClick={onToggleLang}
          className="text-[9px] font-mono text-gray-400 hover:text-white hover:border-white/[0.15] px-2.5 py-1.5 rounded-md transition-all uppercase font-bold bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] sm:text-[10px]"
        >
          {t.lang}
        </button>

        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
