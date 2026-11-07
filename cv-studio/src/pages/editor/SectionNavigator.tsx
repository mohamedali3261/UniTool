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
  ListOrdered,
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

  const tabs: { key: EditorSectionKey; ar: string; en: string; icon: typeof UserRound }[] = [
    { key: 'personal', ar: 'البيانات والصورة', en: 'Personal & Photo', icon: UserRound },
    { key: 'summary-experience', ar: 'الملخص والخبرات', en: 'Summary & Work', icon: BriefcaseBusiness },
    { key: 'education-certs', ar: 'التعليم والشهادات', en: 'Education & Certs', icon: GraduationCap },
    { key: 'skills-languages', ar: 'المهارات واللغات', en: 'Skills & Languages', icon: Sparkles },
    { key: 'projects-custom', ar: 'المشاريع وأقسام حرة', en: 'Projects & Custom', icon: FolderKanban },
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
                aria-selected={active}
                className={`cv-sec-pill ${active ? 'active' : ''}`}
                onClick={() => onSelectSection(tab.key)}
              >
                <tab.icon size={15} aria-hidden="true" />
                <span>{t(tab.ar, tab.en)}</span>
              </button>
            );
          })}
        </div>

        <div className="cv-sec-quick-tools">
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
