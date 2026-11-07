import type { CoreSectionId, PaperSize, ResumeDocument } from './types';

export interface PaperDimensions {
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
}

export function getPaperDimensions(size: PaperSize): PaperDimensions {
  if (size === 'letter') {
    return { widthPx: 816, heightPx: 1056, widthMm: 215.9, heightMm: 279.4 };
  }
  // Standard ISO A4 at 96 DPI: 210mm x 297mm -> 794px x 1123px
  return { widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297 };
}

export interface PaginatedBlock {
  kind: CoreSectionId;
  customGroupId?: string;
  /** Optional slice of item IDs if a long section is split across pages */
  itemIds?: string[];
  continued?: boolean;
}

export interface LogicalPage {
  pageNumber: number;
  includeHeader: boolean;
  blocks: PaginatedBlock[];
}

function estimateBlockUnits(doc: ResumeDocument, id: CoreSectionId): number {
  switch (id) {
    case 'summary':
      return doc.summary.trim() ? Math.max(8, Math.ceil(doc.summary.length / 65) * 3.2 + 5) : 0;
    case 'experience':
      return doc.experience.length
        ? 5 + doc.experience.reduce((acc, item) => acc + 7 + item.highlights.filter(Boolean).length * 3.2, 0)
        : 0;
    case 'education':
      return doc.education.length
        ? 5 + doc.education.reduce((acc, item) => acc + 6 + (item.notes ? 2.5 : 0), 0)
        : 0;
    case 'certifications':
      return doc.certifications.length ? 5 + doc.certifications.length * 3.5 : 0;
    case 'skills':
      if (!doc.skills.length) return 0;
      if (doc.design.skillDisplay === 'comma') return 7 + Math.ceil(doc.skills.length / 7) * 2.2;
      if (doc.design.skillDisplay === 'bars') return 6 + Math.ceil(doc.skills.length / 2) * 3.6;
      return 6 + Math.ceil(doc.skills.length / 4) * 2.8;
    case 'languages':
      return doc.languages.length ? 5 + Math.ceil(doc.languages.length / 2) * 3 : 0;
    case 'projects':
      return doc.projects.length
        ? 5 + doc.projects.reduce((acc, p) => acc + 6 + (p.summary ? 2.8 : 0) + p.highlights.filter(Boolean).length * 2.8, 0)
        : 0;
    case 'custom':
      return doc.customSections
        .filter((g) => g.visible && g.items.length > 0)
        .reduce((acc, g) => acc + 5 + g.items.length * 5.2, 0);
  }
}

/**
 * Computes compact typography & spacing adjustments for One-Page Fit mode
 * so dense resumes fit cleanly on a single sheet without distorting proportions.
 */
export function computeOnePageAdjustments(doc: ResumeDocument): {
  effectiveMarginMm: number;
  effectiveFontScale: number;
  effectiveLineHeight: number;
  gapScale: number;
  densityRatio: number;
} {
  const visibleIds = doc.sections.filter((s) => s.visible).map((s) => s.id);
  const rawUnits = 16 + visibleIds.reduce((sum, id) => sum + estimateBlockUnits(doc, id), 0);
  const capacity = doc.design.paperSize === 'letter' ? 88 : 94;
  const densityRatio = rawUnits / capacity;

  if (densityRatio <= 0.85) {
    return {
      effectiveMarginMm: Math.min(doc.design.marginMm, 15),
      effectiveFontScale: Math.min(doc.design.fontScale, 0.98),
      effectiveLineHeight: Math.min(doc.design.lineHeight, 1.42),
      gapScale: 0.88,
      densityRatio,
    };
  }
  if (densityRatio <= 1.12) {
    return {
      effectiveMarginMm: Math.min(doc.design.marginMm, 12),
      effectiveFontScale: Math.max(0.84, Math.min(doc.design.fontScale * 0.93, 0.93)),
      effectiveLineHeight: 1.32,
      gapScale: 0.74,
      densityRatio,
    };
  }
  const squeeze = Math.max(0.76, Math.min(0.88, 1 / Math.sqrt(densityRatio)));
  return {
    effectiveMarginMm: 10,
    effectiveFontScale: Number((Math.max(0.78, doc.design.fontScale * squeeze)).toFixed(2)),
    effectiveLineHeight: 1.26,
    gapScale: 0.62,
    densityRatio,
  };
}

/**
 * Splits visible resume sections into logical A4/Letter pages.
 * - In 'one-page' mode: always returns 1 page containing all visible sections.
 * - In 'detailed' mode (and when content overflows in 'ats'/'modern'): splits cleanly across pages,
 *   including item-level splitting for long experience / project / education lists!
 */
export function paginateResume(doc: ResumeDocument): LogicalPage[] {
  const visibleSections = doc.sections.filter((s) => s.visible);

  if (doc.design.layoutMode === 'one-page') {
    const blocks: PaginatedBlock[] = [];
    for (const sec of visibleSections) {
      if (sec.id === 'custom') {
        for (const group of doc.customSections.filter((g) => g.visible && g.items.length > 0)) {
          blocks.push({ kind: 'custom', customGroupId: group.id });
        }
      } else if (estimateBlockUnits(doc, sec.id) > 0) {
        blocks.push({ kind: sec.id });
      }
    }
    return [{ pageNumber: 1, includeHeader: true, blocks }];
  }

  // Two-column sidebar in modern mode keeps sidebar items on page 1 cleanly unless detailed
  if (doc.design.layoutMode === 'modern' && doc.design.modernVariant === 'sidebar') {
    const blocks: PaginatedBlock[] = [];
    for (const sec of visibleSections) {
      if (sec.id === 'custom') {
        for (const group of doc.customSections.filter((g) => g.visible && g.items.length > 0)) {
          blocks.push({ kind: 'custom', customGroupId: group.id });
        }
      } else if (estimateBlockUnits(doc, sec.id) > 0) {
        blocks.push({ kind: sec.id });
      }
    }
    return [{ pageNumber: 1, includeHeader: true, blocks }];
  }

  const baseCapacity = doc.design.paperSize === 'letter' ? 84 : 90;
  const scaleFactor = (doc.design.fontScale || 1) * ((doc.design.lineHeight || 1.45) / 1.45);
  const marginPenalty = Math.max(0, (doc.design.marginMm - 14) * 1.1);
  const pageCapacity = Math.max(52, (baseCapacity - marginPenalty) / scaleFactor);
  const firstPageHeaderCost = doc.design.layoutMode === 'detailed' ? 16 : 15;

  const pages: LogicalPage[] = [{ pageNumber: 1, includeHeader: true, blocks: [] }];
  let used = firstPageHeaderCost;

  const pushNewPage = () => {
    pages.push({
      pageNumber: pages.length + 1,
      includeHeader: false,
      blocks: [],
    });
    used = 6;
  };

  for (const sec of visibleSections) {
    if (sec.id === 'experience' && doc.experience.length > 0) {
      let chunk: string[] = [];
      let continued = false;
      let headerAdded = false;

      for (const exp of doc.experience) {
        const itemCost = (headerAdded ? 0 : 5) + 7 + exp.highlights.filter(Boolean).length * 3.2;
        if (used + itemCost > pageCapacity && (pages[pages.length - 1].blocks.length > 0 || chunk.length > 0)) {
          if (chunk.length > 0) {
            pages[pages.length - 1].blocks.push({ kind: 'experience', itemIds: chunk, continued });
            chunk = [];
            continued = true;
          }
          pushNewPage();
          headerAdded = false;
        }
        chunk.push(exp.id);
        used += itemCost;
        headerAdded = true;
      }
      if (chunk.length > 0) {
        pages[pages.length - 1].blocks.push({ kind: 'experience', itemIds: chunk, continued });
      }
      continue;
    }

    if (sec.id === 'projects' && doc.projects.length > 0) {
      let chunk: string[] = [];
      let continued = false;
      let headerAdded = false;

      for (const proj of doc.projects) {
        const itemCost =
          (headerAdded ? 0 : 5) + 6 + (proj.summary ? 2.8 : 0) + proj.highlights.filter(Boolean).length * 2.8;
        if (used + itemCost > pageCapacity && (pages[pages.length - 1].blocks.length > 0 || chunk.length > 0)) {
          if (chunk.length > 0) {
            pages[pages.length - 1].blocks.push({ kind: 'projects', itemIds: chunk, continued });
            chunk = [];
            continued = true;
          }
          pushNewPage();
          headerAdded = false;
        }
        chunk.push(proj.id);
        used += itemCost;
        headerAdded = true;
      }
      if (chunk.length > 0) {
        pages[pages.length - 1].blocks.push({ kind: 'projects', itemIds: chunk, continued });
      }
      continue;
    }

    if (sec.id === 'custom') {
      for (const group of doc.customSections.filter((g) => g.visible && g.items.length > 0)) {
        const cost = 5 + group.items.length * 5.2;
        if (used + cost > pageCapacity && pages[pages.length - 1].blocks.length > 0) {
          pushNewPage();
        }
        pages[pages.length - 1].blocks.push({ kind: 'custom', customGroupId: group.id });
        used += cost;
      }
      continue;
    }

    const cost = estimateBlockUnits(doc, sec.id);
    if (cost <= 0) continue;
    if (used + cost > pageCapacity && pages[pages.length - 1].blocks.length > 0) {
      pushNewPage();
    }
    pages[pages.length - 1].blocks.push({ kind: sec.id });
    used += cost;
  }

  return pages;
}
