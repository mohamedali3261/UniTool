import { CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import type { AtsReport } from '../../core/types';
import { SAMPLE_JOB_DESCRIPTIONS } from '../../data/phrases';

export function JobMatcherPanel({ report }: { report: AtsReport }) {
  const { resume, updateResume, notify, t } = useCvStudio();

  const setJobDesc = (text: string) => {
    updateResume((prev) => ({ ...prev, jobDescription: text }));
  };

  const addMissingKeywordToSkills = (keyword: string) => {
    const exists = resume.skills.some((s) => s.name.toLowerCase() === keyword.toLowerCase());
    if (exists) return;
    updateResume((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: `sk-jd-${Date.now()}`, name: keyword, level: 4 }],
    }));
    notify(t(`تمت إضافة «${keyword}» إلى قسم المهارات`, `Added "${keyword}" to your Skills`));
  };

  const totalKw = report.matchedKeywords.length + report.missingKeywords.length;
  const matchPercent = totalKw > 0 ? Math.round((report.matchedKeywords.length / totalKw) * 100) : 0;

  return (
    <section className="cva-card">
      <div className="cva-card-head">
        <div>
          <h3>{t('مقارنة السيرة مع وصف الوظيفة (Job Description)', 'Job Description Keyword Matcher')}</h3>
          <p>
            {t(
              'الصق إعلان الوظيفة لاستخراج الكلمات المفتاحية المتطابقة والناقصة، وأضف أي مهارة ناقصة بنقرة واحدة.',
              'Paste a target job posting to detect matched and missing keywords, and add missing skills in one click.',
            )}
          </p>
        </div>
      </div>

      <div className="cva-sample-jds">
        <span>{t('تجربة سريعة بنموذج إعلان وظيفي:', 'Try a sample job posting:')}</span>
        {SAMPLE_JOB_DESCRIPTIONS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="cv-chip"
            data-testid={`sample-jd-${sample.id}`}
            onClick={() => setJobDesc(sample.text)}
          >
            <Sparkles size={11} /> {t(sample.titleAr, sample.titleEn)}
          </button>
        ))}
      </div>

      <div className="cv-field">
        <textarea
          rows={5}
          data-testid="jd-textarea"
          placeholder={t(
            'الصق نص الوصف الوظيفي هنا (متطلبات الوظيفة، المهارات المطلوبة، الأدوات)...',
            'Paste the job description requirements and responsibilities here...',
          )}
          value={resume.jobDescription}
          onChange={(e) => setJobDesc(e.target.value)}
        />
      </div>

      {report.hasJobDescription && totalKw > 0 ? (
        <div className="cva-match-results" data-testid="jd-match-results">
          <div className="cva-match-banner">
            <div>
              <strong>
                {t('نسبة تطابق الكلمات المفتاحية:', 'Keyword Match Rate:')}{' '}
                <em>{matchPercent}%</em>
              </strong>
              <small>
                {t(
                  `${report.matchedKeywords.length} كلمة موجودة في سيرتك من أصل ${totalKw}`,
                  `${report.matchedKeywords.length} of ${totalKw} target keywords present`,
                )}
              </small>
            </div>
          </div>

          {report.missingKeywords.length > 0 && (
            <div className="cva-kw-group">
              <h4>{t('كلمات مفتاحية ناقصة (اضغط لإضافتها إلى مهاراتك فوراً):', 'Missing Keywords (Click to add to Skills):')}</h4>
              <div className="cva-kw-chips">
                {report.missingKeywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    className="cva-kw-missing"
                    onClick={() => addMissingKeywordToSkills(kw)}
                  >
                    <Plus size={12} />
                    <span>{kw}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {report.matchedKeywords.length > 0 && (
            <div className="cva-kw-group">
              <h4>{t('كلمات مفتاحية متطابقة في سيرتك:', 'Matched Keywords Found:')}</h4>
              <div className="cva-kw-chips">
                {report.matchedKeywords.map((kw) => (
                  <span key={kw} className="cva-kw-matched">
                    <CheckCircle2 size={12} />
                    <span>{kw}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <small className="cv-calm-note">
          {t('الصق وصف وظيفة مكوناً من جملتين أو أكثر لعرض تحليل الكلمات المفتاحية.', 'Paste at least two lines of a job posting to view keyword extraction.')}
        </small>
      )}
    </section>
  );
}
