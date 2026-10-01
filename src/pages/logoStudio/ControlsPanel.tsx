import { ArrowDown, ArrowUp, Copy, Layers3, Plus, RotateCcw, Save, Sparkles, Trash2, Upload, type LucideIcon } from 'lucide-react';
import { type RefObject } from 'react';
import { type LogoElement, type LogoElementType, type LogoFont, type LogoLayout, type LogoMark, type LogoDesign } from '../../lib/logoStudio';
import { ELEMENT_LABELS, PALETTES, PRESETS } from './constants';

interface ControlsPanelProps {
  design: LogoDesign;
  bg: 'transparent' | 'light' | 'dark' | 'custom';
  customBackground: string;
  notice: string;
  noticeIsError: boolean;
  fileRef: RefObject<HTMLInputElement>;
  onSave: () => void;
  onReset: () => void;
  onAddElement: (type: LogoElementType) => void;
  onUpdate: <K extends keyof LogoDesign>(key: K, value: LogoDesign[K]) => void;
  onUpdateElement: <K extends keyof LogoElement>(id: string, key: K, value: LogoElement[K]) => void;
  onRemoveElement: (id: string) => void;
  onShiftElement: (id: string, direction: -1 | 1) => void;
  onDuplicateElement: (element: LogoElement) => void;
  onImportSvg: (file?: File) => void;
  onBackgroundChange: (next: 'transparent' | 'light' | 'dark' | 'custom') => void;
  onCustomBackgroundChange: (value: string) => void;
  onApplyPreset: (presetId: string) => void;
  lang: 'ar' | 'en';
}

const inputClass = 'mt-1.5 w-full rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400';
const buttonClass = 'rounded-xl border border-[#2D3139] px-3 py-2 text-xs text-gray-300 transition hover:border-indigo-400 hover:text-white';

export function ControlsPanel({
  design,
  bg,
  customBackground,
  notice,
  noticeIsError,
  fileRef,
  onSave,
  onReset,
  onAddElement,
  onUpdate,
  onUpdateElement,
  onRemoveElement,
  onShiftElement,
  onDuplicateElement,
  onImportSvg,
  onBackgroundChange,
  onCustomBackgroundChange,
  onApplyPreset,
  lang,
}: ControlsPanelProps) {
  const isAr = lang === 'ar';
  const text = (ar: string, en: string) => (isAr ? ar : en);
  const labels: Record<LogoMark, string> = {
    orbit: text('مدار', 'Orbit'),
    spark: text('شرارة', 'Spark'),
    diamond: text('ماسة', 'Diamond'),
    bolt: text('صاعقة', 'Bolt'),
  };

  return (
    <section className="space-y-5 rounded-2xl border border-[#252A34] bg-[#14171C] p-4 sm:p-6" aria-label={text('إعدادات الشعار', 'Logo settings')}>
      <header className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3 py-1 text-[10px] font-medium text-indigo-200">
            <Sparkles size={13} />
            {text('استوديو الهوية البصرية', 'Visual identity studio')}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{text('صمّم شعار علامتك', 'Design your brand logo')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            {text('أنشئ شعارًا متناسقًا، جرّب تدرجات الألوان، ثم صدّره بصيغة SVG أو كمكوّن Kotlin جاهز لتطبيق Android.', 'Build a polished brand mark, preview gradients in real time, and export it as SVG or ready-to-use Kotlin code.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notice && (
            <div role={noticeIsError ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2 text-xs ${noticeIsError ? 'border-red-400/20 bg-red-400/[0.08] text-red-200' : 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'}`}>
              {notice}
            </div>
          )}
          <button type="button" className={buttonClass} onClick={onSave}><Save size={14} className="me-1 inline" />{text('حفظ التصميم', 'Save design')}</button>
          <button type="button" className={buttonClass} onClick={onReset}><RotateCcw size={14} className="me-1 inline" />{text('إعادة ضبط', 'Reset')}</button>
        </div>
      </header>

      <div className="rounded-xl border border-[#2D3139] bg-[#0B0D11] p-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">{text('قوالب جاهزة', 'Quick presets')}</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className="rounded-xl border border-[#2D3139] bg-[#121720] p-2 text-left transition hover:border-indigo-400 hover:bg-[#171d2b]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-white">{isAr ? preset.nameAr : preset.name}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
              </div>
              <div className="text-xs font-semibold text-gray-100">{preset.brand}</div>
              <div className="mt-1 text-[10px] text-gray-400">{isAr ? preset.taglineAr : preset.tagline}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-300">
          {text('اسم العلامة', 'Brand name')}
          <input className={inputClass} value={design.name} maxLength={36} onChange={event => onUpdate('name', event.target.value)} />
        </label>
        <div>
          {design.layout === 'stacked' ? (
            <>
              <label className="text-xs font-medium text-gray-300">
                {text('الشعار النصي', 'Tagline')}
                <input className={inputClass} value={design.tagline} maxLength={52} placeholder={text('جملة قصيرة أسفل الاسم', 'A short line below your name')} onChange={event => onUpdate('tagline', event.target.value)} />
              </label>
              <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2 text-xs text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-indigo-400" checked={design.showTagline} onChange={event => onUpdate('showTagline', event.target.checked)} />
                {text('إظهار الشعار النصي', 'Show tagline')}
              </label>
            </>
          ) : (
            <div className="flex h-full min-h-[72px] items-center rounded-xl border border-dashed border-[#2D3139] bg-[#0B0D11]/60 px-4 text-xs leading-5 text-gray-500">
              {text('التخطيط الأفقي يعرض اسم العلامة فقط.', 'Horizontal logos show the brand name only.')}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-300">
          {text('شكل الرمز', 'Symbol')}
          <select className={inputClass} value={design.mark} onChange={event => onUpdate('mark', event.target.value as LogoMark)}>
            {(Object.keys(labels) as LogoMark[]).map(mark => <option key={mark} value={mark}>{labels[mark]}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-300">
          {text('الخط', 'Typography')}
          <select className={inputClass} value={design.font} onChange={event => onUpdate('font', event.target.value as LogoFont)}>
            <option value="sans">{text('هندسي حديث', 'Modern sans-serif')}</option>
            <option value="serif">{text('كلاسيكي أنيق', 'Elegant serif')}</option>
            <option value="mono">{text('تقني', 'Technical mono')}</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-gray-300">{text('تكوين الشعار', 'Logo layout')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {([['horizontal', text('أفقي', 'Horizontal')], ['stacked', text('عمودي', 'Stacked')]] as [LogoLayout, string][]).map(([layout, label]) => (
            <button
              key={layout}
              type="button"
              aria-pressed={design.layout === layout}
              className={`${buttonClass} ${design.layout === layout ? 'border-indigo-400 bg-indigo-400/10 text-white' : ''}`}
              onClick={() => onUpdate('layout', layout)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="space-y-3 border-t border-[#2D3139] pt-4" aria-label={text('العناصر والطبقات', 'Elements and layers')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-semibold text-white"><Layers3 size={15} />{text('ارسم شعارك الخاص', 'Build your own SVG')}</h2>
            <p className="mt-1 text-[10px] text-gray-500">{text('أضف أشكالًا ونصوصًا أو استورد SVG، ثم حرّك الطبقات وعدّلها.', 'Add shapes, text, and SVG layers, then arrange and refine them.')}</p>
          </div>
          <span className="shrink-0 text-[10px] text-gray-500">{design.elements.length}/40</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {(['circle', 'square', 'triangle', 'star', 'text'] as LogoElementType[]).map(type => (
            <button key={type} type="button" className={buttonClass} disabled={design.elements.length >= 40} onClick={() => onAddElement(type)}>
              <Plus size={12} className="me-1 inline" />{ELEMENT_LABELS[type]}
            </button>
          ))}
          <button type="button" className={buttonClass} disabled={design.elements.length >= 40} onClick={() => fileRef.current?.click()}>
            <Upload size={12} className="me-1 inline" />{text('استيراد SVG', 'Import SVG')}
          </button>
          <input ref={fileRef} className="sr-only" type="file" accept=".svg,image/svg+xml" aria-label={text('اختيار ملف SVG', 'Choose an SVG file')} onChange={(event) => onImportSvg(event.target.files?.[0])} />
        </div>

        <div className="rounded-xl border border-[#2D3139] bg-[#0B0D11]/70 p-3">
          <p className="text-[10px] font-medium text-gray-300">{text('مصادر شعارات SVG', 'SVG logo sources')}</p>
          <p className="mt-1 text-[10px] leading-4 text-gray-500">{text('نزّل SVG من أحد المصادر ثم استورده من الزر أعلاه لتعديله كطبقة.', 'Download SVG from the sources below and import it above to edit it as a layer.')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: 'Simple Icons', href: 'https://simpleicons.org/' },
              { label: 'SVG Repo', href: 'https://www.svgrepo.com/' },
              { label: 'Wikimedia Commons', href: 'https://commons.wikimedia.org/wiki/Category:SVG_logos' },
            ].map(source => (
              <a key={source.label} href={source.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#2D3139] px-2.5 py-1.5 text-[10px] text-indigo-200 transition hover:border-indigo-400 hover:bg-indigo-400/10">
                {source.label}
              </a>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-amber-200/70">{text('تحقق من ترخيص كل شعار وحقوق العلامة التجارية قبل استخدامه.', 'Check licensing and trademark rights before using any imported artwork.')}</p>
        </div>

        {design.elements.length > 0 && (
          <ol className="space-y-2">
            {design.elements.map((element, index) => (
              <li key={element.id} className="rounded-xl border border-[#2D3139] bg-[#0B0D11] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[10px] text-gray-500">{index + 1}. {ELEMENT_LABELS[element.type]}</span>
                  <button type="button" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label={text('تحريك الطبقة للأعلى', 'Move layer up')} disabled={index === 0} onClick={() => onShiftElement(element.id, -1)}><ArrowUp size={12} /></button>
                  <button type="button" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label={text('تحريك الطبقة للأسفل', 'Move layer down')} disabled={index === design.elements.length - 1} onClick={() => onShiftElement(element.id, 1)}><ArrowDown size={12} /></button>
                  <button type="button" className="rounded p-1 text-gray-400 hover:text-white" aria-label={text('تكرار الطبقة', 'Duplicate layer')} onClick={() => onDuplicateElement(element)}><Copy size={12} /></button>
                  <button type="button" className="rounded p-1 text-red-300 hover:text-red-200" aria-label={text('حذف الطبقة', 'Delete layer')} onClick={() => onRemoveElement(element.id)}><Trash2 size={12} /></button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-[10px] text-gray-400">{text('اسم الطبقة', 'Layer name')}
                    <input className={inputClass} maxLength={60} value={element.name} onChange={event => onUpdateElement(element.id, 'name', event.target.value)} />
                  </label>
                  {element.type === 'text' && (
                    <label className="text-[10px] text-gray-400">{text('النص', 'Text')}
                      <input className={inputClass} maxLength={40} value={element.text} onChange={event => onUpdateElement(element.id, 'text', event.target.value)} />
                    </label>
                  )}
                  <label className="flex items-center justify-between rounded-lg border border-[#2D3139] px-2 text-[10px] text-gray-400">{text('اللون', 'Color')}
                    <input aria-label={`${ELEMENT_LABELS[element.type]} ${text('اللون', 'color')}`} className="h-8 w-10 cursor-pointer bg-transparent" type="color" value={element.color} onChange={event => onUpdateElement(element.id, 'color', event.target.value)} />
                  </label>
                  <label className="text-[10px] text-gray-400">{text('الحجم', 'Size')} · {element.size}%
                    <input className="mt-2 block w-full accent-indigo-400" type="range" min="20" max="180" value={element.size} onChange={event => onUpdateElement(element.id, 'size', Number(event.target.value))} />
                  </label>
                  <label className="text-[10px] text-gray-400">{text('الدوران', 'Rotation')} · {element.rotation}°
                    <input className="mt-2 block w-full accent-indigo-400" type="range" min="-180" max="180" value={element.rotation} onChange={event => onUpdateElement(element.id, 'rotation', Number(event.target.value))} />
                  </label>
                  <label className="text-[10px] text-gray-400">{text('الشفافية', 'Opacity')} · {Math.round(element.opacity * 100)}%
                    <input className="mt-2 block w-full accent-indigo-400" type="range" min="10" max="100" value={Math.round(element.opacity * 100)} onChange={event => onUpdateElement(element.id, 'opacity', Number(event.target.value) / 100)} />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] text-gray-400">X
                      <input className={inputClass} type="number" min="-120" max="120" value={element.x} onChange={event => onUpdateElement(element.id, 'x', Math.max(-120, Math.min(120, Number(event.target.value))))} />
                    </label>
                    <label className="text-[10px] text-gray-400">Y
                      <input className={inputClass} type="number" min="-100" max="180" value={element.y} onChange={event => onUpdateElement(element.id, 'y', Math.max(-100, Math.min(180, Number(event.target.value))))} />
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-gray-300">{text('امزج لونين', 'Blend two colors')}</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2 text-xs text-gray-400">
            {text('اللون الأول', 'Color one')}
            <input aria-label={text('اللون الأول', 'Color one')} className="h-8 w-10 cursor-pointer rounded-md bg-transparent" type="color" value={design.primary} onChange={event => onUpdate('primary', event.target.value)} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-[#2D3139] bg-[#0B0D11] px-3 py-2 text-xs text-gray-400">
            {text('اللون الثاني', 'Color two')}
            <input aria-label={text('اللون الثاني', 'Color two')} className="h-8 w-10 cursor-pointer rounded-md bg-transparent" type="color" value={design.secondary} onChange={event => onUpdate('secondary', event.target.value)} />
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
              onClick={() => {
                onUpdate('primary', palette.primary);
                onUpdate('secondary', palette.secondary);
              }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-gray-300">{text('خلفية المعاينة', 'Preview background')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            ['transparent', text('شفافة', 'Transparent')],
            ['light', text('فاتحة', 'Light')],
            ['dark', text('داكنة', 'Dark')],
            ['custom', text('مخصصة', 'Custom')],
          ] as ['transparent' | 'light' | 'dark' | 'custom', string][]).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={bg === value} className={`${buttonClass} ${bg === value ? 'border-indigo-400 bg-indigo-400/10 text-white' : ''}`} onClick={() => onBackgroundChange(value)}>
              {label}
            </button>
          ))}
        </div>
        {bg === 'custom' && (
          <label className="mt-3 flex items-center justify-between rounded-xl border border-[#2D3139] px-3 py-2 text-xs text-gray-400">
            {text('اختر لون الخلفية', 'Choose background color')}
            <input aria-label={text('لون خلفية المعاينة', 'Preview background color')} className="h-8 w-10 cursor-pointer bg-transparent" type="color" value={customBackground} onChange={event => onCustomBackgroundChange(event.target.value)} />
          </label>
        )}
      </fieldset>
    </section>
  );
}

export default ControlsPanel;
