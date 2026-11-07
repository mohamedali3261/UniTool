import { useCvStudio } from '../../app/context';
import type { AtsReport } from '../../core/types';

export function AtsScoreGauge({ report }: { report: AtsReport }) {
  const { t } = useCvStudio();
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (report.totalScore / 100) * circumference;

  const gradeText =
    report.grade === 'excellent'
      ? t('ممتاز وجاهز للتقديم القياسي', 'Excellent — ATS Ready')
      : report.grade === 'good'
        ? t('جيد مع فرص تحسين سريعة', 'Solid — Quick wins available')
        : t('يحتاج إلى تقوية قبل الإرسال', 'Needs strengthening before applying');

  return (
    <section className="cva-gauge-card" aria-label={t('مؤشر قوة السيرة الذاتية', 'ATS Score Gauge')}>
      <div className="cva-gauge-ring-wrap">
        <svg viewBox="0 0 140 140" className="cva-gauge-svg" aria-hidden="true">
          <circle cx="70" cy="70" r={radius} className="cva-ring-bg" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="cva-ring-fg"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="cva-gauge-center">
          <strong data-testid="ats-total-score">{report.totalScore}%</strong>
          <span>ATS Score</span>
        </div>
      </div>

      <div className="cva-gauge-details">
        <h2>{t('مؤشر التوافق مع أنظمة الفرز (ATS)', 'ATS Compatibility & Resume Strength')}</h2>
        <p className="cva-grade-pill">{gradeText}</p>

        <div className="cva-subbars">
          {report.subScores.map((b) => {
            const pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
            return (
              <div key={b.id} className="cva-subbar-row">
                <div className="cva-subbar-top">
                  <span>{t(b.labelAr, b.labelEn)}</span>
                  <strong>
                    {b.score}/{b.max}
                  </strong>
                </div>
                <div className="cva-subbar-track">
                  <div className="cva-subbar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
