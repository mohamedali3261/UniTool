import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { tools } from './utils/tools';
import { FeaturedToolCard } from './components/FeaturedToolCard';
import { ToolCard } from './components/ToolCard';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

export function PdfTools({ t, lang, onNavigate }: Props) {
  const featured = tools[0];
  const row1 = [tools[1], tools[2]];
  const row2 = [tools[3], tools[4]];
  const row3 = [tools[5], tools[6]];
  const row4 = [tools[7], tools[8]];
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
          <FeaturedToolCard tool={featured} lang={lang} onNavigate={onNavigate} />

          <div className="grid grid-cols-2 gap-3 mb-3">
            {row1.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} lang={lang} onNavigate={onNavigate} delay={0.08 + i * 0.06} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {row2.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} lang={lang} onNavigate={onNavigate} delay={0.14 + i * 0.06} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {row3.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} lang={lang} onNavigate={onNavigate} delay={0.2 + i * 0.06} />
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
