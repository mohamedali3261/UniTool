import { useState } from 'react';
import { Eye, PenLine, SlidersHorizontal } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import type { EditorSectionKey, MobileEditorTab, WorkspaceViewMode } from '../../core/types';
import { A4Preview } from './A4Preview';
import { ElementsShapesPanel } from './canvas/ElementsShapesPanel';
import { LayersAndInspectorPanel } from './canvas/LayersAndInspectorPanel';
import { DesignCustomizerModal, DesignCustomizerPanel } from './DesignCustomizerModal';
import { EducationCertsSection } from './EducationCertsSection';
import './editor.css';
import { PersonalInfoSection } from './PersonalInfoSection';
import { ProjectsCustomSection } from './ProjectsCustomSection';
import { SectionNavigator } from './SectionNavigator';
import { SkillsLanguagesSection } from './SkillsLanguagesSection';
import { SummaryExperienceSection } from './SummaryExperienceSection';

export function EditorPage() {
  const { t } = useCvStudio();
  const [activeSection, setActiveSection] = useState<EditorSectionKey>('personal');
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('split');
  const [mobileTab, setMobileTab] = useState<MobileEditorTab>('sections');
  const [designModalOpen, setDesignModalOpen] = useState(false);

  return (
    <div
      className={`cv-editor-workspace mode-${viewMode}`}
      data-mobile-tab={mobileTab}
      data-testid="cv-editor-workspace"
    >
      {/* Editor Form & Canvas Inspector Pane */}
      {viewMode === 'split' && (
        <div className="cv-editor-pane no-print">
          <SectionNavigator
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onOpenDesign={() => setDesignModalOpen(true)}
          />

          <div className="cv-editor-scroll">
            {activeSection === 'personal' && (
              <PersonalInfoSection onEditPhotoInspector={() => setActiveSection('layers')} />
            )}
            {activeSection === 'summary-experience' && <SummaryExperienceSection />}
            {activeSection === 'education-certs' && <EducationCertsSection />}
            {activeSection === 'skills-languages' && <SkillsLanguagesSection />}
            {activeSection === 'projects-custom' && <ProjectsCustomSection />}
            {activeSection === 'elements-shapes' && (
              <ElementsShapesPanel onOpenInspector={() => setActiveSection('layers')} />
            )}
            {activeSection === 'layers' && <LayersAndInspectorPanel />}
          </div>
        </div>
      )}

      {/* Mobile-only dedicated Design & Modes pane (mounted only when active) */}
      {mobileTab === 'design' && (
        <div className="cv-mobile-design-pane no-print">
          <div className="cv-section-card">
            <div className="cv-section-head">
              <div>
                <h3>{t('التصميم والأوضاع', 'Design & Modes')}</h3>
                <p>
                  {t(
                    'الأوضاع الأربعة، لغة الورقة، الخطوط، والهوامش.',
                    'Layout modes, paper language, fonts, and spacing.',
                  )}
                </p>
              </div>
            </div>
            <DesignCustomizerPanel />
          </div>
        </div>
      )}

      {/* Live Interactive A4 / Letter Canvas Preview Pane */}
      <A4Preview
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((m) => (m === 'split' ? 'focus' : 'split'))}
        onOpenTab={(tab) => {
          setActiveSection(tab);
          if (mobileTab === 'preview') setMobileTab('sections');
        }}
      />

      {/* Desktop Design Customizer Modal */}
      <DesignCustomizerModal open={designModalOpen} onClose={() => setDesignModalOpen(false)} />

      {/* Mobile Clean Bottom Navigation Bar */}
      <nav
        className="cv-mobile-bottom-bar no-print"
        aria-label={t('التنقل بين التحرير والمعاينة والتصميم', 'Mobile workspace switcher')}
      >
        <button
          type="button"
          className={`cv-mob-tab ${mobileTab === 'sections' ? 'active' : ''}`}
          onClick={() => setMobileTab('sections')}
        >
          <PenLine size={16} />
          <span>{t('تحرير الأقسام', 'Edit Sections')}</span>
        </button>
        <button
          type="button"
          className={`cv-mob-tab ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          <Eye size={16} />
          <span>{t('معاينة الورقة', 'Sheet Preview')}</span>
        </button>
        <button
          type="button"
          className={`cv-mob-tab ${mobileTab === 'design' ? 'active' : ''}`}
          onClick={() => setMobileTab('design')}
        >
          <SlidersHorizontal size={16} />
          <span>{t('التصميم والأوضاع', 'Design & Modes')}</span>
        </button>
      </nav>
    </div>
  );
}
