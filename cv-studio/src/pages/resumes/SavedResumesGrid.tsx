import { useState } from 'react';
import { Building2, CheckCircle2, Copy, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { Modal } from '../../components/Modal';
import { evaluateAts } from '../../core/atsEngine';
import { LAYOUT_MODE_LABELS } from '../../core/i18n';
import type { ResumeDocument } from '../../core/types';

export function SavedResumesGrid() {
  const {
    resume: activeResume,
    resumes,
    selectResume,
    duplicateResume,
    renameResume,
    removeResume,
    navigate,
    notify,
    t,
  } = useCvStudio();

  const [dupSource, setDupSource] = useState<ResumeDocument | null>(null);
  const [dupTitle, setDupTitle] = useState('');
  const [dupCompany, setDupCompany] = useState('');

  const [renameTarget, setRenameTarget] = useState<ResumeDocument | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameCompany, setRenameCompany] = useState('');

  const openDupModal = (doc: ResumeDocument) => {
    setDupSource(doc);
    setDupTitle(`${doc.title} — `);
    setDupCompany(doc.targetCompany || '');
  };

  const openRenameModal = (doc: ResumeDocument) => {
    setRenameTarget(doc);
    setRenameTitle(doc.title);
    setRenameCompany(doc.targetCompany || '');
  };

  return (
    <section className="cvr-grid-section">
      <div className="cvr-grid">
        {resumes.map((doc) => {
          const isActive = doc.id === activeResume.id;
          const score = evaluateAts(doc).totalScore;
          const modeInfo = LAYOUT_MODE_LABELS[doc.design.layoutMode];
          const updatedDate = doc.updatedAt.slice(0, 10);

          return (
            <article
              key={doc.id}
              className={`cvr-card ${isActive ? 'is-active' : ''}`}
              data-testid={`saved-cv-card-${doc.id}`}
            >
              <div className="cvr-card-top">
                <div className="cvr-card-badges">
                  {isActive && (
                    <span className="cvt-badge current">
                      <CheckCircle2 size={11} />
                      {t('النسخة المفتوحة', 'Active')}
                    </span>
                  )}
                  <span className="cvt-badge">{t(modeInfo.ar, modeInfo.en)}</span>
                  <span className="cvt-badge subtle">ATS {score}%</span>
                </div>
                <small className="cvr-date" dir="ltr">
                  {updatedDate}
                </small>
              </div>

              <div className="cvr-card-body">
                <h3>{doc.title}</h3>
                <p className="cvr-person">
                  {doc.personal.fullName}
                  {doc.personal.jobTitle ? ` · ${doc.personal.jobTitle}` : ''}
                </p>
                {doc.targetCompany && (
                  <span className="cvr-company-tag">
                    <Building2 size={12} />
                    {doc.targetCompany}
                  </span>
                )}
              </div>

              <div className="cvr-card-actions">
                <button
                  type="button"
                  className="cv-btn primary"
                  onClick={() => {
                    selectResume(doc.id);
                    navigate('editor');
                  }}
                >
                  <FolderOpen size={14} />
                  <span>{t('فتح وتحرير', 'Open in Editor')}</span>
                </button>

                <button
                  type="button"
                  className="cv-btn"
                  data-testid={`duplicate-cv-${doc.id}`}
                  title={t('إنشاء نسخة مخصصة لشركة معينة', 'Duplicate tailored for a company')}
                  onClick={() => openDupModal(doc)}
                >
                  <Copy size={14} />
                  <span>{t('نسخ لشركة', 'Duplicate')}</span>
                </button>

                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-label={t('إعادة تسمية السيرة', 'Rename resume')}
                  onClick={() => openRenameModal(doc)}
                >
                  <Pencil size={14} />
                </button>

                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-label={t('حذف السيرة الذاتية', 'Delete resume')}
                  onClick={() => {
                    void removeResume(doc.id);
                    notify(t('تم حذف النسخة من القائمة', 'Resume deleted'));
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Duplicate per Company Modal */}
      {dupSource && (
        <Modal
          title={t('نسخ السيرة الذاتية وتخصيصها لشركة', 'Duplicate Resume for Target Company')}
          subtitle={t(
            'أنشئ نسخة مستقلة لتعديل الكلمات المفتاحية وخطاب التقديم بما يناسب الشركة المستهدفة.',
            'Create an independent copy so you can tailor keywords and cover letter for a specific employer.',
          )}
          closeLabel={t('إلغاء', 'Cancel')}
          onClose={() => setDupSource(null)}
        >
          <div className="cv-section-stack">
            <div className="cv-field">
              <label>{t('عنوان النسخة الجديدة', 'New Version Title')}</label>
              <input
                type="text"
                data-testid="dup-title-input"
                value={dupTitle}
                onChange={(e) => setDupTitle(e.target.value)}
              />
            </div>
            <div className="cv-field">
              <label>{t('اسم الشركة المستهدفة (اختياري)', 'Target Company Name')}</label>
              <input
                type="text"
                data-testid="dup-company-input"
                placeholder={t('مثال: بنك مصر / مايكروسوفت / أرامكو', 'e.g. Microsoft / Careem / CIB')}
                value={dupCompany}
                onChange={(e) => setDupCompany(e.target.value)}
              />
            </div>
            <div className="cv-modal-footer">
              <button type="button" className="cv-btn" onClick={() => setDupSource(null)}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                className="cv-btn primary"
                data-testid="confirm-duplicate-btn"
                onClick={async () => {
                  const finalTitle =
                    dupTitle.trim() || `${dupSource.title} (${dupCompany || 'Copy'})`;
                  await duplicateResume(dupSource.id, finalTitle, dupCompany);
                  setDupSource(null);
                  notify(t('تم إنشاء النسخة المخصصة بنجاح', 'Tailored resume copy created'));
                }}
              >
                {t('إنشاء النسخة الآن', 'Create Copy')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <Modal
          title={t('إعادة تسمية السيرة الذاتية', 'Rename Resume')}
          closeLabel={t('إغلاق', 'Close')}
          onClose={() => setRenameTarget(null)}
        >
          <div className="cv-section-stack">
            <div className="cv-field">
              <label>{t('عنوان السيرة الذاتية', 'Resume Title')}</label>
              <input
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
              />
            </div>
            <div className="cv-field">
              <label>{t('الشركة المستهدفة (اختياري)', 'Target Company')}</label>
              <input
                type="text"
                value={renameCompany}
                onChange={(e) => setRenameCompany(e.target.value)}
              />
            </div>
            <div className="cv-modal-footer">
              <button type="button" className="cv-btn" onClick={() => setRenameTarget(null)}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                className="cv-btn primary"
                onClick={async () => {
                  await renameResume(renameTarget.id, renameTitle, renameCompany);
                  setRenameTarget(null);
                  notify(t('تم تحديث اسم السيرة الذاتية', 'Resume renamed'));
                }}
              >
                {t('حفظ التسمية', 'Save Name')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
