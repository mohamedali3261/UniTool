import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { PROFICIENCY_LABELS, SKILL_DISPLAY_LABELS } from '../../core/i18n';
import type { LanguageItem, SkillDisplayMode } from '../../core/types';

export function SkillsLanguagesSection() {
  const { resume, updateResume, t } = useCvStudio();
  const [draftSkill, setDraftSkill] = useState('');

  const addSkillFromDraft = () => {
    const parts = draftSkill
      .split(/[,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    updateResume((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        ...parts.map((name, idx) => ({
          id: `sk-${Date.now()}-${idx}`,
          name,
          level: 4 as const,
        })),
      ],
    }));
    setDraftSkill('');
  };

  const addLanguage = () => {
    const item: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: resume.design.paperLang === 'ar' ? 'الألمانية' : 'German',
      proficiency: 'intermediate',
    };
    updateResume((prev) => ({ ...prev, languages: [...prev.languages, item] }));
  };

  const displayModes: SkillDisplayMode[] = ['badges', 'bars', 'bullets', 'comma'];

  return (
    <div className="cv-section-stack">
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('المهارات التقنية والشخصية', 'Core & Technical Skills')}</h3>
            <p>{t('أضف المهارات المفتاحية واختر أسلوب عرضها في الورقة بنقرة واحدة.', 'Add target keywords and choose how they render on the sheet.')}</p>
          </div>
        </div>

        {/* Display mode switcher */}
        <div className="cv-skill-mode-bar" role="group" aria-label={t('أسلوب عرض المهارات', 'Skill display style')}>
          {displayModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`cv-chip ${resume.design.skillDisplay === mode ? 'active' : ''}`}
              onClick={() =>
                updateResume((prev) => ({
                  ...prev,
                  design: { ...prev.design, skillDisplay: mode },
                }))
              }
            >
              {t(SKILL_DISPLAY_LABELS[mode].ar, SKILL_DISPLAY_LABELS[mode].en)}
            </button>
          ))}
        </div>

        <div className="cv-quick-add-row">
          <input
            type="text"
            className="cv-input"
            value={draftSkill}
            placeholder={t('اكتب مهارة أو عدة مهارات مفصولة بفاصلة ثم Enter…', 'Type skill(s) separated by commas and press Enter…')}
            onChange={(e) => setDraftSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkillFromDraft();
              }
            }}
          />
          <button type="button" className="cv-btn primary" onClick={addSkillFromDraft}>
            <Plus size={15} />
            <span>{t('إضافة', 'Add')}</span>
          </button>
        </div>

        <div className="cv-skills-edit-list">
          {resume.skills.map((sk) => (
            <div key={sk.id} className="cv-skill-edit-item">
              <input
                type="text"
                aria-label={t('اسم المهارة', 'Skill name')}
                value={sk.name}
                onChange={(e) =>
                  updateResume((prev) => ({
                    ...prev,
                    skills: prev.skills.map((item) =>
                      item.id === sk.id ? { ...item, name: e.target.value } : item,
                    ),
                  }))
                }
              />
              {resume.design.skillDisplay === 'bars' && (
                <select
                  aria-label={t('مستوى المهارة', 'Skill level')}
                  value={sk.level}
                  onChange={(e) =>
                    updateResume((prev) => ({
                      ...prev,
                      skills: prev.skills.map((item) =>
                        item.id === sk.id
                          ? { ...item, level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }
                          : item,
                      ),
                    }))
                  }
                >
                  <option value={5}>100%</option>
                  <option value={4}>80%</option>
                  <option value={3}>60%</option>
                  <option value={2}>40%</option>
                  <option value={1}>20%</option>
                </select>
              )}
              <button
                type="button"
                className="cv-icon-btn"
                aria-label={t('حذف المهارة', 'Remove skill')}
                onClick={() =>
                  updateResume((prev) => ({
                    ...prev,
                    skills: prev.skills.filter((item) => item.id !== sk.id),
                  }))
                }
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('اللغات ومستوى الإتقان', 'Languages')}</h3>
            <p>{t('اللغات التي تتحدثها ومستواك المهني فيها.', 'Spoken languages and fluency level.')}</p>
          </div>
          <button type="button" className="cv-btn" onClick={addLanguage}>
            <Plus size={15} />
            <span>{t('إضافة لغة', 'Add Language')}</span>
          </button>
        </div>

        <div className="cv-lang-edit-list">
          {resume.languages.map((langItem) => (
            <div key={langItem.id} className="cv-lang-edit-row">
              <input
                type="text"
                className="cv-input"
                aria-label={t('اسم اللغة', 'Language')}
                value={langItem.name}
                onChange={(e) =>
                  updateResume((prev) => ({
                    ...prev,
                    languages: prev.languages.map((l) =>
                      l.id === langItem.id ? { ...l, name: e.target.value } : l,
                    ),
                  }))
                }
              />
              <select
                className="cv-input"
                aria-label={t('مستوى الإتقان', 'Proficiency')}
                value={langItem.proficiency}
                onChange={(e) =>
                  updateResume((prev) => ({
                    ...prev,
                    languages: prev.languages.map((l) =>
                      l.id === langItem.id
                        ? { ...l, proficiency: e.target.value as LanguageItem['proficiency'] }
                        : l,
                    ),
                  }))
                }
              >
                {(Object.keys(PROFICIENCY_LABELS) as LanguageItem['proficiency'][]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {t(PROFICIENCY_LABELS[lvl].ar, PROFICIENCY_LABELS[lvl].en)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="cv-icon-btn"
                aria-label={t('حذف اللغة', 'Remove language')}
                onClick={() =>
                  updateResume((prev) => ({
                    ...prev,
                    languages: prev.languages.filter((l) => l.id !== langItem.id),
                  }))
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
