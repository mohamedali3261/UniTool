import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera, Upload, Download, Loader2, Trash2, ImagePlus, FileDown,
  RotateCw, Copy, Eye, ScanLine, Sparkles, Languages, X, SwitchCamera, Zap, FileArchive,
  Crosshair, ZoomIn,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { cn } from '../lib/utils';
import type { FileHandoff } from '../types/app';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  fileHandoff?: FileHandoff | null;
  onFileHandoffConsumed?: (id: number) => void;
}

type ScanFilter = 'color' | 'gray' | 'bw' | 'enhanced' | 'magic';
type CornerKey = 'tl' | 'tr' | 'br' | 'bl';
type Pt = [number, number];

interface Quad {
  tl: Pt; tr: Pt; br: Pt; bl: Pt;
}

interface ScanPage {
  id: number;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
  filter: ScanFilter;
  brightness: number;
  contrast: number;
  threshold: number;
  autoLevels: boolean;
  denoise: boolean;
  sharpen: number; // 0..100
  shadowRemove: boolean; // flat-field shadow/uneven lighting removal
  deskew: boolean; // straighten text lines after perspective fix
  quad: Quad | null; // null = full frame, normalized in rotated-image space
  sizeBytes: number;
}

const SETTINGS_KEY = 'unitool-scanner-settings-v2';
const FULL_QUAD: Quad = { tl: [0, 0], tr: [1, 0], br: [1, 1], bl: [0, 1] };
const CORNERS: CornerKey[] = ['tl', 'tr', 'br', 'bl'];

const FILTERS: { id: ScanFilter; ar: string; en: string }[] = [
  { id: 'color', ar: 'ملوّن', en: 'Color' },
  { id: 'magic', ar: 'ألوان حية', en: 'Vivid' },
  { id: 'gray', ar: 'رمادي', en: 'Gray' },
  { id: 'bw', ar: 'أبيض/أسود', en: 'B&W Doc' },
  { id: 'enhanced', ar: 'محسّن', en: 'Enhanced' },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ================= image math helpers ================= */

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

/** rotated render of an image (white background), capped at maxDim */
function drawRotated(img: HTMLImageElement, rotDeg: number, maxDim: number): HTMLCanvasElement {
  const rot = ((rotDeg % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const rw = swap ? img.naturalHeight : img.naturalWidth;
  const rh = swap ? img.naturalWidth : img.naturalHeight;
  const s = Math.min(1, maxDim / Math.max(rw, rh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(rw * s));
  c.height = Math.max(1, Math.round(rh * s));
  const nw = img.naturalWidth * s, nh = img.naturalHeight * s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -nw / 2, -nh / 2, nw, nh);
  ctx.restore();
  return c;
}

/** solve homography src(4)->dst(4), returns 3x3 row-major or null */
function solveHomography(src: number[][], dst: number[][]): number[] | null {
  const A: number[][] = [];
  const B: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [xp, yp] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * xp, -y * xp]); B.push(xp);
    A.push([0, 0, 0, x, y, 1, -x * yp, -y * yp]); B.push(yp);
  }
  const n = 8;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-10) return null;
    const tA = A[col]; A[col] = A[piv]; A[piv] = tA;
    const tB = B[col]; B[col] = B[piv]; B[piv] = tB;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let k = col; k < n; k++) A[r][k] -= f * A[col][k];
      B[r] -= f * B[col];
    }
  }
  const h = B.map((v, i) => v / A[i][i]);
  h.push(1);
  return h;
}

function invert3(m: number[]): number[] | null {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, Bc = c * h - b * i, C = b * f - c * e;
  const det = a * A + d * Bc + g * C;
  if (Math.abs(det) < 1e-12) return null;
  return [
    A / det, Bc / det, C / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ];
}

function isFullQuad(q: Quad | null): boolean {
  if (!q) return true;
  const e = 1e-6;
  return Math.abs(q.tl[0]) < e && Math.abs(q.tl[1]) < e &&
    Math.abs(q.tr[0] - 1) < e && Math.abs(q.tr[1]) < e &&
    Math.abs(q.br[0] - 1) < e && Math.abs(q.br[1] - 1) < e &&
    Math.abs(q.bl[0]) < e && Math.abs(q.bl[1] - 1) < e;
}

function quadAreaNorm(q: Quad): number {
  return polyArea([q.tl, q.tr, q.br, q.bl]);
}

/** guards against degenerate quads (collapsed/crossed/tiny) that would distort the warp */
function isValidQuad(q: Quad | null): q is Quad {
  if (!q) return false;
  const pts = [q.tl, q.tr, q.br, q.bl];
  for (const [x, y] of pts) {
    if (!isFinite(x) || !isFinite(y) || x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) return false;
  }
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 0.02) return false;
    }
  }
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 4];
    const [cx, cy] = pts[(i + 2) % 4];
    const cross = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (Math.abs(cross) < 1e-9) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (sign !== s) return false;
  }
  if (sign === 0) return false;
  const area = quadAreaNorm(q);
  return area > 0.03 && area <= 1.0;
}

/** perspective warp of quad region to outW x outH rect (bilinear, white outside) */
function warpQuadToRect(srcCanvas: HTMLCanvasElement, quad: Quad, outW: number, outH: number): HTMLCanvasElement | null {
  const sw = srcCanvas.width, sh = srcCanvas.height;
  const sImg = srcCanvas.getContext('2d')!.getImageData(0, 0, sw, sh);
  const src = [
    [quad.tl[0] * sw, quad.tl[1] * sh],
    [quad.tr[0] * sw, quad.tr[1] * sh],
    [quad.br[0] * sw, quad.br[1] * sh],
    [quad.bl[0] * sw, quad.bl[1] * sh],
  ];
  const dst = [[0, 0], [outW, 0], [outW, outH], [0, outH]];
  const H = solveHomography(src, dst);
  if (!H) return null;
  const Hi = invert3(H);
  if (!Hi) return null;
  const out = document.createElement('canvas');
  out.width = outW; out.height = outH;
  const octx = out.getContext('2d')!;
  const oImg = octx.createImageData(outW, outH);
  const sd = sImg.data, od = oImg.data;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const w = Hi[6] * x + Hi[7] * y + Hi[8];
      const sx = (Hi[0] * x + Hi[1] * y + Hi[2]) / w;
      const sy = (Hi[3] * x + Hi[4] * y + Hi[5]) / w;
      const o = (y * outW + x) * 4;
      if (sx < 0 || sy < 0 || sx > sw - 1 || sy > sh - 1) {
        od[o] = 255; od[o + 1] = 255; od[o + 2] = 255; od[o + 3] = 255;
        continue;
      }
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const fx = sx - x0, fy = sy - y0;
      const x1 = Math.min(x0 + 1, sw - 1), y1 = Math.min(y0 + 1, sh - 1);
      const i00 = (y0 * sw + x0) * 4, i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4, i11 = (y1 * sw + x1) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const v = sd[i00 + ch] * (1 - fx) * (1 - fy) + sd[i10 + ch] * fx * (1 - fy) +
          sd[i01 + ch] * (1 - fx) * fy + sd[i11 + ch] * fx * fy;
        od[o + ch] = v;
      }
      od[o + 3] = 255;
    }
  }
  octx.putImageData(oImg, 0, 0);
  return out;
}

/* ================= pixel filters ================= */

function applyBrightnessContrast(d: Uint8ClampedArray, b: number, c: number) {
  const bo = b * 2.55;
  const cf = (c + 100) / 100;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.max(0, Math.min(255, (d[i] - 128) * cf + 128 + bo));
    d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - 128) * cf + 128 + bo));
    d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - 128) * cf + 128 + bo));
  }
}

function autoLevelsRGB(d: Uint8ClampedArray) {
  let lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 16) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < lo) lo = lum;
    if (lum > hi) hi = lum;
  }
  if (hi - lo < 10) return;
  const range = hi - lo;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = ((d[i] - lo) * 255) / range;
    d[i + 1] = ((d[i + 1] - lo) * 255) / range;
    d[i + 2] = ((d[i + 2] - lo) * 255) / range;
  }
}

function toGrayscaleInPlace(d: Uint8ClampedArray) {
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = lum;
  }
}

/** 3x3 median denoise on luminance */
function median3(d: Uint8ClampedArray, w: number, h: number) {
  const src = new Uint8ClampedArray(d);
  const lumAt = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const vals: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.max(0, Math.min(w - 1, x + dx));
          const yy = Math.max(0, Math.min(h - 1, y + dy));
          vals.push(lumAt(xx, yy));
        }
      }
      vals.sort((a, b2) => a - b2);
      const o = (y * w + x) * 4;
      d[o] = d[o + 1] = d[o + 2] = vals[4];
    }
  }
}

/** Sauvola adaptive binarization (in place, uses integral images) */
function sauvolaBinarize(d: Uint8ClampedArray, w: number, h: number, k: number, win: number) {
  const R = 128;
  const half = Math.floor(win / 2);
  const integral = new Float64Array((w + 1) * (h + 1));
  const integralSq = new Float64Array((w + 1) * (h + 1));
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      gray[y * w + x] = lum;
      const s = lum + integral[y * (w + 1) + x + 1] + integral[(y + 1) * (w + 1) + x] - integral[y * (w + 1) + x];
      integral[(y + 1) * (w + 1) + x + 1] = s;
      const s2 = lum * lum + integralSq[y * (w + 1) + x + 1] + integralSq[(y + 1) * (w + 1) + x] - integralSq[y * (w + 1) + x];
      integralSq[(y + 1) * (w + 1) + x + 1] = s2;
    }
  }
  const rect = (ii: Float64Array, x0: number, y0: number, x1: number, y1: number) =>
    ii[y1 * (w + 1) + x1] - ii[y0 * (w + 1) + x1] - ii[y1 * (w + 1) + x0] + ii[y0 * (w + 1) + x0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half), y0 = Math.max(0, y - half);
      const x1 = Math.min(w, x + half + 1), y1 = Math.min(h, y + half + 1);
      const n = (x1 - x0) * (y1 - y0);
      const mean = rect(integral, x0, y0, x1, y1) / n;
      const sq = rect(integralSq, x0, y0, x1, y1) / n;
      const std = Math.sqrt(Math.max(0, sq - mean * mean));
      const thresh = mean * (1 + k * (std / R - 1));
      const v = gray[y * w + x] > thresh ? 255 : 0;
      const o = (y * w + x) * 4;
      d[o] = d[o + 1] = d[o + 2] = v;
    }
  }
}

/** unsharp mask via box blur */
function unsharp(d: Uint8ClampedArray, w: number, h: number, amount: number) {
  if (amount <= 0.01) return;
  const src = new Uint8ClampedArray(d);
  const idx = (x: number, y: number) => (Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))) * 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += src[idx(x + dx, y + dy) + ch];
        const blur = sum / 9;
        d[o + ch] = Math.max(0, Math.min(255, src[o + ch] + amount * (src[o + ch] - blur)));
      }
    }
  }
}

/**
 * Flat-field shadow / uneven-lighting removal.
 * Estimates a smooth background illumination field (heavy box blur of a
 * downscaled copy), then divides every pixel by it — dark corners and phone
 * shadows across the page lift back to paper-white like a real scanner.
 */
function flatFieldShadowRemove(d: Uint8ClampedArray, w: number, h: number) {
  try {
    const S = 96; // illumination field resolution
    const sw = Math.max(8, Math.round((w * S) / Math.max(w, h)));
    const sh = Math.max(8, Math.round((h * S) / Math.max(w, h)));
    // blurred average illumination per channel on a tiny canvas
    const tiny = document.createElement('canvas');
    tiny.width = sw; tiny.height = sh;
    const tctx = tiny.getContext('2d')!;
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.putImageData(new ImageData(new Uint8ClampedArray(d), w, h), 0, 0);
    tctx.drawImage(tmp, 0, 0, sw, sh);
    let field = tctx.getImageData(0, 0, sw, sh).data;
    // extra box blur passes on the tiny field for extra smoothness
    const blurTiny = (fd: Uint8ClampedArray) => {
      const out = new Uint8ClampedArray(fd.length);
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          for (let ch = 0; ch < 3; ch++) {
            let s = 0, n = 0;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
              const xx = x + dx, yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= sw || yy >= sh) continue;
              s += fd[(yy * sw + xx) * 4 + ch]; n++;
            }
            out[(y * sw + x) * 4 + ch] = s / n;
          }
          out[(y * sw + x) * 4 + 3] = 255;
        }
      }
      return out;
    };
    field = blurTiny(field);
    field = blurTiny(field);
    // sample field bilinearly and divide
    for (let y = 0; y < h; y++) {
      const fy = (y / h) * (sh - 1);
      const y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1);
      const wy = fy - y0;
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * (sw - 1);
        const x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1);
        const wx = fx - x0;
        const o = (y * w + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const f00 = field[(y0 * sw + x0) * 4 + ch], f10 = field[(y0 * sw + x1) * 4 + ch];
          const f01 = field[(y1 * sw + x0) * 4 + ch], f11 = field[(y1 * sw + x1) * 4 + ch];
          const bg = Math.max(20, f00 * (1 - wx) * (1 - wy) + f10 * wx * (1 - wy) + f01 * (1 - wx) * wy + f11 * wx * wy);
          d[o + ch] = (d[o + ch] / bg) * 244; // normalize paper to near-white
        }
      }
    }
  } catch { /* skip on failure */ }
}

/** per-channel percentage contrast stretch + saturation boost (vivid scan look) */
function applyVividColor(d: Uint8ClampedArray) {
  const hist: Uint32Array[] = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  for (let i = 0; i < d.length; i += 4) {
    hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++;
  }
  const total = d.length / 4;
  const cut = Math.max(8, total * 0.02);
  const lo = [0, 0, 0], hi = [255, 255, 255];
  for (let c = 0; c < 3; c++) {
    let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[c][v]; if (acc > cut) { lo[c] = v; break; } }
    acc = 0;
    for (let v = 255; v >= 0; v--) { acc += hist[c][v]; if (acc > cut) { hi[c] = v; break; } }
    if (hi[c] - lo[c] < 24) { lo[c] = 0; hi[c] = 255; }
  }
  const sat = 1.35;
  for (let i = 0; i < d.length; i += 4) {
    const r0 = Math.max(0, Math.min(255, ((d[i] - lo[0]) * 255) / (hi[0] - lo[0])));
    const g0 = Math.max(0, Math.min(255, ((d[i + 1] - lo[1]) * 255) / (hi[1] - lo[1])));
    const b0 = Math.max(0, Math.min(255, ((d[i + 2] - lo[2]) * 255) / (hi[2] - lo[2])));
    const lum = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
    d[i] = lum + (r0 - lum) * sat;
    d[i + 1] = lum + (g0 - lum) * sat;
    d[i + 2] = lum + (b0 - lum) * sat;
  }
}

/* ================= auto document detection ================= */

function grayOf(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    g[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return g;
}

function boxBlur(g: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= w) continue;
        s += g[y * w + xx]; n++;
      }
      tmp[y * w + x] = s / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        s += tmp[yy * w + x]; n++;
      }
      out[y * w + x] = s / n;
    }
  }
  return out;
}

function sobelNorm(g: Float32Array, w: number, h: number): Uint8ClampedArray {
  const mag = new Float32Array(w * h);
  let max = 1;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx = -g[(y - 1) * w + x - 1] - 2 * g[y * w + x - 1] - g[(y + 1) * w + x - 1] +
        g[(y - 1) * w + x + 1] + 2 * g[y * w + x + 1] + g[(y + 1) * w + x + 1];
      const gy = -g[(y - 1) * w + x - 1] - 2 * g[(y - 1) * w + x] - g[(y - 1) * w + x + 1] +
        g[(y + 1) * w + x - 1] + 2 * g[(y + 1) * w + x] + g[(y + 1) * w + x + 1];
      const m = Math.abs(gx) + Math.abs(gy);
      mag[y * w + x] = m;
      if (m > max) max = m;
    }
  }
  const out = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) out[i] = (mag[i] * 255) / max;
  return out;
}

function otsuThreshold(vals: Uint8ClampedArray): number {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < vals.length; i++) hist[vals[i]]++;
  const total = vals.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thresh = 127;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) { best = between; thresh = i; }
  }
  return thresh;
}

function dilate(bin: Uint8Array, w: number, h: number, iters: number): Uint8Array {
  let cur = bin;
  for (let t = 0; t < iters; t++) {
    const nxt = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let dy = -1; dy <= 1 && !v; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            if (cur[yy * w + xx]) { v = 1; break; }
          }
        }
        nxt[y * w + x] = v;
      }
    }
    cur = nxt;
  }
  return cur;
}

/** largest connected component (union-find), returns flat [x,y,...] */
function largestComponent(bin: Uint8Array, w: number, h: number): number[] | null {
  const parent = new Int32Array(w * h).fill(-1);
  const find = (a: number): number => {
    let r = a;
    while (parent[r] !== r) r = parent[r];
    while (parent[a] !== r) { const n = parent[a]; parent[a] = r; a = n; }
    return r;
  };
  const union = (a: number, b: number) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < w * h; i++) if (bin[i]) parent[i] = i;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!bin[i]) continue;
      if (x > 0 && bin[i - 1]) union(i, i - 1);
      if (y > 0 && bin[i - w]) union(i, i - w);
    }
  }
  const counts = new Map<number, number>();
  for (let i = 0; i < w * h; i++) {
    if (!bin[i]) continue;
    const r = find(i);
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  let best = -1, bestN = 0;
  counts.forEach((n, r) => { if (n > bestN) { bestN = n; best = r; } });
  if (bestN < 200) return null;
  const pts: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (bin[i] && find(i) === best) { pts.push(x, y); }
    }
  }
  return pts;
}

function convexHull(flat: number[]): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const dd = perpDist(pts[i], pts[a], pts[b]);
      if (dd > maxD) { maxD = dd; idx = i; }
    }
    if (maxD > eps && idx > 0) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function polyArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function orderCorners(pts: Pt[]): Quad {
  let tl = pts[0], br = pts[0], tr = pts[0], bl = pts[0];
  for (const p of pts) {
    if (p[0] + p[1] < tl[0] + tl[1]) tl = p;
    if (p[0] + p[1] > br[0] + br[1]) br = p;
    if (p[0] - p[1] > tr[0] - tr[1]) tr = p;
    if (p[0] - p[1] < bl[0] - bl[1]) bl = p;
  }
  return { tl, tr, br, bl };
}

/** best-effort document quad detection on a canvas; normalized coords or null */
function detectDocumentQuad(srcCanvas: HTMLCanvasElement): { quad: Quad; confidence: number } | null {
  try {
    const MAXD = 500;
    const s = Math.min(1, MAXD / Math.max(srcCanvas.width, srcCanvas.height));
    const w = Math.max(60, Math.round(srcCanvas.width * s));
    const h = Math.max(60, Math.round(srcCanvas.height * s));
    const small = document.createElement('canvas');
    small.width = w; small.height = h;
    const sctx = small.getContext('2d')!;
    sctx.drawImage(srcCanvas, 0, 0, w, h);
    const data = sctx.getImageData(0, 0, w, h).data;
    const grayBase = grayOf(data, w, h);
    // multiple attempts: clean shots first, then stronger connect + lower threshold
    const paramSets = [
      { blur: 2, dilateIters: 2, tScale: 1 },
      { blur: 3, dilateIters: 3, tScale: 0.7 },
      { blur: 2, dilateIters: 4, tScale: 0.55 },
    ];
    for (const ps of paramSets) {
      const found = tryDetectOnce(grayBase, w, h, ps);
      if (found) return found;
    }
    return null;
  } catch {
    return null;
  }
}

/** single detection attempt with given blur/dilate/threshold params */
function tryDetectOnce(
  grayBase: Float32Array, w: number, h: number,
  ps: { blur: number; dilateIters: number; tScale: number },
): { quad: Quad; confidence: number } | null {
  try {
    const gray = boxBlur(grayBase, w, h, ps.blur);
    const mag = sobelNorm(gray, w, h);
    const t = otsuThreshold(mag) * ps.tScale;
    let bin = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) bin[i] = mag[i] > t ? 1 : 0;
    bin = dilate(bin, w, h, ps.dilateIters);
    const comp = largestComponent(bin, w, h);
    if (!comp) return null;
    const hull = convexHull(comp);
    if (hull.length < 4) return null;
    let peri = 0;
    for (let i = 0; i < hull.length; i++) {
      const [x1, y1] = hull[i];
      const [x2, y2] = hull[(i + 1) % hull.length];
      peri += Math.hypot(x2 - x1, y2 - y1);
    }
    let quadPts: Pt[] | null = null;
    let eps = 0.015 * peri;
    for (let attempt = 0; attempt < 5; attempt++) {
      const closed = [...hull, hull[0]];
      const simp = rdp(closed, eps);
      const uniq = simp.length > 1 ? simp.slice(0, -1) : simp;
      if (uniq.length === 4) { quadPts = uniq; break; }
      eps *= 1.6;
    }
    if (!quadPts) return null;
    const ordered = orderCorners(quadPts);
    const norm = (p: Pt): Pt => [clamp01(p[0] / w), clamp01(p[1] / h)];
    const quad: Quad = { tl: norm(ordered.tl), tr: norm(ordered.tr), br: norm(ordered.br), bl: norm(ordered.bl) };
    if (!isValidQuad(quad)) return null;
    const confidence = polyArea(quadPts) / (w * h);
    if (confidence < 0.1) return null;
    // note: >0.97 (sheet fills the frame) is returned so the caller can inform the user
    return { quad, confidence };
  } catch {
    return null;
  }
}

/* ================= OCR helpers ================= */

/**
 * Snap each quad corner to the strongest nearby edge (precision refinement).
 * Searches a small window around every corner on the edge-magnitude map.
 * Returns the refined quad, or null when snapping is unsafe.
 */
function snapQuadToEdges(rotCanvas: HTMLCanvasElement, quad: Quad): Quad | null {
  try {
    const MAXW = 800;
    const s = Math.min(1, MAXW / Math.max(rotCanvas.width, rotCanvas.height));
    const w = Math.max(80, Math.round(rotCanvas.width * s));
    const h = Math.max(80, Math.round(rotCanvas.height * s));
    const small = document.createElement('canvas');
    small.width = w; small.height = h;
    const ctx = small.getContext('2d')!;
    ctx.drawImage(rotCanvas, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const g = boxBlur(grayOf(d, w, h), w, h, 2);
    const mag = sobelNorm(g, w, h);
    const R = Math.max(10, Math.round(Math.min(w, h) * 0.05));
    const out: Quad = {
      tl: [...quad.tl] as Pt, tr: [...quad.tr] as Pt,
      br: [...quad.br] as Pt, bl: [...quad.bl] as Pt,
    };
    (Object.keys(out) as CornerKey[]).forEach(k => {
      const cx = Math.round(out[k][0] * w), cy = Math.round(out[k][1] * h);
      let bx = cx, by = cy, best = -1;
      for (let y = Math.max(0, cy - R); y <= Math.min(h - 1, cy + R); y++) {
        for (let x = Math.max(0, cx - R); x <= Math.min(w - 1, cx + R); x++) {
          const m = mag[y * w + x];
          if (m > best) { best = m; bx = x; by = y; }
        }
      }
      if (best > 30) out[k] = [clamp01(bx / w), clamp01(by / h)];
    });
    return isValidQuad(out) ? out : null;
  } catch {
    return null;
  }
}

function buzz(ms: number) {
  try { (navigator as any).vibrate?.(ms); } catch { /* unsupported */ }
}

const CORNER_LABEL: Record<CornerKey, { ar: string; en: string }> = {
  tl: { ar: 'أعلى-يسار', en: 'Top-Left' },
  tr: { ar: 'أعلى-يمين', en: 'Top-Right' },
  br: { ar: 'أسفل-يمين', en: 'Bottom-Right' },
  bl: { ar: 'أسفل-يسار', en: 'Bottom-Left' },
};

/** estimate skew angle (degrees) from binary-ish canvas */
function detectSkewAngle(canvas: HTMLCanvasElement): number {
  const w = 400;
  const h = Math.max(40, Math.round((canvas.height * w) / canvas.width));
  const small = document.createElement('canvas');
  small.width = w; small.height = h;
  small.getContext('2d')!.drawImage(canvas, 0, 0, w, h);
  const d = small.getContext('2d')!.getImageData(0, 0, w, h).data;
  const xs: number[] = [], ys: number[] = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum < 128) { xs.push(x - w / 2); ys.push(y - h / 2); }
    }
  }
  if (xs.length < 500) return 0;
  let bestA = 0, bestV = -1;
  for (let deg = -6; deg <= 6; deg += 0.5) {
    const rad = (deg * Math.PI) / 180;
    const sn = Math.sin(rad), cs = Math.cos(rad);
    const diag = Math.ceil(Math.abs(w * sn) + Math.abs(h * cs)) + 4;
    const rows = new Float64Array(diag * 2);
    const off = diag;
    for (let i = 0; i < xs.length; i++) {
      const ry = Math.round(xs[i] * sn + ys[i] * cs) + off;
      if (ry >= 0 && ry < rows.length) rows[ry]++;
    }
    let mean = 0;
    for (let i = 0; i < rows.length; i++) mean += rows[i];
    mean /= rows.length;
    let v = 0;
    for (let i = 0; i < rows.length; i++) v += (rows[i] - mean) * (rows[i] - mean);
    if (v > bestV) { bestV = v; bestA = deg; }
  }
  return Math.abs(bestA) < 0.25 ? 0 : bestA;
}

function rotateCanvas(canvas: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  if (!deg) return canvas;
  const rad = (deg * Math.PI) / 180;
  const w = canvas.width, h = canvas.height;
  const nw = Math.ceil(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)));
  const nh = Math.ceil(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)));
  const out = document.createElement('canvas');
  out.width = nw; out.height = nh;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, nw, nh);
  ctx.translate(nw / 2, nh / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -w / 2, -h / 2);
  return out;
}

/* ================= component ================= */

export function DocumentScanner({ lang, fileHandoff, onFileHandoffConsumed }: Props) {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // camera
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [camError, setCamError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchOk, setTorchOk] = useState(false);
  const [burstMode, setBurstMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // export settings
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [quality, setQuality] = useState(0.92);
  const [exportScale, setExportScale] = useState<1500 | 2000 | 3000>(2000);
  const [fileName, setFileName] = useState('scan');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pageNumbers, setPageNumbers] = useState(true);

  // ocr
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrText, setOcrText] = useState<Record<number, string>>({});
  const [ocrLang, setOcrLang] = useState<'ara+eng' | 'ara' | 'eng'>('ara+eng');
  const [ocrPsm, setOcrPsm] = useState<'3' | '4' | '6'>('6');

  // perspective editor
  const [editorImgUrl, setEditorImgUrl] = useState<string | null>(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [detecting, setDetecting] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [detectInfo, setDetectInfo] = useState<string | null>(null);
  const [loupeKey, setLoupeKey] = useState<CornerKey | null>(null);
  const [nudgeStep, setNudgeStep] = useState<'fine' | 'fast'>('fine');
  const wrapRef = useRef<HTMLDivElement>(null);
  const rotatedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const quadHistory = useRef<(Quad | null)[]>([]);
  const cornerDrag = useRef<{ key: CornerKey; lastX: number; lastY: number } | null>(null);

  const idRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastHandoffId = useRef<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'capture' | 'pages' | 'edit' | 'export'>('capture');
  const [detectingAll, setDetectingAll] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [imgFormat, setImgFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [ocrProgress, setOcrProgress] = useState<{ done: number; total: number } | null>(null);

  const selected = pages.find(p => p.id === selectedId) ?? null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.pageSize) setPageSize(s.pageSize);
        if (typeof s.quality === 'number') setQuality(s.quality);
        if (s.exportScale) setExportScale(s.exportScale);
        if (s.fileName) setFileName(s.fileName);
        if (typeof s.pageNumbers === 'boolean') setPageNumbers(s.pageNumbers);
        if (s.ocrPsm) setOcrPsm(s.ocrPsm);
        if (s.imgFormat) setImgFormat(s.imgFormat);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ pageSize, quality, exportScale, fileName, pageNumbers, ocrPsm, imgFormat }));
  }, [pageSize, quality, exportScale, fileName, pageNumbers, ocrPsm]);
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  /* ---------- camera ---------- */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(tr => tr.stop());
    streamRef.current = null;
    setCameraOn(false);
    setTorchOn(false);
    setTorchOk(false);
  }, []);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setCamError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 2560 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      // torch (flashlight) support check — great for documents in dim light
      try {
        const track = stream.getVideoTracks()[0];
        const caps: any = track?.getCapabilities?.() ?? {};
        setTorchOk(!!caps.torch);
      } catch { setTorchOk(false); }
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCamError(lang === 'ar' ? 'تعذر فتح الكاميرا — تأكد من الصلاحيات و HTTPS' : 'Cannot open camera — check permission & HTTPS');
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as any);
      setTorchOn(t => !t);
    } catch {
      setCamError(lang === 'ar' ? 'الفلاش غير مدعوم على الجهاز ده' : 'Flash not supported on this device');
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn, mobileTab]);

  /* ---------- import ---------- */
  const loadImageFile = (file: File): Promise<{ name: string; dataUrl: string; width: number; height: number; sizeBytes: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve({
          name: file.name.replace(/\.[^.]+$/, '') || `scan_${Date.now()}`,
          dataUrl: reader.result as string,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          sizeBytes: file.size,
        });
        img.onerror = () => reject(new Error('bad'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('read'));
      reader.readAsDataURL(file);
    });
  };

  const importFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|avif)$/i.test(f.name));
    if (valid.length === 0) {
      setError(lang === 'ar' ? 'لا توجد صور صالحة' : 'No valid images');
      return;
    }
    if (pages.length + valid.length > 200) {
      setError(lang === 'ar' ? 'الحد الأقصى 200 صفحة' : 'Max 200 pages');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const fresh: ScanPage[] = [];
      for (const f of valid.slice(0, 200 - pages.length)) {
        try {
          const base = await loadImageFile(f);
          fresh.push({
            ...base, id: idRef.current++, rotation: 0, filter: 'magic',
            brightness: 0, contrast: 0, threshold: 128, autoLevels: true,
            denoise: true, sharpen: 25, shadowRemove: true, deskew: true, quad: null,
          });
        } catch { /* skip */ }
      }
      if (fresh.length) {
        setPages(prev => [...prev, ...fresh]);
        setSelectedId(fresh[0].id);
        setMobileTab('pages');
        // background auto-crop on import — scanner behaviour
        void autoDetectForPages(fresh);
      }
    } finally {
      setLoading(false);
    }
  }, [lang, pages.length]);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void importFiles(Array.from(e.target.files));
    e.target.value = '';
  }, [importFiles]);

  useEffect(() => {
    if (!fileHandoff || lastHandoffId.current === fileHandoff.id) return;
    lastHandoffId.current = fileHandoff.id;
    void importFiles(fileHandoff.files).then(() => onFileHandoffConsumed?.(fileHandoff.id));
  }, [fileHandoff, importFiles, onFileHandoffConsumed]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      e.clipboardData?.items && Array.from(e.clipboardData.items).forEach(it => {
        if (it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) files.push(f); }
      });
      if (files.length) void importFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [importFiles]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraOn) return;
    setCapturing(true);
    try {
      const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = vw; canvas.height = vh;
      canvas.getContext('2d')!.drawImage(video, 0, 0, vw, vh);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const page: ScanPage = {
        id: idRef.current++, name: `scan_${new Date().toLocaleTimeString().replace(/:/g, '-')}`,
        dataUrl, width: vw, height: vh, rotation: 0, filter: 'magic',
        brightness: 0, contrast: 0, threshold: 128, autoLevels: true,
        denoise: true, sharpen: 25, shadowRemove: true, deskew: true, quad: null,
        sizeBytes: Math.round(dataUrl.length * 0.75),
      };
      setPages(prev => [...prev, page]);
      if (!burstMode) {
        setSelectedId(page.id);
        setSuccess(lang === 'ar' ? 'تم التقاط الصفحة 📸' : 'Page captured 📸');
      }
      void autoDetectForPages([page]);
    } finally {
      setCapturing(false);
    }
  };

  /* ---------- core render pipeline ---------- */
  const renderScan = useCallback(async (page: ScanPage, maxDim: number): Promise<HTMLCanvasElement> => {
    const img = await loadHtmlImage(page.dataUrl);
    const rotated = drawRotated(img, page.rotation, 3000);
    const rw = rotated.width, rh = rotated.height;
    const q = isValidQuad(page.quad) ? page.quad : FULL_QUAD;
    // destination size from quad edge lengths
    const px = (p: Pt): [number, number] => [p[0] * rw, p[1] * rh];
    const [ax, ay] = px(q.tl); const [bx, by] = px(q.tr);
    const [cx2, cy2] = px(q.br); const [dx2, dy2] = px(q.bl);
    const wTop = Math.hypot(bx - ax, by - ay);
    const wBot = Math.hypot(cx2 - dx2, cy2 - dy2);
    const hLeft = Math.hypot(dx2 - ax, dy2 - ay);
    const hRight = Math.hypot(cx2 - bx, cy2 - by);
    const natW = Math.max(10, Math.round(Math.max(wTop, wBot)));
    const natH = Math.max(10, Math.round(Math.max(hLeft, hRight)));
    const sc = Math.min(1, maxDim / Math.max(natW, natH));
    const outW = Math.max(1, Math.round(natW * sc));
    const outH = Math.max(1, Math.round(natH * sc));

    let canvas: HTMLCanvasElement;
    if (isFullQuad(page.quad)) {
      canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(rotated, 0, 0, outW, outH);
    } else {
      const warped = warpQuadToRect(rotated, q, outW, outH);
      if (!warped) throw new Error('warp failed');
      canvas = warped;
    }

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    // 1) shadow/uneven-lighting removal (flat-field division) FIRST — fixes dark corners & shadows
    if (page.shadowRemove && page.filter !== 'color') flatFieldShadowRemove(d, canvas.width, canvas.height);
    // 2) auto levels re-balance after shadow removal
    if (page.filter !== 'color' && page.autoLevels) autoLevelsRGB(d);
    if (page.brightness !== 0 || page.contrast !== 0) applyBrightnessContrast(d, page.brightness, page.contrast);
    if (page.filter === 'gray' || page.filter === 'bw' || page.filter === 'enhanced') {
      toGrayscaleInPlace(d);
      if (page.denoise) median3(d, canvas.width, canvas.height);
      if (page.filter === 'bw') {
        const k = 0.5 - (page.threshold / 255) * 0.4; // slider -> Sauvola k
        sauvolaBinarize(d, canvas.width, canvas.height, k, 31);
      } else if (page.filter === 'enhanced') {
        // contrast curve + white clipping for clean document look
        for (let i = 0; i < d.length; i += 4) {
          const lum = d[i];
          let v = (lum - 128) * 1.6 + 128 + page.brightness * 0.75;
          if (v > page.threshold + 40) v = 255;
          d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v));
        }
        if (page.sharpen > 0) unsharp(d, canvas.width, canvas.height, (page.sharpen / 100) * 0.8);
      } else {
        if (page.sharpen > 0) unsharp(d, canvas.width, canvas.height, (page.sharpen / 100) * 0.6);
      }
    } else if (page.filter === 'magic') {
      // vivid color mode: saturation/contrast pop while removing yellowish cast
      applyVividColor(d);
      if (page.sharpen > 0) unsharp(d, canvas.width, canvas.height, (page.sharpen / 100) * 0.9);
    } else if (page.sharpen > 0) {
      unsharp(d, canvas.width, canvas.height, (page.sharpen / 100) * 0.5);
    }
    ctx.putImageData(imageData, 0, 0);
    // 3) auto deskew straightens text lines (runs after pixel pipeline)
    if (page.deskew && page.filter !== 'color') {
      const angle = detectSkewAngle(canvas);
      if (angle) canvas = rotateCanvas(canvas, -angle);
    }
    return canvas;
  }, []);

  /* ---------- editor image (rotated original for quad overlay) ---------- */
  useEffect(() => {
    let alive = true;
    setEditorImgUrl(null);
    rotatedCanvasRef.current = null;
    quadHistory.current = [];
    setLoupeKey(null);
    if (!selected) return;
    loadHtmlImage(selected.dataUrl).then(img => {
      if (!alive) return;
      const c = drawRotated(img, selected.rotation, 1600);
      rotatedCanvasRef.current = c;
      setEditorImgUrl(c.toDataURL('image/jpeg', 0.9));
    }).catch(() => {});
    return () => { alive = false; };
  }, [selected?.dataUrl, selected?.rotation]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- rectified result preview (debounced) ---------- */
  useEffect(() => {
    if (!selected || !previewCanvasRef.current) return;
    const target = previewCanvasRef.current;
    // before/after: "before" shows the warped (but unfiltered) scan
    const src: ScanPage = showOriginal
      ? { ...selected, filter: 'color', brightness: 0, contrast: 0, sharpen: 0, autoLevels: false, denoise: false, shadowRemove: false, deskew: false }
      : selected;
    const t = setTimeout(() => {
      renderScan(src, 900).then(canvas => {
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext('2d')!.drawImage(canvas, 0, 0);
      }).catch(() => {});
    }, 140);
    return () => clearTimeout(t);
  }, [selected, renderScan, showOriginal]);

  /* ---------- magnifier loupe for the active corner (precision on mobile) ---------- */
  useEffect(() => {
    const canvas = loupeCanvasRef.current;
    const src = rotatedCanvasRef.current;
    if (!canvas || !src || !loupeKey || !selected) return;
    const qq = quadOf(selected);
    const px = qq[loupeKey][0] * src.width;
    const py = qq[loupeKey][1] * src.height;
    const S = 144, Z = 4;
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, S, S);
    const sw = S / Z, sh = S / Z;
    ctx.drawImage(src, px - sw / 2, py - sh / 2, sw, sh, 0, 0, S, S);
    ctx.strokeStyle = 'rgba(20,184,166,.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(S / 2, 0); ctx.lineTo(S / 2, S);
    ctx.moveTo(0, S / 2); ctx.lineTo(S, S / 2);
    ctx.stroke();
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 5, 0, Math.PI * 2); ctx.stroke();
  }, [loupeKey, selected, editorImgUrl]);
  const quadOf = (p: ScanPage): Quad => p.quad ?? FULL_QUAD;

  const pushQuadHistory = () => {
    if (selected) {
      quadHistory.current.push(selected.quad ? { ...selected.quad } : null);
      if (quadHistory.current.length > 20) quadHistory.current.shift();
    }
  };

  const undoQuad = () => {
    const prev = quadHistory.current.pop();
    if (prev !== undefined) {
      updateSelected({ quad: prev });
      setDetectInfo(lang === 'ar' ? 'تم التراجع ↩' : 'Undone ↩');
    }
  };

  const nudgeCorner = (dx: number, dy: number) => {
    if (selectedId == null || !loupeKey) return;
    pushQuadHistory();
    const step = nudgeStep === 'fine' ? 0.002 : 0.01;
    setPages(prev => prev.map(p => {
      if (p.id !== selectedId) return p;
      const base = p.quad ?? FULL_QUAD;
      const q: Quad = { ...base, [loupeKey]: [...base[loupeKey]] as Pt };
      q[loupeKey] = [clamp01(q[loupeKey][0] + dx * step), clamp01(q[loupeKey][1] + dy * step)];
      return { ...p, quad: isValidQuad(q) ? q : p.quad };
    }));
    buzz(5);
  };

  const onCornerDown = (key: CornerKey) => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pushQuadHistory();
    setLoupeKey(key);
    buzz(10);
    cornerDrag.current = { key, lastX: e.clientX, lastY: e.clientY };
  };
  const onCornerMove = (e: React.PointerEvent) => {
    const drag = cornerDrag.current;
    if (!drag || !wrapRef.current || selectedId == null) return;
    const r = wrapRef.current.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const dx = (e.clientX - drag.lastX) / r.width;
    const dy = (e.clientY - drag.lastY) / r.height;
    drag.lastX = e.clientX; drag.lastY = e.clientY;
    setPages(prev => prev.map(p => {
      if (p.id !== selectedId) return p;
      const q = { ...(p.quad ?? FULL_QUAD), [drag.key]: [...(p.quad ?? FULL_QUAD)[drag.key]] as Pt };
      q[drag.key] = [clamp01(q[drag.key][0] + dx), clamp01(q[drag.key][1] + dy)];
      return { ...p, quad: q };
    }));
  };
  const onCornerUp = () => {
    if (cornerDrag.current) buzz(5);
    cornerDrag.current = null;
  };

  /** magnet-snap current quad corners to nearest strong edges */
  const snapManual = async () => {
    if (!selected || snapping) return;
    const base = selected.quad ?? FULL_QUAD;
    setSnapping(true);
    try {
      let rot = rotatedCanvasRef.current;
      if (!rot) {
        const img = await loadHtmlImage(selected.dataUrl);
        rot = drawRotated(img, selected.rotation, 1200);
        rotatedCanvasRef.current = rot;
      }
      pushQuadHistory();
      const snapped = snapQuadToEdges(rot, base);
      if (snapped) {
        updateSelected({ quad: snapped });
        setDetectInfo(lang === 'ar' ? 'تم التثبيت على الحواف 🧲 اسحب للضبط الدقيق' : 'Snapped to edges 🧲 drag to fine-tune');
      } else {
        setDetectInfo(lang === 'ar' ? 'لا توجد حافة قوية قريبة — اضبط يدوياً' : 'No strong edge nearby — adjust manually');
      }
    } finally {
      setSnapping(false);
    }
  };

  const autoDetect = async () => {
    if (!selected || detecting) return;
    setDetecting(true);
    setDetectInfo(null);
    try {
      const img = await loadHtmlImage(selected.dataUrl);
      const rotated = drawRotated(img, selected.rotation, 800);
      const found = detectDocumentQuad(rotated);
      if (!found || !isValidQuad(found.quad)) {
        setDetectInfo(lang === 'ar' ? 'تعذر الاكتشاف التلقائي — اضبط الزوايا يدوياً' : 'Auto-detect failed — adjust corners manually');
      } else if (found.confidence > 0.97) {
        updateSelected({ quad: null });
        setDetectInfo(lang === 'ar' ? 'الورقة مالية الكادر ✅ مش محتاجة قص' : 'Sheet fills the frame ✅ no crop needed');
      } else {
        pushQuadHistory();
        const refined = snapQuadToEdges(rotated, found.quad) ?? found.quad;
        updateSelected({ quad: refined });
        const pct = Math.round(found.confidence * 100);
        setDetectInfo(lang === 'ar' ? `تم اكتشاف الورقة (ثقة ${pct}%) مع تثبيت الحواف 🧲 — اسحب للضبط الدقيق` : `Sheet detected (${pct}%) + edge-snapped 🧲 — drag to fine-tune`);
      }
    } catch {
      setDetectInfo(lang === 'ar' ? 'تعذر الاكتشاف التلقائي' : 'Auto-detect failed');
    } finally {
      setDetecting(false);
    }
  };

  /* ---------- page ops ---------- */
  const updateSelected = (patch: Partial<ScanPage>) => {
    if (selectedId == null) return;
    setPages(prev => prev.map(p => p.id === selectedId ? { ...p, ...patch } : p));
  };
  const applyToAll = (patch: Partial<ScanPage>) => {
    setPages(prev => prev.map(p => ({ ...p, ...patch })));
    setSuccess(lang === 'ar' ? 'تم التطبيق على كل الصفحات ✨' : 'Applied to all pages ✨');
  };
  const removePage = (id: number) => {
    setPages(prev => {
      const next = prev.filter(p => p.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    setOcrText(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const duplicatePage = (id: number) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: idRef.current++, name: prev[idx].name + ' (copy)' };
      const next = [...prev]; next.splice(idx + 1, 0, copy); return next;
    });
  };
  const rotateSelected = () => {
    if (!selected) return;
    pushQuadHistory();
    updateSelected({ rotation: (selected.rotation + 90) % 360, quad: null });
  };
  const autoEnhance = () => selected && updateSelected({ filter: 'magic', brightness: 0, contrast: 0, autoLevels: true, denoise: true, shadowRemove: true, sharpen: 25 });

  /** background auto-crop for a batch of pages (import / capture) */
  const autoDetectForPages = async (list: ScanPage[]) => {
    for (const p of list) {
      try {
        const img = await loadHtmlImage(p.dataUrl);
        const c = drawRotated(img, p.rotation, 640);
        const found = detectDocumentQuad(c);
        if (found && isValidQuad(found.quad) && found.confidence <= 0.97) {
          const refined = snapQuadToEdges(c, found.quad) ?? found.quad;
          setPages(prev => prev.map(x => (x.id === p.id && !x.quad) ? { ...x, quad: refined } : x));
        }
      } catch { /* ignore */ }
    }
  };

  /** force re-detect corners on all pages */
  const detectAllQuads = async () => {
    if (!pages.length || detectingAll) return;
    setDetectingAll(true);
    let n = 0;
    try {
      for (const p of pages) {
        try {
          const img = await loadHtmlImage(p.dataUrl);
          const c = drawRotated(img, p.rotation, 640);
          const found = detectDocumentQuad(c);
          if (found && isValidQuad(found.quad) && found.confidence <= 0.97) {
            const refined = snapQuadToEdges(c, found.quad) ?? found.quad;
            setPages(prev => prev.map(x => x.id === p.id ? { ...x, quad: refined } : x));
            n++;
          }
        } catch { /* ignore */ }
      }
      setSuccess(lang === 'ar' ? `تم اكتشاف الزوايا في ${n} صفحة 🎯` : `Detected corners on ${n} pages 🎯`);
    } finally {
      setDetectingAll(false);
    }
  };
  const movePage = (index: number, dir: 'up' | 'down') => {
    setPages(prev => {
      const next = [...prev];
      const t = dir === 'up' ? index - 1 : index + 1;
      if (t < 0 || t >= next.length) return prev;
      [next[index], next[t]] = [next[t], next[index]];
      return next;
    });
  };
  const onDragStart = (i: number) => setDragIndex(i);
  const onDragOverCard = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    setPages(prev => {
      const next = [...prev];
      const [m] = next.splice(dragIndex, 1);
      next.splice(i, 0, m);
      return next;
    });
    setDragIndex(i);
  };

  /* ---------- OCR (accuracy pipeline) ---------- */
  const prepareOcrCanvas = async (page: ScanPage): Promise<HTMLCanvasElement> => {
    let c = await renderScan(page, 2000);
    // upscale small captures to ~1800px wide for Tesseract
    if (c.width < 1800) {
      const s = 1800 / c.width;
      const up = document.createElement('canvas');
      up.width = 1800; up.height = Math.round(c.height * s);
      const uctx = up.getContext('2d')!;
      uctx.fillStyle = '#ffffff';
      uctx.fillRect(0, 0, up.width, up.height);
      uctx.imageSmoothingEnabled = true;
      uctx.drawImage(c, 0, 0, up.width, up.height);
      c = up;
    }
    // grayscale + deskew + Sauvola -> crisp binary for OCR
    const ctx = c.getContext('2d')!;
    const id = ctx.getImageData(0, 0, c.width, c.height);
    toGrayscaleInPlace(id.data);
    ctx.putImageData(id, 0, 0);
    const angle = detectSkewAngle(c);
    if (angle) c = rotateCanvas(c, -angle);
    const c2 = c.getContext('2d')!;
    const id2 = c2.getImageData(0, 0, c.width, c.height);
    sauvolaBinarize(id2.data, c.width, c.height, 0.34, 31);
    c2.putImageData(id2, 0, 0);
    return c;
  };

  const runOcr = async (onlySelected: boolean) => {
    const targets = onlySelected ? pages.filter(p => p.id === selectedId) : pages;
    if (!targets.length || ocrBusy) return;
    setOcrBusy(true);
    setOcrProgress({ done: 0, total: targets.length });
    setError(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const langs = ocrLang.split('+');
      const worker: any = await (createWorker as any)(langs);
      try {
        await worker.setParameters({ tessedit_pageseg_mode: ocrPsm });
      } catch { /* non-fatal */ }
      const out: Record<number, string> = {};
      let done = 0;
      for (const p of targets) {
        const ocrCanvas = await prepareOcrCanvas(p);
        const { data } = await worker.recognize(ocrCanvas.toDataURL('image/png'));
        out[p.id] = data?.text?.trim() || (lang === 'ar' ? '(لا يوجد نص)' : '(no text)');
        done++;
        setOcrProgress({ done, total: targets.length });
      }
      await worker.terminate?.();
      setOcrText(prev => ({ ...prev, ...out }));
      setSuccess(lang === 'ar' ? `تم استخراج النص ✅ (${targets.length} ${lang === 'ar' ? 'صفحات' : 'pages'})` : `OCR done ✅ (${targets.length} pages)`);
    } catch (e) {
      console.error(e);
      setError(lang === 'ar' ? 'فشل OCR — يحتاج إنترنت لتحميل نموذج اللغة' : 'OCR failed — needs internet for language data');
    } finally {
      setOcrBusy(false);
      setOcrProgress(null);
    }
  };

  const allOcrText = pages.map(p => `--- ${p.name} ---\n${ocrText[p.id] ?? ''}`).join('\n\n');
  const copyOcr = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setSuccess(lang === 'ar' ? 'تم النسخ 📋' : 'Copied 📋'); }
    catch { setError(lang === 'ar' ? 'تعذر النسخ' : 'Copy failed'); }
  };
  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  /* ---------- export ---------- */
  const getPageDims = () => {
    if (pageSize === 'fit') return null;
    return pageSize === 'a4' ? { w: 595.28, h: 841.89 } : { w: 612, h: 792 };
  };

  /** download the currently selected page as a standalone image */
  const exportSingleImage = async () => {
    if (!selected || exporting) return;
    setExporting(true);
    try {
      const canvas = await renderScan(selected, exportScale);
      const url = canvas.toDataURL(imgFormat === 'png' ? 'image/png' : 'image/jpeg', quality);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName(imgFormat === 'png' ? 'png' : 'jpg');
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setSuccess(lang === 'ar' ? 'تم تحميل الصفحة ✅' : 'Page downloaded ✅');
    } catch {
      setError(lang === 'ar' ? 'فشل تحميل الصفحة' : 'Page export failed');
    } finally { setExporting(false); }
  };

  const buildPdf = async (): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    if (pdfTitle) pdfDoc.setTitle(pdfTitle);
    pdfDoc.setCreator('UniTool Scanner');
    pdfDoc.setProducer('UniTool Document Scanner');
    const font = pageNumbers ? await pdfDoc.embedFont(StandardFonts.Helvetica) : null;
    const dims = getPageDims();
    let n = 0;
    for (const p of pages) {
      const canvas = await renderScan(p, exportScale);
      const url = canvas.toDataURL('image/jpeg', quality);
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      const embedded = await pdfDoc.embedJpg(bytes);
      let pw = embedded.width, ph = embedded.height;
      if (dims) {
        const s = Math.min((dims.w - 40) / pw, (dims.h - 60) / ph);
        pw *= s; ph *= s;
      }
      const page = dims ? pdfDoc.addPage([dims.w, dims.h]) : pdfDoc.addPage([pw + 40, ph + (pageNumbers ? 60 : 40)]);
      page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: rgb(1, 1, 1) });
      const x = (page.getWidth() - pw) / 2;
      const y = (page.getHeight() - ph) / 2 + (pageNumbers ? 8 : 0);
      page.drawImage(embedded, { x, y, width: pw, height: ph });
      n++;
      if (pageNumbers && font) {
        const label = `${n}`;
        page.drawText(label, { x: page.getWidth() / 2 - 4, y: 12, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
      }
      setProgress(Math.round((n / pages.length) * 85));
    }
    return pdfDoc.save();
  };

  const safeName = (ext: string) => `${(fileName.trim() || 'scan').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)}.${ext}`;

  const exportPdf = async (mode: 'download' | 'preview') => {
    if (!pages.length || exporting) return;
    setExporting(true); setProgress(5); setError(null);
    try {
      const bytes = await buildPdf();
      setProgress(100);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (mode === 'preview') { window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000); }
      else {
        const a = document.createElement('a');
        a.href = url; a.download = safeName('pdf');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setSuccess(lang === 'ar' ? `تم إنشاء PDF (${pages.length} صفحات)` : `PDF created (${pages.length} pages)`);
    } catch (e) {
      console.error(e);
      setError(lang === 'ar' ? 'فشل إنشاء PDF' : 'PDF export failed');
    } finally { setExporting(false); setProgress(0); }
  };

  const exportZip = async () => {
    if (!pages.length || exporting) return;
    setExporting(true); setProgress(10);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const ext = imgFormat === 'png' ? 'png' : 'jpg';
      let i = 0;
      for (const p of pages) {
        const canvas = await renderScan(p, exportScale);
        const buf = await (await fetch(imgFormat === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality))).arrayBuffer();
        zip.file(`${String(++i).padStart(2, '0')}_${p.name}.${ext}`, buf);
        setProgress(Math.round((i / pages.length) * 85));
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = safeName('zip');
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setSuccess(lang === 'ar' ? 'تم تحميل ZIP ✅' : 'ZIP downloaded ✅');
    } catch (e) {
      console.error(e);
      setError(lang === 'ar' ? 'فشل إنشاء ZIP' : 'ZIP export failed');
    } finally { setExporting(false); setProgress(0); }
  };

  const q = selected ? quadOf(selected) : FULL_QUAD;
  const quadPts = `${q.tl[0] * 100},${q.tl[1] * 100} ${q.tr[0] * 100},${q.tr[1] * 100} ${q.br[0] * 100},${q.br[1] * 100} ${q.bl[0] * 100},${q.bl[1] * 100}`;

  // live output dimensions from current quad (rotated-pixel space)
  const selDims = (() => {
    if (!selected) return null;
    const swap = selected.rotation === 90 || selected.rotation === 270;
    const rw = swap ? selected.height : selected.width;
    const rh = swap ? selected.width : selected.height;
    const P = (p: Pt): [number, number] => [p[0] * rw, p[1] * rh];
    const [ax, ay] = P(q.tl); const [bx, by] = P(q.tr);
    const [cx, cy] = P(q.br); const [dx, dy] = P(q.bl);
    const W = Math.max(Math.hypot(bx - ax, by - ay), Math.hypot(cx - dx, cy - dy));
    const H = Math.max(Math.hypot(dx - ax, dy - ay), Math.hypot(cx - bx, cy - by));
    return { w: Math.round(W), h: Math.round(H) };
  })();

  return (
    <div className="flex flex-col flex-1 overflow-hidden"
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = Array.from(e.dataTransfer.files || []); if (f.length) void importFiles(f); }}>
      {/* header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 sm:w-8 sm:h-8">
          <ScanLine size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'سكانر المستندات' : 'Document Scanner'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'اكتشاف تلقائي + إزالة ظلال + قص منظوري + تصحيح ميلان + OCR' : 'Auto-detect + shadow removal + perspective crop + deskew + OCR'}</p>
        </div>
        {pages.length > 0 && (
          <span className="text-[9px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">📄 {pages.length} {lang === 'ar' ? 'صفحة' : 'pages'}</span>
        )}
      </div>

      {/* mobile tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {([
          { id: 'capture', label: lang === 'ar' ? 'تصوير' : 'Capture', icon: Camera },
          { id: 'pages', label: lang === 'ar' ? `صفحات (${pages.length})` : `Pages (${pages.length})`, icon: ImagePlus },
          { id: 'edit', label: lang === 'ar' ? 'تحسين' : 'Enhance', icon: Sparkles },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id)}
            className={cn('flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors', mobileTab === tab.id ? 'text-teal-400 bg-[#1A1D23]' : 'text-gray-500')}>
            <tab.icon size={12} />{tab.label}
          </button>
        ))}
      </div>

      {dragOver && (
        <div className="absolute inset-0 z-50 bg-teal-600/10 backdrop-blur-sm border-2 border-dashed border-teal-500 m-3 rounded-2xl flex items-center justify-center pointer-events-none">
          <p className="text-teal-300 font-bold text-sm">{lang === 'ar' ? 'أفلت الصور هنا 📥' : 'Drop images here 📥'}</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className={cn('w-full sm:w-80 bg-[#14171C] border-r border-[#2D3139] flex-col shrink-0 overflow-y-auto', mobileTab === 'capture' || mobileTab === 'export' ? 'flex' : 'hidden sm:flex')}>
          <div className={cn(mobileTab === 'capture' ? 'block' : 'hidden sm:block')}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <h3 className="text-[10px] font-bold text-gray-300 mb-2 flex items-center gap-1.5"><Camera size={12} className="text-teal-400" />{lang === 'ar' ? 'الكاميرا' : 'Camera'}</h3>
              {!cameraOn ? (
                <div className="flex gap-2">
                  <button onClick={() => startCamera(facing)} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-mono font-bold hover:from-teal-500 hover:to-emerald-500 flex items-center justify-center gap-2">
                    <Camera size={13} />{lang === 'ar' ? 'فتح الكاميرا' : 'Open camera'}
                  </button>
                  <button onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')} title="switch" className="px-3 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-teal-500/50">
                    <SwitchCamera size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-[#2D3139] bg-black aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={capturePhoto} disabled={capturing} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-mono font-bold hover:from-teal-500 hover:to-emerald-500 flex items-center justify-center gap-2 disabled:opacity-50">
                      {capturing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}{lang === 'ar' ? 'التقاط 📸' : 'Capture 📸'}
                    </button>
                    {torchOk && (
                      <button onClick={toggleTorch} title={lang === 'ar' ? 'الفلاش' : 'Torch'}
                        className={cn('px-3 rounded-lg border', torchOn ? 'bg-amber-500/20 border-amber-400/60 text-amber-300' : 'border-[#2D3139] bg-[#0F1115] text-gray-400 hover:text-white')}>
                        <Zap size={14} />
                      </button>
                    )}
                    <button onClick={stopCamera} className="px-3 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-400 hover:text-white"><X size={14} /></button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={burstMode} onChange={e => setBurstMode(e.target.checked)} className="accent-teal-500 w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'وضع دفعة — التقاط متتابع بدون تحديد' : 'Burst mode — continuous capture'}</span>
                  </label>
                </div>
              )}
              {camError && <p className="text-[9px] text-red-400 mt-2 font-mono bg-red-500/10 border border-red-500/20 rounded p-2">{camError}</p>}
              <label className="mt-3 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-teal-500/50 transition-colors bg-[#0F1115]">
                <Upload size={18} className="text-gray-500" />
                <span className="text-[9px] font-mono text-gray-300 font-bold">{lang === 'ar' ? 'رفع صور / سحب / لصق (Ctrl+V)' : 'Upload / drop / paste (Ctrl+V)'}</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
              </label>
              {loading && <div className="flex items-center gap-2 mt-2 text-[9px] text-gray-400 font-mono"><Loader2 size={11} className="animate-spin" />{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>}
              {error && <p className="text-[9px] text-red-400 mt-2 font-mono bg-red-500/10 border border-red-500/20 rounded p-2">{error}</p>}
              {success && <p className="text-[9px] text-green-400 mt-2 font-mono bg-green-500/10 border border-green-500/20 rounded p-2">✅ {success}</p>}
            </div>
          </div>

          {/* export */}
          <div className={cn('flex-col flex-1', mobileTab === 'export' ? 'flex' : 'hidden sm:flex')}>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-gray-300 mb-2">{lang === 'ar' ? 'إعدادات PDF' : 'PDF Settings'}</h3>
                <div className="flex gap-1">
                  {(['fit', 'a4', 'letter'] as const).map(s => (
                    <button key={s} onClick={() => setPageSize(s)} className={cn('flex-1 py-1.5 text-[9px] font-mono uppercase rounded-md border', pageSize === s ? 'bg-teal-600/20 border-teal-500/40 text-teal-300 font-bold' : 'bg-[#14171C] border-[#2D3139] text-gray-500')}>{s === 'fit' ? (lang === 'ar' ? 'ملائم' : 'Fit') : s.toUpperCase()}</button>
                  ))}
                </div>
                <label className="text-[9px] font-mono text-gray-500 uppercase block mt-2">{lang === 'ar' ? 'دقة الإخراج' : 'Output res'}</label>
                <div className="flex gap-1 mt-1">
                  {([1500, 2000, 3000] as const).map(v => (
                    <button key={v} onClick={() => setExportScale(v)} className={cn('flex-1 py-1.5 text-[9px] font-mono rounded-md border', exportScale === v ? 'bg-teal-600/20 border-teal-500/40 text-teal-300 font-bold' : 'bg-[#14171C] border-[#2D3139] text-gray-500')}>{v}px</button>
                  ))}
                </div>
                <label className="text-[9px] font-mono text-gray-500 uppercase block mt-2">{lang === 'ar' ? 'جودة JPEG' : 'JPEG Quality'}: {Math.round(quality * 100)}%</label>
                <input type="range" min={0.4} max={1} step={0.02} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full accent-teal-500" />
                <label className="text-[9px] font-mono text-gray-500 uppercase block mt-2">{lang === 'ar' ? 'صيغة صور ZIP' : 'ZIP image format'}</label>
                <div className="flex gap-1 mt-1">
                  {(['jpeg', 'png'] as const).map(v => (
                    <button key={v} onClick={() => setImgFormat(v)} className={cn('flex-1 py-1.5 text-[9px] font-mono uppercase rounded-md border', imgFormat === v ? 'bg-teal-600/20 border-teal-500/40 text-teal-300 font-bold' : 'bg-[#14171C] border-[#2D3139] text-gray-500')}>{v.toUpperCase()}</button>
                  ))}
                </div>
                <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder={lang === 'ar' ? 'اسم الملف' : 'File name'} className="mt-2 w-full bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 outline-none focus:border-teal-500/60" />
                <input value={pdfTitle} onChange={e => setPdfTitle(e.target.value)} placeholder={lang === 'ar' ? 'عنوان المستند' : 'Doc title'} className="mt-2 w-full bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 outline-none focus:border-teal-500/60" />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={pageNumbers} onChange={e => setPageNumbers(e.target.checked)} className="accent-teal-500 w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'ترقيم الصفحات' : 'Page numbers'}</span>
                </label>
              </div>

              {/* OCR */}
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-gray-300 mb-2 flex items-center gap-1.5"><Languages size={12} className="text-teal-400" />OCR — {lang === 'ar' ? 'استخراج النص' : 'Extract text'}</h3>
                <div className="flex gap-1 mb-2">
                  {([['ara+eng', 'عربي+EN'], ['ara', 'عربي'], ['eng', 'EN']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setOcrLang(v)} className={cn('flex-1 py-1.5 text-[8px] font-mono rounded-md border', ocrLang === v ? 'bg-teal-600/20 border-teal-500/40 text-teal-300 font-bold' : 'bg-[#14171C] border-[#2D3139] text-gray-500')}>{l}</button>
                  ))}
                </div>
                <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">{lang === 'ar' ? 'وضع التعرف' : 'PSM mode'}</label>
                <div className="flex gap-1 mb-2">
                  {([['6', lang === 'ar' ? 'مستند' : 'Doc'], ['3', lang === 'ar' ? 'تلقائي' : 'Auto'], ['4', lang === 'ar' ? 'عمود' : 'Column']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setOcrPsm(v as '3' | '4' | '6')} className={cn('flex-1 py-1.5 text-[8px] font-mono rounded-md border', ocrPsm === v ? 'bg-teal-600/20 border-teal-500/40 text-teal-300 font-bold' : 'bg-[#14171C] border-[#2D3139] text-gray-500')}>{l}</button>
                  ))}
                </div>
                <p className="text-[8px] font-mono text-gray-600 mb-2 leading-relaxed">{lang === 'ar' ? 'تكبير تلقائي + تصحيح الميلان + عتبة تكيفية قبل التعرف' : 'Auto-upscale + deskew + adaptive threshold before recognition'}</p>
                {ocrBusy && ocrProgress && (
                  <p className="text-[9px] font-mono text-teal-300 mb-2 flex items-center gap-1.5">
                    <Loader2 size={10} className="animate-spin" />
                    OCR {ocrProgress.done}/{ocrProgress.total} …
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => runOcr(true)} disabled={!selected || ocrBusy} className="flex-1 py-2 rounded-md bg-teal-600/20 border border-teal-500/40 text-teal-300 text-[9px] font-mono font-bold hover:bg-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {ocrBusy ? <Loader2 size={11} className="animate-spin" /> : null}{lang === 'ar' ? 'صفحة' : 'Page'}
                  </button>
                  <button onClick={() => runOcr(false)} disabled={!pages.length || ocrBusy} className="flex-1 py-2 rounded-md bg-teal-600/20 border border-teal-500/40 text-teal-300 text-[9px] font-mono font-bold hover:bg-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {ocrBusy ? <Loader2 size={11} className="animate-spin" /> : null}{lang === 'ar' ? 'الكل' : 'All'}
                  </button>
                </div>
                {Object.keys(ocrText).length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => copyOcr(allOcrText)} className="flex-1 py-1.5 text-[8px] font-mono text-gray-300 border border-[#2D3139] rounded-md hover:border-teal-500/50">{lang === 'ar' ? 'نسخ النص' : 'Copy'}</button>
                    <button onClick={() => downloadText(safeName('txt'), allOcrText)} className="flex-1 py-1.5 text-[8px] font-mono text-gray-300 border border-[#2D3139] rounded-md hover:border-teal-500/50">TXT ↓</button>
                  </div>
                )}
              </div>

              {exporting && (
                <div className="bg-[#0F1115] border border-teal-500/30 rounded-lg p-3">
                  <div className="text-[9px] font-mono text-teal-300 mb-1.5">{progress}% …</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              <div className="flex gap-2 pb-2">
                <button onClick={() => exportPdf('download')} disabled={!pages.length || exporting} className={cn('flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all', pages.length ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20' : 'bg-[#2D3139] text-gray-600 cursor-not-allowed')}>
                  {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}{lang === 'ar' ? 'تحميل PDF' : 'PDF'}
                </button>
                <button onClick={() => exportPdf('preview')} disabled={!pages.length || exporting} title="preview" className="px-3.5 py-3 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-teal-500/50 disabled:opacity-40"><Eye size={14} /></button>
                <button onClick={exportZip} disabled={!pages.length || exporting} title="ZIP" className="px-3.5 py-3 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-teal-500/50 disabled:opacity-40"><FileArchive size={14} /></button>
              </div>
            </div>
          </div>
        </aside>

        {/* main */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* pages grid */}
          <section className={cn('flex-1 overflow-y-auto bg-[#0A0C0F] p-3', mobileTab === 'pages' ? 'block' : 'hidden sm:block')}>
            {pages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4"><ScanLine size={26} className="text-teal-500/60" /></div>
                  <p className="text-[11px] font-bold text-gray-300 mb-1">{lang === 'ar' ? 'ابدأ المسح' : 'Start scanning'}</p>
                  <p className="text-[9px] font-mono text-gray-600">{lang === 'ar' ? 'صوّر بالكاميرا أو ارفع صور المستندات' : 'Capture with camera or upload document photos'}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <button onClick={detectAllQuads} disabled={detectingAll}
                    className="py-1.5 px-2.5 rounded-md bg-teal-600/20 border border-teal-500/40 text-teal-300 text-[9px] font-mono font-bold hover:bg-teal-600/30 disabled:opacity-40 flex items-center gap-1.5">
                    {detectingAll ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />}
                    {lang === 'ar' ? 'كشف زوايا الكل 🎯' : 'Detect all 🎯'}
                  </button>
                  <button onClick={() => { if (window.confirm(lang === 'ar' ? 'مسح كل الصفحات؟' : 'Clear all pages?')) { setPages([]); setSelectedId(null); setOcrText({}); } }}
                    disabled={!pages.length}
                    className="py-1.5 px-2.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-300 text-[9px] font-mono hover:bg-red-500/20 disabled:opacity-40 flex items-center gap-1.5">
                    <Trash2 size={11} />{lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                  </button>
                  <span className="text-[8px] font-mono text-gray-600 ml-auto">{lang === 'ar' ? 'اسحب الكروت لإعادة الترتيب' : 'drag cards to reorder'}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {pages.map((p, i) => (
                  <div key={p.id} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOverCard(e, i)} onDragEnd={() => setDragIndex(null)}
                    onClick={() => { setSelectedId(p.id); setMobileTab('edit'); }}
                    className={cn('relative rounded-lg overflow-hidden border bg-[#1A1D23] cursor-pointer transition-all', selectedId === p.id ? 'border-teal-500 ring-1 ring-teal-500' : 'border-[#2D3139] hover:border-teal-500/40', dragIndex === i && 'opacity-50 scale-95')}>
                    <div className="relative aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt={p.name} draggable={false} className="max-w-full max-h-full object-contain pointer-events-none"
                        style={{ transform: `rotate(${p.rotation}deg)`, filter: p.filter === 'gray' || p.filter === 'bw' || p.filter === 'enhanced' ? 'grayscale(1) contrast(1.15)' : p.filter === 'magic' ? 'saturate(1.35) contrast(1.1)' : undefined }} />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono font-bold text-white">#{i + 1}</div>
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-teal-600/90 text-[7px] font-mono text-white">{FILTERS.find(f => f.id === p.filter)?.[lang === 'ar' ? 'ar' : 'en']}</div>
                      {p.quad && !isFullQuad(p.quad) && <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-blue-600/90 text-[7px] font-mono text-white">◈ {lang === 'ar' ? 'مقصوص' : 'cropped'}</div>}
                      {ocrText[p.id] && <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-[7px] font-mono text-white">OCR ✓</div>}
                    </div>
                    <div className="p-2 flex items-center gap-1">
                      <p className="text-[8px] font-mono text-white truncate flex-1">{p.name}</p>
                      <button onClick={e => { e.stopPropagation(); duplicatePage(p.id); }} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"><Copy size={11} /></button>
                      <button onClick={e => { e.stopPropagation(); removePage(p.id); }} className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </section>

          {/* editor */}
          <section className={cn('w-full sm:w-[360px] shrink-0 border-t sm:border-t-0 sm:border-s border-[#2D3139] bg-[#14171C] overflow-y-auto', mobileTab === 'edit' ? 'block' : 'hidden sm:block')}>
            {!selected ? (
              <div className="p-6 text-center text-[10px] font-mono text-gray-600">{lang === 'ar' ? 'اختر صفحة لتحسينها' : 'Select a page to enhance'}</div>
            ) : (
              <div className="p-3 space-y-3">
                {/* perspective crop */}
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-gray-300">◈ {lang === 'ar' ? 'القص المنظوري الدقيق' : 'Precise perspective crop'}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditorZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))} className="px-2 py-1 rounded border border-[#2D3139] text-gray-400 text-[10px]">−</button>
                      <span className="text-[9px] font-mono text-gray-400 flex items-center gap-1"><ZoomIn size={10} />{Math.round(editorZoom * 100)}%</span>
                      <button onClick={() => setEditorZoom(z => Math.min(3, +(z + 0.5).toFixed(1)))} className="px-2 py-1 rounded border border-[#2D3139] text-gray-400 text-[10px]">+</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button onClick={autoDetect} disabled={detecting || !editorImgUrl}
                      className="py-2 rounded-md bg-teal-600/20 border border-teal-500/40 text-teal-300 text-[9px] font-mono font-bold hover:bg-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                      {detecting ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />}
                      {detecting ? (lang === 'ar' ? 'جاري الاكتشاف...' : 'Detecting...') : (lang === 'ar' ? 'اكتشاف تلقائي 🎯' : 'Auto-detect 🎯')}
                    </button>
                    <button onClick={snapManual} disabled={snapping || !selected}
                      className="py-2 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[9px] font-mono font-bold hover:bg-blue-600/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                      {snapping ? <Loader2 size={11} className="animate-spin" /> : <span>🧲</span>}
                      {lang === 'ar' ? 'تثبيت على الحواف' : 'Snap to edges'}
                    </button>
                    <button onClick={() => { pushQuadHistory(); updateSelected({ quad: null }); setDetectInfo(null); }}
                      className="py-2 rounded-md border border-[#2D3139] bg-[#14171C] text-gray-400 hover:text-white text-[9px] font-mono">
                      {lang === 'ar' ? 'إعادة ↺' : 'Reset ↺'}
                    </button>
                    <button onClick={undoQuad} disabled={quadHistory.current.length === 0}
                      className="py-2 rounded-md border border-[#2D3139] bg-[#14171C] text-gray-400 hover:text-white text-[9px] font-mono disabled:opacity-40">
                      {lang === 'ar' ? 'تراجع ↩' : 'Undo ↩'}
                    </button>
                  </div>
                  {editorImgUrl ? (
                    <div className="overflow-auto rounded-md border border-[#2D3139] bg-black/40" style={{ maxHeight: 320 }}>
                      <div ref={wrapRef} className="relative select-none" style={{ width: `${editorZoom * 100}%` }}
                        onDoubleClick={() => setEditorZoom(z => (z > 1.5 ? 1 : 2.5))} title={lang === 'ar' ? 'ضغطة مزدوجة للتقريب' : 'Double-tap to zoom'}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editorImgUrl} alt="" draggable={false} className="w-full block pointer-events-none" />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <g stroke="#ffffff" strokeWidth={1} opacity={0.12} vectorEffect="non-scaling-stroke">
                            <line x1="33.3" y1="0" x2="33.3" y2="100" />
                            <line x1="66.6" y1="0" x2="66.6" y2="100" />
                            <line x1="0" y1="33.3" x2="100" y2="33.3" />
                            <line x1="0" y1="66.6" x2="100" y2="66.6" />
                          </g>
                          <polygon points={quadPts} fill="rgba(20,184,166,0.12)" stroke="#14b8a6" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="6 3" />
                        </svg>
                        {CORNERS.map(k => (
                          <button key={k}
                            onPointerDown={onCornerDown(k)}
                            onPointerMove={onCornerMove}
                            onPointerUp={onCornerUp}
                            onPointerCancel={onCornerUp}
                            title={k}
                            className="absolute w-7 h-7 sm:w-5 sm:h-5 rounded-full bg-teal-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing touch-none z-10"
                            style={{ left: `${q[k][0] * 100}%`, top: `${q[k][1] * 100}%`, transform: 'translate(-50%,-50%)' }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 rounded-md border border-[#2D3139] flex items-center justify-center text-[9px] font-mono text-gray-600">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}
                  {/* magnifier loupe + precision nudge pad */}
                  {loupeKey && (
                    <div className="mt-2 rounded-lg border border-teal-500/40 bg-[#0F1115] p-2.5 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <canvas ref={loupeCanvasRef} width={144} height={144} className="w-[104px] h-[104px] rounded-lg border border-teal-500/50 bg-black" />
                        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[8px] font-mono font-bold">4x</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[9px] font-mono font-bold text-teal-300">
                            {lang === 'ar' ? 'ركن: ' : 'Corner: '}{lang === 'ar' ? CORNER_LABEL[loupeKey].ar : CORNER_LABEL[loupeKey].en}
                          </p>
                          <button onClick={() => setLoupeKey(null)} className="text-gray-500 hover:text-white"><X size={12} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-1 w-28">
                          <span />
                          <button onClick={() => nudgeCorner(0, -1)} className="py-1.5 rounded bg-white/5 border border-white/10 text-gray-200 text-[10px] hover:border-teal-500/60 active:bg-teal-500/20">▲</button>
                          <span />
                          <button onClick={() => nudgeCorner(-1, 0)} className="py-1.5 rounded bg-white/5 border border-white/10 text-gray-200 text-[10px] hover:border-teal-500/60 active:bg-teal-500/20">◀</button>
                          <button onClick={() => nudgeCorner(0, 1)} className="py-1.5 rounded bg-white/5 border border-white/10 text-gray-200 text-[10px] hover:border-teal-500/60 active:bg-teal-500/20">▼</button>
                          <button onClick={() => nudgeCorner(1, 0)} className="py-1.5 rounded bg-white/5 border border-white/10 text-gray-200 text-[10px] hover:border-teal-500/60 active:bg-teal-500/20">▶</button>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {(['fine', 'fast'] as const).map(s => (
                            <button key={s} onClick={() => setNudgeStep(s)}
                              className={cn('flex-1 py-1 text-[8px] font-mono rounded border', nudgeStep === s ? 'bg-teal-600/25 border-teal-500/50 text-teal-200 font-bold' : 'border-white/10 text-gray-500')}>
                              {s === 'fine' ? (lang === 'ar' ? 'دقيق' : 'Fine') : (lang === 'ar' ? 'سريع' : 'Fast')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {detectInfo && <p className="text-[8px] font-mono text-teal-300/90 mt-1.5 leading-relaxed">{detectInfo}</p>}
                  <p className="text-[8px] font-mono text-gray-600 mt-1.5 leading-relaxed">{lang === 'ar' ? 'اسحب النقاط الفيروزية الأربع لأركان الورقة — تُصحَّح زاوية التصوير تلقائياً' : 'Drag the 4 teal dots to the sheet corners — perspective is corrected automatically'}</p>
                </div>

                {/* rectified result */}
                <div className="rounded-lg overflow-hidden border border-teal-500/30 bg-white">
                  <canvas ref={previewCanvasRef} className="w-full h-auto block" />
                </div>
                {selDims && (
                  <p className="-mt-1.5 text-center text-[8px] font-mono text-gray-500">
                    {lang === 'ar' ? 'الإخراج' : 'Output'} ≈ {selDims.w}×{selDims.h}px
                    {!isValidQuad(selected.quad) && selected.quad ? (lang === 'ar' ? ' — الزوايا غير صالحة، يُستخدم الإطار الكامل' : ' — invalid corners, full frame used') : ''}
                  </p>
                )}
                <button onClick={() => setShowOriginal(o => !o)} disabled={!selected}
                  className="w-full py-1.5 rounded-md border border-[#2D3139] bg-[#0F1115] text-[9px] font-mono text-gray-400 hover:text-teal-300 flex items-center justify-center gap-1.5">
                  <Eye size={11} />
                  {showOriginal
                    ? (lang === 'ar' ? 'عرض بعد التحسين ✨' : 'Show enhanced ✨')
                    : (lang === 'ar' ? 'عرض قبل التحسين 👁' : 'Show original 👁')}
                </button>

                <div className="flex gap-2">
                  <button onClick={rotateSelected} className="flex-1 py-2 rounded-md border border-[#2D3139] bg-[#0F1115] text-gray-300 text-[9px] font-mono hover:border-teal-500/50 flex items-center justify-center gap-1.5"><RotateCw size={11} />{lang === 'ar' ? 'تدوير' : 'Rotate'}</button>
                  <button onClick={autoEnhance} className="flex-1 py-2 rounded-md bg-teal-600/20 border border-teal-500/40 text-teal-300 text-[9px] font-mono font-bold hover:bg-teal-600/30 flex items-center justify-center gap-1.5"><Sparkles size={11} />{lang === 'ar' ? 'تحسين تلقائي' : 'Auto'}</button>
                  <button onClick={exportSingleImage} disabled={exporting} title={lang === 'ar' ? 'تحميل الصفحة كصورة' : 'Download page as image'} className="px-3 py-2 rounded-md border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-teal-500/50 disabled:opacity-40 flex items-center"><Download size={11} /></button>
                  <button onClick={() => selected && duplicatePage(selected.id)} className="px-3 py-2 rounded-md border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-teal-500/50"><Copy size={11} /></button>
                  <button onClick={() => movePage(pages.findIndex(p => p.id === selected.id), 'up')} className="px-2 py-2 rounded-md border border-[#2D3139] bg-[#0F1115] text-gray-300">↑</button>
                  <button onClick={() => movePage(pages.findIndex(p => p.id === selected.id), 'down')} className="px-2 py-2 rounded-md border border-[#2D3139] bg-[#0F1115] text-gray-300">↓</button>
                </div>

                {/* filters */}
                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'فلتر المسح' : 'Scan filter'}</label>
                  <div className="grid grid-cols-5 gap-1 mt-1.5">
                    {FILTERS.map(f => (
                      <button key={f.id} onClick={() => updateSelected({ filter: f.id })}
                        className={cn('py-2 text-[7px] font-mono rounded-md border leading-tight', selected.filter === f.id ? 'bg-teal-600/20 border-teal-500/50 text-teal-300 font-bold' : 'bg-[#0F1115] border-[#2D3139] text-gray-500')}>
                        {lang === 'ar' ? f.ar : f.en}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => selected && applyToAll({ filter: selected.filter, brightness: selected.brightness, contrast: selected.contrast, threshold: selected.threshold, autoLevels: selected.autoLevels, denoise: selected.denoise, sharpen: selected.sharpen, shadowRemove: selected.shadowRemove, deskew: selected.deskew })}
                    className="w-full mt-1.5 py-1.5 text-[8px] font-mono text-gray-500 hover:text-teal-300 border border-dashed border-[#2D3139] rounded-md">
                    {lang === 'ar' ? 'تطبيق الفلتر على الكل ✨' : 'Apply filter to all ✨'}
                  </button>
                </div>

                {/* sliders */}
                <div className="space-y-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                  <div>
                    <label className="text-[9px] font-mono text-gray-500">{lang === 'ar' ? 'السطوع' : 'Brightness'}: {selected.brightness}</label>
                    <input type="range" min={-100} max={100} value={selected.brightness} onChange={e => updateSelected({ brightness: +e.target.value })} className="w-full accent-teal-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-gray-500">{lang === 'ar' ? 'التباين' : 'Contrast'}: {selected.contrast}</label>
                    <input type="range" min={-100} max={100} value={selected.contrast} onChange={e => updateSelected({ contrast: +e.target.value })} className="w-full accent-teal-500" />
                  </div>
                  {(selected.filter === 'bw' || selected.filter === 'enhanced') && (
                    <div>
                      <label className="text-[9px] font-mono text-gray-500">
                        {selected.filter === 'bw'
                          ? (lang === 'ar' ? 'حساسية التكيف (Sauvola)' : 'Adaptive sensitivity (Sauvola)')
                          : (lang === 'ar' ? 'عتبة التبييض' : 'White-clip')}: {selected.threshold}
                      </label>
                      <input type="range" min={40} max={220} value={selected.threshold} onChange={e => updateSelected({ threshold: +e.target.value })} className="w-full accent-teal-500" />
                    </div>
                  )}
                  <div>
                    <label className="text-[9px] font-mono text-gray-500">{lang === 'ar' ? 'حدة التفاصيل' : 'Sharpness'}: {selected.sharpen}%</label>
                    <input type="range" min={0} max={100} value={selected.sharpen} onChange={e => updateSelected({ sharpen: +e.target.value })} className="w-full accent-teal-500" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selected.autoLevels} onChange={e => updateSelected({ autoLevels: e.target.checked })} className="accent-teal-500 w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'توازن تلقائي للإضاءة' : 'Auto levels'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selected.denoise} onChange={e => updateSelected({ denoise: e.target.checked })} className="accent-teal-500 w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'إزالة ضجيج الحساس (median)' : 'Sensor denoise (median)'}</span>
                  </label>
                  {selected.filter !== 'color' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selected.shadowRemove} onChange={e => updateSelected({ shadowRemove: e.target.checked })} className="accent-teal-500 w-3.5 h-3.5" />
                      <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'إزالة الظلال والتظليل غير المستوي' : 'Remove shadows / uneven light'}</span>
                    </label>
                  )}
                  {selected.filter !== 'color' && selected.filter !== 'magic' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selected.deskew} onChange={e => updateSelected({ deskew: e.target.checked })} className="accent-teal-500 w-3.5 h-3.5" />
                      <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'تقويم ميلان النص تلقائياً' : 'Auto-straighten text lines'}</span>
                    </label>
                  )}
                </div>

                {/* ocr result */}
                {ocrText[selected.id] && (
                  <div className="bg-[#0F1115] border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-mono text-emerald-400 font-bold">OCR ✓</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => copyOcr(ocrText[selected.id])} className="text-[8px] font-mono text-gray-400 hover:text-white">{lang === 'ar' ? 'نسخ' : 'Copy'}</button>
                        <button onClick={() => downloadText(`${selected.name}.txt`, ocrText[selected.id])} className="text-[8px] font-mono text-gray-400 hover:text-white">TXT ↓</button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto" dir="auto">{ocrText[selected.id]}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
