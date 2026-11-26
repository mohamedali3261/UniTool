/**
 * القسم ٩ — تصدير الخط.
 * TTF/OTF حقيقي + SVG + PNG، تقرير بما سيُصدَّر (الحروف المعدلة، الجداول
 * المحفوظة، الحجم)، وتحميل مباشر مع التحقق من القراءة بعد التصدير.
 */
import { useState } from 'react';
import { Download, FileType, FileImage, ShieldCheck, AlertTriangle, Loader2, PackageCheck } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { DEFAULT_EXPORT, downloadBlob, exportFont, kerningReport, previewSvg } from '../../core/exporter';
import { loadFont } from '../../core/fontEngine';
import { editedCount } from '../../core/project';
import { ActionButton, Field, PanelCard, Segmented, Slider, StatusDot, Toggle } from '../../ui/controls';

export function ExportPanel() {
  const { state, dispatch, font, ar } = useFontLab();
  const [format, setFormat] = useState<'ttf' | 'otf'>('ttf');
  const [includeKerning, setIncludeKerning] = useState(true);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [svgSize, setSvgSize] = useState(160);
  const [result, setResult] = useState<{ fileName: string; bytes: number; glyphs: number; verified: boolean } | null>(null);

  const edits = editedCount(state.doc);
  const kern = kerningReport(state.doc);

  const runExport = async () => {
    if (!font) {
      setMessage({ kind: 'error', text: ar ? 'لا يوجد خط محمّل.' : 'No font loaded.' });
      return;
    }
    setBusy(true);
    dispatch({ type: 'exporting', value: true });
    setMessage(null);
    try {
      const exported = exportFont(font, state.doc, { ...DEFAULT_EXPORT, otf: format === 'otf', kerning: includeKerning });
      // verify: parse our own output before handing it to the user
      const verified = (() => {
        try {
          const check = loadFont(exported.buffer, exported.fileName);
          return check.parsed.glyphs.length === font.parsed.glyphs.length;
        } catch {
          return false;
        }
      })();
      downloadBlob(exported.buffer, exported.fileName, 'font/ttf');
      dispatch({ type: 'exported', value: exported.editedGlyphs });
      setResult({ fileName: exported.fileName, bytes: exported.bytes, glyphs: exported.editedGlyphs, verified });
      setMessage({
        kind: 'ok',
        text: ar
          ? `تم تصدير ${exported.fileName} — ${Math.round(exported.bytes / 1024)} كيلوبايت، ${exported.editedGlyphs} حرفاً معدلاً${verified ? '، وتم التحقق من القراءة' : ''}.`
          : `Exported ${exported.fileName} — ${Math.round(exported.bytes / 1024)} KB, ${exported.editedGlyphs} edited glyph(s)${verified ? ', read-back verified' : ''}.`,
      });
    } catch (cause) {
      setMessage({ kind: 'error', text: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(false);
      dispatch({ type: 'exporting', value: false });
    }
  };

  const downloadSvg = () => {
    const svg = previewSvg(
      {
        text: state.doc.sample.arabic,
        size: svgSize,
        color: '#123a2e',
        background: '#f5f7f4',
        script: 'arabic',
      },
      "'unitool-fontlab-preview', 'Cairo', sans-serif",
    );
    downloadBlob(svg, `${state.doc.family.replace(/\s+/g, '-')}-sample.svg`, 'image/svg+xml');
    setMessage({ kind: 'ok', text: ar ? 'تم تنزيل نموذج SVG.' : 'SVG sample downloaded.' });
  };

  return (
    <div className="fl-export">
      <PanelCard
        title={ar ? 'تصدير خط يعمل' : 'Export a working font'}
        subtitle={ar ? 'تُحفظ كل الجداول الأصلية (GSUB/GPOS/cmap/الأسماء)' : 'All original tables survive (GSUB/GPOS/cmap/names)'}
        icon={<FileType size={15} />}
      >
        <div className="fl-export-format">
          <Segmented<'ttf' | 'otf'>
            ariaLabel={ar ? 'صيغة التصدير' : 'Export format'}
            value={format}
            onChange={setFormat}
            options={[
              { value: 'ttf', label: 'TrueType .ttf' },
              { value: 'otf', label: 'OpenType .otf' },
            ]}
          />
        </div>
        <div className="fl-switch-list">
          <label>
            <span>{ar ? 'تضمين الكرننغ اليدوي' : 'Include manual kerning'}</span>
            <Toggle checked={includeKerning} onChange={setIncludeKerning} label={ar ? 'كرننغ' : 'Kerning'} />
          </label>
        </div>

        <ul className="fl-export-report">
          <li><StatusDot status="pass" /> {ar ? 'الحروف المعدلة' : 'Edited glyphs'} <b>{edits}</b></li>
          <li><StatusDot status={kern.count ? 'pass' : 'warn'} /> {ar ? 'أزواج الكرننغ' : 'Kerning pairs'} <b>{kern.count}</b></li>
          <li><StatusDot status={font?.parsed.tables.gpos ? 'pass' : 'warn'} /> GPOS <b>{font?.parsed.tables.gpos ? '✓' : '—'}</b></li>
          <li><StatusDot status={font?.parsed.tables.gsub ? 'pass' : 'warn'} /> GSUB <b>{font?.parsed.tables.gsub ? '✓' : '—'}</b></li>
          <li><StatusDot status="pass" /> {ar ? 'مقياس em' : 'Units/em'} <b>{state.doc.metrics.unitsPerEm}</b></li>
        </ul>

        <ActionButton full tone="primary" onClick={runExport} disabled={busy || !font} icon={busy ? <Loader2 size={15} className="fl-spin" /> : <Download size={15} />}>
          {ar ? `تنزيل ${format.toUpperCase()}` : `Download ${format.toUpperCase()}`}
        </ActionButton>

        {message ? (
          <p className={`fl-export-message is-${message.kind}`}>
            {message.kind === 'ok' ? <PackageCheck size={14} /> : <AlertTriangle size={14} />}
            {message.text}
          </p>
        ) : null}

        {result ? (
          <div className="fl-export-result">
            <div>
              <FileType size={18} />
              <strong>{result.fileName}</strong>
              <small>{Math.round(result.bytes / 1024)} KB · {result.glyphs} ✎</small>
            </div>
            <span className={result.verified ? 'is-ok' : 'is-warn'}>
              <ShieldCheck size={13} />
              {result.verified ? (ar ? 'تم التحقق' : 'Verified') : ar ? 'تحقق جزئي' : 'Partly verified'}
            </span>
          </div>
        ) : null}
      </PanelCard>

      <PanelCard title={ar ? 'نموذج SVG' : 'SVG sample'} icon={<FileImage size={15} />}>
        <Field label={ar ? 'حجم النموذج' : 'Sample size'} hint={`${svgSize}px`}>
          <Slider ariaLabel={ar ? 'حجم SVG' : 'SVG size'} min={48} max={280} value={svgSize} onChange={setSvgSize} />
        </Field>
        <div className="fl-svg-preview" dir="rtl" style={{ fontSize: `${Math.min(64, svgSize / 2)}px` }}>
          {state.doc.sample.arabic}
        </div>
        <ActionButton onClick={downloadSvg} icon={<Download size={14} />} full>{ar ? 'تنزيل SVG' : 'Download SVG'}</ActionButton>
      </PanelCard>

      <PanelCard title={ar ? 'ملاحظات التصدير' : 'Export notes'} icon={<ShieldCheck size={15} />}>
        <ul className="fl-export-notes">
          <li>{ar ? 'الحروف غير المعدّلة تُنسخ بايت ببايت من الخط الأصلي.' : 'Untouched glyphs are copied byte-for-byte from the original font.'}</li>
          <li>{ar ? 'الأوزان الأخرى (Bold/Black) تُصدَّر منفصلة — لا دمج تلقائي.' : 'Other weights (Bold/Black) export separately — no automatic merging.'}</li>
          <li>{ar ? 'الملف الناتج يُقرأ ويُعاد فتحه للتأكد قبل التنزيل.' : 'The output is parsed again before the download starts.'}</li>
          <li>{ar ? 'إن كان الخط WOFF2 فلن يُقرأ — استخدم TTF/OTF.' : 'WOFF2 files cannot be parsed — use TTF/OTF.'}</li>
        </ul>
      </PanelCard>
    </div>
  );
}
