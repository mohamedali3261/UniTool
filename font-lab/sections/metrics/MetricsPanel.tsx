/**
 * القسم ٧ — المقاييس والأدلة.
 * خطوط المرجع (علوي/كابيتال/x/قاعدة/سفلي)، أدلة المستخدم، شبكة المحاذاة،
 * وعرض بصري للصندوق em بنسبة كل مقياس.
 */
import { useState } from 'react';
import { Ruler, Plus, Trash2, Grid3x3, AlignVerticalJustifyCenter } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { ActionButton, Field, NumberField, PanelCard, Toggle } from '../../ui/controls';

export function MetricsPanel() {
  const { state, dispatch, ar } = useFontLab();
  const metrics = state.doc.metrics;
  const [guide, setGuide] = useState(0);


  const setMetric = (key: 'ascender' | 'descender' | 'xHeight' | 'capHeight' | 'unitsPerEm', value: number, labelAr: string, labelEn: string) => {
    dispatch({ type: 'metrics', metrics: { [key]: value }, labelAr, labelEn });
  };

  const bars = [
    { key: 'ascender', label: ar ? 'علوي' : 'Ascender', value: metrics.ascender, tone: 'ascender' },
    { key: 'capHeight', label: ar ? 'كابيتال' : 'Cap', value: metrics.capHeight, tone: 'cap' },
    { key: 'xHeight', label: ar ? 'x' : 'x-height', value: metrics.xHeight, tone: 'x' },
    { key: 'baseline', label: ar ? 'قاعدة' : 'Baseline', value: 0, tone: 'baseline' },
    { key: 'descender', label: ar ? 'سفلي' : 'Descender', value: metrics.descender, tone: 'descender' },
  ] as const;

  const max = Math.max(metrics.ascender, metrics.unitsPerEm) || 1;

  return (
    <div className="fl-metrics-panel">
      <PanelCard
        title={ar ? 'المقاييس الرأسية' : 'Vertical metrics'}
        subtitle={ar ? 'تُكتب داخل الخط عند التصدير' : 'Written into the font on export'}
        icon={<Ruler size={15} />}
      >
        <div className="fl-metrics-inputs">
          <Field label={ar ? 'العلوي' : 'Ascender'}>
            <NumberField ariaLabel={ar ? 'العلوي' : 'Ascender'} value={metrics.ascender} min={0} max={metrics.unitsPerEm * 1.5} onChange={(value) => setMetric('ascender', value, 'مقياس علوي', 'Ascender')} />
          </Field>
          <Field label={ar ? 'السفلي' : 'Descender'}>
            <NumberField ariaLabel={ar ? 'السفلي' : 'Descender'} value={metrics.descender} min={-metrics.unitsPerEm} max={0} onChange={(value) => setMetric('descender', value, 'مقياس سفلي', 'Descender')} />
          </Field>
          <Field label={ar ? 'ارتفاع x' : 'x-height'}>
            <NumberField ariaLabel={ar ? 'ارتفاع x' : 'x-height'} value={metrics.xHeight} min={0} max={metrics.unitsPerEm} onChange={(value) => setMetric('xHeight', value, 'ارتفاع x', 'x-height')} />
          </Field>
          <Field label={ar ? 'كابيتال' : 'Cap height'}>
            <NumberField ariaLabel={ar ? 'كابيتال' : 'Cap height'} value={metrics.capHeight} min={0} max={metrics.unitsPerEm} onChange={(value) => setMetric('capHeight', value, 'ارتفاع كابيتال', 'Cap height')} />
          </Field>
          <Field label={ar ? 'مقياس em (upm)' : 'Units per em'}>
            <NumberField ariaLabel="unitsPerEm" value={metrics.unitsPerEm} min={16} max={16384} step={1} onChange={(value) => setMetric('unitsPerEm', value, 'مقياس em', 'Units per em')} />
          </Field>
        </div>

        <div className="fl-metric-bars" aria-hidden="true">
          {bars.map((bar) => {
            const height = Math.abs(bar.value) / max;
            return (
              <div key={bar.key} className={`fl-metric-bar is-${bar.tone}`}>
                <span style={{ height: `${Math.max(2, height * 100)}%` }} />
                <label>{bar.label}</label>
                <em>{bar.value}</em>
              </div>
            );
          })}
        </div>
      </PanelCard>

      <PanelCard title={ar ? 'أدلة مخصّصة' : 'Custom guides'} icon={<AlignVerticalJustifyCenter size={15} />}>
        <div className="fl-guide-add">
          <NumberField ariaLabel={ar ? 'قيمة الدليل' : 'Guide value'} value={guide} min={metrics.descender} max={metrics.ascender + metrics.unitsPerEm} onChange={setGuide} />
          <ActionButton
            icon={<Plus size={14} />}
            onClick={() => {
              if (state.doc.guides.vertical.includes(guide)) return;
              const doc = { ...state.doc, guides: { ...state.doc.guides, vertical: [...state.doc.guides.vertical, guide] } };
              dispatch({ type: 'document', doc, labelAr: 'إضافة دليل', labelEn: 'Guide added' });
            }}
          >
            {ar ? 'إضافة دليل' : 'Add guide'}
          </ActionButton>
        </div>
        <ul className="fl-guide-list">
          {state.doc.guides.vertical.map((value, index) => (
            <li key={`${value}-${index}`}>
              <span>{value}</span>
              <button
                type="button"
                aria-label={ar ? 'حذف الدليل' : 'Remove guide'}
                onClick={() => {
                  const doc = { ...state.doc, guides: { ...state.doc.guides, vertical: state.doc.guides.vertical.filter((_, position) => position !== index) } };
                  dispatch({ type: 'document', doc, labelAr: 'حذف دليل', labelEn: 'Guide removed' });
                }}
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
          {state.doc.guides.vertical.length === 0 ? <li className="is-empty">{ar ? 'لا أدلة مخصّصة بعد.' : 'No custom guides yet.'}</li> : null}
        </ul>
      </PanelCard>

      <PanelCard title={ar ? 'عرض الشبكة' : 'Canvas aids'} icon={<Grid3x3 size={15} />}>
        <div className="fl-switch-list">
          <label>
            <span>{ar ? 'أدلة المقاييس' : 'Metric guides'}</span>
            <Toggle checked={state.showMetrics} onChange={() => dispatch({ type: 'toggleMetrics' })} label={ar ? 'أدلة المقاييس' : 'Metric guides'} />
          </label>
          <label>
            <span>{ar ? 'الشبكة' : 'Grid'}</span>
            <Toggle checked={state.showGrid} onChange={() => dispatch({ type: 'toggleGrid' })} label={ar ? 'الشبكة' : 'Grid'} />
          </label>
          <label>
            <span>{ar ? 'مقارنة بالأصل' : 'Compare with original'}</span>
            <Toggle checked={state.compare !== 'none'} onChange={() => dispatch({ type: 'compare', value: state.compare === 'none' ? 'ghost' : 'none' })} label={ar ? 'مقارنة' : 'Compare'} />
          </label>
        </div>
        <p className="fl-hint-note">
          {ar
            ? 'إيقاف المقاييس يوسّع مساحة الرسم فقط؛ لا يغيّر بيانات الحرف.'
            : 'Hiding the guides only changes the canvas; the glyph data is untouched.'}
        </p>
      </PanelCard>
    </div>
  );
}
