import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Code2, Copy, Download, Layers3, Plus, RotateCcw, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import {
  makeKotlinExport,
  makeLogoSvg,
  sanitizeImportedSvg,
  type LogoElement,
  type LogoElementType,
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
const SAVE_KEY = 'unitool-logo-studio-design';

function emptyElement(type: LogoElementType, index: number): LogoElement {
  return {
    id: crypto.randomUUID(),
    name: `${type} ${index}`,
    type,
    x: 0,
    y: 0,
    size: 100,
    rotation: 0,
    opacity: 0.9,
    color: '#FACC15',
    text: type === 'text' ? 'YOUR IDEA' : '',
    svg: '',
    viewBox: '0 0 100 100',
  };
}

function readSavedDesign(): LogoDesign | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const design = value as Partial<LogoDesign>;
    if (
      typeof design.name !== 'string' ||
      typeof design.tagline !== 'string' ||
      !/^#[0-9a-f]{6}$/i.test(design.primary ?? '') ||
      !/^#[0-9a-f]{6}$/i.test(design.secondary ?? '') ||
      !['orbit', 'spark', 'diamond', 'bolt'].includes(design.mark ?? '') ||
      !['horizontal', 'stacked'].includes(design.layout ?? '') ||
      !['sans', 'serif', 'mono'].includes(design.font ?? '') ||
      !Array.isArray(design.elements) ||
      design.elements.length > 40
    ) return null;
    if (design.name.length > 36 || design.tagline.length > 52) return null;
    const elements: LogoElement[] = [];
    for (const candidate of design.elements) {
      if (!candidate || typeof candidate !== 'object') return null;
      const element = candidate as Partial<LogoElement>;
      if (
        typeof element.id !== 'string' || element.id.length > 100 ||
        typeof element.name !== 'string' || element.name.length > 60 ||
        !['circle', 'square', 'triangle', 'star', 'text', 'svg'].includes(element.type ?? '') ||
        !['x', 'y', 'size', 'rotation', 'opacity'].every(key => Number.isFinite(element[key as keyof LogoElement])) ||
        !/^#[0-9a-f]{6}$/i.test(element.color ?? '') ||
        typeof element.text !== 'string' || element.text.length > 40 ||
        typeof element.svg !== 'string' || typeof element.viewBox !== 'string'
      ) return null;
      const safeSvg = element.type === 'svg'
        ? sanitizeImportedSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${element.viewBox.replace(/[<>&'"]/g, '')}">${element.svg}</svg>`)
        : null;
      elements.push({
        id: element.id,
        name: element.name,
        type: element.type as LogoElementType,
        x: Math.max(-120, Math.min(120, Number(element.x))),
        y: Math.max(-100, Math.min(100, Number(element.y))),
        size: Math.max(20, Math.min(180, Number(element.size))),
        rotation: Math.max(-180, Math.min(180, Number(element.rotation))),
        opacity: Math.max(0.1, Math.min(1, Number(element.opacity))),
        color: element.color,
        text: element.text,
        svg: safeSvg?.svg ?? '',
        viewBox: safeSvg?.viewBox ?? '0 0 100 100',
      });
    }
    return { ...design as LogoDesign, elements };
  } catch (error) {
    console.error('Unable to restore saved logo design', error);
    return null;
  }
}

export function LogoStudio({ lang }: Props) {
  const isAr = lang === 'ar';
  const text = (ar: string, en: string) => isAr ? ar : en;
  const [design, setDesign] = useState<LogoDesign>(() => readSavedDesign() ?? ({
    name: 'UniTool',
    tagline: isAr ? 'أفكارك، أدواتك' : 'TOOLS FOR YOUR IDEAS',
    primary: '#22D3EE',
    secondary: '#6366F1',
    mark: 'orbit',
    layout: 'horizontal',
    font: 'sans',
    elements: [],
  }));
  const [background, setBackground] = useState<'transparent' | 'light' | 'dark' | 'custom'>('transparent');
  const [customBackground, setCustomBackground] = useState('#273244');
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const svg = useMemo(() => makeLogoSvg(design), [design]);
  const kotlin = useMemo(() => makeKotlinExport(svg), [svg]);
  const feedback = (message: string, isError = false) => {
    setNotice(message);
    setNoticeIsError(isError);
  };
  const update = <K extends keyof LogoDesign>(key: K, value: LogoDesign[K]) => {
    setDesign(current => ({ ...current, [key]: value }));
  };

  const download = (contents: string | Blob, filename: string, type: string) => {
    const url = URL.createObjectURL(contents instanceof Blob ? contents : new Blob([contents], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async (contents: string, success: string) => {
    try {
      await navigator.clipboard.writeText(contents);
      feedback(success);
    } catch (error) {
      feedback(text('تعذّر النسخ. تحقق من صلاحية الحافظة في المتصفح.', 'Copy failed. Check browser clipboard permissions.'), true);
      console.error('Logo export copy failed', error);
    }
  };

  const save = () => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(design));
      feedback(text('تم حفظ تصميمك على هذا الجهاز.', 'Design saved on this device.'));
    } catch (error) {
      feedback(text('تعذّر حفظ التصميم في المتصفح.', 'Could not save this design in the browser.'), true);
      console.error('Logo design save failed', error);
    }
  };

  const addElement = (type: LogoElementType) => {
    setDesign(current => {
      if (current.elements.length >= 40) {
        feedback(text('الحد الأقصى 40 عنصرًا لكل شعار.', 'A logo can contain up to 40 custom elements.'), true);
        return current;
      }
      return { ...current, elements: [...current.elements, emptyElement(type, current.elements.length + 1)] };
    });
  };

  const updateElement = <K extends keyof LogoElement>(id: string, key: K, value: LogoElement[K]) => {
    setDesign(current => ({
      ...current,
      elements: current.elements.map(element => element.id === id ? { ...element, [key]: value } : element),
    }));
  };

  const removeElement = (id: string) => {
    setDesign(current => ({ ...current, elements: current.elements.filter(element => element.id !== id) }));
  };

  const shiftElement = (id: string, direction: -1 | 1) => {
    setDesign(current => {
      const index = current.elements.findIndex(element => element.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.elements.length) return current;
      const elements = [...current.elements];
      [elements[index], elements[next]] = [elements[next], elements[index]];
      return { ...current, elements };
    });
  };

  const duplicateElement = (element: LogoElement) => {
    if (design.elements.length >= 40) {
      feedback(text('الحد الأقصى 40 عنصرًا لكل شعار.', 'A logo can contain up to 40 custom elements.'), true);
      return;
    }
    setDesign(current => ({
      ...current,
      elements: [...current.elements, { ...element, id: crypto.randomUUID(), name: `${element.name} copy`, x: element.x + 8, y: element.y + 8 }],
    }));
  };

  const importSvg = async (file?: File) => {
    if (!file) return;
    try {
      const imported = sanitizeImportedSvg(await file.text());
      const element = {
        ...emptyElement('svg', design.elements.length + 1),
        name: file.name.replace(/\.svg$/i, '').slice(0, 60),
        svg: imported.svg,
        viewBox: imported.viewBox,
      };
      setDesign(current => {
        if (current.elements.length >= 40) {
          feedback(text('الحد الأقصى 40 عنصرًا لكل شعار.', 'A logo can contain up to 40 custom elements.'), true);
          return current;
        }
        return { ...current, elements: [...current.elements, element] };
      });
      feedback(text('تم استيراد SVG بأمان وإضافته إلى الطبقات.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import SVG.';
      feedback(`${text('تعذّر استيراد SVG:', 'Could not import SVG:')} ${message}`, true);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadPng = async () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
      const width = Number(viewBox?.[1] ?? 560);
      const height = Number(viewBox?.[2] ?? 160);
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is unavailable.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG encoding failed.')), 'image/png');
      });
      download(blob, 'unitool-logo.png', 'image/png');
      feedback(text('تم تجهيز PNG.', 'PNG export is ready.'));
    } catch (error) {
      feedback(error instanceof Error ? error.message : text('تعذّر تصدير PNG.', 'PNG export failed.'), true);
      console.error('Logo PNG export failed', error);
    } finally {
      URL.revokeObjectURL(url);
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
      : background === 'custom'
        ? customBackground
        : 'transparent';
  const elementLabels: Record<LogoElementType, string> = {
    circle: text('دائرة', 'Circle'),
    square: text('مربع', 'Square'),
    triangle: text('مثلث', 'Triangle'),
    star: text('نجمة', 'Star'),
    text: text('نص مخصص', 'Custom text'),
    svg: 'SVG',
  };

  const reset = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error('Unable to clear saved logo design', error);
      feedback(text('تعذّر حذف النسخة المحفوظة؛ لم يتم إعادة ضبط التصميم.', 'Could not remove the saved design; reset was cancelled.'), true);
      return;
    }
    setDesign({
      name: 'UniTool',
      tagline: isAr ? 'أفكارك، أدواتك' : 'TOOLS FOR YOUR IDEAS',
      primary: '#22D3EE',
      secondary: '#6366F1',
      mark: 'orbit',
      layout: 'horizontal',
      font: 'sans',
      elements: [],
    });
    feedback(text('تمت إعادة التصميم الافتراضي.', 'Restored the default design.'));
  };

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
        <div className="flex flex-wrap items-center gap-2">
          {notice && (
            <div role={noticeIsError ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2 text-xs ${noticeIsError ? 'border-red-400/20 bg-red-400/[0.08] text-red-200' : 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'}`}>
              {notice}
            </div>
          )}
          <button type="button" className={buttonClass} onClick={save}><Save size={14} className="me-1 inline" />{text('حفظ التصميم', 'Save design')}</button>
          <button type="button" className={buttonClass} onClick={reset}><RotateCcw size={14} className="me-1 inline" />{text('إعادة ضبط', 'Reset')}</button>
        </div>
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

          <section className="space-y-3 border-t border-[#2D3139] pt-4" aria-label={text('العناصر والطبقات', 'Elements and layers')}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-xs font-semibold text-white"><Layers3 size={15} />{text('ارسم شعارك الخاص', 'Build your own SVG')}</h2>
                <p className="mt-1 text-[10px] text-gray-500">{text('أضف أشكالًا ونصوصًا أو استورد SVG، ثم حرّك الطبقات وعدّلها.', 'Add shapes, text or imported SVG, then edit and reorder layers.')}</p>
              </div>
              <span className="shrink-0 text-[10px] text-gray-500">{design.elements.length}/40</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(['circle', 'square', 'triangle', 'star', 'text'] as LogoElementType[]).map(type => (
                <button key={type} type="button" className={buttonClass} disabled={design.elements.length >= 40} onClick={() => addElement(type)}>
                  <Plus size={12} className="me-1 inline" />{elementLabels[type]}
                </button>
              ))}
              <button type="button" className={buttonClass} disabled={design.elements.length >= 40} onClick={() => fileRef.current?.click()}>
                <Upload size={12} className="me-1 inline" />{text('استيراد SVG', 'Import SVG')}
              </button>
              <input ref={fileRef} className="sr-only" type="file" accept=".svg,image/svg+xml" aria-label={text('اختيار ملف SVG', 'Choose an SVG file')} onChange={event => void importSvg(event.currentTarget.files?.[0])} />
            </div>
            {design.elements.length > 0 && (
              <ol className="space-y-2">
                {design.elements.map((element, index) => (
                  <li key={element.id} className="rounded-xl border border-[#2D3139] bg-[#0B0D11] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[10px] text-gray-500">{index + 1}. {elementLabels[element.type]}</span>
                      <button type="button" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label={text('تحريك الطبقة للأعلى', 'Move layer up')} disabled={index === 0} onClick={() => shiftElement(element.id, -1)}><ArrowUp size={14} /></button>
                      <button type="button" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label={text('تحريك الطبقة للأسفل', 'Move layer down')} disabled={index === design.elements.length - 1} onClick={() => shiftElement(element.id, 1)}><ArrowDown size={14} /></button>
                      <button type="button" className="rounded p-1 text-gray-400 hover:text-white" aria-label={text('تكرار الطبقة', 'Duplicate layer')} onClick={() => duplicateElement(element)}><Copy size={13} /></button>
                      <button type="button" className="rounded p-1 text-red-300 hover:text-red-200" aria-label={text('حذف الطبقة', 'Delete layer')} onClick={() => removeElement(element.id)}><Trash2 size={14} /></button>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label className="text-[10px] text-gray-400">{text('اسم الطبقة', 'Layer name')}
                        <input className={inputClass} maxLength={60} value={element.name} onChange={event => updateElement(element.id, 'name', event.target.value)} />
                      </label>
                      {element.type === 'text' && (
                        <label className="text-[10px] text-gray-400">{text('النص', 'Text')}
                          <input className={inputClass} maxLength={40} value={element.text} onChange={event => updateElement(element.id, 'text', event.target.value)} />
                        </label>
                      )}
                      <label className="flex items-center justify-between rounded-lg border border-[#2D3139] px-2 text-[10px] text-gray-400">{text('اللون', 'Color')}
                        <input aria-label={`${elementLabels[element.type]} ${text('اللون', 'color')}`} className="h-8 w-10 cursor-pointer bg-transparent" type="color" value={element.color} onChange={event => updateElement(element.id, 'color', event.target.value)} />
                      </label>
                      <label className="text-[10px] text-gray-400">{text('الحجم', 'Size')} · {element.size}%
                        <input className="mt-2 block w-full accent-indigo-400" type="range" min="20" max="180" value={element.size} onChange={event => updateElement(element.id, 'size', Number(event.target.value))} />
                      </label>
                      <label className="text-[10px] text-gray-400">{text('الدوران', 'Rotation')} · {element.rotation}°
                        <input className="mt-2 block w-full accent-indigo-400" type="range" min="-180" max="180" value={element.rotation} onChange={event => updateElement(element.id, 'rotation', Number(event.target.value))} />
                      </label>
                      <label className="text-[10px] text-gray-400">{text('الشفافية', 'Opacity')} · {Math.round(element.opacity * 100)}%
                        <input className="mt-2 block w-full accent-indigo-400" type="range" min="10" max="100" value={Math.round(element.opacity * 100)} onChange={event => updateElement(element.id, 'opacity', Number(event.target.value) / 100)} />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[10px] text-gray-400">X
                          <input className={inputClass} type="number" min="-120" max="120" value={element.x} onChange={event => updateElement(element.id, 'x', Math.max(-120, Math.min(120, Number(event.target.value))))} />
                        </label>
                        <label className="text-[10px] text-gray-400">Y
                          <input className={inputClass} type="number" min="-100" max="100" value={element.y} onChange={event => updateElement(element.id, 'y', Math.max(-100, Math.min(100, Number(event.target.value))))} />
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                ['transparent', text('شفافة', 'Transparent')],
                ['light', text('فاتحة', 'Light')],
                ['dark', text('داكنة', 'Dark')],
                ['custom', text('مخصصة', 'Custom')],
              ] as ['transparent' | 'light' | 'dark' | 'custom', string][]).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={background === value} className={`${buttonClass} ${background === value ? 'border-indigo-400 bg-indigo-400/10 text-white' : ''}`} onClick={() => setBackground(value)}>
                  {label}
                </button>
              ))}
            </div>
            {background === 'custom' && (
              <label className="mt-3 flex items-center justify-between rounded-xl border border-[#2D3139] px-3 py-2 text-xs text-gray-400">
                {text('اختر لون الخلفية', 'Choose background color')}
                <input aria-label={text('لون خلفية المعاينة', 'Preview background color')} className="h-8 w-10 cursor-pointer bg-transparent" type="color" value={customBackground} onChange={event => setCustomBackground(event.target.value)} />
              </label>
            )}
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
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D3139] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-indigo-400 hover:text-white" onClick={() => void downloadPng()}>
              <Download size={16} />
              {text('تنزيل PNG', 'Download PNG')}
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
