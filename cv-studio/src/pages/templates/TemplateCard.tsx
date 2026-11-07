import { CheckCircle2, FilePlus2, RefreshCw } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { LAYOUT_MODE_LABELS } from '../../core/i18n';
import type { TemplatePreset } from '../../core/types';

export function TemplateCard({ template }: { template: TemplatePreset }) {
  const { resume, applyTemplateKeepData, applyTemplateWithSample, t } = useCvStudio();
  const isCurrent = resume.design.templateId === template.id;
  const accent = template.design.accentColor;
  const isSidebar = template.design.layoutMode === 'modern' && template.design.modernVariant === 'sidebar';
  const isBanner = template.design.layoutMode === 'modern' && template.design.modernVariant === 'banner';
  const sample = resume.design.paperLang === 'en' ? template.sampleEn : template.sampleAr;
  const modeInfo = LAYOUT_MODE_LABELS[template.design.layoutMode];

  return (
    <article className={`cvt-card ${isCurrent ? 'is-current' : ''}`} data-testid={`template-card-${template.id}`}>
      {/* Miniature Print-White Paper Sheet */}
      <div className="cvt-mini-stage">
        <div
          className={`cvt-mini-paper ${isSidebar ? 'is-sidebar' : ''}`}
          dir={resume.design.paperDir}
        >
          {isSidebar ? (
            <>
              <div className="cvt-mini-side" style={{ backgroundColor: `${accent}14`, borderColor: `${accent}30` }}>
                <div className="cvt-mini-avatar" style={{ borderColor: accent }} />
                <strong style={{ color: accent }}>{sample.personal.fullName}</strong>
                <span>{sample.personal.jobTitle}</span>
                <div className="cvt-mini-lines">
                  <i style={{ width: '82%' }} />
                  <i style={{ width: '68%' }} />
                  <i style={{ width: '76%' }} />
                </div>
              </div>
              <div className="cvt-mini-main">
                <div className="cvt-mini-sec-bar" style={{ backgroundColor: accent }} />
                <p>{sample.summary.slice(0, 95)}…</p>
                <div className="cvt-mini-sec-bar" style={{ backgroundColor: accent }} />
                <div className="cvt-mini-lines">
                  <i style={{ width: '94%' }} />
                  <i style={{ width: '86%' }} />
                  <i style={{ width: '78%' }} />
                </div>
              </div>
            </>
          ) : (
            <div className="cvt-mini-single">
              <div
                className={`cvt-mini-head ${isBanner ? 'is-banner' : ''}`}
                style={
                  isBanner
                    ? { backgroundColor: `${accent}14`, borderTop: `4px solid ${accent}` }
                    : { borderBottom: `1.5px solid ${accent}44` }
                }
              >
                <strong style={{ color: accent }}>{sample.personal.fullName}</strong>
                <span>{sample.personal.jobTitle}</span>
              </div>
              <div className="cvt-mini-body">
                <div className="cvt-mini-sec-bar" style={{ backgroundColor: accent }} />
                <p>{sample.summary.slice(0, 105)}…</p>
                <div className="cvt-mini-sec-bar" style={{ backgroundColor: accent }} />
                <div className="cvt-mini-lines">
                  <i style={{ width: '95%' }} />
                  <i style={{ width: '88%' }} />
                  <i style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="cvt-card-content">
        <div className="cvt-card-badges">
          <span className="cvt-badge">{t(template.badgeAr, template.badgeEn)}</span>
          <span className="cvt-badge subtle">{t(modeInfo.ar, modeInfo.en)}</span>
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
