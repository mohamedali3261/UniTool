import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { BookDocument, BookPage, FileType } from '../types';
import { processTextIntoChunks, detectTextLanguage, sanitizeExtractedText } from './textProcessor';

// Ensure ReadableStream has asyncIterator and values() in all environments
if (typeof ReadableStream !== 'undefined') {
  if (!ReadableStream.prototype[Symbol.asyncIterator]) {
    ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    };
  }
  if (typeof (ReadableStream.prototype as any).values !== 'function') {
    (ReadableStream.prototype as any).values = ReadableStream.prototype[Symbol.asyncIterator];
  }
}

// Configure pdfjs worker to reliably load in browser
if (typeof window !== 'undefined') {
  try {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF Worker initialization fallback:', e);
  }
}

export interface ParseProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Main parser entry that accepts any supported file (PDF, TXT, EPUB, DOCX)
 */
export async function parseUploadedFile(
  file: File,
  onProgress?: ParseProgressCallback
): Promise<BookDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const fileId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '').trim();

  let fileType: FileType = 'txt';
  let pages: BookPage[] = [];

  if (extension === 'pdf') {
    fileType = 'pdf';
    pages = await parsePDFFile(file, onProgress);
  } else if (extension === 'epub') {
    fileType = 'epub';
    pages = await parseEPUBFile(file, onProgress);
  } else if (extension === 'docx') {
    fileType = 'docx';
    pages = await parseDOCXFile(file, onProgress);
  } else {
    // Default to TXT / plaintext
    fileType = 'txt';
    pages = await parseTXTFile(file, onProgress);
  }

  // Calculate stats
  const totalWords = pages.reduce((acc, p) => acc + p.wordCount, 0);
  const sampleCombinedText = pages.slice(0, 5).map(p => p.rawText).join(' ');
  const detectedLanguage = detectTextLanguage(sampleCombinedText);

  // Check if any pages need OCR (empty or image-only)
  const emptyPagesCount = pages.filter(p => p.wordCount === 0 || p.isScannedImage).length;
  const isMostlyScanned = pages.length > 0 && (emptyPagesCount / pages.length) > 0.6;

  return {
    id: fileId,
    title: cleanTitle || 'مستند بدون عنوان',
    fileType,
    fileSize: file.size,
    totalPages: pages.length,
    totalWords,
    detectedLanguage,
    pages,
    dateAdded: Date.now(),
    lastReadPage: 1,
    lastReadChunkIndex: 0,
    progressPercentage: 0,
    hasOcrProcessed: false,
  };
}

/**
 * Parse PDF files using PDF.js
 */
async function parsePDFFile(
  file: File,
  onProgress?: ParseProgressCallback
): Promise<BookPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfData = new Uint8Array(arrayBuffer);
  const version = pdfjsLib.version || '4.10.38';

  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/standard_fonts/`,
    disableAutoFetch: true,
    disableStream: true,
    disableRange: true,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: BookPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(i, numPages, `جاري استخراج الصفحة ${i} من ${numPages}...`);
    }

    let extractedText = '';

    try {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const items = textContent.items as any[];

      if (items && items.length > 0) {
        const allTextItems: { x: number; y: number; str: string; width: number; order: number }[] = [];

        let orderIdx = 0;
        for (const item of items) {
          if (!('str' in item) || !item.str) continue;
          const x = item.transform ? item.transform[4] : 0;
          const y = item.transform ? item.transform[5] : 0;
          const width = item.width || 0;
          allTextItems.push({ x, y, str: item.str, width, order: orderIdx++ });
        }

        if (allTextItems.length > 0) {
          const minY = Math.min(...allTextItems.map(it => it.y));
          const maxY = Math.max(...allTextItems.map(it => it.y));
          const ySpread = maxY - minY || 1;
          const adaptiveTolerance = Math.max(8, Math.min(20, ySpread * 0.08));

          const lineMap: { y: number; items: typeof allTextItems }[] = [];

          for (const item of allTextItems) {
            const existingLine = lineMap.find((l) => Math.abs(l.y - item.y) <= adaptiveTolerance);
            if (existingLine) {
              existingLine.items.push(item);
            } else {
              lineMap.push({ y: item.y, items: [item] });
            }
          }

          lineMap.sort((a, b) => b.y - a.y);

          const lineStrings: string[] = [];
          for (const line of lineMap) {
            line.items.sort((a, b) => a.order - b.order);

            if (line.items.length === 1) {
              const lineStr = line.items[0].str;
              if (lineStr.trim()) {
                lineStrings.push(lineStr.trim());
              }
              continue;
            }

            const firstX = line.items[0].x;
            const lastX = line.items[line.items.length - 1].x;
            const isRtlLine = firstX > lastX;

            const parts: string[] = [line.items[0].str];
            for (let j = 1; j < line.items.length; j++) {
              const prev = line.items[j - 1];
              const cur = line.items[j];

              let gap: number;
              if (isRtlLine) {
                gap = prev.x - (cur.x + cur.width);
              } else {
                gap = cur.x - (prev.x + prev.width);
              }

              const avgWidth = (prev.width + cur.width) / 2;
              if (gap > avgWidth * 0.25) {
                parts.push(' ');
              }

              parts.push(cur.str);
            }

            const lineStr = parts.join('').replace(/\s{2,}/g, ' ').trim();
            if (lineStr) {
              lineStrings.push(lineStr);
            }
          }

          extractedText = lineStrings.join('\n');
        }
      }
    } catch (pageErr) {
      console.warn(`Error extracting text from PDF page ${i}:`, pageErr);
      extractedText = '';
    }

    const cleanPageText = sanitizeExtractedText(extractedText);
    const wordCount = cleanPageText ? cleanPageText.split(/\s+/).filter(Boolean).length : 0;
    const isScannedImage = wordCount < 4; // Less than 4 words strongly indicates scanned/image-only page

    const pageLang = detectTextLanguage(cleanPageText);
    const chunks = processTextIntoChunks(cleanPageText, i, pageLang === 'en' ? 'en' : 'ar');

    pages.push({
      pageNumber: i,
      title: `الصفحة ${i}`,
      rawText: cleanPageText,
      chunks,
      wordCount,
      isScannedImage,
    });
  }

  return pages;
}

/**
 * Render a specific PDF page to an offscreen/visible canvas for OCR
 */
export async function renderPDFPageToCanvas(
  fileBuffer: ArrayBuffer,
  pageNumber: number,
  scale: number = 2.0
): Promise<HTMLCanvasElement> {
  const version = pdfjsLib.version || '4.10.38';
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/standard_fonts/`,
    disableAutoFetch: true,
    disableStream: true,
    disableRange: true,
  });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) throw new Error('Could not get 2d context for canvas');

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  } as any).promise;

  return canvas;
}

/**
 * Parse plain TXT files and split into clean structured pages
 */
async function parseTXTFile(
  file: File,
  onProgress?: ParseProgressCallback
): Promise<BookPage[]> {
  const text = await file.text();
  return splitPlainTextIntoPages(text, onProgress);
}

/**
 * Split any raw text string into nicely readable pages (~350 words per page)
 */
export function splitPlainTextIntoPages(
  text: string,
  onProgress?: ParseProgressCallback
): BookPage[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) {
    return [{
      pageNumber: 1,
      title: 'الصفحة 1',
      rawText: '',
      chunks: [],
      wordCount: 0,
    }];
  }

  // Split by explicit page breaks if any, or chapters, or paragraph clusters
  const paragraphs = normalized.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const pages: BookPage[] = [];

  let currentPageText = '';
  let currentPageWords = 0;
  let pageNumber = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    const paraWords = para.split(/\s+/).length;

    if (currentPageWords + paraWords > 350 && currentPageText.length > 0) {
      const lang = detectTextLanguage(currentPageText);
      const chunks = processTextIntoChunks(currentPageText, pageNumber, lang === 'en' ? 'en' : 'ar');
      pages.push({
        pageNumber,
        title: `الصفحة ${pageNumber}`,
        rawText: currentPageText,
        chunks,
        wordCount: currentPageWords,
      });

      pageNumber++;
      currentPageText = para;
      currentPageWords = paraWords;
    } else {
      currentPageText += (currentPageText.length > 0 ? '\n\n' : '') + para;
      currentPageWords += paraWords;
    }

    if (onProgress && i % 10 === 0) {
      onProgress(i, paragraphs.length, 'جاري تنظيم صفحات المستند...');
    }
  }

  if (currentPageText.trim().length > 0) {
    const lang = detectTextLanguage(currentPageText);
    const chunks = processTextIntoChunks(currentPageText, pageNumber, lang === 'en' ? 'en' : 'ar');
    pages.push({
      pageNumber,
      title: `الصفحة ${pageNumber}`,
      rawText: currentPageText,
      chunks,
      wordCount: currentPageWords,
    });
  }

  return pages.length > 0 ? pages : [{
    pageNumber: 1,
    title: 'الصفحة 1',
    rawText: normalized,
    chunks: processTextIntoChunks(normalized, 1),
    wordCount: normalized.split(/\s+/).length,
  }];
}

/**
 * Parse EPUB files using JSZip
 */
async function parseEPUBFile(
  file: File,
  onProgress?: ParseProgressCallback
): Promise<BookPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Read META-INF/container.xml to find OPF path
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  let opfPath = 'OEBPS/content.opf';

  if (containerXml) {
    const match = containerXml.match(/full-path="([^"]+)"/);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  const opfFolder = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfText = await zip.file(opfPath)?.async('text');

  const xhtmlFiles: string[] = [];

  if (opfText) {
    // Extract manifest items
    const itemRegex = /<item\s+[^>]*href="([^"]+)"[^>]*media-type="application\/xhtml\+xml"[^>]*>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(opfText)) !== null) {
      xhtmlFiles.push(opfFolder + itemMatch[1]);
    }
  }

  // Fallback: search all html/xhtml files in zip if OPF parsing was partial
  if (xhtmlFiles.length === 0) {
    zip.forEach((relativePath) => {
      if (relativePath.endsWith('.xhtml') || relativePath.endsWith('.html')) {
        xhtmlFiles.push(relativePath);
      }
    });
  }

  const pages: BookPage[] = [];
  let pageIndex = 1;

  for (let i = 0; i < xhtmlFiles.length; i++) {
    const path = xhtmlFiles[i];
    const fileEntry = zip.file(path);
    if (!fileEntry) continue;

    if (onProgress) {
      onProgress(i + 1, xhtmlFiles.length, `جاري استخراج فصل ${i + 1}...`);
    }

    const htmlContent = await fileEntry.async('text');
    // Strip HTML tags cleanly and extract chapter titles
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Remove scripts/styles
    doc.querySelectorAll('script, style, head').forEach(el => el.remove());
    const chapterHeading = doc.querySelector('h1, h2, h3, title')?.textContent?.trim();
    const cleanText = (doc.body.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length > 20) {
      // Split large chapters if necessary
      const chapterPages = splitPlainTextIntoPages(cleanText);
      for (const cp of chapterPages) {
        pages.push({
          pageNumber: pageIndex,
          title: chapterHeading || `فصل ${pageIndex}`,
          rawText: cp.rawText,
          chunks: processTextIntoChunks(cp.rawText, pageIndex),
          wordCount: cp.wordCount,
        });
        pageIndex++;
      }
    }
  }

  return pages.length > 0 ? pages : [{
    pageNumber: 1,
    title: 'الصفحة 1',
    rawText: 'لم يتم استخراج نصوص كافية من ملف EPUB',
    chunks: [],
    wordCount: 0,
  }];
}

/**
 * Parse DOCX files using mammoth
 */
async function parseDOCXFile(
  file: File,
  onProgress?: ParseProgressCallback
): Promise<BookPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(1, 1, 'جاري معالجة مستند DOCX...');

  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || '';
  return splitPlainTextIntoPages(rawText, onProgress);
}
