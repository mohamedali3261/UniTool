import { motion } from 'motion/react';
import { Zap, Percent, FileArchive, LayoutGrid, Sparkles, Video, FileText as FileTextIcon, ArrowRight, Music, Image, Film, FileType2, FileBox } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

interface Tool {
  id: string;
  icon: any;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  gradient: string;
  iconBg: string;
  tag: { labelAr: string; labelEn: string; color: string };
}

const audioTools: Tool[] = [
  {
    id: 'compress',
    icon: Music,
    titleAr: 'ضغط الصوت',
    titleEn: 'Audio Compression',
    descAr: 'ضغط وتحسين جودة الملفات الصوتية مع دعم MP3, AAC, Opus',
    descEn: 'Compress and enhance audio files with MP3, AAC, Opus support',
    gradient: 'from-blue-500/30 to-indigo-500/15',
    iconBg: 'bg-blue-500/20',
    tag: { labelAr: 'صوت', labelEn: 'Audio', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  },
];

const visualTools: Tool[] = [
  {
    id: 'imageCompressor',
    icon: Image,
    titleAr: 'ضغط الصور',
    titleEn: 'Image Compression',
    descAr: 'ضغط الصور مع الحفاظ على الجودة — WebP, JPEG, PNG',
    descEn: 'Compress images while preserving quality — WebP, JPEG, PNG',
    gradient: 'from-amber-500/30 to-orange-500/15',
    iconBg: 'bg-amber-500/20',
    tag: { labelAr: 'صور', labelEn: 'Image', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  },
  {
    id: 'videoCompressor',
    icon: Film,
    titleAr: 'ضغط الفيديو',
    titleEn: 'Video Compression',
    descAr: 'تقليل حجم الفيديو مع الحفاظ على الجودة — H.264, CRF',
    descEn: 'Reduce video size while preserving quality — H.264, CRF',
    gradient: 'from-rose-500/30 to-pink-500/15',
    iconBg: 'bg-rose-500/20',
    tag: { labelAr: 'فيديو', labelEn: 'Video', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  },
];

const documentTools: Tool[] = [
  {
    id: 'pdfCompressor',
    icon: FileType2,
    titleAr: 'ضغط PDF',
    titleEn: 'PDF Compression',
    descAr: 'تحسين وضغط ملفات PDF — تقليل الحجم دون فقدان المحتوى',
    descEn: 'Optimize and compress PDF files — reduce size without losing content',
    gradient: 'from-red-500/30 to-orange-500/15',
    iconBg: 'bg-red-500/20',
    tag: { labelAr: 'PDF', labelEn: 'PDF', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  },
  {
    id: 'officeCompressor',
    icon: FileBox,
    titleAr: 'ضغط ملفات أوفيس',
    titleEn: 'Office Compression',
    descAr: 'ضغط Word و Excel و PowerPoint — تقليل حجم الصور المضمنة',
    descEn: 'Compress Word, Excel & PowerPoint — reduce embedded images',
    gradient: 'from-sky-500/30 to-blue-500/15',
    iconBg: 'bg-sky-500/20',
    tag: { labelAr: 'مستندات', labelEn: 'Docs', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  },
];

const sections = [
  { id: 'audio', labelAr: 'صوتي', labelEn: 'Audio', tools: audioTools },
  { id: 'visual', labelAr: 'مرئي', labelEn: 'Visual', tools: visualTools },
  { id: 'documents', labelAr: 'مستندات', labelEn: 'Documents', tools: documentTools },
];

export function CompressionTools({ t, lang, onNavigate }: Props) {
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
          {sections.map((section, si) => (
            <motion.div
              key={section.id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: si * 0.1 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-px bg-white/10" />
                <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-gray-500">
                  {lang === 'ar' ? section.labelAr : section.labelEn}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.tools.map((tool, i) => (
                  <motion.button
                    key={tool.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: si * 0.1 + i * 0.05 }}
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
            </motion.div>
          ))}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-2 pb-4 text-[7px] text-gray-600 font-mono"
          >
            {lang === 'ar' ? 'ضغط سريع لكل الصيغ' : 'Fast compression for all formats'}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
