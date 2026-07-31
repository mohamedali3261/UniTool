import { navItems } from '../config/navigation';
import { cn } from '../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ lang, currentPage, onNavigate }: Props) {
  return (
    <aside className="hidden md:flex w-60 lg:w-72 shrink-0 flex-col border-e border-white/[0.06] bg-gradient-to-b from-[#0C0E12] via-[#0A0C0F] to-[#08090C]">
      <div className="px-4 pt-4 pb-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-500">
            {lang === 'ar' ? 'قائمة الأدوات' : 'Tool Menu'}
          </p>
          <p className="text-[11px] font-semibold text-white/90 mt-0.5">
            {lang === 'ar' ? 'اختر أداة للعمل' : 'Choose a tool'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group relative w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-start transition-all duration-200',
                active
                  ? cn(item.activeBg, 'text-white')
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.035]'
              )}
            >
              {active && (
                <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-gradient-to-b from-white/80 to-white/20" />
              )}

              <span
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200',
                  'bg-gradient-to-br shadow-md',
                  item.color,
                  active ? 'scale-105 shadow-lg' : 'opacity-85 group-hover:opacity-100 group-hover:scale-[1.03]'
                )}
              >
                <item.icon size={16} className="text-white" />
              </span>

              <span className={cn(
                'text-[12px] leading-snug flex-1 min-w-0',
                active ? 'font-semibold' : 'font-medium'
              )}>
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/[0.05]">
        <p className="text-[8px] font-mono text-gray-600 text-center tracking-wider">
          UniTool · {navItems.length} {lang === 'ar' ? 'أدوات' : 'tools'}
        </p>
      </div>
    </aside>
  );
}
