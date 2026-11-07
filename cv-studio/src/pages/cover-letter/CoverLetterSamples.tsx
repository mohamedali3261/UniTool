import { Sparkles } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { COVER_LETTER_PRESETS } from '../../data/phrases';

export function CoverLetterSamples() {
  const { resume, updateResume, notify, t } = useCvStudio();
  const pLang = resume.design.paperLang;

  const applySample = (presetId: string) => {
    const preset = COVER_LETTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const role = resume.personal.jobTitle || (pLang === 'ar' ? 'الوظيفة المعلنة' : 'the open position');
    const company =
      resume.coverLetter.companyName ||
      resume.targetCompany ||
      (pLang === 'ar' ? 'مؤسستكم الموقرة' : 'your organization');

    const fill = (raw: string) => raw.replace(/\{\{role\}\}/g, role).replace(/\{\{company\}\}/g, company);

    updateResume((prev) => ({
      ...prev,
      coverLetter: {
        ...prev.coverLetter,
        subject: fill(pLang === 'ar' ? preset.subjectAr : preset.subjectEn),
        greeting: fill(pLang === 'ar' ? preset.greetingAr : preset.greetingEn),
        opening: fill(pLang === 'ar' ? preset.openingAr : preset.openingEn),
        body: fill(pLang === 'ar' ? preset.bodyAr : preset.bodyEn),
        closing: fill(pLang === 'ar' ? preset.closingAr : preset.closingEn),
        signOff: pLang === 'ar' ? preset.signOffAr : preset.signOffEn,
      },
    }));
    notify(t('تم ملء الخطاب بالنموذج المختار مع دمج مسماك الوظيفي والشركة', 'Applied cover letter preset with your role & company'));
  };

  return (
    <div className="cvcl-samples-bar">
      <span className="cvcl-samples-label">
        <Sparkles size={14} />
        {t('قوالب نصية جاهزة حسب نوع الوظيفة:', 'Ready Letter Templates by Job Type:')}
      </span>
      <div className="cvcl-samples-chips">
        {COVER_LETTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="cv-chip"
            data-testid={`cl-preset-${preset.id}`}
            onClick={() => applySample(preset.id)}
          >
            {t(preset.roleTypeAr, preset.roleTypeEn)}
          </button>
        ))}
      </div>
    </div>
  );
}
