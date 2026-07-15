import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
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
    gradient: 'from-violet-500/40 to-indigo-500/20',
    borderGlow: 'hover:border-violet-500/50',
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
    gradient: 'from-emerald-500/40 to-teal-500/20',
    borderGlow: 'hover:border-emerald-500/50',
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
    gradient: 'from-amber-500/40 to-orange-500/20',
    borderGlow: 'hover:border-amber-500/50',
    iconBg: 'bg-amber-500/20',
    tag: { labelAr: 'ضغط', labelEn: 'Size', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  },
];

export function ImageTools({ t, lang, onNavigate }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % tools.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused]);

  const active = tools[activeIdx];

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
        <div className="flex flex-col items-center justify-center p-6 min-h-full">
          <div className="w-full max-w-lg mx-auto">
            <div
              className="relative overflow-hidden mb-8"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="flex items-center justify-center gap-2 py-3">
                {tools.map((tool, i) => {
                  const isActive = i === activeIdx;
                  return (
                    <motion.button
                      key={tool.id}
                      layout
                      onClick={() => { setActiveIdx(i); setPaused(true); }}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 shrink-0",
                        isActive
                          ? "border-white/20 bg-white/10 shadow-lg"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeBg"
                          className={cn(
                            "absolute inset-0 rounded-full opacity-20",
                            tool.gradient.replace('/40', '/30').replace('/20', '/30')
                          )}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <tool.icon size={11} className={cn("relative z-10", isActive ? "text-white" : "text-gray-500")} />
                      <span className={cn(
                        "relative z-10 text-[7px] font-mono uppercase tracking-wider whitespace-nowrap",
                        isActive ? "text-white font-bold" : "text-gray-500"
                      )}>
                        {lang === 'ar' ? tool.tag.labelAr : tool.tag.labelEn}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ y: 15, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -15, opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.04] backdrop-blur-xl"
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-30",
                  active.gradient
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative z-10 p-6 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xl",
                    active.iconBg
                  )}>
                    <active.icon size={26} className="text-white" />
                  </div>
                  <h2 className="text-base font-bold text-white mb-1">
                    {lang === 'ar' ? active.titleAr : active.titleEn}
                  </h2>
                  <p className="text-[9px] text-white/50 font-mono leading-relaxed mb-5 max-w-xs mx-auto">
                    {lang === 'ar' ? active.descAr : active.descEn}
                  </p>
                  <button
                    onClick={() => onNavigate(active.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all bg-white/10 hover:bg-white/15 text-white border border-white/[0.08] hover:border-white/[0.15]"
                  >
                    {lang === 'ar' ? 'فتح الأداة' : 'Open Tool'}
                    <ArrowRight size={12} className={lang === 'ar' ? 'rotate-180' : ''} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5 mt-6">
              {tools.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveIdx(i); setPaused(true); }}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === activeIdx ? "w-5 h-1.5 bg-white/40" : "w-1.5 h-1.5 bg-white/10 hover:bg-white/20"
                  )}
                />
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-4 text-[7px] text-gray-600 font-mono"
            >
              {paused
                ? (lang === 'ar' ? 'متوقف' : 'Paused')
                : (lang === 'ar' ? 'يتحرك تلقائياً' : 'Auto-rotating')}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
