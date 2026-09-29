import { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download, Sparkles } from 'lucide-react';
import {
  makeKotlinExport,
  makeLogoSvg,
  type LogoDesign,
  type LogoFont,
  type LogoLayout,
  type LogoMark,
} from '../lib/logoStudio';

interface Props {
  lang: 'ar' | 'en';
}

const PALETTES = [
  { name: 'Ocean', primary: '#22D3EE', secondary: '#6366F1' },
  { name: 'Sunset', primary: '#F97316', secondary: '#EC4899' },
  { name: 'Forest', primary: '#4ADE80', secondary: '#14B8A6' },
  { name: 'Gold', primary: '#FACC15', secondary: '#F97316' },
  { name: 'Royal', primary: '#C084FC', secondary: '#60A5FA' },
];

const inputClass = 'mt-1.5 w-full rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400';
const buttonClass = 'rounded-xl border border-[#2D3139] px-3 py-2 text-xs text-gray-300 transition hover:border-indigo-400 hover:text-white';

export function LogoStudio({ lang }: Props) {
  const isAr = lang === 'ar';
  const text = (ar: string, en: string) => isAr ? ar : en;
  const [design, setDesign] = useState<LogoDesign>({
    name: 'UniTool',
    tagline: isAr ? 'أفكارك، أدواتك' : 'TOOLS FOR YOUR IDEAS',
    primary: '#22D3EE',
    secondary: '#6366F1',
    mark: 'orbit',
    layout: 'horizontal',
    font: 'sans',
  });
  const [background, setBackground] = useState<'transparent' | 'light' | 'dark'>('transparent');
  const [notice, setNotice] = useState('');

  const svg = useMemo(() => makeLogoSvg(design), [design]);
  const kotlin = useMemo(() => makeKotlinExport(svg), [svg]);
  const update = <K extends keyof LogoDesign>(key: K, value: LogoDesign[K]) => {
    setDesign(current => ({ ...current, [key]: value }));
  };

  const download = (contents: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async (contents: string, success: string) => {
    try {
      await navigator.clipboard.writeText(contents);
      setNotice(success);
    } catch (error) {
      setNotice(text('تعذّر النسخ. تحقق من صلاحية الحافظة في المتصفح.', 'Copy failed. Check browser clipboard permissions.'));
      console.error('Logo export copy failed', error);
    }
  };

  const labels: Record<LogoMark, string> = {
    orbit: text('مدار', 'Orbit'),
    spark: text('شرارة', 'Spark'),
    diamond: text('ماسة', 'Diamond'),
    bolt: text('صاعقة', 'Bolt'),
  };
  const previewBackground = background === 'light'
    ? '#F4F5F7'
    : background === 'dark'
      ? '#090B10'
      : 'transparent';

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3 py-1 text-[10px] font-medium text-indigo-200">
            <Sparkles size={13} />
            {text('استوديو الهوية البصرية', 'Visual identity studio')}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {text('صمّم شعار علامتك', 'Design your brand logo')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            {text('أنشئ شعارًا متناسقًا، جرّب تدرجات الألوان، ثم صدّره بصيغة SVG أو كمكوّن Kotlin جاهز لتطبيق Android.', 'Build a polished logo, blend two colors, then export SVG artwork or a Kotlin component for Android.')}
          </p>
        </div>
        {notice && (
          <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-xs text-emerald-200">
            {notice}
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <section className="space-y-5 rounded-2xl border border-[#252A34] bg-[#14171C] p-4 sm:p-6" aria-label={text('إعدادات الشعار', 'Logo settings')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-300">
              {text('اسم العلامة', 'Brand name')}
              <input className={inputClass} value={design.name} maxLength={36} onChange={event => update('name', event.target.value)} />
            </label>
            <label className="text-xs font-medium text-gray-300">
              {text('الشعار النصي', 'Tagline')}
              <input className={inputClass} value={design.tagline} maxLength={52} placeholder={text('جملة قصيرة أسفل الاسم', 'A short line below your name')} onChange={event => update('tagline', event.target.value)} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-300">
              {text('شكل الرمز', 'Symbol')}
              <select className={inputClass} value={design.mark} onChange={event => update('mark', event.target.value as LogoMark)}>
                {(Object.keys(labels) as LogoMark[]).map(mark => <option key={mark} value={mark}>{labels[mark]}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-300">
              {text('الخط', 'Typography')}
              <select className={inputClass} value={design.font} onChange={event => update('font', event.target.value as LogoFont)}>
                <option value="sans">{text('هندسي حديث', 'Modern sans-serif')}</option>
                <option value="serif">{text('كلاسيكي أنيق', 'Elegant serif')}</option>
                <option value="mono">{text('تقني', 'Technical mono')}</option>
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-gray-300">{text('تكوين الشعار', 'Logo layout')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['horizontal', text('أفقي', 'Horizontal')],
                ['stacked', text('عمودي', 'Stacked')],
              ] as [LogoLayout, string][]).map(([layout, label]) => (
                <button
                  key={layout}
                  type="button"
                  aria-pressed={design.layout === layout}
                  className={`${buttonClass} ${design.layout === layout ? 'border-indigo-400 bg-indigo-400/10 text-white' : ''}`}
                  onClick={() => update('layout', layout)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-gray-300">{text('امزج لونين', 'Blend two colors')}</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2 text-xs text-gray-400">
                {text('اللون الأول', 'Color one')}
                <input aria-label={text('اللون الأول', 'Color one')} className="h-8 w-10 cursor-pointer rounded-md bg-transparent" type="color" value={design.primary} onChange={event => update('primary', event.target.value)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2 text-xs text-gray-400">
                {text('اللون الثاني', 'Color two')}
                <input aria-label={text('اللون الثاني', 'Color two')} className="h-8 w-10 cursor-pointer rounded-md bg-transparent" type="color" value={design.secondary} onChange={event => update('secondary', event.target.value)} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PALETTES.map(palette => (
                <button
                  key={palette.name}
                  type="button"
                  aria-label={`${text('لوحة ألوان', 'Color palette')} ${palette.name}`}
                  title={palette.name}
                  className="h-7 w-12 rounded-full border border-white/15 transition hover:scale-105"
                  style={{ background: `linear-gradient(110deg, ${palette.primary}, ${palette.secondary})` }}
                  onClick={() => setDesign(current => ({ ...current, primary: palette.primary, secondary: palette.secondary }))}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-gray-300">{text('خلفية المعاينة', 'Preview background')}</legend>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['transparent', text('شفافة', 'Transparent')],
                ['light', text('فاتحة', 'Light')],
                ['dark', text('داكنة', 'Dark')],
              ] as ['transparent' | 'light' | 'dark', string][]).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={background === value} className={`${buttonClass} ${background === value ? 'border-indigo-400 bg-indigo-400/10 text-white' : ''}`} onClick={() => setBackground(value)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="flex min-w-0 flex-col gap-4" aria-label={text('معاينة وتصدير', 'Preview and export')}>
          <div
            className="flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#252A34] p-6 sm:min-h-[340px]"
            style={{
              backgroundColor: previewBackground,
              backgroundImage: background === 'transparent'
                ? 'linear-gradient(45deg,#20242c 25%,transparent 25%),linear-gradient(-45deg,#20242c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#20242c 75%),linear-gradient(-45deg,transparent 75%,#20242c 75%)'
                : undefined,
              backgroundSize: background === 'transparent' ? '20px 20px' : undefined,
              backgroundPosition: background === 'transparent' ? '0 0,0 10px,10px -10px,-10px 0' : undefined,
            }}
          >
            <div className="w-full max-w-[560px]" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400" onClick={() => download(svg, 'unitool-logo.svg', 'image/svg+xml;charset=utf-8')}>
              <Download size={16} />
              {text('تنزيل SVG', 'Download SVG')}
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-400/[0.08] px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-400/[0.15]" onClick={() => download(kotlin, 'BrandLogo.kt', 'text/x-kotlin;charset=utf-8')}>
              <Code2 size={16} />
              {text('تصدير Kotlin', 'Export Kotlin')}
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D3139] px-4 py-2.5 text-xs text-gray-300 transition hover:bg-white/[0.04] hover:text-white" onClick={() => copy(svg, text('تم نسخ كود SVG.', 'SVG copied to clipboard.'))}>
              <Copy size={14} />
              {text('نسخ كود SVG', 'Copy SVG code')}
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D3139] px-4 py-2.5 text-xs text-gray-300 transition hover:bg-white/[0.04] hover:text-white" onClick={() => copy(kotlin, text('تم نسخ كود Kotlin.', 'Kotlin copied to clipboard.'))}>
              {notice.includes('نسخ') || notice.includes('copied') ? <Check size={14} /> : <Copy size={14} />}
              {text('نسخ Kotlin', 'Copy Kotlin')}
            </button>
          </div>
          <p className="text-[11px] leading-5 text-gray-500">
            {text('كود Kotlin المُصدّر يحتوي على رسم SVG متجهي ومكوّن Jetpack Compose لعرضه في Android عبر WebView.', 'The Kotlin export includes the vector SVG and a Jetpack Compose component that displays it in Android using WebView.')}
          </p>
        </section>
      </div>
    </main>
  );
}
