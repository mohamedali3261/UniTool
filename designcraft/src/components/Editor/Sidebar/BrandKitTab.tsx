import { useState } from 'react';
import { SwatchBook, Plus, Pipette, ScanLine, Trash2, Check } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';
import { BRAND_KIT_KEY, MAX_BRAND_COLORS, mergeBrandColors, normalizeBrandColor, parseBrandColors } from '../../../utils/brandKit';

interface BrandKitTabProps {
  selectedColor?: string;
  onApplyColor: (color: string) => void;
  onCollectColors: () => string[];
  onNotice: (message: string, error?: boolean) => void;
}

const STARTERS = [
  { key: 'brandOcean', colors: ['#0EA5E9', '#6366F1', '#0F172A', '#F8FAFC'] },
  { key: 'brandSunset', colors: ['#F97316', '#EC4899', '#FACC15', '#4C1D95'] },
  { key: 'brandForest', colors: ['#059669', '#14B8A6', '#064E3B', '#ECFDF5'] },
] as const;

export function BrandKitTab({ selectedColor, onApplyColor, onCollectColors, onNotice }: BrandKitTabProps) {
  const { t, lang } = useDcLang();
  const [colors, setColors] = useState(() => {
    try { return parseBrandColors(localStorage.getItem(BRAND_KIT_KEY)); } catch { return []; }
  });
  const [draft, setDraft] = useState('#0EA5E9');
  const validDraft = normalizeBrandColor(draft);
  const validSelection = normalizeBrandColor(selectedColor);

  const commit = (next: string[]) => {
    setColors(next);
    try { localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(next)); }
    catch { onNotice(t.brandStorageError, true); }
  };
  const add = (incoming: string[], collected = false) => {
    const result = mergeBrandColors(colors, incoming);
    if (result.added) {
      commit(result.colors);
      onNotice(collected ? t.brandCollected : t.brandAdded);
    } else {
      onNotice(result.skipped ? t.brandFull : t.brandNoColors, !!result.skipped);
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4 pb-3">
      <div className="space-y-1.5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><SwatchBook className="h-4 w-4 text-sky-400" />{t.brandTitle}</h3>
        <p className="text-[11px] leading-relaxed text-slate-400">{t.brandDesc}</p>
      </div>

      <div className="rounded-2xl border border-slate-700/70 bg-[#0B132B] p-3 space-y-3">
        <label htmlFor="brand-custom-color" className="text-xs font-semibold text-slate-300">{t.brandCustom}</label>
        <div className="flex gap-2" dir="ltr">
          <input id="brand-custom-color" type="color" value={validDraft || '#0EA5E9'} onChange={event => setDraft(event.target.value.toUpperCase())} className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-600 bg-transparent p-1" />
          <input aria-label="HEX" value={draft} onChange={event => setDraft(event.target.value)} maxLength={7} spellCheck={false} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#1C2541] px-3 font-mono text-xs text-white outline-none focus:border-sky-400" />
          <button type="button" disabled={!validDraft} onClick={() => validDraft && add([validDraft])} aria-label={t.brandAdd} title={t.brandAdd} className="rounded-lg bg-sky-600 px-3 text-white hover:bg-sky-500 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
        </div>
        <button type="button" disabled={!validSelection} onClick={() => validSelection && add([validSelection])} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 py-2.5 text-[11px] font-semibold text-slate-200 hover:border-sky-500 disabled:cursor-not-allowed disabled:opacity-40">
          <Pipette className="h-3.5 w-3.5 text-sky-400" />{t.brandAddSelection}
        </button>
        <button type="button" onClick={() => add(onCollectColors(), true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/10 py-2.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20">
          <ScanLine className="h-3.5 w-3.5" />{t.brandCollect}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400"><span>{t.tabBrand}</span><span className="font-mono">{colors.length} / {MAX_BRAND_COLORS}</span></div>
        {colors.length ? (
          <div className="grid grid-cols-4 gap-2">
            {colors.map(color => (
              <div key={color} className="group relative overflow-hidden rounded-xl border border-slate-700 bg-[#0B132B]">
                <button type="button" onClick={() => onApplyColor(color)} aria-label={`${t.brandApply} ${color}`} title={`${t.brandApply} ${color}`} className="flex w-full flex-col items-center gap-1.5 p-1.5 hover:bg-slate-800">
                  <span className="h-12 w-full rounded-lg border border-white/10" style={{ backgroundColor: color }} />
                  <span dir="ltr" className="font-mono text-[9px] text-slate-300">{color}</span>
                </button>
                <button type="button" onClick={() => commit(colors.filter(item => item !== color))} aria-label={`${t.brandRemove} ${color}`} title={t.brandRemove} className="absolute end-2 top-2 rounded-md bg-slate-950/80 p-1 text-slate-300 opacity-70 transition hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-center"><SwatchBook className="mx-auto mb-2 h-7 w-7 text-slate-600" /><p className="text-[11px] leading-relaxed text-slate-400">{t.brandEmpty}</p></div>
        )}
        <p className="text-[10px] leading-relaxed text-slate-500">{t.brandApplyHint}</p>
      </div>

      <div className="space-y-2 border-t border-slate-700/60 pt-3">
        <h4 className="text-[11px] font-semibold text-slate-300">{t.brandStarters}</h4>
        <div className="grid grid-cols-3 gap-2">
          {STARTERS.map(starter => (
            <button key={starter.key} type="button" onClick={() => add([...starter.colors])} className="rounded-xl border border-slate-700 bg-[#0B132B] p-2 hover:border-sky-500">
              <span className="flex h-6 overflow-hidden rounded-md">{starter.colors.map(color => <span key={color} className="flex-1" style={{ backgroundColor: color }} />)}</span>
              <span className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-slate-300"><Plus className="h-3 w-3" />{t[starter.key]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80"><Check className="h-3 w-3" />{t.brandDesc}</div>
    </div>
  );
}
