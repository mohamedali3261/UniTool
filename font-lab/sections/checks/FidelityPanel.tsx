/**
 * القسم ١٢ — لوحة التحقق.
 * تفحص الخط فعلياً (GSUB/GPOS/الأشكال/التصدير) وتُظهر ما يعمل وما ينقص،
 * مع خروج سريع لأول مشكلة.
 */
import { useMemo } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { fidelityReport, reportScore } from '../../core/library';
import { PanelCard, StatusDot } from '../../ui/controls';

export function FidelityPanel() {
  const { font, state, ar } = useFontLab();
  const checks = useMemo(
    () => (font ? fidelityReport(font, state.edited.length, state.exported) : []),
    [font, state.edited.length, state.exported],
  );

  if (!font) {
    return (
      <PanelCard title={ar ? 'التحقق' : 'Verification'} icon={<ShieldCheck size={15} />}>
        <p className="fl-empty">{ar ? 'حمّل خطاً لعرض التقرير.' : 'Load a font to see the report.'}</p>
      </PanelCard>
    );
  }

  const score = reportScore(checks);
  const passed = checks.filter((check) => check.status === 'pass').length;

  return (
    <PanelCard
      title={ar ? 'لوحة التحقق الفعلي' : 'Verification board'}
      subtitle={ar ? `${passed} من ${checks.length} فحصاً ناجحاً` : `${passed} of ${checks.length} checks pass`}
      icon={<ShieldCheck size={15} />}
      actions={
        <span className={`fl-score is-${score >= 80 ? 'good' : score >= 55 ? 'ok' : 'low'}`}>
          {score}%
        </span>
      }
    >
      <div className="fl-score-bar">
        <i style={{ width: `${score}%` }} />
      </div>
      <ul className="fl-check-list">
        {checks.map((check) => (
          <li key={check.id} className={`is-${check.status}`}>
            <StatusDot status={check.status} />
            <div>
              <strong>{ar ? check.ar : check.en}</strong>
              <small>{ar ? check.detailAr : check.detailEn}</small>
            </div>
          </li>
        ))}
      </ul>
      <p className="fl-hint-note">
        <Info size={13} />{' '}
        {ar
          ? 'كل فحص يقرأ بيانات الخط نفسه — لا يوجد «ناجح» ثابت في الكود.'
          : 'Every check reads the font itself — nothing is hard-coded to pass.'}
      </p>
    </PanelCard>
  );
}
