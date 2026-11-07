import { useState } from 'react';
import { ChevronDown, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { Modal } from '../../components/Modal';
import type { ExperienceItem } from '../../core/types';
import { ACHIEVEMENT_PHRASES, SUMMARY_STARTERS } from '../../data/phrases';

export function SummaryExperienceSection() {
  const { resume, updateResume, notify, t } = useCvStudio();
  const [openExpId, setOpenExpId] = useState<string>(resume.experience[0]?.id || '');
  const [phraseModalExpId, setPhraseModalExpId] = useState<string | null>(null);
  const [summaryPickerOpen, setSummaryPickerOpen] = useState(false);

  const pLang = resume.design.paperLang;

  const updateExp = (id: string, patch: Partial<ExperienceItem>) => {
    updateResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: pLang === 'ar' ? 'المسمى الوظيفي' : 'Job Title',
      company: pLang === 'ar' ? 'اسم جهة العمل' : 'Company Name',
      location: pLang === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt',
      startDate: '2024',
      endDate: '',
      current: true,
      highlights: [''],
    };
    updateResume((prev) => ({ ...prev, experience: [newItem, ...prev.experience] }));
    setOpenExpId(newItem.id);
  };

  const removeExperience = (id: string) => {
    updateResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((item) => item.id !== id),
    }));
  };

  const insertBulletPhrase = (expId: string, phraseText: string) => {
    updateResume((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id !== expId) return exp;
        const clean = exp.highlights.filter((h) => h.trim().length > 0);
        return { ...exp, highlights: [...clean, phraseText] };
      }),
    }));
    setPhraseModalExpId(null);
    notify(t('تم إدراج العبارة الإنجازية في الخبرة', 'Achievement phrase inserted'));
  };

  return (
    <div className="cv-section-stack">
      {/* Summary Card */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('الملخص المهني', 'Professional Summary')}</h3>
            <p>{t('نبذة مركزة من 3 أسطر تبرز تخصصك وأهم نتائجك.', 'A concise 3-line pitch highlighting your seniority and impact.')}</p>
          </div>
          <button type="button" className="cv-btn soft" onClick={() => setSummaryPickerOpen(true)}>
            <Wand2 size={14} />
            <span>{t('صياغات جاهزة', 'Ready Starters')}</span>
          </button>
        </div>

        <div className="cv-field">
          <textarea
            aria-label={t('الملخص المهني', 'Professional Summary')}
            rows={4}
            value={resume.summary}
            onChange={(e) => updateResume((prev) => ({ ...prev, summary: e.target.value }))}
          />
        </div>
      </div>

      {/* Work Experience Card */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('الخبرات العملية', 'Work Experience')}</h3>
            <p>{t('رتّب خبراتك من الأحدث للأقدم مع التركيز على الأرقام والنتائج.', 'List roles chronologically with measurable bullet achievements.')}</p>
          </div>
          <button type="button" className="cv-btn primary" onClick={addExperience}>
            <Plus size={15} />
            <span>{t('إضافة خبرة', 'Add Role')}</span>
          </button>
        </div>

        <div className="cv-accordion-list">
          {resume.experience.map((exp) => {
            const expanded = openExpId === exp.id;
            return (
              <div key={exp.id} className={`cv-acc-item ${expanded ? 'open' : ''}`}>
                <div className="cv-acc-header">
                  <button
                    type="button"
                    className="cv-acc-trigger"
                    aria-expanded={expanded}
                    onClick={() => setOpenExpId(expanded ? '' : exp.id)}
                  >
                    <div>
                      <strong>{exp.role || t('بدون مسمى', 'Untitled Role')}</strong>
                      <small>
                        {exp.company} · {exp.startDate} – {exp.current ? t('حتى الآن', 'Present') : exp.endDate}
                      </small>
                    </div>
                    <ChevronDown size={16} className="cv-chevron" />
                  </button>
                  <button
                    type="button"
                    className="cv-icon-btn"
                    aria-label={t('حذف الخبرة', 'Remove experience')}
                    onClick={() => removeExperience(exp.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {expanded && (
                  <div className="cv-acc-body">
                    <div className="cv-grid-2">
                      <div className="cv-field">
                        <label>{t('المسمى الوظيفي', 'Job Title')}</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExp(exp.id, { role: e.target.value })}
                        />
                      </div>
                      <div className="cv-field">
                        <label>{t('الشركة / المؤسسة', 'Company')}</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExp(exp.id, { company: e.target.value })}
                        />
                      </div>
                      <div className="cv-field">
                        <label>{t('الموقع', 'Location')}</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExp(exp.id, { location: e.target.value })}
                        />
                      </div>
                      <div className="cv-grid-2">
                        <div className="cv-field">
                          <label>{t('تاريخ البداية', 'Start Date')}</label>
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="2022-05"
                            value={exp.startDate}
                            onChange={(e) => updateExp(exp.id, { startDate: e.target.value })}
                          />
                        </div>
                        <div className="cv-field">
                          <label>{t('تاريخ النهاية', 'End Date')}</label>
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="2024-11"
                            disabled={exp.current}
                            value={exp.current ? '' : exp.endDate}
                            onChange={(e) => updateExp(exp.id, { endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <label className="cv-inline-check">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExp(exp.id, { current: e.target.checked })}
                      />
                      <span>{t('أعمل في هذه الوظيفة حالياً', 'I currently work here')}</span>
                    </label>

                    <div className="cv-bullets-editor">
                      <div className="cv-bullets-head">
                        <span>{t('الإنجازات والمسؤوليات (نقاط)', 'Key Achievements & Impact')}</span>
                        <button
                          type="button"
                          className="cv-btn soft"
                          onClick={() => setPhraseModalExpId(exp.id)}
                          data-testid="open-phrases-btn"
                        >
                          <Sparkles size={13} />
                          <span>{t('عبارات إنجازية جاهزة', 'Ready Achievement Phrases')}</span>
                        </button>
                      </div>

                      {exp.highlights.map((bullet, bIdx) => (
                        <div key={bIdx} className="cv-bullet-row">
                          <input
                            type="text"
                            value={bullet}
                            placeholder={t('مثال: رفعت كفاءة التشغيل بنسبة 30%...', 'e.g. Increased conversion rate by 30%...')}
                            onChange={(e) => {
                              const next = [...exp.highlights];
                              next[bIdx] = e.target.value;
                              updateExp(exp.id, { highlights: next });
                            }}
                          />
                          <button
                            type="button"
                            className="cv-icon-btn"
                            aria-label={t('حذف النقطة', 'Delete bullet')}
                            onClick={() => {
                              const next = exp.highlights.filter((_, idx) => idx !== bIdx);
                              updateExp(exp.id, { highlights: next.length ? next : [''] });
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="cv-btn"
                        onClick={() => updateExp(exp.id, { highlights: [...exp.highlights, ''] })}
                      >
                        <Plus size={14} />
                        <span>{t('إضافة نقطة إنجاز', 'Add Bullet Point')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready Summary Starters Modal */}
      {summaryPickerOpen && (
        <Modal
          title={t('نماذج ملخص مهني جاهزة', 'Ready-Made Professional Summaries')}
          subtitle={t('اختر صياغة مناسبة لتخصصك وعدّل الأرقام بما يطابق خبرتك.', 'Pick a starter tailored to your track and customize the metrics.')}
          closeLabel={t('إغلاق', 'Close')}
          onClose={() => setSummaryPickerOpen(false)}
        >
          <div className="cv-phrase-list">
            {SUMMARY_STARTERS.map((item) => {
              const text = pLang === 'ar' ? item.ar : item.en;
              return (
                <div key={item.id} className="cv-phrase-card">
                  <strong>{t(item.labelAr, item.labelEn)}</strong>
                  <p dir={pLang === 'ar' ? 'rtl' : 'ltr'}>{text}</p>
                  <button
                    type="button"
                    className="cv-btn soft"
                    onClick={() => {
                      updateResume((prev) => ({ ...prev, summary: text }));
                      setSummaryPickerOpen(false);
                      notify(t('تم تطبيق الملخص المهني الجاهز', 'Summary starter applied'));
                    }}
                  >
                    {t('استخدام هذا الملخص', 'Use this summary')}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Ready Achievement Phrases Modal */}
      {phraseModalExpId && (
        <Modal
          wide
          title={t('مكتبة العبارات الإنجازية القياسية', 'Impact & Achievement Phrase Library')}
          subtitle={t('عبارات مصاغة بأفعال قوية ونسب قياسية ترفع تقييم الـ ATS — اضغط لإدراجها فوراً.', 'Action-verb bullets with quantifiable metrics — click any phrase to insert.')}
          closeLabel={t('إغلاق', 'Close')}
          onClose={() => setPhraseModalExpId(null)}
        >
          <div className="cv-phrase-list">
            {ACHIEVEMENT_PHRASES.map((ph) => {
              const text = pLang === 'ar' ? ph.ar : ph.en;
              return (
                <div key={ph.id} className="cv-phrase-card">
                  <small className="cv-phrase-tag">{t(ph.categoryLabelAr, ph.categoryLabelEn)}</small>
                  <p dir={pLang === 'ar' ? 'rtl' : 'ltr'}>{text}</p>
                  <button
                    type="button"
                    className="cv-btn soft"
                    onClick={() => insertBulletPhrase(phraseModalExpId, text)}
                  >
                    <Plus size={14} />
                    <span>{t('إدراج في الخبرة', 'Insert into role')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
