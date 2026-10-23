import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { PdfTool } from '../types';

interface Props {
  tool: PdfTool;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

export function FeaturedToolCard({ tool, lang, onNavigate }: Props) {
  return (
    <motion.button
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onNavigate(tool.id)}
      className="group relative w-full text-left mb-3"
    >
      <div className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-300 border",
        tool.border,
        "bg-gradient-to-br", tool.color,
        "backdrop-blur-sm hover:shadow-xl", tool.glow,
        "hover:-translate-y-0.5"
      )}>
        <div className="absolute -bottom-6 -left-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <tool.icon size={140} className="text-white" />
        </div>
        <div className="relative z-10 p-5 sm:p-6 flex items-center gap-5">
          <div className={cn("w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-xl", tool.iconBg)}>
            <tool.icon size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base sm:text-lg font-extrabold text-white truncate">{lang === 'ar' ? tool.titleAr : tool.titleEn}</h3>
              <Sparkles size={14} className="text-yellow-400 shrink-0" />
            </div>
            <p className="text-[9px] sm:text-[10px] text-white/40 font-mono leading-relaxed line-clamp-2">{lang === 'ar' ? tool.descAr : tool.descEn}</p>
          </div>
          <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] group-hover:bg-white/[0.12] transition-all duration-300 group-hover:scale-110">
            <ArrowRight size={16} className={cn("text-white/40 group-hover:text-white/80 transition-colors", lang === 'ar' ? 'rotate-180' : '')} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
