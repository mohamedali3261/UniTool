import * as pdfjsLib from 'pdfjs-dist';
import type { ImageFormat, PageImage } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const loadImageAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const loadImageToCanvas = (dataUrl: string): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: c.toDataURL('image/png'), width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

export const loadPdfPages = async (file: File): Promise<PageImage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const result: PageImage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await (page.render as any)({ canvas, canvasContext: ctx, viewport }).promise;
    result.push({
      id: 0,
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height,
      name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}`,
    });
  }
  return result;
};

export const canvasToBlob = (dataUrl: string, format: ImageFormat, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      if (format === 'jpeg') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(img, 0, 0);
      c.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert'));
      }, `image/${format === 'jpeg' ? 'jpeg' : 'png'}`, format === 'jpeg' ? quality : undefined);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

export const downloadUrl = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
