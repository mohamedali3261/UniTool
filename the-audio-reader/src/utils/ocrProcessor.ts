import { createWorker, Worker } from 'tesseract.js';
import { BookDocument, BookPage } from '../types';
import { renderPDFPageToCanvas } from './bookParser';
import { processTextIntoChunks, detectTextLanguage, sanitizeExtractedText } from './textProcessor';

export interface OCRProgressEvent {
  currentPage: number;
  totalPages: number;
  pageProgress: number; // 0-100
  overallProgress: number; // 0-100
  statusMessage: string;
}

export type OCRCallback = (progress: OCRProgressEvent) => void;

class OCRProcessorService {
  private activeWorker: Worker | null = null;
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
    if (this.activeWorker) {
      try {
        this.activeWorker.terminate();
      } catch (e) {
        console.warn('Error terminating OCR worker:', e);
      }
      this.activeWorker = null;
    }
  }

  /**
   * Run client-side OCR on specific or all pages of a document
   */
  public async performOCR(
    book: BookDocument,
    fileBuffer: ArrayBuffer,
    options: {
      lang?: 'ara' | 'eng' | 'ara+eng';
      onlyEmptyPages?: boolean;
      onProgress?: OCRCallback;
    } = {}
  ): Promise<BookDocument> {
    this.isCancelled = false;
    const targetLang = options.lang || (book.detectedLanguage === 'en' ? 'eng' : 'ara+eng');
    const onProgress = options.onProgress;

    // Filter which pages to process
    const pagesToProcess = book.pages.filter((p) => {
      if (options.onlyEmptyPages) {
        return p.wordCount < 5 || p.isScannedImage;
      }
      return true;
    });

    if (pagesToProcess.length === 0) {
      return book;
    }

    onProgress?.({
      currentPage: 0,
      totalPages: pagesToProcess.length,
      pageProgress: 0,
      overallProgress: 0,
      statusMessage: 'جاري تهيئة محرك التعرف الضوئي على الحروف (OCR)...',
    });

    // Create worker
    const worker = await createWorker(targetLang, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const p = Math.round((m.progress || 0) * 100);
          onProgress?.({
            currentPage: 1,
            totalPages: pagesToProcess.length,
            pageProgress: p,
            overallProgress: 0,
            statusMessage: `جاري تحليل الصورة والتعرف على الكلمات (${p}%)...`,
          });
        }
      },
    });
    this.activeWorker = worker;

    const updatedPages: BookPage[] = [...book.pages];

    for (let index = 0; index < pagesToProcess.length; index++) {
      if (this.isCancelled) break;

      const pageItem = pagesToProcess[index];
      const pageNum = pageItem.pageNumber;

      onProgress?.({
        currentPage: index + 1,
        totalPages: pagesToProcess.length,
        pageProgress: 0,
        overallProgress: Math.round((index / pagesToProcess.length) * 100),
        statusMessage: `جاري معالجة الصفحة ${pageNum} (${index + 1} من ${pagesToProcess.length})...`,
      });

      try {
        // Render PDF page to canvas
        const canvas = await renderPDFPageToCanvas(fileBuffer, pageNum, 2.0);
        const { data } = await worker.recognize(canvas);

        const recognizedText = sanitizeExtractedText(data.text);
        const pageWords = recognizedText.split(/\s+/).filter(Boolean).length;
        const pageLang = detectTextLanguage(recognizedText);
        const chunks = processTextIntoChunks(recognizedText, pageNum, pageLang === 'en' ? 'en' : 'ar');

        // Update the page in array
        const pageIndex = updatedPages.findIndex((p) => p.pageNumber === pageNum);
        if (pageIndex !== -1) {
          updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            rawText: recognizedText,
            chunks,
            wordCount: pageWords,
            isScannedImage: false,
          };
        }
      } catch (err) {
        console.error(`OCR failed on page ${pageNum}:`, err);
      }
    }

    // Terminate worker
    try {
      await worker.terminate();
    } catch (e) {
      // ignore
    }
    this.activeWorker = null;

    if (this.isCancelled) {
      throw new Error('OCR operation cancelled by user');
    }

    const totalWords = updatedPages.reduce((acc, p) => acc + p.wordCount, 0);
    const sampleText = updatedPages.slice(0, 5).map((p) => p.rawText).join(' ');
    const detectedLanguage = detectTextLanguage(sampleText);

    return {
      ...book,
      pages: updatedPages,
      totalWords,
      detectedLanguage,
      hasOcrProcessed: true,
    };
  }
}

export const ocrProcessor = new OCRProcessorService();
