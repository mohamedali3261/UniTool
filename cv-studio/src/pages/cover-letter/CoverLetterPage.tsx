import { useState } from 'react';
import { Eye, PenLine } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import './cover-letter.css';
import { CoverLetterEditor } from './CoverLetterEditor';
import { CoverLetterPreview } from './CoverLetterPreview';
import { CoverLetterSamples } from './CoverLetterSamples';

export function CoverLetterPage() {
  const { t } = useCvStudio();
  const [mobTab, setMobTab] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="cvcl-workspace" data-mobile-tab={mobTab} data-testid="cv-cover-letter-page">
      <div className="cvcl-editor-col no-print">
        <CoverLetterSamples />
        <CoverLetterEditor />
      </div>

      <CoverLetterPreview />

      <nav className="cv-mobile-bottom-bar cvcl-mob-bar no-print" aria-label={t('التبديل بين التحرير والمعاينة', 'Mobile letter view')}>
        <button
          type="button"
          className={`cv-mob-tab ${mobTab === 'edit' ? 'active' : ''}`}
          onClick={() => setMobTab('edit')}
        >
          <PenLine size={16} />
          <span>{t('تحرير الخطاب', 'Edit Letter')}</span>
        </button>
        <button
          type="button"
          className={`cv-mob-tab ${mobTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobTab('preview')}
        >
          <Eye size={16} />
          <span>{t('معاينة الورقة', 'Sheet Preview')}</span>
        </button>
      </nav>
    </div>
  );
}
