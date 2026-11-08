import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  Layers,
  ListOrdered,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { Modal } from '../../components/Modal';
import { getPaperSectionTitle } from '../../core/i18n';
import type { EditorSectionKey } from '../../core/types';

export function SectionNavigator({
  activeSection,
  onSelectSection,
  onOpenDesign,
}: {
  activeSection: EditorSectionKey;
  onSelectSection: (key: EditorSectionKey) => void;
  onOpenDesign: () => void;
}) {
  const { resume, updateResume, t } = useCvStudio();
  const [orderOpen, setOrderOpen] = useState(false);
  const layersCount = (resume.canvasElements || []).length;

  const tabs: {
    key: EditorSectionKey;
    ar: string;
    en: string;
    icon: typeof UserRound;
    badge?: number;
  }[] = [
    { key: 'personal', ar: 'البيانات والصورة', en: 'Personal & Photo', icon: UserRound },
    { key: 'summary-experience', ar: 'الملخص والخبرات', en: 'Summary & Work', icon: BriefcaseBusiness },
    { key: 'education-certs', ar: 'التعليم والشهادات', en: 'Education & Certs', icon: GraduationCap },
    { key: 'skills-languages', ar: 'المهارات واللغات', en: 'Skills & Languages', icon: Sparkles },
    { key: 'projects-custom', ar: 'المشاريع وأقسام حرة', en: 'Projects & Custom', icon: FolderKanban },
    { key: 'elements-shapes', ar: 'عناصر وأشكال وصور', en: 'Elements & Shapes', icon: Shapes },
    { key: 'layers', ar: 'الطبقات والخصائص', en: 'Layers & Inspector', icon: Layers, badge: layersCount },
  ];

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= resume.sections.length) return;
    updateResume((prev) => {
      const next = [...prev.sections];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, sections: next };
    });
  };

  const toggleVisibility = (index: number) => {
    updateResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s, idx) => (idx === index ? { ...s, visible: !s.visible } : s)),
    }));
  };

  return (
    <div className="cv-sec-nav">
      <div className="cv-sec-nav-top">
        <div className="cv-sec-pills" role="tablist" aria-label={t('أقسام التحرير', 'Editor sections')}>
          {tabs.map((tab) => {
            const active = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                data-testid={`editor-tab-${tab.key}`}
                aria-selected={active}
                className={`cv-sec-pill ${active ? 'active' : ''}`}
                onClick={() => onSelectSection(tab.key)}
              >
                <tab.icon size={15} aria-hidden="true" />
                <span>{t(tab.ar, tab.en)}</span>
                {tab.badge ? <b className="cv-pill-count">{tab.badge}</b> : null}
              </button>
            );
          })}
        </div>

        <div className="cv-sec-quick-tools">
          <div className="cv-completeness-bar" title={t('مؤشر اكتمال أقسام السيرة الأساسية', 'Core resume completeness')}>
            <span className="cv-completeness-label">
              {t('اكتمال السيرة', 'Completeness')}:{' '}
              <strong>
                {Math.min(
                  100,
                  (resume.personal.fullName.trim() ? 20 : 0) +
                    (resume.personal.email.trim() || resume.personal.phone.trim() ? 15 : 0) +
                    (resume.summary.trim().length > 25 ? 20 : 0) +
                    (resume.experience.length > 0 ? 25 : 0) +
                    (resume.education.length > 0 ? 10 : 0) +
                    (resume.skills.length >= 3 ? 10 : 0),
                )}
                %
              </strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="cv-btn"
              onClick={() => setOrderOpen(true)}
              title={t('ترتيب وإظهار/إخفاء الأقسام', 'Reorder & toggle sections')}
            >
              <ListOrdered size={15} />
              <span>{t('ترتيب الأقسام', 'Order & Visibility')}</span>
            </button>
            <button
              type="button"
              className="cv-btn soft cv-desktop-only"
              onClick={onOpenDesign}
              data-testid="open-design-modal-btn"
            >
              <SlidersHorizontal size={15} />
              <span>{t('التصميم والأوضاع', 'Design & Modes')}</span>
            </button>
          </div>
        </div>
      </div>

      {orderOpen && (
        <Modal
          title={t('ترتيب وإظهار أقسام السيرة الذاتية', 'Reorder & Show/Hide Sections')}
          subtitle={t(
            'رتّب الأقسام حسب أولوية الوظيفة أو أخفِ ما لا تحتاجه دون حذف بياناتك المكتوبة.',
            'Arrange sections by priority or hide unused ones without deleting any typed content.',
          )}
          closeLabel={t('إغلاق', 'Close')}
          onClose={() => setOrderOpen(false)}
        >
          <div className="cv-order-list">
            {resume.sections.map((sec, idx) => {
              const title = getPaperSectionTitle(
                sec.id,
                resume.design.paperLang,
                sec.customTitleAr,
                sec.customTitleEn,
              );
              return (
                <div key={sec.id} className={`cv-order-row ${sec.visible ? '' : 'is-hidden'}`}>
                  <div className="cv-order-label">
                    <Award size={15} aria-hidden="true" />
                    <strong>{title}</strong>
                    {!sec.visible && <small>{t('مخفي', 'Hidden')}</small>}
                  </div>
                  <div className="cv-order-actions">
                    <button
                      type="button"
                      className="cv-icon-btn"
                      disabled={idx === 0}
                      aria-label={t('تحريك لأعلى', 'Move section up')}
                      onClick={() => moveSection(idx, -1)}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      disabled={idx === resume.sections.length - 1}
                      aria-label={t('تحريك لأسفل', 'Move section down')}
                      onClick={() => moveSection(idx, 1)}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      aria-label={sec.visible ? t('إخفاء القسم', 'Hide section') : t('إظهار القسم', 'Show section')}
                      onClick={() => toggleVisibility(idx)}
                    >
                      {sec.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
