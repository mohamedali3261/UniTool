import { Menu } from 'lucide-react';
import { desktopNavItems } from '../config/navigation';
import { cn } from '../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  t: any;
  currentPage: string;
  onNavigate: (page: string) => void;
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
}

export function Header({ lang, t, currentPage, onNavigate, onToggleLang, onOpenMobileMenu }: Props) {
  return (
    <header className="flex items-center justify-between bg-[#0F1115]/90 backdrop-blur-xl border-b border-white/[0.06] shrink-0 overflow-visible">
      <div className="flex items-center">
        <img src="/UniTool_logo.png" alt="UniTool Logo" className="w-32 h-32 sm:w-40 sm:h-40 object-contain -my-8 sm:-my-12" />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center bg-white/[0.03] rounded-lg px-1.5 py-1 border border-white/[0.05]">
          {desktopNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all rounded-md flex items-center gap-1.5 relative",
                currentPage === item.id
                  ? "text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  : "text-gray-500 hover:text-gray-200"
              )}
            >
              <item.icon size={11} className={currentPage === item.id ? 'drop-shadow-[0_0_4px_rgba(99,102,241,0.6)]' : ''} />
              {lang === 'ar' ? item.labelAr : item.labelEn}
            </button>
          ))}
        </div>

        {/* Lang toggle */}
        <button
          onClick={onToggleLang}
          className="text-[9px] font-mono text-gray-400 hover:text-white hover:border-white/[0.15] px-2.5 py-1.5 rounded-md transition-all uppercase font-bold bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] sm:text-[10px]"
        >
          {t.lang}
        </button>

        {/* Hamburger (mobile/tablet) */}
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
