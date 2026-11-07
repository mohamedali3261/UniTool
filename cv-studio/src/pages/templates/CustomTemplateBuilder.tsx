import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { Modal } from '../../components/Modal';
import { LAYOUT_MODE_LABELS } from '../../core/i18n';
import type { DesignSettings, LayoutMode, TemplateVisualStyle } from '../../core/types';
import { createBlankResume, CV_TEMPLATES } from '../../data/templates';
import { CV_COLOR_SWATCHES, CV_FONTS } from '../../data/themes';

export function CustomTemplateBuilder({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { resume, updateResume, addResume, navigate, notify, t } = useCvStudio();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(resume.design.layoutMode);
  const [visualStyle, setVisualStyle] = useState<TemplateVisualStyle>(
    resume.design.visualStyle || 'modern-sidebar',
  );
  const [paperLang, setPaperLang] = useState<'ar' | 'en'>(resume.design.paperLang);
  const [fontFamily, setFontFamily] = useState(resume.design.fontFamily);
  const [accentColor, setAccentColor] = useState(resume.design.accentColor);
  const [sectionDivider, setSectionDivider] = useState<DesignSettings['sectionDivider']>('line');

  if (!open) return null;

  const builtDesign: DesignSettings = {
    ...resume.design,
    templateId: 'custom-from-scratch',
    visualStyle,
    layoutMode,
    modernVariant: visualStyle === 'modern-sidebar' ? 'sidebar' : 'banner',
    paperLang,
    paperDir: paperLang === 'ar' ? 'rtl' : 'ltr',
    fontFamily,
    accentColor,
    sectionDivider,
  };

  const applyToCurrent = () => {
    updateResume((prev) => ({
      ...prev,
      design: builtDesign,
    }));
    onClose();
    navigate('editor');
    notify(t('تم تطبيق القالب المخصص على بياناتك الحالية', 'Custom template applied to your current resume'));
  };

  const createFreshBlank = async () => {
    const blank = createBlankResume(paperLang);
    blank.design = builtDesign;
    await addResume(blank);
    onClose();
    navigate('editor');
    notify(t('تم إنشاء سيرة ذاتية فارغة بقالبك المخصص', 'Blank resume created with your custom template'));
  };

  return (
    <Modal
      wide
      title={t('منشئ القالب المخصص من الصفر', 'Custom Template Builder from Scratch')}
      subtitle={t(
        'صمّم هيكلك الخاص باختيار معمارية القالب والخط ولون الهوية، ثم طبّقه على بياناتك أو ابدأ ورقة فارغة.',
        'Compose your own layout architecture, font, and calm identity color, then apply to existing data or start blank.',
      )}
      closeLabel={t('إغلاق', 'Close')}
      onClose={onClose}
    >
      <div className="cv-design-panel">
        <div className="cv-design-group">
          <h4>{t('1. اختر وضع التخطيط', '1. Choose Structural Mode')}</h4>
          <div className="cv-layout-cards">
            {(['ats', 'modern', 'one-page', 'detailed'] as LayoutMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`cv-layout-card ${layoutMode === m ? 'active' : ''}`}
                onClick={() => setLayoutMode(m)}
              >
                <div className="cv-layout-card-top">
                  <strong>{t(LAYOUT_MODE_LABELS[m].ar, LAYOUT_MODE_LABELS[m].en)}</strong>
                  {layoutMode === m && <Check size={14} />}
                </div>
                <small>{t(LAYOUT_MODE_LABELS[m].descAr, LAYOUT_MODE_LABELS[m].descEn)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="cv-design-group">
          <h4>{t('2. اختر البنية البصرية للقالب', '2. Choose Visual Architecture')}</h4>
          <div className="cv-chip-row">
            {CV_TEMPLATES.map((tpl) => (
              <button
                key={tpl.visualStyle}
                type="button"
                className={`cv-chip ${visualStyle === tpl.visualStyle ? 'active' : ''}`}
                onClick={() => setVisualStyle(tpl.visualStyle)}
              >
                {t(tpl.structureTagAr, tpl.structureTagEn)}
              </button>
            ))}
          </div>
        </div>

        <div className="cv-grid-2">
          <div className="cv-field">
            <label>{t('3. لغة واتجاه الورقة', '3. Sheet Language & Direction')}</label>
            <select
              value={paperLang}
              onChange={(e) => {
                const next = e.target.value as 'ar' | 'en';
                setPaperLang(next);
                setFontFamily(next === 'en' ? 'inter' : 'cairo');
              }}
            >
              <option value="ar">العربية (RTL)</option>
              <option value="en">English (LTR)</option>
            </select>
          </div>
          <div className="cv-field">
            <label>{t('4. خط الطباعة', '4. Sheet Font')}</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              {CV_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {t(f.labelAr, f.labelEn)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cv-grid-2">
          <div className="cv-design-group">
            <h4>{t('5. لون الهوية الهادئ', '5. Calm Identity Color')}</h4>
            <div className="cv-swatches-row">
              {CV_COLOR_SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  className={`cv-color-swatch ${accentColor.toLowerCase() === sw.hex.toLowerCase() ? 'active' : ''}`}
                  style={{ backgroundColor: sw.hex }}
                  aria-label={t(sw.labelAr, sw.labelEn)}
                  onClick={() => setAccentColor(sw.hex)}
                />
              ))}
            </div>
          </div>

          <div className="cv-field">
            <label>{t('6. فواصل الأقسام', '6. Section Divider')}</label>
            <select
              value={sectionDivider}
              onChange={(e) => setSectionDivider(e.target.value as DesignSettings['sectionDivider'])}
            >
              <option value="line">{t('خط سفلي نظيف', 'Bottom Rule')}</option>
              <option value="accent-bar">{t('شريط جانبي', 'Side Accent Bar')}</option>
              <option value="soft-bg">{t('خلفية هادئة', 'Soft Tinted Band')}</option>
            </select>
          </div>
        </div>

        <div className="cv-modal-footer">
          <button type="button" className="cv-btn" onClick={() => void createFreshBlank()}>
            {t('بدء ورقة فارغة بهذا القالب', 'Start Blank CV with Template')}
          </button>
          <button type="button" className="cv-btn primary" onClick={applyToCurrent}>
            <Sparkles size={14} />
            <span>{t('تطبيق على سيرتي الحالية', 'Apply to Current CV')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
