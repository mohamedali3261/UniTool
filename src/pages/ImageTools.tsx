import { motion } from 'motion/react';
import { Eraser, Percent, Scissors, LayoutGrid, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

const tools = [
  {
    id: 'imageCropper',
    icon: Scissors,
    titleAr: 'قص الصور',
    titleEn: 'Crop Images',
    descAr: 'قص وتدوير وتعديل أبعاد الصور بدقة',
    descEn: 'Crop, rotate and resize images with precision',
    gradient: 'from-violet-500/30 to-indigo-500/15',
    iconBg: 'bg-violet-500/20',
    tag: { labelAr: 'تعديل', labelEn: 'Edit', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  },
  {
    id: 'bgRemover',
    icon: Eraser,
    titleAr: 'إزالة الخلفية',
    titleEn: 'Remove Background',
    descAr: 'احذف خلفية الصورة تلقائياً بضغطة واحدة',
    descEn: 'Remove image background automatically',
    gradient: 'from-emerald-500/30 to-teal-500/15',
    iconBg: 'bg-emerald-500/20',
    tag: { labelAr: 'خلفية', labelEn: 'Bg', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  },
  {
    id: 'imageCompressor',
    icon: Percent,
    titleAr: 'ضغط الصور',
    titleEn: 'Compress Images',
    descAr: 'ضغط الصور مع الحفاظ على الجودة العالية',
    descEn: 'Compress images while preserving quality',
    gradient: 'from-amber-500/30 to-orange-500/15',
    iconBg: 'bg-amber-500/20',
    tag: { labelAr: 'ضغط', labelEn: 'Size', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  },
];

export function ImageTools({ t, lang, onNavigate }: Props) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .img-tools-scroll {
          direction: ltr;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .img-tools-scroll::-webkit-scrollbar { width: 4px; }
        .img-tools-scroll::-webkit-scrollbar-track { background: transparent; }
        .img-tools-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .img-tools-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .img-tools-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 sm:w-8 sm:h-8">
          <LayoutGrid size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'أدوات الصور' : 'Image Tools'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'جميع أدوات تحرير الصور في مكان واحد' : 'All image editing tools in one place'}</p>
        </div>
      </div>

      <div className="flex-1 img-tools-scroll">
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((tool, i) => (
              <motion.button
                key={tool.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onNavigate(tool.id)}
                className="group relative text-left"
              >
                <div className={cn(
                  "relative p-4 rounded-xl border border-white/[0.06] overflow-hidden transition-all duration-300",
                  "bg-white/[0.03] backdrop-blur-xl",
                  "hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-lg hover:shadow-white/[0.02]"
                )}>
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity group-hover:opacity-30",
                    tool.gradient
                  )} />
                  <div className="relative z-10 flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-xl transition-transform group-hover:scale-110",
                      tool.iconBg
                    )}>
                      <tool.icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-xs font-bold text-white truncate">
                          {lang === 'ar' ? tool.titleAr : tool.titleEn}
                        </h3>
                        <span className={cn(
                          "text-[6px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0",
                          tool.tag.color
                        )}>
                          {lang === 'ar' ? tool.tag.labelAr : tool.tag.labelEn}
                        </span>
                      </div>
                      <p className="text-[8px] text-white/40 font-mono leading-relaxed line-clamp-2">
                        {lang === 'ar' ? tool.descAr : tool.descEn}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[7px] font-mono text-white/30 group-hover:text-white/50 transition-colors">
                        <span>{lang === 'ar' ? 'فتح الأداة' : 'Open tool'}</span>
                        <ArrowRight size={8} className={lang === 'ar' ? 'rotate-180' : ''} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-6 pb-2 text-[7px] text-gray-600 font-mono"
          >
            {lang === 'ar' ? 'كل أدوات تحرير الصور في متناول يدك' : 'All image editing tools at your fingertips'}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
