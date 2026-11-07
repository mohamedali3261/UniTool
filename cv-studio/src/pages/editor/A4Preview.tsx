import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, Printer, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import {
  formatPageNumber,
  formatPaperPresent,
  getPaperSectionTitle,
  LAYOUT_MODE_LABELS,
  PROFICIENCY_LABELS,
} from '../../core/i18n';
import { computeOnePageAdjustments, getPaperDimensions, paginateResume, type PaginatedBlock } from '../../core/pagination';
import type { CoreSectionId, ResumeDocument, SkillDisplayMode, WorkspaceViewMode } from '../../core/types';
import { resolveFontFamily } from '../../data/themes';

function renderSkillsContent(doc: ResumeDocument, mode: SkillDisplayMode, accent: string) {
  if (!doc.skills.length) return null;
  if (mode === 'comma') {
    return (
      <p className="cvp-skills-comma">
        {doc.skills.map((s) => s.name).join(doc.design.paperLang === 'ar' ? ' ، ' : ' • ')}
      </p>
    );
  }
  if (mode === 'bullets') {
    return (
      <ul className="cvp-skills-bullets">
        {doc.skills.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    );
  }
  if (mode === 'bars') {
    return (
      <div className="cvp-skills-bars">
        {doc.skills.map((s) => (
          <div key={s.id} className="cvp-skill-bar-row">
            <div className="cvp-skill-bar-top">
              <span>{s.name}</span>
              <small>{Math.round((s.level / 5) * 100)}%</small>
            </div>
            <div className="cvp-skill-bar-track">
              <div
                className="cvp-skill-bar-fill"
                style={{ width: `${(s.level / 5) * 100}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="cvp-skills-badges">
      {doc.skills.map((s) => (
        <span key={s.id} className="cvp-skill-badge" style={{ borderColor: `${accent}44` }}>
          {s.name}
        </span>
      ))}
    </div>
  );
}

function SheetSectionHeading({
  title,
  continued,
  paperLang,
  divider,
  accent,
  isAts,
}: {
  title: string;
  continued?: boolean;
  paperLang: 'ar' | 'en';
  divider: ResumeDocument['design']['sectionDivider'];
  accent: string;
  isAts: boolean;
}) {
  const suffix = continued ? (paperLang === 'ar' ? ' (تابع)' : ' (Cont.)') : '';
  if (isAts || divider === 'line') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-line" style={{ color: accent, borderBottomColor: `${accent}40` }}>
        {title}
        {suffix}
      </h2>
    );
  }
  if (divider === 'soft-bg') {
    return (
      <h2
        className="cvp-sec-heading cvp-sec-soft"
        style={{ color: accent, backgroundColor: `${accent}12` }}
      >
        {title}
        {suffix}
      </h2>
    );
  }
  return (
    <h2 className="cvp-sec-heading cvp-sec-bar" style={{ color: accent }}>
      <i style={{ backgroundColor: accent }} aria-hidden="true" />
      <span>
        {title}
        {suffix}
      </span>
    </h2>
  );
}

function RenderSectionBlock({
  doc,
  block,
  accent,
  isAts,
}: {
  doc: ResumeDocument;
  block: PaginatedBlock;
  accent: string;
  isAts: boolean;
}) {
  const pLang = doc.design.paperLang;
  const meta = doc.sections.find((s) => s.id === block.kind);
  const title = getPaperSectionTitle(block.kind, pLang, meta?.customTitleAr, meta?.customTitleEn);
  const divider = doc.design.sectionDivider;

  if (block.kind === 'summary') {
    if (!doc.summary.trim()) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading title={title} paperLang={pLang} divider={divider} accent={accent} isAts={isAts} />
        <p className="cvp-summary-text">{doc.summary}</p>
      </section>
    );
  }

  if (block.kind === 'experience') {
    const items = block.itemIds
      ? doc.experience.filter((e) => block.itemIds!.includes(e.id))
      : doc.experience;
    if (!items.length) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading
          title={title}
          continued={block.continued}
          paperLang={pLang}
          divider={divider}
          accent={accent}
          isAts={isAts}
        />
        <div className="cvp-entries">
          {items.map((exp) => (
            <div key={exp.id} className="cvp-entry">
              <div className="cvp-entry-head">
                <div>
                  <strong className="cvp-entry-role">{exp.role}</strong>
                  <div className="cvp-entry-sub">
                    <span style={{ color: accent }}>{exp.company}</span>
                    {exp.location ? <span> • {exp.location}</span> : null}
                  </div>
                </div>
                <span className="cvp-entry-date">
                  {exp.startDate}
                  {(exp.current || exp.endDate) && ' – '}
                  {exp.current ? formatPaperPresent(pLang) : exp.endDate}
                </span>
              </div>
              {exp.highlights.filter(Boolean).length > 0 && (
                <ul className="cvp-bullets">
                  {exp.highlights.filter(Boolean).map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === 'education') {
    if (!doc.education.length) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading title={title} paperLang={pLang} divider={divider} accent={accent} isAts={isAts} />
        <div className="cvp-entries">
          {doc.education.map((edu) => (
            <div key={edu.id} className="cvp-entry">
              <div className="cvp-entry-head">
                <div>
                  <strong className="cvp-entry-role">{edu.degree}</strong>
                  <div className="cvp-entry-sub">
                    <span style={{ color: accent }}>{edu.school}</span>
                    {edu.location ? <span> • {edu.location}</span> : null}
                  </div>
                </div>
                <span className="cvp-entry-date">
                  {edu.startDate}
                  {edu.endDate ? ` – ${edu.endDate}` : ''}
                </span>
              </div>
              {edu.grade && <p className="cvp-entry-note">{edu.grade}</p>}
              {edu.notes && <p className="cvp-entry-note">{edu.notes}</p>}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === 'certifications') {
    if (!doc.certifications.length) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading title={title} paperLang={pLang} divider={divider} accent={accent} isAts={isAts} />
        <div className="cvp-cert-list">
          {doc.certifications.map((cert) => (
            <div key={cert.id} className="cvp-cert-row">
              <div>
                <strong>{cert.name}</strong>
                {cert.issuer && <span> — {cert.issuer}</span>}
                {cert.credentialId && <small> ({cert.credentialId})</small>}
              </div>
              {cert.date && <span className="cvp-entry-date">{cert.date}</span>}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === 'skills') {
    if (!doc.skills.length) return null;
    const effectiveMode: SkillDisplayMode = isAts && doc.design.skillDisplay === 'bars' ? 'comma' : doc.design.skillDisplay;
    return (
      <section className="cvp-section">
        <SheetSectionHeading title={title} paperLang={pLang} divider={divider} accent={accent} isAts={isAts} />
        {renderSkillsContent(doc, effectiveMode, accent)}
      </section>
    );
  }

  if (block.kind === 'languages') {
    if (!doc.languages.length) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading title={title} paperLang={pLang} divider={divider} accent={accent} isAts={isAts} />
        <div className="cvp-lang-grid">
          {doc.languages.map((l) => (
            <div key={l.id} className="cvp-lang-item">
              <strong>{l.name}</strong>
              <span>{PROFICIENCY_LABELS[l.proficiency][pLang]}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === 'projects') {
    const items = block.itemIds ? doc.projects.filter((p) => block.itemIds!.includes(p.id)) : doc.projects;
    if (!items.length) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading
          title={title}
          continued={block.continued}
          paperLang={pLang}
          divider={divider}
          accent={accent}
          isAts={isAts}
        />
        <div className="cvp-entries">
          {items.map((proj) => (
            <div key={proj.id} className="cvp-entry">
              <div className="cvp-entry-head">
                <div>
                  <strong className="cvp-entry-role">{proj.name}</strong>
                  {(proj.role || proj.link) && (
                    <div className="cvp-entry-sub">
                      {proj.role && <span style={{ color: accent }}>{proj.role}</span>}
                      {proj.role && proj.link && <span> • </span>}
                      {proj.link && <span dir="ltr">{proj.link}</span>}
                    </div>
                  )}
                </div>
                {proj.date && <span className="cvp-entry-date">{proj.date}</span>}
              </div>
              {proj.summary && <p className="cvp-entry-note">{proj.summary}</p>}
              {proj.highlights.filter(Boolean).length > 0 && (
                <ul className="cvp-bullets">
                  {proj.highlights.filter(Boolean).map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === 'custom' && block.customGroupId) {
    const group = doc.customSections.find((g) => g.id === block.customGroupId);
    if (!group || !group.visible || !group.items.length) return null;
    return (
      <section className="cvp-section">
        <SheetSectionHeading
          title={group.title}
          paperLang={pLang}
          divider={divider}
          accent={accent}
          isAts={isAts}
        />
        <div className="cvp-entries">
          {group.items.map((item) => (
            <div key={item.id} className="cvp-entry">
              <div className="cvp-entry-head">
                <div>
                  <strong className="cvp-entry-role">{item.heading}</strong>
                  {item.subheading && (
                    <div className="cvp-entry-sub">
                      <span style={{ color: accent }}>{item.subheading}</span>
                    </div>
                  )}
                </div>
                {item.date && <span className="cvp-entry-date">{item.date}</span>}
              </div>
              {item.description && <p className="cvp-entry-note">{item.description}</p>}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return null;
}

export function ResumeSheetCanvas({ doc }: { doc: ResumeDocument }) {
  const dims = getPaperDimensions(doc.design.paperSize);
  const pages = useMemo(() => paginateResume(doc), [doc]);
  const onePageFit = useMemo(
    () => (doc.design.layoutMode === 'one-page' ? computeOnePageAdjustments(doc) : null),
    [doc],
  );

  const isAts = doc.design.layoutMode === 'ats';
  const isSidebarModern = doc.design.layoutMode === 'modern' && doc.design.modernVariant === 'sidebar';
  const isBannerModern = doc.design.layoutMode === 'modern' && doc.design.modernVariant === 'banner';

  const effectiveMargin = onePageFit ? onePageFit.effectiveMarginMm : doc.design.marginMm;
  const effectiveScale = onePageFit ? onePageFit.effectiveFontScale : doc.design.fontScale;
  const effectiveLh = onePageFit ? onePageFit.effectiveLineHeight : doc.design.lineHeight;
  const gapScale = onePageFit ? onePageFit.gapScale : 1;
  const accent = isAts ? doc.design.accentColor || '#111827' : doc.design.accentColor || '#24795e';
  const fontCss = resolveFontFamily(doc.design.fontFamily);

  const contacts = [
    doc.personal.email,
    doc.personal.phone,
    doc.personal.location,
    doc.personal.linkedin,
    doc.personal.website,
    doc.personal.github,
  ].filter((v) => v && v.trim());

  const showPhoto = Boolean(doc.personal.showPhoto && doc.personal.photoDataUrl && !isAts);
  const sidebarKinds: CoreSectionId[] = ['skills', 'languages', 'certifications'];

  return (
    <div className="cvp-pages-stack">
      {pages.map((pg) => {
        const sheetStyle: React.CSSProperties = {
          width: `${dims.widthPx}px`,
          minHeight: `${dims.heightPx}px`,
          maxHeight: doc.design.layoutMode === 'one-page' ? `${dims.heightPx}px` : undefined,
          overflow: doc.design.layoutMode === 'one-page' ? 'hidden' : undefined,
          fontFamily: fontCss,
          fontSize: `${(13.2 * effectiveScale).toFixed(2)}px`,
          lineHeight: effectiveLh,
          ['--cvp-gap' as any]: `${Math.round(14 * gapScale)}px`,
          ['--cvp-accent' as any]: accent,
        };

        if (isSidebarModern) {
          const sidebarBlocks = pg.blocks.filter((b) => sidebarKinds.includes(b.kind));
          const mainBlocks = pg.blocks.filter((b) => !sidebarKinds.includes(b.kind));
          return (
            <article
              key={pg.pageNumber}
              data-cv-sheet
              dir={doc.design.paperDir}
              lang={doc.design.paperLang}
              className="cv-paper-sheet cvp-mode-sidebar"
              style={sheetStyle}
            >
              <aside className="cvp-sidebar-col" style={{ backgroundColor: `${accent}0d`, borderColor: `${accent}24` }}>
                {showPhoto && (
                  <div className={`cvp-photo-frame ${doc.personal.photoShape}`}>
                    <img src={doc.personal.photoDataUrl} alt={doc.personal.fullName} />
                  </div>
                )}
                <div className="cvp-sidebar-identity">
                  <h1 style={{ color: accent }}>{doc.personal.fullName}</h1>
                  {doc.personal.jobTitle && <p className="cvp-job-title">{doc.personal.jobTitle}</p>}
                </div>
                {contacts.length > 0 && (
                  <div className="cvp-sidebar-contacts">
                    {contacts.map((c, i) => (
                      <span key={i} dir={c.includes('@') || c.includes('+') || c.includes('.') ? 'ltr' : undefined}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <div className="cvp-col-sections">
                  {sidebarBlocks.map((b, idx) => (
                    <RenderSectionBlock key={`${b.kind}-${idx}`} doc={doc} block={b} accent={accent} isAts={false} />
                  ))}
                </div>
              </aside>

              <div className="cvp-main-col" style={{ padding: `${effectiveMargin}mm` }}>
                <div className="cvp-col-sections">
                  {mainBlocks.map((b, idx) => (
                    <RenderSectionBlock
                      key={`${b.kind}-${b.customGroupId || idx}`}
                      doc={doc}
                      block={b}
                      accent={accent}
                      isAts={false}
                    />
                  ))}
                </div>
              </div>
            </article>
          );
        }

        return (
          <article
            key={pg.pageNumber}
            data-cv-sheet
            dir={doc.design.paperDir}
            lang={doc.design.paperLang}
            className={`cv-paper-sheet cvp-mode-${doc.design.layoutMode}`}
            style={{
              ...sheetStyle,
              padding: isBannerModern ? `0 0 ${effectiveMargin}mm 0` : `${effectiveMargin}mm`,
            }}
          >
            {pg.includeHeader ? (
              <header
                className={`cvp-top-header ${isBannerModern ? 'cvp-banner-header' : ''} ${isAts ? 'cvp-ats-header' : ''}`}
                style={
                  isBannerModern
                    ? {
                        backgroundColor: `${accent}10`,
                        borderTop: `5px solid ${accent}`,
                        padding: `${effectiveMargin}mm ${effectiveMargin}mm 14px`,
                        marginBottom: '14px',
                      }
                    : { borderBottomColor: `${accent}33` }
                }
              >
                <div className="cvp-header-row">
                  <div className="cvp-header-copy">
                    <h1 style={{ color: isAts ? '#111827' : accent }}>{doc.personal.fullName}</h1>
                    {doc.personal.jobTitle && <p className="cvp-job-title">{doc.personal.jobTitle}</p>}
                    {contacts.length > 0 && (
                      <div className="cvp-inline-contacts">
                        {contacts.map((c, i) => (
                          <span key={i}>
                            {i > 0 && <em aria-hidden="true"> • </em>}
                            <bdi>{c}</bdi>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {showPhoto && (
                    <div className={`cvp-photo-frame ${doc.personal.photoShape}`}>
                      <img src={doc.personal.photoDataUrl} alt={doc.personal.fullName} />
                    </div>
                  )}
                </div>
              </header>
            ) : (
              <header className="cvp-continuation-bar" style={{ borderBottomColor: `${accent}26` }}>
                <span>{doc.personal.fullName}</span>
                <span>{formatPageNumber(pg.pageNumber, pages.length, doc.design.paperLang)}</span>
              </header>
            )}

            <div
              className="cvp-body-flow"
              style={isBannerModern ? { paddingInline: `${effectiveMargin}mm` } : undefined}
            >
              {pg.blocks.map((b, idx) => (
                <RenderSectionBlock
                  key={`${b.kind}-${b.customGroupId || idx}`}
                  doc={doc}
                  block={b}
                  accent={accent}
                  isAts={isAts}
                />
              ))}
            </div>

            {(pages.length > 1 || doc.design.layoutMode === 'detailed') && (
              <footer className="cvp-sheet-footer">
                <span>{doc.personal.fullName}</span>
                <span>{formatPageNumber(pg.pageNumber, pages.length, doc.design.paperLang)}</span>
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function A4Preview({
  viewMode,
  onToggleViewMode,
}: {
  viewMode: WorkspaceViewMode;
  onToggleViewMode: () => void;
}) {
  const { resume, t } = useCvStudio();
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [fitZoom, setFitZoom] = useState(0.76);

  const dims = getPaperDimensions(resume.design.paperSize);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const availW = el.clientWidth - 32;
      if (availW <= 0) return;
      const ratio = Math.min(1, Math.max(0.34, availW / dims.widthPx));
      setFitZoom(Number(ratio.toFixed(3)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims.widthPx, viewMode]);

  const scale = zoomMode === 'fit' ? fitZoom : zoomMode;
  const pagesCount = useMemo(() => paginateResume(resume).length, [resume]);
  const modeLabel = LAYOUT_MODE_LABELS[resume.design.layoutMode];

  return (
    <section className="cv-preview-pane" aria-label={t('المعاينة الحية للورقة', 'Live sheet preview')}>
      <div className="cv-preview-toolbar no-print">
        <div className="cv-preview-pills">
          <span className="cv-mode-pill" data-testid="active-layout-pill">
            {t(modeLabel.ar, modeLabel.en)}
          </span>
          <span className="cv-meta-pill">
            {resume.design.paperSize.toUpperCase()} · {resume.design.paperDir.toUpperCase()} ·{' '}
            {pagesCount} {t(pagesCount === 1 ? 'صفحة' : 'صفحات', pagesCount === 1 ? 'page' : 'pages')}
          </span>
        </div>

        <div className="cv-zoom-controls">
          <button
            type="button"
            className="cv-icon-btn"
            aria-label={t('تصغير المعاينة', 'Zoom out')}
            onClick={() => setZoomMode((z) => Math.max(0.35, Number(((z === 'fit' ? fitZoom : z) - 0.1).toFixed(2))))}
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            className={`cv-zoom-readout ${zoomMode === 'fit' ? 'is-fit' : ''}`}
            onClick={() => setZoomMode('fit')}
            title={t('ملائمة العرض تلقائياً', 'Fit to width')}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="cv-icon-btn"
            aria-label={t('تكبير المعاينة', 'Zoom in')}
            onClick={() => setZoomMode((z) => Math.min(1.35, Number(((z === 'fit' ? fitZoom : z) + 0.1).toFixed(2))))}
          >
            <ZoomIn size={15} />
          </button>
          {zoomMode !== 'fit' && (
            <button
              type="button"
              className="cv-icon-btn"
              aria-label={t('إعادة ضبط التقريب', 'Reset zoom')}
              onClick={() => setZoomMode('fit')}
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            type="button"
            className="cv-icon-btn"
            aria-label={t('طباعة فورية', 'Print sheet')}
            title={t('طباعة فورية', 'Print sheet')}
            onClick={() => window.print()}
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            className="cv-icon-btn cv-desktop-only"
            aria-label={
              viewMode === 'focus'
                ? t('العودة للوضع المقسوم', 'Exit focus preview')
                : t('وضع التركيز والمعاينة الكاملة', 'Full focus preview')
            }
            title={
              viewMode === 'focus'
                ? t('العودة للوضع المقسوم', 'Exit focus preview')
                : t('وضع التركيز والمعاينة الكاملة', 'Full focus preview')
            }
            onClick={onToggleViewMode}
          >
            {viewMode === 'focus' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      <div className="cv-preview-stage" ref={stageRef}>
        <div
          className="cv-scale-frame"
          style={{
            width: `${Math.round(dims.widthPx * scale)}px`,
            minHeight: `${Math.round(dims.heightPx * scale * pagesCount)}px`,
          }}
        >
          <div
            className="cv-scale-origin"
            style={{
              width: `${dims.widthPx}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <ResumeSheetCanvas doc={resume} />
          </div>
        </div>
      </div>
    </section>
  );
}
