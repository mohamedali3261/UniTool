import { motion } from 'motion/react';
import { Zap, Music, Image, Film, FileType2, FileBox, Sparkles, ArrowRight, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

const tools = [
  {
    id: 'compress',
    icon: Music,
    titleAr: 'ضغط الصوت',
    titleEn: 'Audio Compression',
    descAr: 'ضغط وتحسين جودة الملفات الصوتية مع دعم MP3, AAC, Opus',
    descEn: 'Compress and enhance audio files with MP3, AAC, Opus support',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/20 hover:border-blue-400/40',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    glow: 'group-hover:shadow-blue-500/20',
    featured: true,
  },
  {
    id: 'imageCompressor',
    icon: Image,
    titleAr: 'ضغط الصور',
    titleEn: 'Image Compression',
    descAr: 'ضغط الصور مع الحفاظ على الجودة — WebP, JPEG, PNG',
    descEn: 'Compress images while preserving quality — WebP, JPEG, PNG',
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20 hover:border-amber-400/40',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    glow: 'group-hover:shadow-amber-500/20',
    featured: false,
  },
  {
    id: 'videoCompressor',
    icon: Film,
    titleAr: 'ضغط الفيديو',
    titleEn: 'Video Compression',
    descAr: 'تقليل حجم الفيديو مع الحفاظ على الجودة — H.264, CRF',
    descEn: 'Reduce video size while preserving quality — H.264, CRF',
    color: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/20 hover:border-rose-400/40',
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
    glow: 'group-hover:shadow-rose-500/20',
    featured: false,
  },
  {
    id: 'pdfCompressor',
    icon: FileType2,
    titleAr: 'ضغط PDF',
    titleEn: 'PDF Compression',
    descAr: 'تحسين وضغط ملفات PDF — تقليل الحجم دون فقدان المحتوى',
    descEn: 'Optimize and compress PDF files — reduce size without losing content',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/20 hover:border-red-400/40',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    glow: 'group-hover:shadow-red-500/20',
    featured: false,
  },
  {
    id: 'officeCompressor',
    icon: FileBox,
    titleAr: 'ضغط ملفات أوفيس',
    titleEn: 'Office Compression',
    descAr: 'ضغط Word و Excel و PowerPoint — تقليل حجم الصور المضمنة',
    descEn: 'Compress Word, Excel & PowerPoint — reduce embedded images',
    color: 'from-sky-500/20 to-blue-500/20',
    border: 'border-sky-500/20 hover:border-sky-400/40',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
    glow: 'group-hover:shadow-sky-500/20',
    featured: false,
  },
];

export function CompressionTools({ t, lang, onNavigate }: Props) {
  const featured = tools[0];
  const mid = [tools[1], tools[2]];
  const small = [tools[3], tools[4]];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .comp-tools-scroll {
          direction: ltr;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .comp-tools-scroll::-webkit-scrollbar { width: 4px; }
        .comp-tools-scroll::-webkit-scrollbar-track { background: transparent; }
        .comp-tools-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .comp-tools-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .comp-tools-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 sm:w-8 sm:h-8">
          <LayoutGrid size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'أدوات الضغط' : 'Compression Tools'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'جميع أدوات الضغط في مكان واحد' : 'All compression tools in one place'}</p>
        </div>
      </div>

      <div className="flex-1 comp-tools-scroll">
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Row 1: Featured full-width card */}
          <motion.button
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0, type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => onNavigate(featured.id)}
            className="group relative w-full text-left mb-3"
          >
            <div className={cn(
              "relative rounded-2xl overflow-hidden transition-all duration-300 border",
              featured.border,
              "bg-gradient-to-br", featured.color,
              "backdrop-blur-sm hover:shadow-xl", featured.glow,
              "hover:-translate-y-0.5"
            )}>
              <div className="absolute -bottom-6 -left-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <featured.icon size={140} className="text-white" />
              </div>
              <div className="relative z-10 p-5 sm:p-6 flex items-center gap-5">
                <div className={cn("w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-xl", featured.iconBg)}>
                  <featured.icon size={28} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-base sm:text-lg font-extrabold text-white truncate">{lang === 'ar' ? featured.titleAr : featured.titleEn}</h3>
                    <Sparkles size={14} className="text-yellow-400 shrink-0" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-white/40 font-mono leading-relaxed line-clamp-2">{lang === 'ar' ? featured.descAr : featured.descEn}</p>
                </div>
                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] group-hover:bg-white/[0.12] transition-all duration-300 group-hover:scale-110">
                  <ArrowRight size={16} className={cn("text-white/40 group-hover:text-white/80 transition-colors", lang === 'ar' ? 'rotate-180' : '')} />
                </div>
              </div>
            </div>
          </motion.button>

          {/* Row 2: Two medium cards */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {mid.map((tool, i) => (
              <motion.button
                key={tool.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => onNavigate(tool.id)}
                className="group relative text-left"
              >
                <div className={cn(
                  "relative rounded-2xl overflow-hidden transition-all duration-300 border h-full",
                  tool.border,
                  "bg-gradient-to-br", tool.color,
                  "backdrop-blur-sm hover:shadow-xl", tool.glow,
                  "hover:-translate-y-0.5"
                )}>
                  <div className="absolute -bottom-4 -left-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <tool.icon size={80} className="text-white" />
                  </div>
                  <div className="relative z-10 p-4 flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg", tool.iconBg)}>
                      <tool.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] sm:text-xs font-extrabold text-white truncate mb-1">{lang === 'ar' ? tool.titleAr : tool.titleEn}</h3>
                      <p className="text-[8px] sm:text-[9px] text-white/40 font-mono leading-relaxed line-clamp-2">{lang === 'ar' ? tool.descAr : tool.descEn}</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Row 3: Two small cards */}
          <div className="grid grid-cols-2 gap-3">
            {small.map((tool, i) => (
              <motion.button
                key={tool.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => onNavigate(tool.id)}
                className="group relative text-left"
              >
                <div className={cn(
                  "relative rounded-2xl overflow-hidden transition-all duration-300 border h-full",
                  tool.border,
                  "bg-gradient-to-br", tool.color,
                  "backdrop-blur-sm hover:shadow-xl", tool.glow,
                  "hover:-translate-y-0.5"
                )}>
                  <div className="absolute -bottom-4 -left-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <tool.icon size={60} className="text-white" />
                  </div>
                  <div className="relative z-10 p-3.5 flex items-center gap-2.5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg", tool.iconBg)}>
                      <tool.icon size={17} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[10px] sm:text-[11px] font-extrabold text-white truncate mb-0.5">{lang === 'ar' ? tool.titleAr : tool.titleEn}</h3>
                      <p className="text-[7px] sm:text-[8px] text-white/40 font-mono leading-relaxed line-clamp-2">{lang === 'ar' ? tool.descAr : tool.descEn}</p>
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
            {lang === 'ar' ? 'ضغط سريع لكل الصيغ' : 'Fast compression for all formats'}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
