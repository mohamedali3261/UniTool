/**
 * القسم ٤ — مكتبة الخطوط.
 * ثلاثة خطوط مفتوحة مضمّنة (Cairo / Amiri / Inter) + استيراد TTF/OTF، وتحليل
 * الخط: عدد الحروف، الجداول، ميزات الاتصال العربي وتغطية النصوص.
 */
import { useRef, useState } from 'react';
import { BookOpen, Upload, Check, AlertTriangle, Type } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { LIBRARY } from '../../core/library';
import { ActionButton, PanelCard, StatusDot } from '../../ui/controls';

export function FontLibrary() {
  const { state, dispatch, font, loading, error, loadFontById, loadFontFile, ar } = useFontLab();
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await loadFontFile(file);
      setNotice(ar ? `تم تحميل ${file.name}` : `Loaded ${file.name}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <div className="fl-library">
      <PanelCard
        title={ar ? 'الخطوط المضمّنة' : 'Bundled fonts'}
        subtitle={ar ? 'خطوط مفتوحة الترخيص تُحمَّل محلياً بدون إنترنت' : 'Openly licensed fonts bundled with the app'}
        icon={<BookOpen size={15} />}
      >
        <div className="fl-font-list">
          {LIBRARY.map((entry) => {
            const active = font?.fileName === entry.file;
            return (
              <button
                key={entry.id}
                type="button"
                className={`fl-font-card${active ? ' is-active' : ''}`}
                onClick={() => void loadFontById(entry.id)}
                disabled={loading}
              >
                <span className="fl-font-chip" style={{ background: entry.accent }}>{entry.family.slice(0, 2)}</span>
                <span className="fl-font-body">
                  <strong>{entry.family} <em>{entry.style}</em></strong>
                  <small>{ar ? entry.noteAr : entry.noteEn}</small>
                  <span className="fl-font-tags">
                    {entry.tags.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}
                    <i>{entry.glyphs} ✎</i>
                    <i>{entry.upm} upm</i>
                    <i title={entry.licenceFile}>{entry.licence}</i>
                  </span>
                </span>
                {active ? <Check size={16} className="fl-font-check" /> : null}
              </button>
            );
          })}
        </div>

        <div
          className={`fl-dropzone${dragging ? ' is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <Upload size={18} />
          <p>{ar ? 'اسحب ملف TTF أو OTF هنا، أو' : 'Drop a TTF/OTF file here, or'}</p>
          <ActionButton onClick={() => inputRef.current?.click()} icon={<Upload size={14} />}>{ar ? 'اختر ملفاً' : 'Choose a file'}</ActionButton>
          <input
            ref={inputRef}
            type="file"
            accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf"
            hidden
            onChange={(event) => void handleFile(event.target.files?.[0] || undefined)}
          />
          <small>{ar ? 'كل شيء يُعالَج في المتصفح — لا يُرسل أي ملف لأي سيرفر.' : 'Everything runs in your browser — files never leave the device.'}</small>
        </div>

        {notice ? <p className="fl-hint-note">{notice}</p> : null}
        {error ? (
          <p className="fl-export-message is-error">
            <AlertTriangle size={14} /> {error}
          </p>
        ) : null}
      </PanelCard>

      {font ? (
        <PanelCard
          title={ar ? 'تحليل الخط الحالي' : 'Current font analysis'}
          subtitle={font.fileName}
          icon={<Type size={15} />}
          actions={<span className="fl-chip is-feature">{font.summary.outlineFormat}</span>}
        >
          <div className="fl-analysis">
            <div>
              <small>{ar ? 'العائلة' : 'Family'}</small>
              <b>{font.summary.family}</b>
            </div>
            <div>
              <small>{ar ? 'النمط' : 'Style'}</small>
              <b>{font.summary.subfamily}</b>
            </div>
            <div>
              <small>{ar ? 'خانات الحروف' : 'Glyph slots'}</small>
              <b>{font.summary.glyphCount}</b>
            </div>
            <div>
              <small>{ar ? 'مرسوم' : 'Drawn'}</small>
              <b>{font.drawn.length}</b>
            </div>
            <div>
              <small>em</small>
              <b>{font.summary.unitsPerEm}</b>
            </div>
            <div>
              <small>{ar ? 'الصيغة' : 'Outline'}</small>
              <b>{font.summary.outlineFormat}</b>
            </div>
          </div>

          <div className="fl-chips">
            {font.summary.scripts.map((script) => (
              <span key={script} className="fl-chip">{script}</span>
            ))}
            {font.summary.features.slice(0, 12).map((feature) => (
              <span key={feature} className="fl-chip is-feature">{feature}</span>
            ))}
          </div>

          <div className="fl-caps">
            <span><StatusDot status={font.summary.hinting ? 'pass' : 'warn'} /> {ar ? 'تلميحات' : 'Hinting'} <b>{font.summary.hinting ? '✓' : '—'}</b></span>
            <span><StatusDot status={font.summary.variable ? 'pass' : 'warn'} /> {ar ? 'متغير' : 'Variable'} <b>{font.summary.variable ? '✓' : '—'}</b></span>
            <span><StatusDot status={font.summary.colorGlyphs ? 'pass' : 'warn'} /> {ar ? 'ملون' : 'Colour'} <b>{font.summary.colorGlyphs ? '✓' : '—'}</b></span>
            <span><StatusDot status={font.summary.license ? 'pass' : 'warn'} /> {ar ? 'ترخيص' : 'Licence'} <b>{font.summary.license ? '✓' : '—'}</b></span>
          </div>

          <p className="fl-hint-note">
            {ar
              ? 'الأشكال المتصلة تُستخرج من جدول GSUB الحقيقي، لذلك «باء» تظهر بشكلها الابتدائي/الوسطي كما في الخط نفسه.'
              : 'Positional forms come from the real GSUB table, so a letter shows the same initial/medial shape the font ships.'}
          </p>
        </PanelCard>
      ) : null}
    </div>
  );
}
