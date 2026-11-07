import { toCanvas } from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { formatPaperPresent, getPaperSectionTitle, PROFICIENCY_LABELS } from './i18n';
import { getPaperDimensions } from './pagination';
import { serializeUtcvProject } from './storage';
import type { PaperSize, ResumeDocument } from './types';

export function sanitizeFilename(raw: string, fallback = 'UniTool-CV'): string {
  const clean = raw
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return clean || fallback;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

async function renderSheetElementToCanvas(sheet: HTMLElement, paperSize: PaperSize): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => {});
  }
  const dims = getPaperDimensions(paperSize);
  const host = document.createElement('div');
  host.setAttribute('data-cv-export-sandbox', 'true');
  host.style.cssText = [
    'position:fixed',
    'left:-12000px',
    'top:0',
    `width:${dims.widthPx}px`,
    'background:#ffffff',
    'color:#111827',
    'color-scheme:light',
    'z-index:-1',
    'pointer-events:none',
  ].join(';');

  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-canvas-ui-chrome]').forEach((el) => el.remove());
  clone.querySelectorAll('.is-canvas-selected').forEach((el) => el.classList.remove('is-canvas-selected'));
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
  clone.style.transform = 'none';
  clone.style.width = `${dims.widthPx}px`;
  clone.style.minHeight = `${dims.heightPx}px`;
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.backgroundColor = '#ffffff';

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    try {
      return await toCanvas(clone, {
        width: dims.widthPx,
        height: Math.max(dims.heightPx, clone.offsetHeight),
        pixelRatio: 2.4,
        backgroundColor: '#ffffff',
        cacheBust: false,
      });
    } catch {
      return await html2canvas(clone, {
        scale: 2.2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: dims.widthPx,
        windowWidth: dims.widthPx,
      });
    }
  } finally {
    host.remove();
  }
}

function findSheetElements(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

export async function exportSheetsToPdf(options: {
  selector: string;
  filename: string;
  paperSize: PaperSize;
  title?: string;
}): Promise<void> {
  const sheets = findSheetElements(options.selector);
  if (sheets.length === 0) {
    throw new Error('لا توجد صفحة جاهزة للتصدير حالياً / No sheet found to export');
  }

  const dims = getPaperDimensions(options.paperSize);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.paperSize === 'letter' ? 'letter' : 'a4',
    compress: true,
  });

  pdf.setProperties({
    title: options.title || options.filename,
    creator: 'UniTool CV & Cover Letter Studio',
  });

  for (let i = 0; i < sheets.length; i++) {
    if (i > 0) {
      pdf.addPage(options.paperSize === 'letter' ? 'letter' : 'a4', 'portrait');
    }
    const canvas = await renderSheetElementToCanvas(sheets[i], options.paperSize);
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', 0, 0, dims.widthMm, dims.heightMm, undefined, 'FAST');
  }

  const arrayBuffer = pdf.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  triggerBlobDownload(blob, `${sanitizeFilename(options.filename)}.pdf`);
}

export async function exportSheetsToPng(options: {
  selector: string;
  filename: string;
  paperSize: PaperSize;
}): Promise<void> {
  const sheets = findSheetElements(options.selector);
  if (sheets.length === 0) {
    throw new Error('لا توجد صفحة جاهزة للتصدير حالياً / No sheet found to export');
  }

  const canvases: HTMLCanvasElement[] = [];
  for (const sheet of sheets) {
    canvases.push(await renderSheetElementToCanvas(sheet, options.paperSize));
  }

  let finalCanvas: HTMLCanvasElement;
  if (canvases.length === 1) {
    finalCanvas = canvases[0];
  } else {
    const gap = 36;
    const maxWidth = Math.max(...canvases.map((c) => c.width));
    const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + gap * (canvases.length - 1);
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = maxWidth;
    finalCanvas.height = totalHeight;
    const ctx = finalCanvas.getContext('2d')!;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, maxWidth, totalHeight);
    let y = 0;
    for (const c of canvases) {
      ctx.drawImage(c, Math.round((maxWidth - c.width) / 2), y);
      y += c.height + gap;
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    finalCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png');
  });
  triggerBlobDownload(blob, `${sanitizeFilename(options.filename)}.png`);
}

export function exportProjectUtcv(doc: ResumeDocument): void {
  const json = serializeUtcvProject(doc);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFilename(doc.title || doc.personal.fullName)}.utcv.json`);
}

export function buildPlainTextAtsResume(doc: ResumeDocument): string {
  const lang = doc.design.paperLang;
  const lines: string[] = [];
  lines.push(doc.personal.fullName.toUpperCase());
  if (doc.personal.jobTitle) lines.push(doc.personal.jobTitle);

  const contacts = [
    doc.personal.email,
    doc.personal.phone,
    doc.personal.location,
    doc.personal.linkedin,
    doc.personal.website,
    doc.personal.github,
  ].filter((c) => c && c.trim());
  if (contacts.length) lines.push(contacts.join(' | '));
  lines.push('');

  for (const sec of doc.sections.filter((s) => s.visible)) {
    const heading = getPaperSectionTitle(sec.id, lang, sec.customTitleAr, sec.customTitleEn);
    if (sec.id === 'summary' && doc.summary.trim()) {
      lines.push(`=== ${heading} ===`);
      lines.push(doc.summary.trim());
      lines.push('');
    } else if (sec.id === 'experience' && doc.experience.length) {
      lines.push(`=== ${heading} ===`);
      for (const exp of doc.experience) {
        const period = `${exp.startDate} - ${exp.current ? formatPaperPresent(lang) : exp.endDate}`;
        lines.push(`${exp.role} | ${exp.company}${exp.location ? ` (${exp.location})` : ''} | ${period}`);
        for (const h of exp.highlights.filter(Boolean)) lines.push(`- ${h}`);
        lines.push('');
      }
    } else if (sec.id === 'education' && doc.education.length) {
      lines.push(`=== ${heading} ===`);
      for (const edu of doc.education) {
        lines.push(`${edu.degree} | ${edu.school} | ${edu.startDate} - ${edu.endDate}`);
        if (edu.grade) lines.push(`  ${edu.grade}`);
        if (edu.notes) lines.push(`  ${edu.notes}`);
      }
      lines.push('');
    } else if (sec.id === 'certifications' && doc.certifications.length) {
      lines.push(`=== ${heading} ===`);
      for (const c of doc.certifications) {
        lines.push(`- ${c.name} — ${c.issuer}${c.date ? ` (${c.date})` : ''}`);
      }
      lines.push('');
    } else if (sec.id === 'skills' && doc.skills.length) {
      lines.push(`=== ${heading} ===`);
      lines.push(doc.skills.map((s) => s.name).join(', '));
      lines.push('');
    } else if (sec.id === 'languages' && doc.languages.length) {
      lines.push(`=== ${heading} ===`);
      lines.push(doc.languages.map((l) => `${l.name} (${PROFICIENCY_LABELS[l.proficiency][lang]})`).join(', '));
      lines.push('');
    } else if (sec.id === 'projects' && doc.projects.length) {
      lines.push(`=== ${heading} ===`);
      for (const p of doc.projects) {
        lines.push(`${p.name}${p.role ? ` — ${p.role}` : ''}${p.date ? ` (${p.date})` : ''}`);
        if (p.summary) lines.push(`  ${p.summary}`);
        for (const h of p.highlights.filter(Boolean)) lines.push(`- ${h}`);
      }
      lines.push('');
    } else if (sec.id === 'custom') {
      for (const group of doc.customSections.filter((g) => g.visible && g.items.length)) {
        lines.push(`=== ${group.title} ===`);
        for (const item of group.items) {
          lines.push(`${item.heading}${item.subheading ? ` — ${item.subheading}` : ''}${item.date ? ` (${item.date})` : ''}`);
          if (item.description) lines.push(`  ${item.description}`);
        }
        lines.push('');
      }
    }
  }
  return lines.join('\n').trim();
}
