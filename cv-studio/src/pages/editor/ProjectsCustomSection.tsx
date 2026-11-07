import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import type { CustomSectionGroup, ProjectItem } from '../../core/types';

export function ProjectsCustomSection() {
  const { resume, updateResume, t } = useCvStudio();
  const pLang = resume.design.paperLang;

  const updateProject = (id: string, patch: Partial<ProjectItem>) => {
    updateResume((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const addProject = () => {
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: pLang === 'ar' ? 'اسم المشروع' : 'Project Name',
      role: pLang === 'ar' ? 'الدور أو التقنيات' : 'Lead / Tech Stack',
      date: '2025',
      link: '',
      summary: '',
      highlights: [pLang === 'ar' ? 'أبرز نتيجة حققها المشروع...' : 'Key outcome delivered...'],
    };
    updateResume((prev) => ({ ...prev, projects: [...prev.projects, item] }));
  };

  const addCustomGroup = () => {
    const group: CustomSectionGroup = {
      id: `custom-${Date.now()}`,
      title: pLang === 'ar' ? 'الجوائز والعمل التطوعي' : 'Awards & Volunteering',
      visible: true,
      items: [
        {
          id: `ci-${Date.now()}`,
          heading: pLang === 'ar' ? 'عنوان الإنجاز أو المبادرة' : 'Award or Initiative Title',
          subheading: pLang === 'ar' ? 'الجهة' : 'Organization',
          date: '2025',
          description: '',
        },
      ],
    };
    updateResume((prev) => ({ ...prev, customSections: [...prev.customSections, group] }));
  };

  return (
    <div className="cv-section-stack">
      {/* Projects */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('المشاريع البارزة', 'Selected Projects')}</h3>
            <p>{t('أبرز المشاريع العملية أو البحثية مع روابط المعاينة إن وجدت.', 'Key technical, business, or portfolio projects.')}</p>
          </div>
          <button type="button" className="cv-btn primary" onClick={addProject}>
            <Plus size={15} />
            <span>{t('إضافة مشروع', 'Add Project')}</span>
          </button>
        </div>

        <div className="cv-subcards">
          {resume.projects.map((proj) => (
            <div key={proj.id} className="cv-subcard">
              <div className="cv-subcard-top">
                <strong>{proj.name || t('مشروع', 'Project')}</strong>
                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-label={t('حذف المشروع', 'Remove project')}
                  onClick={() =>
                    updateResume((prev) => ({
                      ...prev,
                      projects: prev.projects.filter((p) => p.id !== proj.id),
                    }))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>{t('اسم المشروع', 'Project Name')}</label>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('الدور / التقنيات', 'Role / Stack')}</label>
                  <input
                    type="text"
                    value={proj.role}
                    onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('التاريخ', 'Year / Date')}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={proj.date}
                    onChange={(e) => updateProject(proj.id, { date: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('رابط المشروع (اختياري)', 'Link (Optional)')}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={proj.link}
                    onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                  />
                </div>
              </div>

              <div className="cv-field" style={{ marginTop: 8 }}>
                <label>{t('وصف مختصر', 'Short Summary')}</label>
                <textarea
                  rows={2}
                  value={proj.summary}
                  onChange={(e) => updateProject(proj.id, { summary: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free Custom Sections */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('أقسام مخصصة حرة', 'Free Custom Sections')}</h3>
            <p>{t('أضف أي قسم إضافي تريده مثل: الأبحاث العلمية، الجوائز، التطوع، أو العضويات.', 'Add custom sections such as Publications, Awards, Volunteering, or Memberships.')}</p>
          </div>
          <button type="button" className="cv-btn" onClick={addCustomGroup} data-testid="add-custom-section-btn">
            <Plus size={15} />
            <span>{t('قسم مخصص جديد', 'New Custom Section')}</span>
          </button>
        </div>

        <div className="cv-subcards">
          {resume.customSections.map((group) => (
            <div key={group.id} className="cv-subcard">
              <div className="cv-subcard-top">
                <input
                  type="text"
                  className="cv-input"
                  style={{ maxWidth: 280, fontWeight: 700 }}
                  aria-label={t('عنوان القسم المخصص', 'Custom section heading')}
                  value={group.title}
                  onChange={(e) =>
                    updateResume((prev) => ({
                      ...prev,
                      customSections: prev.customSections.map((g) =>
                        g.id === group.id ? { ...g, title: e.target.value } : g,
                      ),
                    }))
                  }
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="cv-icon-btn"
                    aria-label={group.visible ? t('إخفاء القسم', 'Hide section') : t('إظهار القسم', 'Show section')}
                    onClick={() =>
                      updateResume((prev) => ({
                        ...prev,
                        customSections: prev.customSections.map((g) =>
                          g.id === group.id ? { ...g, visible: !g.visible } : g,
                        ),
                      }))
                    }
                  >
                    {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    type="button"
                    className="cv-icon-btn"
                    aria-label={t('حذف القسم المخصص', 'Delete custom section')}
                    onClick={() =>
                      updateResume((prev) => ({
                        ...prev,
                        customSections: prev.customSections.filter((g) => g.id !== group.id),
                      }))
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {group.items.map((item) => (
                <div key={item.id} className="cv-custom-item-box">
                  <div className="cv-grid-2">
                    <div className="cv-field">
                      <label>{t('العنوان الفرعي', 'Item Heading')}</label>
                      <input
                        type="text"
                        value={item.heading}
                        onChange={(e) =>
                          updateResume((prev) => ({
                            ...prev,
                            customSections: prev.customSections.map((g) =>
                              g.id === group.id
                                ? {
                                    ...g,
                                    items: g.items.map((i) =>
                                      i.id === item.id ? { ...i, heading: e.target.value } : i,
                                    ),
                                  }
                                : g,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="cv-grid-2">
                      <div className="cv-field">
                        <label>{t('الجهة', 'Organization')}</label>
                        <input
                          type="text"
                          value={item.subheading}
                          onChange={(e) =>
                            updateResume((prev) => ({
                              ...prev,
                              customSections: prev.customSections.map((g) =>
                                g.id === group.id
                                  ? {
                                      ...g,
                                      items: g.items.map((i) =>
                                        i.id === item.id ? { ...i, subheading: e.target.value } : i,
                                      ),
                                    }
                                  : g,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="cv-field">
                        <label>{t('السنة', 'Date')}</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={item.date}
                          onChange={(e) =>
                            updateResume((prev) => ({
                              ...prev,
                              customSections: prev.customSections.map((g) =>
                                g.id === group.id
                                  ? {
                                      ...g,
                                      items: g.items.map((i) =>
                                        i.id === item.id ? { ...i, date: e.target.value } : i,
                                      ),
                                    }
                                  : g,
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="cv-field" style={{ marginTop: 6 }}>
                    <label>{t('التفاصيل', 'Details')}</label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) =>
                        updateResume((prev) => ({
                          ...prev,
                          customSections: prev.customSections.map((g) =>
                            g.id === group.id
                              ? {
                                  ...g,
                                  items: g.items.map((i) =>
                                    i.id === item.id ? { ...i, description: e.target.value } : i,
                                  ),
                                }
                              : g,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="cv-btn"
                style={{ marginTop: 8 }}
                onClick={() =>
                  updateResume((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((g) =>
                      g.id === group.id
                        ? {
                            ...g,
                            items: [
                              ...g.items,
                              {
                                id: `ci-${Date.now()}`,
                                heading: pLang === 'ar' ? 'عنصر جديد' : 'New Entry',
                                subheading: '',
                                date: '',
                                description: '',
                              },
                            ],
                          }
                        : g,
                    ),
                  }))
                }
              >
                <Plus size={14} />
                <span>{t('إضافة عنصر داخل القسم', 'Add Entry')}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
