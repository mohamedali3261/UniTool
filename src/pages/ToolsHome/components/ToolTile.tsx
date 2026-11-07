import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ToolEntry } from '../data';

interface Props {
  tool: ToolEntry;
  lang: 'ar' | 'en';
  delay: number;
  onNavigate: (page: string) => void;
}

export function ToolTile({ tool, lang, delay, onNavigate }: Props) {
  return (
    <motion.button
      data-tool-card
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 320, damping: 26 }}
      onClick={() => tool.href ? window.location.assign(tool.href) : onNavigate(tool.id)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white/[0.02] p-3.5 text-start',
        'transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.04] hover:shadow-xl',
        tool.border, tool.glow
      )}
    >
      <div className="absolute -top-10 -end-10 h-24 w-24 rounded-full bg-white/[0.03] blur-2xl transition-opacity duration-300 group-hover:bg-white/[0.06]" />

      <div className="relative flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
          'transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3',
          tool.gradient
        )}>
          <tool.icon size={17} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[11px] font-bold text-white">
              {lang === 'ar' ? tool.titleAr : tool.titleEn}
            </h3>
            {tool.badgeAr && (
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-px text-[6px] font-mono uppercase tracking-wider text-gray-300">
                {lang === 'ar' ? tool.badgeAr : tool.badgeEn}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[8px] leading-relaxed text-gray-500">
            {lang === 'ar' ? tool.descAr : tool.descEn}
          </p>
          {tool.id === 'cvStudio' && (
            <div
              data-testid="cv-studio-tile-preview"
              aria-hidden="true"
              className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1.5"
            >
              <div className="relative h-7 w-5 shrink-0 overflow-hidden rounded-[3px] border border-emerald-500/30 bg-white shadow-xs">
                <span className="block h-[2px] w-full bg-[#24795e]" />
                <span className="mx-0.5 mt-1 block h-[2px] w-3 rounded-full bg-gray-700" />
                <span className="mx-0.5 mt-0.5 block h-[1.5px] w-3.5 rounded-full bg-gray-300" />
                <span className="mx-0.5 mt-0.5 block h-[1.5px] w-2.5 rounded-full bg-gray-300" />
                <motion.span
                  className="absolute inset-x-0 h-1.5 bg-[#24795e]/25"
                  animate={{ top: ['15%', '75%', '15%'] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="min-w-0 flex-1 text-[7.5px] font-semibold text-emerald-400">
                {lang === 'ar' ? 'معاينة A4 حية · فاحص ATS 96%' : 'Live A4 Sheet · ATS 96%'}
              </div>
            </div>
          )}
        </div>

        <ArrowUpRight
          size={12}
          className="mt-0.5 shrink-0 text-gray-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-300 rtl:group-hover:-translate-x-0.5"
        />
      </div>
    </motion.button>
  );
}
