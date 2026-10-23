import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function convertWordToHtml(file: File): Promise<{ html: string; messages: unknown[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return { html: result.value, messages: result.messages };
}

export async function generatePdfBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const pdf = new jsPDF({
    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pdfWidth - margin * 2;
  const usableHeight = pdfHeight - margin * 2;

  const ratio = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;

  const xOffset = margin + (usableWidth - scaledWidth) / 2;
  const yOffset = margin;

  if (scaledHeight <= usableHeight) {
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
  } else {
    const pageCanvasHeight = usableHeight / ratio;
    let sourceY = 0;
    let pageIdx = 0;

    while (sourceY < imgHeight) {
      if (pageIdx > 0) pdf.addPage();

      const sliceHeight = Math.min(pageCanvasHeight, imgHeight - sourceY);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgWidth, sliceHeight);
        ctx.drawImage(canvas, 0, sourceY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
      }

      const pageData = pageCanvas.toDataURL('image/png');
      pdf.addImage(pageData, 'PNG', margin, margin, usableWidth, sliceHeight * ratio);

      sourceY += sliceHeight;
      pageIdx++;
    }
  }

  return pdf.output('blob');
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
