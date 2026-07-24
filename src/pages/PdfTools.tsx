import { motion } from 'motion/react';
import { FileText, Image, Type, ArrowDownToLine, Shrink, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

const tools = [
  {
    id: 'imageToPdf',
    icon: Image,
    titleAr: 'تحويل الصور إلى ملف PDF',
    titleEn: 'Convert Images to PDF',
    descAr: 'دمج وتحويل مجموعة الصور إلى ملف PDF واحد بجودة عالية',
    descEn: 'Merge and convert multiple images into a single high-quality PDF file',
    gradient: 'from-red-500/30 to-rose-500/15',
    iconBg: 'bg-red-500/20',
    tag: { labelAr: 'إنشاء', labelEn: 'Create', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  },
  {
    id: 'pdfToImage',
    icon: Image,
    titleAr: 'استخراج صفحات PDF كصور',
    titleEn: 'Extract PDF Pages as Images',
    descAr: 'تحويل صفحات ملف PDF إلى صور PNG أو JPG بدقة عالية',
    descEn: 'Convert PDF pages to high-resolution PNG or JPG images',
    gradient: 'from-orange-500/30 to-amber-500/15',
    iconBg: 'bg-orange-500/20',
    tag: { labelAr: 'تحويل', labelEn: 'Convert', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  },
  {
    id: 'pdfToWord',
    icon: Type,
    titleAr: 'تحويل PDF إلى مستند Word',
    titleEn: 'Convert PDF to Word Document',
    descAr: 'استخراج النصوص من ملف PDF وتحويلها إلى مستند Word قابل للتعديل',
    descEn: 'Extract text from PDF and convert it to an editable Word document',
    gradient: 'from-blue-500/30 to-indigo-500/15',
    iconBg: 'bg-blue-500/20',
    tag: { labelAr: 'تحويل', labelEn: 'Convert', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  },
  {
    id: 'wordToPdf',
    icon: FileText,
    titleAr: 'تحويل مستند Word إلى PDF',
    titleEn: 'Convert Word Document to PDF',
    descAr: 'تحويل ملف Word إلى PDF مع الحفاظ على التنسيق والتصميم',
    descEn: 'Convert Word files to PDF while preserving formatting and layout',
    gradient: 'from-cyan-500/30 to-blue-500/15',
    iconBg: 'bg-cyan-500/20',
    tag: { labelAr: 'تحويل', labelEn: 'Convert', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  },
  {
    id: 'pdfCompressor',
    icon: Shrink,
    titleAr: 'ضغط ملفات PDF لتقليل الحجم',
    titleEn: 'Compress PDF Files to Reduce Size',
    descAr: 'تقليل حجم ملفات PDF مع الحفاظ على جودة المحتوى والنصوص',
    descEn: 'Reduce PDF file size while maintaining content and text quality',
    gradient: 'from-emerald-500/30 to-teal-500/15',
    iconBg: 'bg-emerald-500/20',
    tag: { labelAr: 'ضغط', labelEn: 'Compress', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  },
];

export function PdfTools({ t, lang, onNavigate }: Props) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-tools-scroll {
          direction: ltr;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .pdf-tools-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-tools-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-tools-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-tools-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-tools-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'أدوات PDF' : 'PDF Tools'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'جميع أدوات التعامل مع ملفات PDF في مكان واحد' : 'All PDF tools in one place'}</p>
        </div>
      </div>

      <div className="flex-1 pdf-tools-scroll">
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-extrabold text-white truncate sm:text-base">
                          {lang === 'ar' ? tool.titleAr : tool.titleEn}
                        </h3>
                        <span className={cn(
                          "text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 font-bold",
                          tool.tag.color
                        )}>
                          {lang === 'ar' ? tool.tag.labelAr : tool.tag.labelEn}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/50 font-mono leading-relaxed line-clamp-2 sm:text-[10px]">
                        {lang === 'ar' ? tool.descAr : tool.descEn}
                      </p>
                      <div className="flex items-center gap-1 mt-2.5 text-[8px] font-mono text-white/40 group-hover:text-white/60 transition-colors">
                        <span>{lang === 'ar' ? 'فتح الأداة' : 'Open tool'}</span>
                        <ArrowRight size={10} className={lang === 'ar' ? 'rotate-180' : ''} />
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
            {lang === 'ar' ? 'كل أدوات PDF في متناول يدك' : 'All PDF tools at your fingertips'}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
