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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 320, damping: 26 }}
      onClick={() => onNavigate(tool.id)}
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
        </div>

        <ArrowUpRight
          size={12}
          className="mt-0.5 shrink-0 text-gray-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-300 rtl:group-hover:-translate-x-0.5"
        />
      </div>
    </motion.button>
  );
}
