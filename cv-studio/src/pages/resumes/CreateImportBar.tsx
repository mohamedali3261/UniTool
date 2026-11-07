import { FilePlus2, FolderUp, LayoutTemplate } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { createBlankResume } from '../../data/templates';

export function CreateImportBar() {
  const { resume, addResume, navigate, triggerImportFile, notify, t } = useCvStudio();

  const handleNewBlank = async () => {
    const doc = createBlankResume(resume.design.paperLang);
    await addResume(doc);
    navigate('editor');
    notify(t('تم إنشاء سيرة ذاتية فارغة جديدة', 'Created a new blank resume'));
  };

  return (
    <div className="cvr-create-bar">
      <div className="cvr-create-copy">
        <h2>{t('إدارة نسخ سيرتك الذاتية', 'Manage Your Resume Versions')}</h2>
        <p>
          {t(
            'أنشئ نسخة مخصصة لكل شركة أو مسمى وظيفي — تُحفظ كل سيرة محلياً وبشكل مستقل على متصفحك.',
            'Maintain tailored versions per company or role — every resume autosaves locally on your device.',
          )}
        </p>
      </div>

      <div className="cvr-create-actions">
        <button
          type="button"
          className="cv-btn primary"
          data-testid="create-blank-cv-btn"
          onClick={() => void handleNewBlank()}
        >
          <FilePlus2 size={15} />
          <span>{t('سيرة جديدة فارغة', 'New Blank Resume')}</span>
        </button>

        <button type="button" className="cv-btn" onClick={() => navigate('templates')}>
          <LayoutTemplate size={15} />
          <span>{t('إنشاء من قالب جاهز', 'New from Template')}</span>
        </button>

        <button
          type="button"
          className="cv-btn soft"
          data-testid="import-utcv-btn"
          onClick={triggerImportFile}
        >
          <FolderUp size={15} />
          <span>{t('استيراد ملف مشروع (.utcv.json)', 'Import Project (.utcv.json)')}</span>
        </button>
      </div>
    </div>
  );
}
