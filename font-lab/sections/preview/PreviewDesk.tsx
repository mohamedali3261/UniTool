/**
 * القسم ٦ — مكتب المعاينة.
 * معاينة نصية حقيقية بالخط المُحرَّر (FontFace)، محرّر نماذج نصوص جاهزة،
 * مقارنة أحجام ومقياس، وسحب صورة PNG للحرف.
 */
import { useMemo, useState } from 'react';
import { Type, ImageDown, Sparkles, AlignRight, AlignLeft } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { previewFontStyle } from '../../state/FontLabContext';
import { downloadBlob, glyphPngDataUrl } from '../../core/exporter';
import { ActionButton, Field, NumberField, PanelCard, Segmented, Slider } from '../../ui/controls';
import { glyphState } from '../../core/project';
import { contoursToPathData } from '../../core/outline';

const SAMPLES = {
  arabic: ['بسم الله الرحمن الرحيم', 'الخط العربي هندسة وروح', 'صمّم حروفك بنفسك', 'لا يأس مع الحياة'],
  latin: ['Hamburgefonts 0123', 'The quick brown fox jumps', 'Aa Bb Cc Dd Ee', 'Kerning AVATAR To.'],
};

export function PreviewDesk() {
  const { state, dispatch, font, ar } = useFontLab();
  const [script, setScript] = useState<'arabic' | 'latin'>('arabic');
  const [align, setAlign] = useState<'start' | 'end'>('end');
  const size = state.doc.sample.size;

  const text = script === 'arabic' ? state.doc.sample.arabic : state.doc.sample.latin;
  const updateSample = (value: string) => {
    const doc = { ...state.doc, sample: { ...state.doc.sample, [script]: value } };
    dispatch({ type: 'document', doc, labelAr: 'نص المعاينة', labelEn: 'Sample text' });
  };

  const setSize = (value: number) => {
    const doc = { ...state.doc, sample: { ...state.doc.sample, size: value } };
    dispatch({ type: 'document', doc, labelAr: 'حجم المعاينة', labelEn: 'Preview size' });
  };

  const selected = font && state.selection.glyph ? font.glyphs.get(state.selection.glyph) : null;
  const selectedContours = selected ? glyphState(state.doc, selected).contours : [];

  const downloadPng = (zoom: number) => {
    const url = glyphPngDataUrl(selectedContours, state.doc.metrics.unitsPerEm, 512 * zoom, '#123a2e');
    if (!url) return;
    const response = fetch(url);
    void response.then((result) => result.blob()).then((blob) => downloadBlob(blob, `${state.selection.glyph || 'glyph'}-${zoom}x.png`, 'image/png'));
  };

  const glyphList = useMemo(() => text.slice(0, 40), [text]);
  // long samples shrink a little so the whole line stays readable
  const canvasSize = Math.max(28, Math.min(size, Math.round(1150 / Math.max(6, text.length))));

  return (
    <div className="fl-preview">
      <PanelCard
        title={ar ? 'معاينة حيّة بالخط' : 'Live font preview'}
        subtitle={ar ? 'النص مرسوم بالخط بعد كل تعديل — بما فيه الاتصال العربي' : 'Rendered with the edited font after every change, including Arabic joining'}
        icon={<Type size={15} />}
        actions={
          <Segmented<'arabic' | 'latin'>
            ariaLabel={ar ? 'نص المعاينة' : 'Preview script'}
            value={script}
            onChange={setScript}
            options={[
              { value: 'arabic', label: ar ? 'عربي' : 'Arabic' },
              { value: 'latin', label: ar ? 'لاتيني' : 'Latin' },
            ]}
          />
        }
      >
        <div className={`fl-preview-canvas is-${script}`} dir={script === 'arabic' ? 'rtl' : 'ltr'} style={{ textAlign: align === 'end' ? 'end' : 'start' }}>
          <p style={previewFontStyle(canvasSize)}>{text || (ar ? 'اكتب نصاً للمعاينة…' : 'Type sample text…')}</p>
        </div>

        <div className="fl-preview-controls">
          <Field label={ar ? 'الحجم' : 'Size'} hint={`${size}px`}>
            <Slider ariaLabel={ar ? 'حجم المعاينة' : 'Preview size'} min={32} max={280} value={size} onChange={setSize} />
          </Field>
          <Field label={ar ? 'المحاذاة' : 'Align'}>
            <div className="fl-op-row">
              <ActionButton icon={<AlignRight size={14} />} active={align === 'end'} onClick={() => setAlign('end')}>{ar ? 'يمين' : 'End'}</ActionButton>
              <ActionButton icon={<AlignLeft size={14} />} active={align === 'start'} onClick={() => setAlign('start')}>{ar ? 'يسار' : 'Start'}</ActionButton>
            </div>
          </Field>
        </div>

        <textarea
          className="fl-preview-input"
          value={text}
          dir={script === 'arabic' ? 'rtl' : 'ltr'}
          onChange={(event) => updateSample(event.target.value)}
          aria-label={ar ? 'تحرير نص المعاينة' : 'Edit sample text'}
          rows={2}
        />

        <div className="fl-sample-chips">
          {SAMPLES[script].map((sample) => (
            <button key={sample} type="button" onClick={() => updateSample(sample)}>
              {sample}
            </button>
          ))}
        </div>
      </PanelCard>

      <div className="fl-preview-side">
        <PanelCard title={ar ? 'شريط الحروف' : 'Glyph strip'} icon={<Sparkles size={15} />}>
          {/* one text run, never per-character spans: splitting a run breaks Arabic joining */}
          <p className="fl-strip" style={previewFontStyle(30)} dir={script === 'arabic' ? 'rtl' : 'ltr'}>
            {glyphList}
          </p>
        </PanelCard>

        <PanelCard title={ar ? 'أحجام المقارنة' : 'Size ladder'} icon={<Type size={15} />}>
          <div className="fl-ladder">
            {[14, 18, 24, 36, 56].map((value) => (
              <div key={value}>
                <small>{value}px</small>
                <span style={previewFontStyle(value)} dir="rtl">أبجد هوّز</span>
                <span style={previewFontStyle(value)} dir="ltr">Aa Bb</span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title={ar ? 'تصدير الحرف صورة' : 'Glyph as image'} icon={<ImageDown size={15} />}>
          {selected ? (
            <div className="fl-png-row">
              <div className="fl-png-preview">
                <svg viewBox={`0 0 ${state.doc.metrics.unitsPerEm} ${state.doc.metrics.unitsPerEm}`} aria-hidden="true">
                  <path d={contoursToPathData(selectedContours, state.doc.metrics.unitsPerEm)} fill="currentColor" />
                </svg>
              </div>
              <div className="fl-op-row">
                <ActionButton onClick={() => downloadPng(1)}>PNG 512</ActionButton>
                <ActionButton onClick={() => downloadPng(2)}>PNG 1024</ActionButton>
              </div>
            </div>
          ) : (
            <p className="fl-empty">{ar ? 'اختر حرفاً لتصديره صورة.' : 'Select a glyph to export it as an image.'}</p>
          )}
        </PanelCard>

        <PanelCard title={ar ? 'قياسات النموذج' : 'Sample metrics'} icon={<NumberFieldIcon />}>
          <div className="fl-sample-metrics">
            <Field label={ar ? 'عرض النص' : 'Text width'}>
              <span className="fl-readout">{Math.round((selected?.advanceWidth ?? 0) * glyphList.length)} u</span>
            </Field>
            <Field label={ar ? 'عدد الحروف' : 'Characters'}>
              <span className="fl-readout">{glyphList.length}</span>
            </Field>
          </div>
          <p className="fl-hint-note">
            {ar
              ? 'المعاينة تستخدم ملف الخط الذي ستصدّره فعلاً، وليس صورة أو محاكاة.'
              : 'The preview uses the exact font file you will export — not an image or a mock.'}
          </p>
        </PanelCard>
      </div>
    </div>
  );
}

function NumberFieldIcon() {
  return <span className="fl-mini-num">#</span>;
}
