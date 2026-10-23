import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Search, X, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toolCategories, totalToolCount } from './data';
import { ToolTile } from './components/ToolTile';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onNavigate: (page: string) => void;
}

export function ToolsHome({ lang, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return toolCategories
      .filter(c => activeCategory === 'all' || c.id === activeCategory)
      .map(c => ({
        ...c,
        tools: q
          ? c.tools.filter(tool =>
              [tool.titleAr, tool.titleEn, tool.descAr, tool.descEn]
                .join(' ')
                .toLowerCase()
                .includes(q)
            )
          : c.tools,
      }))
      .filter(c => c.tools.length > 0);
  }, [q, activeCategory]);

  const resultCount = filtered.reduce((sum, c) => sum + c.tools.length, 0);

  const stats = [
    { icon: Sparkles, ar: `${totalToolCount}+ أداة`, en: `${totalToolCount}+ tools` },
    { icon: ShieldCheck, ar: 'خصوصية كاملة', en: 'Fully private' },
    { icon: Zap, ar: 'يعمل بدون رفع', en: 'Runs offline' },
  ];

  const chips = [
    { id: 'all', ar: 'الكل', en: 'All', icon: LayoutDashboard },
    ...toolCategories.map(c => ({ id: c.id, ar: c.titleAr, en: c.titleEn, icon: c.icon })),
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .tools-home-scroll {
          direction: ltr;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .tools-home-scroll::-webkit-scrollbar { width: 4px; }
        .tools-home-scroll::-webkit-scrollbar-track { background: transparent; }
        .tools-home-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .tools-home-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .tools-home-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 sm:w-8 sm:h-8">
          <LayoutDashboard size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'كل الأدوات' : 'All Tools'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {lang === 'ar' ? 'دليلك السريع لكل أداة في UniTool' : 'Your quick guide to every UniTool tool'}
          </p>
        </div>
      </div>

      <div className="flex-1 tools-home-scroll">
        <div className="relative overflow-hidden border-b border-white/[0.06]">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(600px 240px at 15% -20%, rgba(99,102,241,.22), transparent 70%), radial-gradient(500px 220px at 85% 0%, rgba(244,63,94,.16), transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(ellipse at top, black, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 75%)',
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-5 sm:pt-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-[7px] font-mono uppercase tracking-[0.18em] text-indigo-300">
                <Sparkles size={9} />
                UniTool · Toolbox
              </span>

              <h2 className="mt-3 text-xl sm:text-2xl lg:text-[28px] font-extrabold leading-tight text-white">
                {lang === 'ar' ? (
                  <>
                    كل اللي محتاجه{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                      في مكان واحد
                    </span>
                  </>
                ) : (
                  <>
                    Everything you need{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                      in one place
                    </span>
                  </>
                )}
              </h2>

              <p className="mt-2 max-w-lg text-[9px] sm:text-[10px] leading-relaxed text-gray-400">
                {lang === 'ar'
                  ? 'أدوات سريعة لملفات PDF والصور والفيديو والصوت — كلها تعمل داخل المتصفح بدون رفع ملفاتك لأي سيرفر.'
                  : 'Fast tools for PDF, images, video and audio — all running in your browser without uploading your files anywhere.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {stats.map(s => (
                  <span
                    key={s.en}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[8px] font-medium text-gray-300"
                  >
                    <s.icon size={10} className="text-indigo-400" />
                    {lang === 'ar' ? s.ar : s.en}
                  </span>
                ))}
              </div>

              <div className="relative mt-4 max-w-md">
                <Search size={13} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={lang === 'ar' ? 'ابحث عن أداة... (مثال: ضغط، صور، PDF)' : 'Search for a tool... (e.g. PDF, image, audio)'}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B0D11]/80 py-2.5 ps-9 pe-9 text-[10px] text-white placeholder:text-gray-600 outline-none transition-colors focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/15"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
                    aria-label="Clear"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {chips.map(chip => {
              const active = activeCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveCategory(chip.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-semibold transition-all',
                    active
                      ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200 shadow-lg shadow-indigo-500/10'
                      : 'border-white/[0.07] bg-white/[0.02] text-gray-400 hover:border-white/[0.14] hover:text-gray-200'
                  )}
                >
                  <chip.icon size={10} />
                  {lang === 'ar' ? chip.ar : chip.en}
                </button>
              );
            })}
            {q && (
              <span className="ms-auto text-[8px] font-mono text-gray-500">
                {lang === 'ar' ? `${resultCount} نتيجة` : `${resultCount} results`}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {filtered.map((category, ci) => (
              <motion.section
                key={category.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.05, duration: 0.3 }}
              >
                <div className="mb-2.5 flex items-start gap-2">
                  <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-md', category.accent)}>
                    <category.icon size={13} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] font-extrabold text-white">
                        {lang === 'ar' ? category.titleAr : category.titleEn}
                      </h3>
                      <span className={cn('rounded-full border px-1.5 py-px text-[6px] font-mono', category.soft)}>
                        {category.tools.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[8px] text-gray-500">
                      {lang === 'ar' ? category.taglineAr : category.taglineEn}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool, i) => (
                    <ToolTile
                      key={tool.id}
                      tool={tool}
                      lang={lang}
                      delay={0.05 + ci * 0.04 + i * 0.02}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </motion.section>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-10 text-center">
                <Search size={20} className="mx-auto mb-2 text-gray-600" />
                <p className="text-[10px] font-semibold text-gray-300">
                  {lang === 'ar' ? 'مفيش أداة بالاسم ده' : 'No tool matches that search'}
                </p>
                <p className="mt-1 text-[8px] text-gray-500">
                  {lang === 'ar' ? 'جرّب كلمة تانية زي «PDF» أو «صور» أو «صوت»' : 'Try another keyword like "PDF", "image" or "audio"'}
                </p>
              </div>
            )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-8 pb-2 text-center text-[7px] font-mono text-gray-600"
          >
            {lang === 'ar'
              ? `${totalToolCount} أداة · تعمل بالكامل داخل المتصفح · ملفاتك لا تغادر جهازك`
              : `${totalToolCount} tools · fully browser-based · your files never leave your device`}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
