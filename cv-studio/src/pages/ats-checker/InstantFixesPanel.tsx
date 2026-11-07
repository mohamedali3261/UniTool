import { AlertTriangle, CheckCircle2, Info, Wand2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { applyInstantAtsFix } from '../../core/atsEngine';
import type { AtsCheckItem } from '../../core/types';

export function InstantFixesPanel({ checks }: { checks: AtsCheckItem[] }) {
  const { updateResume, notify, t } = useCvStudio();

  const sorted = [...checks].sort((a, b) => {
    const rank = { fail: 0, warn: 1, pass: 2 };
    return rank[a.status] - rank[b.status];
  });

  const runInstantFix = (check: AtsCheckItem) => {
    if (!check.fixKind) return;
    updateResume((prev) => applyInstantAtsFix(prev, check.fixKind!));
    notify(t('تم تطبيق التحسين الفوري على سيرتك الذاتية', 'Applied instant ATS improvement'));
  };

  return (
    <section className="cva-card">
      <div className="cva-card-head">
        <div>
          <h3>{t('قائمة الفحص والتحسينات الفورية بنقرة واحدة', 'Diagnostic Checklist & One-Click Fixes')}</h3>
          <p>
            {t(
              'كل نقطة فحص توضح كيف يقرأ نظام الفرز الآلي سيرتك مع زر إصلاح فوري عند الحاجة.',
              'Actionable ATS diagnostics with instant one-click auto-fixes where applicable.',
            )}
          </p>
        </div>
      </div>

      <div className="cva-checks-list">
        {sorted.map((chk) => (
          <div key={chk.id} className={`cva-check-item is-${chk.status}`}>
            <div className="cva-check-icon">
              {chk.status === 'pass' ? (
                <CheckCircle2 size={18} />
              ) : chk.status === 'warn' ? (
                <Info size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
            </div>

            <div className="cva-check-copy">
              <strong>{t(chk.titleAr, chk.titleEn)}</strong>
              <p>{t(chk.detailAr, chk.detailEn)}</p>
            </div>

            {chk.fixKind && chk.status !== 'pass' && (
              <button
                type="button"
                className="cv-btn primary"
                data-testid={`ats-fix-${chk.fixKind}`}
                onClick={() => runInstantFix(chk)}
              >
                <Wand2 size={14} />
                <span>{t(chk.fixLabelAr || 'إصلاح فوري', chk.fixLabelEn || 'Fix Now')}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
