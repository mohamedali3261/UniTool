import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import type { PdfTool } from '../types';

interface Props {
  tool: PdfTool;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
  delay: number;
}

export function ToolCard({ tool, lang, onNavigate, delay }: Props) {
  return (
    <motion.button
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onNavigate(tool.id)}
      className="group relative text-left"
    >
      <div className={cn("relative rounded-2xl overflow-hidden transition-all duration-300 border h-full", tool.border, "bg-gradient-to-br", tool.color, "backdrop-blur-sm hover:shadow-xl", tool.glow, "hover:-translate-y-0.5")}>
        <div className="absolute -bottom-4 -left-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"><tool.icon size={80} className="text-white" /></div>
        <div className="relative z-10 p-4 flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg", tool.iconBg)}><tool.icon size={20} className="text-white" /></div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] sm:text-xs font-extrabold text-white truncate mb-1">{lang === 'ar' ? tool.titleAr : tool.titleEn}</h3>
            <p className="text-[8px] sm:text-[9px] text-white/40 font-mono leading-relaxed line-clamp-2">{lang === 'ar' ? tool.descAr : tool.descEn}</p>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
