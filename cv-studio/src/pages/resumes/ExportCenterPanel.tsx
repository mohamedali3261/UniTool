import { Archive, ClipboardCopy, Download, FileJson, ImageDown, MailCheck, Printer } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { buildPlainTextAtsResume } from '../../core/exportEngine';
import { ResumeSheetCanvas } from '../editor/A4Preview';

export function ExportCenterPanel() {
  const { resume, exportPdfNow, exportPngNow, exportUtcvNow, busyLabel, notify, t } = useCvStudio();

  const copyPlainAtsText = async () => {
    const plain = buildPlainTextAtsResume(resume);
    try {
      await navigator.clipboard.writeText(plain);
      notify(t('تم نسخ النص القياسي الصافي (ATS Plain Text) للحافظة', 'Copied ATS plain text to clipboard'));
    } catch {
      const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.title || 'resume'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      notify(t('تم تنزيل ملف النص القياسي (.txt)', 'Downloaded ATS plain-text (.txt)'));
    }
  };

  return (
    <section className="cvr-export-center">
      <div className="cvr-export-head">
        <div>
          <h2>
            {t('مركز التصدير والطباعة المتكامل', 'Export & Print Center')} —{' '}
            <span>{resume.title}</span>
          </h2>
          <p>
            {t(
              'صدّر النسخة المفتوحة حالياً بصيغة PDF حادة جاهزة للطباعة والإرسال، أو صورة PNG عالية الدقة، أو ملف مشروع قابل للتعديل لاحقاً.',
              'Export your active resume as a print-sharp PDF, high-resolution PNG, ATS plain text, or editable .utcv.json project.',
            )}
          </p>
        </div>
      </div>

      <div className="cvr-export-cards">
        <div className="cvr-exp-card">
          <strong>{t('ملف PDF احترافي جاهز للطباعة', 'Print-Ready PDF Document')}</strong>
          <p>{t('أبعاد A4 / Letter قياسية دقيقة بهوامش وتباعد موزون للطباعة والإرسال الرسمي.', 'Crisp A4 / Letter pagination ready for job portals and recruiters.')}</p>
          <div className="cvr-exp-btns">
            <button
              type="button"
              className="cv-btn primary"
              disabled={Boolean(busyLabel)}
              onClick={() => void exportPdfNow('cv')}
            >
              <Download size={15} />
              <span>{t('تنزيل السيرة PDF', 'Download CV PDF')}</span>
            </button>
            <button type="button" className="cv-btn" onClick={() => window.print()}>
              <Printer size={15} />
              <span>{t('طباعة متجهية مباشرة', 'Native Vector Print')}</span>
            </button>
          </div>
        </div>

        <div className="cvr-exp-card">
          <strong>{t('صورة عالية الدقة وخطاب التقديم', 'High-Res PNG & Cover Letter')}</strong>
          <p>{t('صدّر سيرتك كصورة PNG نقية للمشاركة السريعة أو صدّر خطاب التقديم المرافق.', 'Save a crisp PNG snapshot or export your matching cover letter.')}</p>
          <div className="cvr-exp-btns">
            <button
              type="button"
              className="cv-btn"
              disabled={Boolean(busyLabel)}
              onClick={() => void exportPngNow('cv')}
            >
              <ImageDown size={15} />
              <span>{t('تصدير صورة PNG', 'Export PNG')}</span>
            </button>
            <button
              type="button"
              className="cv-btn"
              disabled={Boolean(busyLabel)}
              onClick={() => void exportPdfNow('cover-letter')}
            >
              <MailCheck size={15} />
              <span>{t('خطاب التقديم PDF', 'Cover Letter PDF')}</span>
            </button>
          </div>
        </div>

        <div className="cvr-exp-card">
          <strong>{t('ملف المشروع والنص الصافي والنسخ الاحتياطي', 'Project File, ATS Text & Backup')}</strong>
          <p>{t('احتفظ بملف .utcv.json لإعادة التعديل مستقبلاً، أو استخدم مركز النسخ الاحتياطي الموحد للموقع.', 'Save an editable .utcv.json file, copy ATS plain text, or back up all UniTool studios.')}</p>
          <div className="cvr-exp-btns">
            <button
              type="button"
              className="cv-btn soft"
              data-testid="export-utcv-btn"
              onClick={exportUtcvNow}
            >
              <FileJson size={15} />
              <span>{t('حفظ مشروع (.utcv.json)', 'Save .utcv.json')}</span>
            </button>
            <button type="button" className="cv-btn" onClick={() => void copyPlainAtsText()}>
              <ClipboardCopy size={15} />
              <span>{t('نسخ نص ATS صافي', 'Copy ATS Text')}</span>
            </button>
            <a href="/storage.html" className="cv-btn">
              <Archive size={15} />
              <span>{t('النسخ الاحتياطي الشامل', 'Site Backup')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Offscreen render target so PDF/PNG/Print works directly from ResumesPage */}
      <div className="cvr-offscreen-render" aria-hidden="true">
        <ResumeSheetCanvas doc={resume} />
      </div>
    </section>
  );
}
