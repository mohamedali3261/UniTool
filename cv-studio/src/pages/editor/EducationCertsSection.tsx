import { Plus, Trash2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import type { CertificationItem, EducationItem } from '../../core/types';

export function EducationCertsSection() {
  const { resume, updateResume, t } = useCvStudio();
  const pLang = resume.design.paperLang;

  const updateEdu = (id: string, patch: Partial<EducationItem>) => {
    updateResume((prev) => ({
      ...prev,
      education: prev.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addEdu = () => {
    const item: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: pLang === 'ar' ? 'بكالوريوس في التخصص' : 'Bachelor of Science',
      school: pLang === 'ar' ? 'اسم الجامعة' : 'University Name',
      location: pLang === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt',
      startDate: '2018',
      endDate: '2022',
      grade: '',
      notes: '',
    };
    updateResume((prev) => ({ ...prev, education: [...prev.education, item] }));
  };

  const updateCert = (id: string, patch: Partial<CertificationItem>) => {
    updateResume((prev) => ({
      ...prev,
      certifications: prev.certifications.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addCert = () => {
    const item: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: pLang === 'ar' ? 'اسم الشهادة أو الدورة' : 'Certification or Course Name',
      issuer: pLang === 'ar' ? 'الجهة المانحة' : 'Issuing Organization',
      date: '2024',
      credentialId: '',
    };
    updateResume((prev) => ({ ...prev, certifications: [...prev.certifications, item] }));
  };

  return (
    <div className="cv-section-stack">
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('المؤهلات الأكاديمية', 'Education')}</h3>
            <p>{t('الشهادات الجامعية والتقدير الأكاديمي ومشاريع التخرج البارزة.', 'Academic degrees, GPA/honors, and key coursework.')}</p>
          </div>
          <button type="button" className="cv-btn primary" onClick={addEdu}>
            <Plus size={15} />
            <span>{t('إضافة مؤهل', 'Add Degree')}</span>
          </button>
        </div>

        <div className="cv-subcards">
          {resume.education.map((edu) => (
            <div key={edu.id} className="cv-subcard">
              <div className="cv-subcard-top">
                <strong>{edu.degree || t('مؤهل دراسي', 'Degree')}</strong>
                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-label={t('حذف المؤهل', 'Remove degree')}
                  onClick={() =>
                    updateResume((prev) => ({
                      ...prev,
                      education: prev.education.filter((e) => e.id !== edu.id),
                    }))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>{t('الدرجة العلمية والتخصص', 'Degree & Major')}</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEdu(edu.id, { degree: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('الجامعة / المؤسسة', 'University / School')}</label>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => updateEdu(edu.id, { school: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('المدينة / الدولة', 'Location')}</label>
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) => updateEdu(edu.id, { location: e.target.value })}
                  />
                </div>
                <div className="cv-grid-2">
                  <div className="cv-field">
                    <label>{t('البداية', 'Start')}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={edu.startDate}
                      onChange={(e) => updateEdu(edu.id, { startDate: e.target.value })}
                    />
                  </div>
                  <div className="cv-field">
                    <label>{t('التخرج', 'Graduation')}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={edu.endDate}
                      onChange={(e) => updateEdu(edu.id, { endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="cv-field">
                  <label>{t('التقدير أو المعدل (اختياري)', 'Grade / GPA (Optional)')}</label>
                  <input
                    type="text"
                    value={edu.grade}
                    onChange={(e) => updateEdu(edu.id, { grade: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('ملاحظات أو مشروع التخرج', 'Honors / Thesis Notes')}</label>
                  <input
                    type="text"
                    value={edu.notes}
                    onChange={(e) => updateEdu(edu.id, { notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('الشهادات المهنية والدورات', 'Certifications & Courses')}</h3>
            <p>{t('الشهادات المعتمدة والدورات التخصصية.', 'Industry credentials, licenses, and bootcamps.')}</p>
          </div>
          <button type="button" className="cv-btn" onClick={addCert}>
            <Plus size={15} />
            <span>{t('إضافة شهادة', 'Add Certification')}</span>
          </button>
        </div>

        <div className="cv-subcards">
          {resume.certifications.map((cert) => (
            <div key={cert.id} className="cv-subcard">
              <div className="cv-subcard-top">
                <strong>{cert.name || t('شهادة مهنية', 'Certification')}</strong>
                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-label={t('حذف الشهادة', 'Remove certification')}
                  onClick={() =>
                    updateResume((prev) => ({
                      ...prev,
                      certifications: prev.certifications.filter((c) => c.id !== cert.id),
                    }))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>{t('اسم الشهادة', 'Certification Name')}</label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => updateCert(cert.id, { name: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('الجهة المانحة', 'Issuing Authority')}</label>
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => updateCert(cert.id, { issuer: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('سنة الإصدار', 'Issue Year')}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={cert.date}
                    onChange={(e) => updateCert(cert.id, { date: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('رقم الاعتماد (اختياري)', 'Credential ID (Optional)')}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={cert.credentialId}
                    onChange={(e) => updateCert(cert.id, { credentialId: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
