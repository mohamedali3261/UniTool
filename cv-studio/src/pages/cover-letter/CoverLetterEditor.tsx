import { Download, ImageDown, Printer } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import type { CoverLetterData } from '../../core/types';

export function CoverLetterEditor() {
  const { resume, updateResume, exportPdfNow, exportPngNow, busyLabel, t } = useCvStudio();
  const cl = resume.coverLetter;

  const setField = <K extends keyof CoverLetterData>(key: K, val: CoverLetterData[K]) => {
    updateResume((prev) => ({
      ...prev,
      coverLetter: { ...prev.coverLetter, [key]: val },
    }));
  };

  return (
    <div className="cv-section-card">
      <div className="cv-section-head">
        <div>
          <h3>{t('محرر خطاب التقديم الذكي', 'Smart Cover Letter Editor')}</h3>
          <p>
            {t(
              'يرث بيانات تواصلك وهوية الألوان والخط من سيرتك الذاتية تلقائياً ليتكامل الملفان معاً.',
              'Automatically inherits your header contact details, typography, and calm accent color.',
            )}
          </p>
        </div>
      </div>

      <div className="cv-grid-2">
        <div className="cv-field">
          <label>{t('اسم المرسل إليه', 'Recipient Name')}</label>
          <input
            type="text"
            value={cl.recipientName}
            onChange={(e) => setField('recipientName', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label>{t('المسمى الوظيفي للمستلم', 'Recipient Title')}</label>
          <input
            type="text"
            value={cl.recipientTitle}
            onChange={(e) => setField('recipientTitle', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label>{t('اسم الشركة أو المؤسسة', 'Target Company')}</label>
          <input
            type="text"
            value={cl.companyName}
            onChange={(e) => setField('companyName', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label>{t('تاريخ الخطاب', 'Letter Date')}</label>
          <input
            type="text"
            dir="ltr"
            value={cl.date}
            onChange={(e) => setField('date', e.target.value)}
          />
        </div>
      </div>

      <div className="cv-field">
        <label>{t('عنوان الموضوع (Subject)', 'Subject Line')}</label>
        <input
          type="text"
          data-testid="cl-subject-input"
          value={cl.subject}
          onChange={(e) => setField('subject', e.target.value)}
        />
      </div>

      <div className="cv-field">
        <label>{t('التحية الافتتاحية', 'Greeting')}</label>
        <input
          type="text"
          value={cl.greeting}
          onChange={(e) => setField('greeting', e.target.value)}
        />
      </div>

      <div className="cv-field">
        <label>{t('الفقرة الافتتاحية', 'Opening Paragraph')}</label>
        <textarea
          rows={3}
          value={cl.opening}
          onChange={(e) => setField('opening', e.target.value)}
        />
      </div>

      <div className="cv-field">
        <label>{t('صلب الخطاب وأبرز الإنجازات', 'Core Pitch & Value Proposition')}</label>
        <textarea
          rows={5}
          value={cl.body}
          onChange={(e) => setField('body', e.target.value)}
        />
      </div>

      <div className="cv-grid-2">
        <div className="cv-field">
          <label>{t('الفقرة الختامية', 'Closing Call-to-Action')}</label>
          <textarea
            rows={2}
            value={cl.closing}
            onChange={(e) => setField('closing', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label>{t('عبارة التوقيع', 'Sign-Off')}</label>
          <input
            type="text"
            value={cl.signOff}
            onChange={(e) => setField('signOff', e.target.value)}
          />
        </div>
      </div>

      <div className="cvcl-actions-bar">
        <button
          type="button"
          className="cv-btn primary"
          disabled={Boolean(busyLabel)}
          onClick={() => void exportPdfNow('cover-letter')}
        >
          <Download size={15} />
          <span>{t('تصدير الخطاب PDF', 'Export Letter PDF')}</span>
        </button>
        <button
          type="button"
          className="cv-btn"
          disabled={Boolean(busyLabel)}
          onClick={() => void exportPngNow('cover-letter')}
        >
          <ImageDown size={15} />
          <span>{t('حفظ كصورة PNG', 'Export PNG')}</span>
        </button>
        <button type="button" className="cv-btn" onClick={() => window.print()}>
          <Printer size={15} />
          <span>{t('طباعة', 'Print')}</span>
        </button>
      </div>
    </div>
  );
}
