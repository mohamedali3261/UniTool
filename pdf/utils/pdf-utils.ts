import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { PDFElement } from '../types';

// Utility to convert hex color to RGB (0-1)
const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

export const exportEditedPDF = async (
  originalBuffer: ArrayBuffer,
  elements: PDFElement[],
  renderedWidth: number = 0,
  renderedHeight: number = 0,
  pageRotations: { [pageIndex: number]: number } = {}
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(originalBuffer);
  pdfDoc.registerFontkit(fontkit);

  // Use a reliable font for Arabic
  const fontUrl = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf';
  let customFont;
  try {
    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
    customFont = await pdfDoc.embedFont(fontBytes);
  } catch (e) {
    console.error('Failed to load Arabic font, falling back to standard', e);
  }

  const pages = pdfDoc.getPages();

  // Apply page rotations before processing elements
  Object.entries(pageRotations).forEach(([indexStr, rot]) => {
    const idx = parseInt(indexStr);
    if (idx < pages.length && rot) {
      const page = pages[idx];
      const originalRotation = page.getRotation().angle;
      const finalRotation = (originalRotation + rot) % 360;
      page.setRotation(degrees(finalRotation));
    }
  });

  for (const element of elements) {
    if (element.pageIndex >= pages.length) continue;
    const page = pages[element.pageIndex];
    // getSize() returns crop box if defined, else media box
    const unrotatedSize = page.getSize();
    const cropBox = page.getCropBox() || page.getMediaBox();
    const rotationAngle = page.getRotation().angle;

    const cx = cropBox.x || 0;
    const cy = cropBox.y || 0;
    const unrotatedWidth = unrotatedSize.width;
    const unrotatedHeight = unrotatedSize.height;

    let uprightWidth = unrotatedWidth;
    let uprightHeight = unrotatedHeight;

    if (rotationAngle === 90 || rotationAngle === 270) {
      uprightWidth = unrotatedHeight;
      uprightHeight = unrotatedWidth;
    }

    // Calculate uniform scale to prevent any aspect ratio distortions
    const scaleX = renderedWidth ? uprightWidth / renderedWidth : 1;
    const scaleY = renderedHeight ? uprightHeight / renderedHeight : 1;
    const scale = (scaleX + scaleY) / 2;

    // Scale UI bounds to upright PDF points using the uniform scale
    const ux = element.x * scale;
    const uy = element.y * scale;
    const uw = element.width * scale;
    const uh = element.height * scale;
    const eFontSize = (element.fontSize || 12) * scale;

    // Determine unrotated position and rotation based on page's intrinsic rotation
    let pdfLibX = 0;
    let pdfLibY = 0;
    let pdfLibWidth = uw;
    let pdfLibHeight = uh;
    let pdfLibRotate = 0;

    if (rotationAngle === 0) {
      pdfLibX = cx + ux;
      pdfLibY = cy + unrotatedHeight - uy - uh;
      pdfLibRotate = 0;
    } else if (rotationAngle === 90) {
      pdfLibX = cx + uy + uh;
      pdfLibY = cy + ux;
      pdfLibRotate = 90;
    } else if (rotationAngle === 180) {
      pdfLibX = cx + unrotatedWidth - ux;
      pdfLibY = cy + unrotatedHeight - uy;
      pdfLibRotate = 180;
    } else if (rotationAngle === 270) {
      pdfLibX = cx + unrotatedWidth - uy - uh;
      pdfLibY = cy + unrotatedHeight - ux;
      pdfLibRotate = 270;
    }

    // Apply any base object rotation (UI rotates CW, pdf-lib rotates CCW)
    const elementRotation = element.rotation || 0;
    const totalRotation = degrees(pdfLibRotate - elementRotation);
    const opacity = element.opacity !== undefined ? element.opacity : 1;

    // Draw border if exists (except for shapes that handle their own borders)
    if (element.borderWidth && element.borderWidth > 0 && 
        element.type !== 'rectangle' && element.type !== 'ellipse' && element.type !== 'line') {
      page.drawRectangle({
        x: pdfLibX,
        y: pdfLibY,
        width: pdfLibWidth,
        height: pdfLibHeight,
        borderColor: hexToRgb(element.borderColor || '#000000'),
        borderWidth: element.borderWidth * scaleX,
        rotate: totalRotation,
        opacity: opacity,
      });
    }

    if (element.type === 'text') {
      // Text drawing pivot is lower-left of baseline
      // Roughly match the visual offset
      const textOffset = eFontSize * 0.75;
      
      let textX = pdfLibX;
      let textY = pdfLibY;
      
      if (rotationAngle === 0) {
        textY += (uh - textOffset); // adjust up to baseline
      } else if (rotationAngle === 90) {
        textX -= (uh - textOffset); // adjust inward
      } else if (rotationAngle === 180) {
        textX -= uw;
        textY -= textOffset;
      } else if (rotationAngle === 270) {
        textY += uw;
        textX += textOffset;
      }

      page.drawText(element.content || '', {
        x: textX,
        y: textY,
        size: eFontSize,
        font: customFont || undefined,
        color: hexToRgb(element.color || '#000000'),
        rotate: totalRotation,
        opacity: opacity,
      });
    } else if (element.type === 'image' && element.src) {
      let image;
      try {
        if (element.src.includes('image/png')) {
          image = await pdfDoc.embedPng(element.src);
        } else if (element.src.includes('image/jpeg')) {
          image = await pdfDoc.embedJpg(element.src);
        } else {
          continue;
        }

        page.drawImage(image, {
          x: pdfLibX,
          y: pdfLibY,
          width: pdfLibWidth,
          height: pdfLibHeight,
          rotate: totalRotation,
          opacity: opacity,
        });
      } catch (e) {
        console.error('Failed to embed image', e);
      }
    } else if (element.type === 'rectangle' || element.type === 'line') {
      const isLine = element.type === 'line';
      page.drawRectangle({
        x: pdfLibX,
        y: pdfLibY,
        width: pdfLibWidth,
        height: pdfLibHeight,
        color: (element.backgroundColor && element.backgroundColor !== 'transparent') ? hexToRgb(element.backgroundColor) : undefined,
        borderColor: (element.borderColor && element.borderColor !== 'transparent') ? hexToRgb(element.borderColor) : undefined,
        borderWidth: isLine ? 0 : (element.borderWidth || 0) * scaleX,
        rotate: totalRotation,
        opacity: opacity,
      });
    } else if (element.type === 'ellipse') {
      page.drawEllipse({
        x: pdfLibX + pdfLibWidth / 2, // pdf-lib draws ellipses from the center
        y: pdfLibY + pdfLibHeight / 2,
        xScale: pdfLibWidth / 2,
        yScale: pdfLibHeight / 2,
        color: (element.backgroundColor && element.backgroundColor !== 'transparent') ? hexToRgb(element.backgroundColor) : undefined,
        borderColor: (element.borderColor && element.borderColor !== 'transparent') ? hexToRgb(element.borderColor) : undefined,
        borderWidth: (element.borderWidth || 0) * scaleX,
        opacity: opacity,
      });
    }
  }

  return await pdfDoc.save();
};
