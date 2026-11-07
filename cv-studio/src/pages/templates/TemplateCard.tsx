import { CheckCircle2, FilePlus2, RefreshCw } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { LAYOUT_MODE_LABELS } from '../../core/i18n';
import type { TemplatePreset } from '../../core/types';
import { getTemplateModuleById } from '../../data/templates';

export function TemplateCard({ template }: { template: TemplatePreset }) {
  const { resume, applyTemplateKeepData, applyTemplateWithSample, t } = useCvStudio();
  const isCurrent = resume.design.templateId === template.id;
  const accent = template.design.accentColor;
  const sample = resume.design.paperLang === 'en' ? template.sampleEn : template.sampleAr;
  const modeInfo = LAYOUT_MODE_LABELS[template.design.layoutMode];
  const tplModule = getTemplateModuleById(template.id);

  return (
    <article
      className={`cvt-card ${isCurrent ? 'is-current' : ''}`}
      data-testid={`template-card-${template.id}`}
      data-visual-style={template.visualStyle}
    >
      {/* Distinct Per-Template Miniature Print-White Paper Sheet */}
      <div className="cvt-mini-stage">
        {tplModule ? (
          tplModule.renderMiniPreview({
            sample,
            accent,
            paperDir: resume.design.paperDir,
          })
        ) : null}
      </div>

      <div className="cvt-card-content">
        <div className="cvt-card-badges">
          <span className="cvt-badge">{t(template.badgeAr, template.badgeEn)}</span>
          <span className="cvt-badge subtle">
            {t(template.structureTagAr || modeInfo.ar, template.structureTagEn || modeInfo.en)}
          </span>
          {isCurrent && (
            <span className="cvt-badge current">
              <CheckCircle2 size={11} />
              {t('مُفعّل حالياً', 'Active')}
            </span>
          )}
        </div>

        <h3>{t(template.nameAr, template.nameEn)}</h3>
        <p>{t(template.descAr, template.descEn)}</p>

        <div className="cvt-card-actions">
          <button
            type="button"
            className="cv-btn primary"
            data-testid={`apply-template-keep-${template.id}`}
            onClick={() => applyTemplateKeepData(template)}
          >
            <RefreshCw size={14} />
            <span>{t('تطبيق مع الاحتفاظ ببياناتي', 'Apply to My Data')}</span>
          </button>
          <button
            type="button"
            className="cv-btn"
            onClick={() => void applyTemplateWithSample(template)}
          >
            <FilePlus2 size={14} />
            <span>{t('نسخة جديدة بمحتوى القالب', 'New Copy with Sample')}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
