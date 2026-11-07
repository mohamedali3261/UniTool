import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import './ats-checker.css';
import { AtsScoreGauge } from './AtsScoreGauge';
import { InstantFixesPanel } from './InstantFixesPanel';
import { JobMatcherPanel } from './JobMatcherPanel';

export function AtsCheckerPage() {
  const { atsReport, navigate, lang, t } = useCvStudio();
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="cva-page" data-testid="cv-ats-page">
      <div className="cva-top-row">
        <div>
          <h1>{t('فاحص توافق السيرة الذاتية (ATS) ومطابقة الوظائف', 'ATS Compatibility & Job Matcher')}</h1>
          <p>
            {t(
              'تحقق محلياً 100% على جهازك من جاهزية سيرتك لأنظمة الفرز الآلي وقارنها مع متطلبات الوظيفة المستهدفة.',
              '100% private client-side audit of ATS parsing compliance, measurable impact, and target job alignment.',
            )}
          </p>
        </div>
        <button type="button" className="cv-btn" onClick={() => navigate('editor')}>
          <span>{t('العودة للمحرر والمعاينة', 'Back to Editor')}</span>
          <ArrowIcon size={15} />
        </button>
      </div>

      <AtsScoreGauge report={atsReport} />

      <div className="cva-two-cols">
        <JobMatcherPanel report={atsReport} />
        <InstantFixesPanel checks={atsReport.checks} />
      </div>
    </div>
  );
}
