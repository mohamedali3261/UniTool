import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import type { PdfPage } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractPdfPages(file: File): Promise<PdfPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const extractedPages: PdfPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    extractedPages.push({ pageNum: i, text });
  }

  return extractedPages;
}

export async function generateWordBlob(pages: PdfPage[], lang: 'ar' | 'en'): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  pages.forEach((page, idx) => {
    if (idx > 0) {
      paragraphs.push(new Paragraph({ text: '' }));
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: lang === 'ar' ? `صفحة ${page.pageNum}` : `Page ${page.pageNum}`,
            bold: true,
            size: 28,
            color: '4472C4',
          }),
        ],
        spacing: { after: 200 },
      })
    );

    if (page.text.trim()) {
      const lines = page.text.split(/\s+/);
      const lineChunks: string[] = [];
      for (let i = 0; i < lines.length; i += 20) {
        lineChunks.push(lines.slice(i, i + 20).join(' '));
      }

      lineChunks.forEach(chunk => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: chunk,
                size: 24,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: lang === 'ar' ? '[صفحة فارغة]' : '[Empty page]',
              italics: true,
              size: 22,
              color: '999999',
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
