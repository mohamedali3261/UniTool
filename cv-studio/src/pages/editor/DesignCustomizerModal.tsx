import { Check } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { Modal } from '../../components/Modal';
import { LAYOUT_MODE_LABELS, SKILL_DISPLAY_LABELS } from '../../core/i18n';
import type {
  DesignSettings,
  LayoutMode,
  SkillDisplayMode,
  TemplateVisualStyle,
} from '../../core/types';
import { CV_COLOR_SWATCHES, CV_FONTS } from '../../data/themes';

export function DesignCustomizerPanel() {
  const { resume, updateResume, t } = useCvStudio();
  const { design } = resume;

  const setDesign = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    updateResume((prev) => ({
      ...prev,
      design: { ...prev.design, [key]: value },
    }));
  };

  const switchPaperLanguage = (nextLang: 'ar' | 'en') => {
    updateResume((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        paperLang: nextLang,
        paperDir: nextLang === 'ar' ? 'rtl' : 'ltr',
        fontFamily:
          nextLang === 'en' && ['noto-naskh', 'noto-kufi', 'amiri'].includes(prev.design.fontFamily)
            ? 'inter'
            : nextLang === 'ar' && ['inter', 'poppins', 'montserrat', 'playfair'].includes(prev.design.fontFamily)
              ? 'cairo'
              : prev.design.fontFamily,
      },
    }));
  };

  const layoutModes: LayoutMode[] = ['ats', 'modern', 'one-page', 'detailed'];
  const skillModes: SkillDisplayMode[] = ['badges', 'bars', 'dots', 'bullets', 'comma'];

  const setLayoutModeAndStyle = (mode: LayoutMode) => {
    const defaultStyle: Record<LayoutMode, TemplateVisualStyle> = {
      ats: 'ats-classic',
      modern: design.modernVariant === 'sidebar' ? 'modern-sidebar' : 'creative-banner-timeline',
      'one-page': 'tech-split-grid',
      detailed: 'academic-hanging',
    };
    updateResume((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        layoutMode: mode,
        visualStyle: defaultStyle[mode],
      },
    }));
  };

  return (
    <div className="cv-design-panel">
      {/* 1. 4 Layout Modes */}
      <div className="cv-design-group">
        <h4>{t('أوضاع السيرة الذاتية الأربعة', '4 Resume Layout Modes')}</h4>
        <div className="cv-layout-cards">
          {layoutModes.map((mode) => {
            const info = LAYOUT_MODE_LABELS[mode];
            const active = design.layoutMode === mode;
            return (
              <button
                key={mode}
                type="button"
                data-testid={`layout-mode-${mode}`}
                className={`cv-layout-card ${active ? 'active' : ''}`}
                onClick={() => setLayoutModeAndStyle(mode)}
              >
                <div className="cv-layout-card-top">
                  <strong>{t(info.ar, info.en)}</strong>
                  {active && <Check size={14} />}
                </div>
                <small>{t(info.descAr, info.descEn)}</small>
              </button>
            );
          })}
        </div>

        {design.layoutMode === 'modern' && (
          <div className="cv-sub-options">
            <span>{t('تخطيط الوضع الحديث:', 'Modern Variant:')}</span>
            <button
              type="button"
              className={`cv-chip ${design.modernVariant === 'sidebar' ? 'active' : ''}`}
              onClick={() =>
                updateResume((prev) => ({
                  ...prev,
                  design: {
                    ...prev.design,
                    modernVariant: 'sidebar',
                    visualStyle: 'modern-sidebar',
                  },
                }))
              }
            >
              {t('عمودان جانبيان', 'Two-Column Sidebar')}
            </button>
            <button
              type="button"
              className={`cv-chip ${design.modernVariant === 'banner' ? 'active' : ''}`}
              onClick={() =>
                updateResume((prev) => ({
                  ...prev,
                  design: {
                    ...prev.design,
                    modernVariant: 'banner',
                    visualStyle: 'creative-banner-timeline',
                  },
                }))
              }
            >
              {t('ترويسة عريضة مميزة', 'Executive Banner')}
            </button>
          </div>
        )}
      </div>

      {/* 2. Independent Paper Language & Paper Size */}
      <div className="cv-grid-2">
        <div className="cv-design-group">
          <h4>{t('لغة واتجاه ورقة الـ CV (مستقلة)', 'CV Sheet Language & Direction')}</h4>
          <div className="cv-chip-row">
            <button
              type="button"
              data-testid="paper-lang-ar"
              className={`cv-chip ${design.paperLang === 'ar' ? 'active' : ''}`}
              onClick={() => switchPaperLanguage('ar')}
            >
              العربية (RTL)
            </button>
            <button
              type="button"
              data-testid="paper-lang-en"
              className={`cv-chip ${design.paperLang === 'en' ? 'active' : ''}`}
              onClick={() => switchPaperLanguage('en')}
            >
              English (LTR)
            </button>
          </div>
        </div>

        <div className="cv-design-group">
          <h4>{t('مقاس الورقة القياسي', 'Paper Size')}</h4>
          <div className="cv-chip-row">
            <button
              type="button"
              className={`cv-chip ${design.paperSize === 'a4' ? 'active' : ''}`}
              onClick={() => setDesign('paperSize', 'a4')}
            >
              A4 (210 × 297 mm)
            </button>
            <button
              type="button"
              className={`cv-chip ${design.paperSize === 'letter' ? 'active' : ''}`}
              onClick={() => setDesign('paperSize', 'letter')}
            >
              US Letter
            </button>
          </div>
        </div>
      </div>

      {/* 3. Typography & Calm Color Identity */}
      <div className="cv-grid-2">
        <div className="cv-field">
          <label>{t('خط الورقة الطباعي', 'Sheet Font Family')}</label>
          <select
            value={design.fontFamily}
            onChange={(e) => setDesign('fontFamily', e.target.value)}
          >
            {CV_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {t(f.labelAr, f.labelEn)}
              </option>
            ))}
          </select>
        </div>

        <div className="cv-field">
          <label>{t('نمط فواصل العناوين', 'Section Heading Style')}</label>
          <select
            value={design.sectionDivider}
            onChange={(e) => setDesign('sectionDivider', e.target.value as DesignSettings['sectionDivider'])}
          >
            <option value="line">{t('خط كلاسيكي سفلي', 'Clean Bottom Line')}</option>
            <option value="accent-bar">{t('شريط جانبي أنيق', 'Side Accent Bar')}</option>
            <option value="soft-bg">{t('شريط خلفية هادئ', 'Soft Tinted Band')}</option>
          </select>
        </div>
      </div>

      <div className="cv-design-group">
        <h4>{t('لون الهوية الهادئ للورقة', 'Calm Sheet Accent Color')}</h4>
        <div className="cv-swatches-row">
          {CV_COLOR_SWATCHES.map((sw) => {
            const active = design.accentColor.toLowerCase() === sw.hex.toLowerCase();
            return (
              <button
                key={sw.hex}
                type="button"
                className={`cv-color-swatch ${active ? 'active' : ''}`}
                style={{ backgroundColor: sw.hex }}
                title={t(sw.labelAr, sw.labelEn)}
                aria-label={t(sw.labelAr, sw.labelEn)}
                onClick={() => setDesign('accentColor', sw.hex)}
              >
                {active && <Check size={13} color="#ffffff" />}
              </button>
            );
          })}
          <input
            type="color"
            className="cv-color-picker"
            aria-label={t('اختيار لون مخصص', 'Custom accent color')}
            value={design.accentColor}
            onChange={(e) => setDesign('accentColor', e.target.value)}
          />
        </div>
      </div>

      {/* 4. Fine Spacing & Skill Display */}
      <div className="cv-grid-3-sliders">
        <div className="cv-field">
          <label>
            {t('حجم الخط', 'Font Scale')} ({Math.round(design.fontScale * 100)}%)
          </label>
          <input
            type="range"
            min="0.85"
            max="1.15"
            step="0.02"
            value={design.fontScale}
            onChange={(e) => setDesign('fontScale', Number(e.target.value))}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('تباعد الأسطر', 'Line Height')} ({design.lineHeight.toFixed(2)})
          </label>
          <input
            type="range"
            min="1.25"
            max="1.75"
            step="0.05"
            value={design.lineHeight}
            onChange={(e) => setDesign('lineHeight', Number(e.target.value))}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('هوامش الورقة', 'Page Margins')} ({design.marginMm} mm)
          </label>
          <input
            type="range"
            min="10"
            max="22"
            step="1"
            value={design.marginMm}
            onChange={(e) => setDesign('marginMm', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="cv-design-group">
        <h4>{t('طريقة عرض المهارات', 'Skills Presentation')}</h4>
        <div className="cv-chip-row">
          {skillModes.map((m) => (
            <button
              key={m}
              type="button"
              className={`cv-chip ${design.skillDisplay === m ? 'active' : ''}`}
              onClick={() => setDesign('skillDisplay', m)}
            >
              {t(SKILL_DISPLAY_LABELS[m].ar, SKILL_DISPLAY_LABELS[m].en)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesignCustomizerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useCvStudio();
  if (!open) return null;
  return (
    <Modal
      wide
      title={t('التصميم وأوضاع السيرة الذاتية', 'Design, Typography & Layout Modes')}
      subtitle={t(
        'خصص وضع السيرة، لغة الورقة المستقلة، الخطوط، الهوامش، ولون الهوية دون المساس بمحتواك.',
        'Customize layout mode, independent paper language, fonts, margins, and calm color accent.',
      )}
      closeLabel={t('تم', 'Done')}
      onClose={onClose}
    >
      <DesignCustomizerPanel />
    </Modal>
  );
}
