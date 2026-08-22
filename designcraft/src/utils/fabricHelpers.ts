import { fabric } from 'fabric';
import { SVG_ICON_STRINGS, getFallbackSvgForIcon } from './svgIcons';
import { ProjectItem } from '../types';
import { INITIAL_MOCK_PROJECTS } from '../data/presets';

// Configure Fabric default control styling and safe text style handlers
export const initFabricDefaults = () => {
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.cornerColor = '#0284C7';
  fabric.Object.prototype.cornerStrokeColor = '#FFFFFF';
  fabric.Object.prototype.borderColor = '#38BDF8';
  fabric.Object.prototype.cornerSize = 12;
  fabric.Object.prototype.cornerStyle = 'circle';
  fabric.Object.prototype.borderScaleFactor = 2;
  fabric.Object.prototype.borderDashArray = [4, 4];
  fabric.Object.prototype.padding = 6;
  fabric.Object.prototype.hasBorders = true;
  fabric.Object.prototype.hasControls = true;

  // Safe prototype default for styles
  if (fabric.Text) {
    (fabric.Text.prototype as any).styles = {};
  }
  if (fabric.IText) {
    (fabric.IText.prototype as any).styles = {};
  }
  if (fabric.Textbox) {
    (fabric.Textbox.prototype as any).styles = {};
  }

  // Patch fabric.util.stylesToArray to prevent TypeError: undefined is not an object (evaluating 'styles[i]')
  if (fabric.util && typeof (fabric.util as any).stylesToArray === 'function') {
    const originalStylesToArray = (fabric.util as any).stylesToArray;
    (fabric.util as any).stylesToArray = function(styles: any, text: any) {
      if (!styles || typeof styles !== 'object') {
        return [];
      }
      if (!text || typeof text !== 'string') {
        return [];
      }
      try {
        return originalStylesToArray.call(this, styles, text);
      } catch (err) {
        return [];
      }
    };
  }

  // Patch fabric.util.stylesFromArray
  if (fabric.util && typeof (fabric.util as any).stylesFromArray === 'function') {
    const originalStylesFromArray = (fabric.util as any).stylesFromArray;
    (fabric.util as any).stylesFromArray = function(styles: any, text: any) {
      if (!styles) {
        return {};
      }
      if (!Array.isArray(styles)) {
        return typeof styles === 'object' ? styles : {};
      }
      if (!text || typeof text !== 'string') {
        return {};
      }
      try {
        return originalStylesFromArray.call(this, styles, text);
      } catch (err) {
        return {};
      }
    };
  }
};

// Initialize immediately on module load
initFabricDefaults();

// Helper to determine good contrast color based on canvas background
const getDefaultContrastingColor = (canvas: fabric.Canvas) => {
  const bg = canvas.backgroundColor;
  if (!bg || bg === '#FFFFFF' || bg === 'white' || bg === '#fff' || bg === '#F8FAFC' || bg === '#F1F5F9') {
    return '#0F172A';
  }
  return '#FFFFFF';
};

// Shape Creators
export const addRectangleToCanvas = (
  canvas: fabric.Canvas,
  options: { rounded?: boolean; fill?: string; stroke?: string; rx?: number } | string = {}
) => {
  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();
  const cHeight = canvas.getHeight();

  const fill = typeof options === 'string' ? options : options.fill || '#0284C7';
  const rx =
    typeof options === 'object' && options.rx !== undefined
      ? options.rx
      : typeof options === 'object' && options.rounded
      ? 24
      : 0;
  const stroke = typeof options === 'object' && options.stroke ? options.stroke : '#38BDF8';

  const w = Math.min(Math.round(cWidth * 0.4), 320);
  const h = Math.min(Math.round(cHeight * 0.3), 220);

  const rect = new fabric.Rect({
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    width: w,
    height: h,
    fill,
    stroke,
    strokeWidth: 2,
    rx,
    ry: rx,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 12,
      offsetX: 0,
      offsetY: 4
    })
  });

  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.renderAll();
  return rect;
};

export const addCircleToCanvas = (canvas: fabric.Canvas, options: { fill?: string } | string = {}) => {
  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();
  const fill = typeof options === 'string' ? options : options.fill || '#0077B6';
  const radius = Math.min(Math.round(cWidth * 0.18), 120);

  const circle = new fabric.Circle({
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    radius,
    fill,
    stroke: '#48CAE4',
    strokeWidth: 2,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 10,
      offsetX: 0,
      offsetY: 4
    })
  });

  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.renderAll();
  return circle;
};

export const addTriangleToCanvas = (canvas: fabric.Canvas, options: { fill?: string } | string = {}) => {
  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();
  const fill = typeof options === 'string' ? options : options.fill || '#4F46E5';
  const w = Math.min(Math.round(cWidth * 0.3), 200);

  const triangle = new fabric.Triangle({
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    width: w,
    height: Math.round(w * 0.9),
    fill,
    stroke: '#818CF8',
    strokeWidth: 2
  });

  canvas.add(triangle);
  canvas.setActiveObject(triangle);
  canvas.renderAll();
  return triangle;
};

export const addStarToCanvas = (canvas: fabric.Canvas, options: { fill?: string } | string = {}) => {
  const center = canvas.getCenter();
  const fill = typeof options === 'string' ? options : options.fill || '#F59E0B';
  const points = [
    { x: 100, y: 10 },
    { x: 125, y: 70 },
    { x: 190, y: 75 },
    { x: 140, y: 120 },
    { x: 155, y: 185 },
    { x: 100, y: 150 },
    { x: 45, y: 185 },
    { x: 60, y: 120 },
    { x: 10, y: 75 },
    { x: 75, y: 70 }
  ];

  const star = new fabric.Polygon(points, {
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    fill,
    stroke: '#FCD34D',
    strokeWidth: 2,
    scaleX: 1,
    scaleY: 1
  });

  canvas.add(star);
  canvas.setActiveObject(star);
  canvas.renderAll();
  return star;
};

export const addLineToCanvas = (canvas: fabric.Canvas, stroke: string = '#0284C7') => {
  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();
  const lineLen = Math.min(Math.round(cWidth * 0.4), 260);

  const line = new fabric.Line([center.left - lineLen / 2, center.top, center.left + lineLen / 2, center.top], {
    stroke: typeof stroke === 'string' ? stroke : '#0284C7',
    strokeWidth: 4,
    strokeLineCap: 'round',
    originX: 'center',
    originY: 'center'
  });

  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.renderAll();
  return line;
};

export const addArrowToCanvas = (canvas: fabric.Canvas, stroke: string = '#0284C7') => {
  const center = canvas.getCenter();
  const path = new fabric.Path('M 0 10 L 140 10 M 120 0 L 140 10 L 120 20', {
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    stroke: typeof stroke === 'string' ? stroke : '#0284C7',
    strokeWidth: 5,
    fill: '',
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    scaleX: 1.5,
    scaleY: 1.5
  });

  canvas.add(path);
  canvas.setActiveObject(path);
  canvas.renderAll();
  return path;
};

export const addBadgeToCanvas = (canvas: fabric.Canvas, options: { fill?: string } | string = {}) => {
  const center = canvas.getCenter();
  const fill = typeof options === 'string' ? options : options.fill || '#E11D48';
  // 12-point badge / starburst
  const points = [];
  const spikes = 12;
  const outerRadius = 80;
  const innerRadius = 65;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    points.push({
      x: Math.cos(angle) * r + 100,
      y: Math.sin(angle) * r + 100
    });
  }

  const badge = new fabric.Polygon(points, {
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    fill,
    stroke: '#FDA4AF',
    strokeWidth: 2
  });

  canvas.add(badge);
  canvas.setActiveObject(badge);
  canvas.renderAll();
  return badge;
};

export const addHeartToCanvas = (canvas: fabric.Canvas, options: { fill?: string } | string = {}) => {
  const center = canvas.getCenter();
  const fill = typeof options === 'string' ? options : options.fill || '#EC4899';
  const heart = new fabric.Path(
    'M 272 400 C 272 400 136 260 136 170 C 136 110 180 64 240 64 C 272 64 300 80 320 104 C 340 80 368 64 400 64 C 460 64 504 110 504 170 C 504 260 368 400 368 400 Z',
    {
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center',
      fill,
      stroke: '#F472B6',
      strokeWidth: 2,
      scaleX: 0.45,
      scaleY: 0.45
    }
  );

  canvas.add(heart);
  canvas.setActiveObject(heart);
  canvas.renderAll();
  return heart;
};

// Text Creator - Supports both (canvas, text, options) AND (canvas, options)
export const addTextToCanvas = (
  canvas: fabric.Canvas,
  textOrOptions:
    | string
    | {
        text?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string | number;
        fill?: string;
        fontStyle?: '' | 'normal' | 'italic' | 'oblique';
        backgroundColor?: string;
        shadow?: string;
      } = 'اكتب نصك هنا',
  secondaryOptions: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fill?: string;
    fontStyle?: '' | 'normal' | 'italic' | 'oblique';
    backgroundColor?: string;
    shadow?: string;
  } = {}
) => {
  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();

  let textString = 'اكتب نصك هنا';
  let opts: any = {};

  if (typeof textOrOptions === 'string') {
    textString = textOrOptions;
    opts = secondaryOptions || {};
  } else if (typeof textOrOptions === 'object' && textOrOptions !== null) {
    textString = textOrOptions.text || 'اكتب نصك هنا';
    opts = textOrOptions;
  }

  // Automatic contrast fallback if fill not explicitly provided or white text on white canvas
  let textColor = opts.fill;
  if (!textColor) {
    textColor = getDefaultContrastingColor(canvas);
  } else if (
    textColor.toLowerCase() === '#ffffff' &&
    (canvas.backgroundColor === '#FFFFFF' || canvas.backgroundColor === 'white' || !canvas.backgroundColor)
  ) {
    textColor = '#0F172A';
  }

  const fontSize = opts.fontSize || Math.min(Math.round(cWidth * 0.05), 48);

  const textbox = new fabric.Textbox(textString, {
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    fontFamily: opts.fontFamily || 'Cairo',
    fontSize,
    fontWeight: opts.fontWeight || 700,
    fill: textColor,
    textAlign: 'center',
    lineHeight: 1.2,
    styles: {},
    textBackgroundColor: opts.backgroundColor || '',
    splitByGrapheme: false,
    width: Math.min(cWidth * 0.8, 600)
  });

  if (opts.shadow) {
    textbox.set(
      'shadow',
      new fabric.Shadow({
        color: 'rgba(2, 132, 199, 0.4)',
        blur: 12,
        offsetX: 0,
        offsetY: 2
      })
    );
  }

  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  canvas.renderAll();
  return textbox;
};

// Icon Creator
export const addIconToCanvas = (
  canvas: fabric.Canvas,
  iconName: string,
  color: string = '#0284C7'
) => {
  if (!canvas || !iconName) return;
  const svgStr = SVG_ICON_STRINGS[iconName] || getFallbackSvgForIcon(iconName, color);
  if (!svgStr) return;

  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();
  const targetScale = Math.max(0.5, Math.min(cWidth / 500, 2.5));

  try {
    fabric.loadSVGFromString(svgStr, (objects, options) => {
      if (!objects || !Array.isArray(objects) || objects.length === 0) return;

      try {
        const loadedObject = (fabric.util as any).groupSVGElements(objects, options);
        if (!loadedObject) return;

        (loadedObject as any).set({
          left: center.left,
          top: center.top,
          originX: 'center',
          originY: 'center',
          scaleX: targetScale,
          scaleY: targetScale
        });

        // Update color for paths inside group safely
        if ('getObjects' in loadedObject && typeof (loadedObject as any).getObjects === 'function') {
          const children = (loadedObject as any).getObjects();
          if (Array.isArray(children)) {
            children.forEach((child: any) => {
              if (child && child.set) {
                if (child.stroke && child.stroke !== 'none') {
                  child.set('stroke', color);
                }
                if (child.fill && child.fill !== 'none' && child.fill !== '') {
                  child.set('fill', color);
                }
              }
            });
          }
        } else if ((loadedObject as any).set) {
          if ((loadedObject as any).stroke) (loadedObject as any).set({ stroke: color });
        }

        canvas.add(loadedObject);
        canvas.setActiveObject(loadedObject);
        canvas.renderAll();
      } catch (err) {
        console.error('Error grouping SVG icon elements:', err);
      }
    });
  } catch (err) {
    console.error('Error loading SVG icon string:', err);
  }
};

// Recursively apply fill/stroke color to an object and its group children (for SVG icons)
export const applyColorToObject = (
  obj: fabric.Object | null | undefined,
  colors: { fill?: string; stroke?: string }
) => {
  if (!obj) return;
  const anyObj = obj as any;
  if (colors.fill !== undefined && ('fill' in anyObj)) anyObj.set('fill', colors.fill);
  if (colors.stroke !== undefined && ('stroke' in anyObj)) anyObj.set('stroke', colors.stroke);
  applyColorToGroupChildren(obj, colors);
};

// Apply colors only to the child paths inside a group (recursively)
export const applyColorToGroupChildren = (
  obj: fabric.Object | null | undefined,
  colors: { fill?: string; stroke?: string }
) => {
  if (!obj) return;
  const anyObj = obj as any;

  if (typeof anyObj.getObjects === 'function') {
    const children = anyObj.getObjects();
    if (Array.isArray(children)) {
      children.forEach((child: any) => applyColorToObject(child, colors));
    }
    try { anyObj.dirty = true; } catch { /* noop */ }
    return;
  }

  if (colors.fill !== undefined) {
    const currentFill = anyObj.fill;
    if (currentFill && currentFill !== 'none' && currentFill !== '') {
      anyObj.set('fill', colors.fill);
    }
  }
  if (colors.stroke !== undefined) {
    const currentStroke = anyObj.stroke;
    if (currentStroke && currentStroke !== 'none' && currentStroke !== '') {
      anyObj.set('stroke', colors.stroke);
      if (!anyObj.strokeWidth) anyObj.set('strokeWidth', 1);
    }
  }
};

// Image Adder with automatic scaling & robust CORS fallback
export const addImageToCanvas = (
  canvas: fabric.Canvas,
  url: string,
  options: { maxWidth?: number; maxHeight?: number } = {}
) => {
  if (!canvas || !url) return;

  const imgElement = new Image();
  // Only set crossOrigin for external http/https URLs to prevent WebKit/Safari SyntaxError/CORS issues on data/blob URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    imgElement.crossOrigin = 'anonymous';
  }

  imgElement.onload = () => {
    try {
      const center = canvas.getCenter();
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      const maxWidth = options.maxWidth || canvasWidth * 0.7;
      const maxHeight = options.maxHeight || canvasHeight * 0.7;

      let scale = 1;
      const imgWidth = imgElement.naturalWidth || imgElement.width || 400;
      const imgHeight = imgElement.naturalHeight || imgElement.height || 400;

      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      }
      if (isNaN(scale) || scale <= 0) scale = 1;

      const fabricImage = new fabric.Image(imgElement, {
        left: center.left,
        top: center.top,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        cornerColor: '#0284C7',
        borderColor: '#38BDF8',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.2)',
          blur: 14,
          offsetX: 0,
          offsetY: 4
        })
      });
      (fabricImage as any)._originalSrc = url;

      canvas.add(fabricImage);
      canvas.setActiveObject(fabricImage);
      canvas.renderAll();
    } catch (err) {
      console.error('Error adding image to canvas:', err);
    }
  };

  imgElement.onerror = (err) => {
    console.warn('Image load error, rendering fallback placeholder:', err);
    try {
      const center = canvas.getCenter();
      const rect = new fabric.Rect({
        left: center.left,
        top: center.top,
        originX: 'center',
        originY: 'center',
        width: 260,
        height: 180,
        fill: '#E2E8F0',
        stroke: '#94A3B8',
        strokeWidth: 2,
        rx: 12,
        ry: 12
      });
      const label = new fabric.Text('صورة توضيحية', {
        left: center.left,
        top: center.top,
        originX: 'center',
        originY: 'center',
        fontSize: 18,
        fill: '#475569',
        fontFamily: 'Cairo'
      });
      const group = new fabric.Group([rect, label], {
        left: center.left,
        top: center.top,
        originX: 'center',
        originY: 'center'
      });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
    } catch (e) {
      console.error('Error adding image fallback:', e);
    }
  };

  imgElement.src = url;
};

// Layer Ordering
export const bringForward = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (active) {
    canvas.bringForward(active);
    canvas.renderAll();
  }
};

export const sendBackwards = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (active) {
    canvas.sendBackwards(active);
    canvas.renderAll();
  }
};

export const bringToFront = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (active) {
    canvas.bringToFront(active);
    canvas.renderAll();
  }
};

export const sendToBack = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (active) {
    canvas.sendToBack(active);
    canvas.renderAll();
  }
};

// Alignment Helpers
export const alignObject = (
  canvas: fabric.Canvas,
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
) => {
  const active = canvas.getActiveObject();
  if (!active) return;

  const bound = active.getBoundingRect(true, true);
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  switch (alignment) {
    case 'left':
      active.set('left', (active.left || 0) - bound.left + 20);
      break;
    case 'center':
      active.centerH();
      break;
    case 'right':
      active.set('left', (active.left || 0) + (canvasWidth - bound.left - bound.width) - 20);
      break;
    case 'top':
      active.set('top', (active.top || 0) - bound.top + 20);
      break;
    case 'middle':
      active.centerV();
      break;
    case 'bottom':
      active.set('top', (active.top || 0) + (canvasHeight - bound.top - bound.height) - 20);
      break;
  }
  active.setCoords();
  canvas.renderAll();
};

// Duplicate Active Object
export const duplicateActiveObject = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (!active) return;

  active.clone((cloned: fabric.Object) => {
    canvas.discardActiveObject();
    cloned.set({
      left: (cloned.left || 0) + 30,
      top: (cloned.top || 0) + 30,
      evented: true
    });
    if (cloned.type === 'activeSelection') {
      (cloned as any).canvas = canvas;
      (cloned as any).forEachObject((obj: fabric.Object) => {
        canvas.add(obj);
      });
      cloned.setCoords();
    } else {
      canvas.add(cloned);
    }
    canvas.setActiveObject(cloned);
    canvas.renderAll();
  });
};

// Delete Active Object
export const deleteActiveObject = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (!active) return;

  if (active.type === 'activeSelection') {
    (active as any).forEachObject((obj: fabric.Object) => {
      canvas.remove(obj);
    });
    canvas.discardActiveObject();
  } else {
    canvas.remove(active);
  }
  canvas.renderAll();
};

// Apply custom selective corner clipping and edge masking to an Image
export const applyImageClipPathAndEdges = (
  img: fabric.Image | fabric.Object,
  options: {
    clipCornerTL?: number;
    clipCornerTR?: number;
    clipCornerBR?: number;
    clipCornerBL?: number;
    cropTop?: number;
    cropBottom?: number;
    cropLeft?: number;
    cropRight?: number;
  } = {}
) => {
  if (!img) return;
  const origW = img.width || 400;
  const origH = img.height || 400;

  if (!origW || !origH || isNaN(origW) || isNaN(origH) || origW <= 0 || origH <= 0) {
    (img as any).set('clipPath', undefined);
    return;
  }

  const minX = -origW / 2;
  const maxX = origW / 2;
  const minY = -origH / 2;
  const maxY = origH / 2;

  // Max edge cut is 48% of dimension to preserve non-empty visible area
  const insetTop = Math.max(0, Math.min(origH * 0.48, options.cropTop ?? (img as any).cropTop ?? 0));
  const insetBottom = Math.max(0, Math.min(origH * 0.48, options.cropBottom ?? (img as any).cropBottom ?? 0));
  const insetLeft = Math.max(0, Math.min(origW * 0.48, options.cropLeft ?? (img as any).cropLeft ?? 0));
  const insetRight = Math.max(0, Math.min(origW * 0.48, options.cropRight ?? (img as any).cropRight ?? 0));

  const left = minX + insetLeft;
  const right = maxX - insetRight;
  const top = minY + insetTop;
  const bottom = maxY - insetBottom;
  const boxW = Math.max(2, right - left);
  const boxH = Math.max(2, bottom - top);
  const maxRadius = Math.min(boxW / 2, boxH / 2);

  const rawTL = options.clipCornerTL ?? (img as any).clipCornerTL ?? 0;
  const rawTR = options.clipCornerTR ?? (img as any).clipCornerTR ?? 0;
  const rawBR = options.clipCornerBR ?? (img as any).clipCornerBR ?? 0;
  const rawBL = options.clipCornerBL ?? (img as any).clipCornerBL ?? 0;

  const rTL = Math.max(0, Math.min(maxRadius, rawTL));
  const rTR = Math.max(0, Math.min(maxRadius, rawTR));
  const rBR = Math.max(0, Math.min(maxRadius, rawBR));
  const rBL = Math.max(0, Math.min(maxRadius, rawBL));

  // Store properties on the object for serialization & UI state
  (img as any).clipCornerTL = rTL;
  (img as any).clipCornerTR = rTR;
  (img as any).clipCornerBR = rBR;
  (img as any).clipCornerBL = rBL;
  (img as any).cropTop = insetTop;
  (img as any).cropBottom = insetBottom;
  (img as any).cropLeft = insetLeft;
  (img as any).cropRight = insetRight;

  if (insetTop === 0 && insetBottom === 0 && insetLeft === 0 && insetRight === 0 && rTL === 0 && rTR === 0 && rBR === 0 && rBL === 0) {
    (img as any).set('clipPath', undefined);
    return;
  }

  // Construct smooth SVG path for selective corner rounding and edge trimming
  const pathString = [
    'M', left + rTL, top,
    'L', right - rTR, top,
    'Q', right, top, right, top + rTR,
    'L', right, bottom - rBR,
    'Q', right, bottom, right - rBR, bottom,
    'L', left + rBL, bottom,
    'Q', left, bottom, left, bottom - rBL,
    'L', left, top + rTL,
    'Q', left, top, left + rTL, top,
    'Z'
  ].join(' ');

  if (!pathString || pathString.includes('NaN') || pathString.includes('undefined')) {
    (img as any).set('clipPath', undefined);
    return;
  }

  try {
    const clipPath = new fabric.Path(pathString, {
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0,
      fill: '#000000',
      strokeWidth: 0
    });
    (img as any).set('clipPath', clipPath);
  } catch (err) {
    console.error('Error creating fabric.Path for clipPath:', err);
    (img as any).set('clipPath', undefined);
  }
};

// Apply soft edge feathering / gradient transparent fade to any edge of an Image
export const applyImageEdgeFade = (
  img: fabric.Image | fabric.Object,
  options: {
    fadeTop?: number;
    fadeBottom?: number;
    fadeLeft?: number;
    fadeRight?: number;
    fadeRadial?: number;
  } | (() => void) = {},
  callback?: () => void
) => {
  if (!img) return;
  const opts = typeof options === 'function' ? {} : options;
  const cb = typeof options === 'function' ? options : callback;

  const fabricImg = img as fabric.Image;
  let originalSrc = (fabricImg as any)._originalSrc;
  if (!originalSrc) {
    originalSrc = fabricImg.getSrc ? fabricImg.getSrc() : (fabricImg.getElement() as HTMLImageElement)?.src;
    (fabricImg as any)._originalSrc = originalSrc;
  }

  (fabricImg as any).fadeTop = opts.fadeTop ?? (fabricImg as any).fadeTop ?? 0;
  (fabricImg as any).fadeBottom = opts.fadeBottom ?? (fabricImg as any).fadeBottom ?? 0;
  (fabricImg as any).fadeLeft = opts.fadeLeft ?? (fabricImg as any).fadeLeft ?? 0;
  (fabricImg as any).fadeRight = opts.fadeRight ?? (fabricImg as any).fadeRight ?? 0;
  (fabricImg as any).fadeRadial = opts.fadeRadial ?? (fabricImg as any).fadeRadial ?? 0;

  const fTop = (fabricImg as any).fadeTop;
  const fBottom = (fabricImg as any).fadeBottom;
  const fLeft = (fabricImg as any).fadeLeft;
  const fRight = (fabricImg as any).fadeRight;
  const fRadial = (fabricImg as any).fadeRadial;

  if (fTop === 0 && fBottom === 0 && fLeft === 0 && fRight === 0 && fRadial === 0) {
    if (originalSrc && fabricImg.getSrc && fabricImg.getSrc() !== originalSrc) {
      try {
        fabricImg.setSrc(originalSrc, () => {
          fabricImg.canvas?.renderAll();
          cb?.();
        });
      } catch (err) {
        console.error('Error resetting image src:', err);
      }
    }
    return;
  }

  const baseImg = new Image();
  if (originalSrc && (originalSrc.startsWith('http://') || originalSrc.startsWith('https://'))) {
    baseImg.crossOrigin = 'anonymous';
  }

  baseImg.onload = () => {
    try {
      const W = baseImg.naturalWidth || baseImg.width || 800;
      const H = baseImg.naturalHeight || baseImg.height || 600;

      if (!W || !H || isNaN(W) || isNaN(H) || W <= 0 || H <= 0) return;

      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = W;
      mainCanvas.height = H;
      const ctx = mainCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(baseImg, 0, 0, W, H);

      // Create alpha mask canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = W;
      maskCanvas.height = H;
      const mCtx = maskCanvas.getContext('2d');
      if (!mCtx) return;

      // Start with solid opaque white mask
      mCtx.fillStyle = '#FFFFFF';
      mCtx.fillRect(0, 0, W, H);

      // Top fade:
      if (fTop > 0) {
        const fadeH = Math.max(2, Math.round((fTop / 100) * (H * 0.48)));
        mCtx.globalCompositeOperation = 'destination-out';
        const grad = mCtx.createLinearGradient(0, 0, 0, fadeH);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, W, fadeH);
      }

      // Bottom fade:
      if (fBottom > 0) {
        const fadeH = Math.max(2, Math.round((fBottom / 100) * (H * 0.48)));
        mCtx.globalCompositeOperation = 'destination-out';
        const grad = mCtx.createLinearGradient(0, H, 0, H - fadeH);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, H - fadeH, W, fadeH);
      }

      // Left fade:
      if (fLeft > 0) {
        const fadeW = Math.max(2, Math.round((fLeft / 100) * (W * 0.48)));
        mCtx.globalCompositeOperation = 'destination-out';
        const grad = mCtx.createLinearGradient(0, 0, fadeW, 0);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, fadeW, H);
      }

      // Right fade:
      if (fRight > 0) {
        const fadeW = Math.max(2, Math.round((fRight / 100) * (W * 0.48)));
        mCtx.globalCompositeOperation = 'destination-out';
        const grad = mCtx.createLinearGradient(W, 0, W - fadeW, 0);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(W - fadeW, 0, fadeW, H);
      }

      // Radial vignette / soft feather
      if (fRadial > 0) {
        mCtx.globalCompositeOperation = 'destination-in';
        const maxR = Math.min(W, H) / 2;
        const innerR = maxR * Math.max(0.02, 1 - (fRadial / 100));
        const radGrad = mCtx.createRadialGradient(W / 2, H / 2, innerR, W / 2, H / 2, maxR);
        radGrad.addColorStop(0, 'rgba(255,255,255,1)');
        radGrad.addColorStop(0.8, 'rgba(255,255,255,0.4)');
        radGrad.addColorStop(1, 'rgba(255,255,255,0)');
        mCtx.fillStyle = radGrad;
        mCtx.fillRect(0, 0, W, H);
      }

      // Apply alpha mask
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);

      const dataUrl = mainCanvas.toDataURL('image/png');
      if (fabricImg.setSrc) {
        fabricImg.setSrc(dataUrl, () => {
          fabricImg.canvas?.renderAll();
          cb?.();
        });
      }
    } catch (err) {
      console.error('Error in applyImageEdgeFade onload:', err);
    }
  };

  if (originalSrc) {
    baseImg.src = originalSrc;
  }
};

// Export Canvas as Image
export const exportCanvasImage = (
  canvas: fabric.Canvas,
  format: 'png' | 'jpeg' | 'webp',
  quality: number = 0.95,
  multiplier: number = 1
): string => {
  try {
    return canvas.toDataURL({
      format: (format as any) === 'jpg' ? 'jpeg' : format,
      quality,
      multiplier,
      enableRetinaScaling: true
    });
  } catch (err) {
    console.error('Error exporting canvas image:', err);
    return '';
  }
};

// Export Canvas as Clean SVG
export const exportCanvasSvg = (canvas: fabric.Canvas): string => {
  try {
    return canvas.toSVG({
      suppressPreamble: false,
      width: canvas.getWidth(),
      height: canvas.getHeight()
    });
  } catch (err) {
    console.error('Error exporting canvas as SVG:', err);
    return '';
  }
};

// Export Canvas as PDF Document
export const exportCanvasPdf = (
  canvas: fabric.Canvas,
  title: string = 'design'
): void => {
  try {
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
      enableRetinaScaling: true
    });
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const orientation = width >= height ? 'landscape' : 'portrait';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - PDF</title>
            <style>
              @page {
                size: ${orientation};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #ffffff;
                width: 100vw;
                height: 100vh;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (err) {
    console.error('Error creating PDF preview:', err);
  }
};

// Apply Modern Text Gradients
export const applyTextGradient = (
  textObj: fabric.Object | fabric.Textbox,
  stops: string[],
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
) => {
  if (!textObj) return;
  const width = (textObj.width || 200) * (textObj.scaleX || 1);
  const height = (textObj.height || 100) * (textObj.scaleY || 1);

  let coords = { x1: 0, y1: 0, x2: width || 200, y2: 0 };
  if (direction === 'vertical') {
    coords = { x1: 0, y1: 0, x2: 0, y2: height || 100 };
  } else if (direction === 'diagonal') {
    coords = { x1: 0, y1: 0, x2: width || 200, y2: height || 100 };
  }

  const gradient = new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pixels',
    coords,
    colorStops: stops.map((c, idx) => ({
      offset: idx / Math.max(1, stops.length - 1),
      color: c
    }))
  });

  textObj.set({ fill: gradient as any });
  (textObj as any)._textGradient = stops;
};

// Apply Curved / Arc Path to Text
export const applyTextCurve = (
  textObj: fabric.Textbox | fabric.Text | fabric.Object,
  curveAmount: number
) => {
  if (!textObj) return;
  (textObj as any).curve = curveAmount;

  if (!curveAmount || Math.abs(curveAmount) < 2) {
    (textObj as any).set('path', undefined);
    return;
  }

  const width = textObj.width || 200;
  const h = (curveAmount / 100) * (width * 0.4);
  const pathStr = `M 0 ${h > 0 ? 0 : -h} Q ${width / 2} ${h > 0 ? h : 0} ${width} ${h > 0 ? 0 : -h}`;
  try {
    const path = new fabric.Path(pathStr, {
      fill: '',
      stroke: '',
      strokeWidth: 0,
      visible: false
    });
    (textObj as any).set('path', path);
  } catch (err) {
    console.warn('Error applying curve path:', err);
  }
};

// LocalStorage Project Management
const STORAGE_KEY = 'designcraft_saved_projects_v1';

export const getSavedProjects = (): ProjectItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_PROJECTS));
      return INITIAL_MOCK_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse saved projects', err);
    return INITIAL_MOCK_PROJECTS;
  }
};

export const saveProjectToStorage = (project: ProjectItem): void => {
  try {
    const projects = getSavedProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = { ...project, updatedAt: Date.now() };
    } else {
      projects.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save project', err);
  }
};

export const deleteProjectFromStorage = (projectId: string): ProjectItem[] => {
  try {
    const projects = getSavedProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return projects;
  } catch (err) {
    console.error('Failed to delete project', err);
    return [];
  }
};

// Add Generic SVG Shape from Catalog
export const addSvgShapeToCanvas = (
  canvas: fabric.Canvas,
  svgPath: string,
  viewBox: string = '0 0 200 200',
  fillColor: string = '#0284C7',
  strokeColor: string = '',
  strokeWidth: number = 0
) => {
  if (!canvas || !svgPath) return;

  const cleanPath = (svgPath || '').trim();
  if (!cleanPath || cleanPath.includes('NaN') || cleanPath.includes('undefined')) return;

  const center = canvas.getCenter();
  const cWidth = canvas.getWidth();
  const targetScale = Math.max(0.5, Math.min(cWidth / 500, 2.2));

  const fillVal = fillColor === 'none' ? 'none' : (fillColor || '#0284C7');
  const strokeVal = strokeColor || 'none';
  const strokeW = strokeWidth || 0;

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox || '0 0 200 200'}" width="200" height="200"><path d="${cleanPath}" fill="${fillVal}" stroke="${strokeVal}" stroke-width="${strokeW}" /></svg>`;

  try {
    fabric.loadSVGFromString(svgString, (objects, options) => {
      if (!objects || !Array.isArray(objects) || objects.length === 0) {
        try {
          const pathObj = new fabric.Path(cleanPath, {
            left: center.left,
            top: center.top,
            originX: 'center',
            originY: 'center',
            fill: fillVal,
            stroke: strokeVal,
            strokeWidth: strokeW,
            scaleX: targetScale,
            scaleY: targetScale
          });
          canvas.add(pathObj);
          canvas.setActiveObject(pathObj);
          canvas.renderAll();
        } catch (pathErr) {
          console.error('Failed to create fabric.Path fallback:', pathErr);
        }
        return;
      }

      try {
        const loadedObject = (fabric.util as any).groupSVGElements(objects, options);
        if (!loadedObject) return;

        (loadedObject as any).set({
          left: center.left,
          top: center.top,
          originX: 'center',
          originY: 'center',
          scaleX: targetScale,
          scaleY: targetScale
        });

        canvas.add(loadedObject);
        canvas.setActiveObject(loadedObject);
        canvas.renderAll();
      } catch (err) {
        console.error('Error grouping SVG shape elements:', err);
      }
    });
  } catch (err) {
    console.error('Error loading SVG shape string:', err);
  }
};

// Set SVG seamless repeating pattern as canvas background
export const setCanvasPatternBackground = (
  canvas: fabric.Canvas,
  patternSourceUrl: string,
  onComplete?: () => void
) => {
  if (!canvas) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const pattern = new fabric.Pattern({
        source: img,
        repeat: 'repeat'
      });
      canvas.setBackgroundColor(pattern as any, () => {
        canvas.renderAll();
        if (onComplete) onComplete();
      });
    } catch (err) {
      console.error('Failed to set canvas pattern background:', err);
    }
  };
  img.onerror = (err) => {
    console.error('Failed to load pattern image:', err);
  };
  img.src = patternSourceUrl;
};

// Set HD Wallpaper Image as canvas background
export const setCanvasWallpaperBackground = (
  canvas: fabric.Canvas,
  imageUrl: string,
  onComplete?: () => void
) => {
  if (!canvas) return;

  try {
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (!img) return;

        const canvasW = canvas.width || 800;
        const canvasH = canvas.height || 600;
        const imgW = img.width || 800;
        const imgH = img.height || 600;

        // Scale image to cover entire canvas
        const scale = Math.max(canvasW / imgW, canvasH / imgH);

        canvas.setBackgroundImage(
          img,
          () => {
            canvas.renderAll();
            if (onComplete) onComplete();
          },
          {
            originX: 'center',
            originY: 'center',
            left: canvasW / 2,
            top: canvasH / 2,
            scaleX: scale,
            scaleY: scale,
            crossOrigin: 'anonymous'
          }
        );
      },
      { crossOrigin: 'anonymous' }
    );
  } catch (err) {
    console.error('Error applying wallpaper background image:', err);
  }
};

// Add interactive Mobile Phone Frame Mockup to canvas
export const addMobilePhoneMockupToCanvas = (
  canvas: fabric.Canvas,
  screenImageUrl?: string
) => {
  if (!canvas) return;

  const center = canvas.getCenter();
  const phoneWidth = 320;
  const phoneHeight = 640;
  const screenW = 296;
  const screenH = 616;

  // Outer phone chassis / bezel
  const chassis = new fabric.Rect({
    left: center.left,
    top: center.top,
    originX: 'center',
    originY: 'center',
    width: phoneWidth,
    height: phoneHeight,
    fill: '#090D16',
    stroke: '#38BDF8',
    strokeWidth: 4,
    rx: 48,
    ry: 48,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.45)',
      blur: 24,
      offsetX: 0,
      offsetY: 12
    })
  });

  // Dynamic island / Camera notch
  const island = new fabric.Rect({
    left: center.left,
    top: center.top - (phoneHeight / 2) + 24,
    originX: 'center',
    originY: 'center',
    width: 90,
    height: 24,
    fill: '#000000',
    rx: 12,
    ry: 12
  });

  const defaultImg = screenImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

  const imgEl = new Image();
  imgEl.crossOrigin = 'anonymous';
  imgEl.onload = () => {
    try {
      const screenImg = new fabric.Image(imgEl, {
        left: center.left,
        top: center.top,
        originX: 'center',
        originY: 'center',
        cornerColor: '#0284C7',
        borderColor: '#38BDF8'
      });

      // Scale image to fit inside screen dimensions
      const scale = Math.max(screenW / (screenImg.width || 300), screenH / (screenImg.height || 600));
      screenImg.scale(scale);

      // Clip image with rounded screen corners
      applyImageClipPathAndEdges(screenImg, {
        clipCornerTL: 38,
        clipCornerTR: 38,
        clipCornerBR: 38,
        clipCornerBL: 38
      });

      // Add chassis, screen image, dynamic island
      canvas.add(chassis);
      canvas.add(screenImg);
      canvas.add(island);
      canvas.setActiveObject(screenImg);
      canvas.renderAll();
    } catch (err) {
      console.error('Failed to assemble phone mockup screen:', err);
    }
  };

  imgEl.onerror = () => {
    const screenRect = new fabric.Rect({
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center',
      width: screenW,
      height: screenH,
      fill: '#1E293B',
      rx: 38,
      ry: 38
    });
    const label = new fabric.Text('📱 شاشة الهاتف\nاضغط هنا لاستبدال الصورة', {
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center',
      fontSize: 18,
      fill: '#94A3B8',
      fontFamily: 'Cairo',
      textAlign: 'center'
    });
    canvas.add(chassis);
    canvas.add(screenRect);
    canvas.add(label);
    canvas.add(island);
    canvas.renderAll();
  };

  imgEl.src = defaultImg;
};


