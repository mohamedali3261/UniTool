import type { ProjectItem } from '../types';

export const PROJECT_FILE_FORMAT = 'unitool-designcraft';
export const PROJECT_FILE_VERSION = 1;
export const MAX_PROJECT_FILE_BYTES = 12 * 1024 * 1024;

/** Keep editor metadata, locks and image effects intact in history and backups. */
export const FABRIC_CUSTOM_PROPERTIES = [
  'id', 'name', 'locked', 'lockMovementX', 'lockMovementY', 'lockRotation',
  'lockScalingX', 'lockScalingY', 'lockSkewingX', 'lockSkewingY',
  'selectable', 'evented', 'hasBorders', 'hasControls',
  'clipCornerTL', 'clipCornerTR', 'clipCornerBR', 'clipCornerBL',
  'cropTop', 'cropBottom', 'cropLeft', 'cropRight',
  'fadeTop', 'fadeBottom', 'fadeLeft', 'fadeRight', 'fadeRadial',
  '_originalSrc', 'textGradient', 'curve', 'clipPath',
];

const OBJECT_TYPES = new Set([
  'rect', 'circle', 'ellipse', 'triangle', 'line', 'polyline', 'polygon',
  'path', 'text', 'i-text', 'textbox', 'image', 'group',
]);
const FILTER_TYPES = new Set([
  'grayscale', 'sepia', 'invert', 'brightness', 'contrast', 'saturation',
  'huerotation', 'blur', 'gamma', 'convolute', 'resize', 'blendcolor',
  'blendimage', 'removecolor', 'pixelate', 'composed', 'vibrance',
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const byteLength = (value: string): number => new TextEncoder().encode(value).length;

function validImageSource(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > MAX_PROJECT_FILE_BYTES) return false;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
    } catch { return false; }
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value)) return true;
  const svg = value.match(/^data:image\/svg\+xml(;charset=utf-8)?(;base64)?,(.*)$/is);
  if (!svg) return false;
  try {
    const source = svg[2] ? atob(svg[3]) : decodeURIComponent(svg[3]);
    // SVG uploads are supported, but active content and external references are not.
    return !/<!DOCTYPE|<!ENTITY|<script|<foreignObject|\son[a-z]+\s*=|javascript:|(?:href|src)\s*=\s*["']\s*(?!#)|url\(\s*["']?\s*(?!#)/i.test(source);
  } catch { return false; }
}

function validateTree(root: unknown): void {
  let nodes = 0;
  const stack: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }];
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (++nodes > 100_000 || depth > 40) throw new Error('Project structure is too complex.');
    if (typeof value === 'string') {
      if (value.length > MAX_PROJECT_FILE_BYTES) throw new Error('Project text is too large.');
      continue;
    }
    if (value === null || typeof value !== 'object') {
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid number in project.');
      continue;
    }
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Unsafe project property.');
      if (['src', '_originalSrc', 'source'].includes(key) && !validImageSource(child)) {
        throw new Error('Project contains an unsupported or unsafe image source.');
      }
      stack.push({ value: child, depth: depth + 1 });
    }
  }
}

function validateObject(value: unknown, budget = { count: 0 }, depth = 0): void {
  if (!isRecord(value) || typeof value.type !== 'string' || depth > 20 || ++budget.count > 2000) {
    throw new Error('Project contains an invalid or excessive object tree.');
  }
  const type = value.type.toLowerCase();
  if (!OBJECT_TYPES.has(type)) throw new Error(`Unsupported object type: ${value.type}`);
  for (const key of ['left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'opacity', 'strokeWidth', 'radius', 'rx', 'ry', 'fontSize']) {
    const number = value[key];
    if (number === undefined) continue;
    if (typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > 1_000_000) {
      throw new Error(`Invalid object ${key}.`);
    }
    if (['width', 'height', 'strokeWidth', 'radius', 'rx', 'ry', 'fontSize'].includes(key) && number < 0) throw new Error(`Negative object ${key}.`);
    if (['scaleX', 'scaleY'].includes(key) && number === 0) throw new Error('Object scale cannot be zero.');
    if (key === 'opacity' && (number < 0 || number > 1)) throw new Error('Invalid opacity.');
  }
  if (value.text !== undefined && (typeof value.text !== 'string' || value.text.length > 100_000)) throw new Error('Invalid text.');
  if (type === 'image' && !validImageSource(value.src)) throw new Error('Invalid image source.');
  if (value.objects !== undefined) {
    if (type !== 'group' || !Array.isArray(value.objects)) throw new Error('Invalid group.');
    value.objects.forEach(child => validateObject(child, budget, depth + 1));
  }
  if (value.clipPath !== undefined) validateObject(value.clipPath, budget, depth + 1);
  if (value.filters !== undefined) {
    if (!Array.isArray(value.filters) || value.filters.length > 40) throw new Error('Invalid filters.');
    for (const filter of value.filters) {
      if (!isRecord(filter) || typeof filter.type !== 'string' || !FILTER_TYPES.has(filter.type.toLowerCase())) throw new Error('Unsupported image filter.');
    }
  }
}

export function validateCanvasData(value: unknown): void {
  if (!isRecord(value) || !Array.isArray(value.objects)) throw new Error('Missing canvas objects.');
  value.objects.forEach(object => validateObject(object));
  if (value.backgroundImage !== undefined) validateObject(value.backgroundImage);
  validateTree(value);
}

function validatePages(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 50) throw new Error('Invalid pages.');
  const ids = new Set<string>();
  for (const page of value) {
    if (!isRecord(page) || typeof page.id !== 'string' || ids.has(page.id) || typeof page.title !== 'string' || page.title.length > 160) throw new Error('Invalid page metadata.');
    ids.add(page.id);
    if (page.canvasData !== undefined) validateCanvasData(page.canvasData);
  }
}

/** Backups contain editable fabric data, not a flattened screenshot. */
export function createProjectFile(project: ProjectItem): string {
  validateCanvasData(project.canvasData);
  validatePages(project.pages);
  if (!Number.isFinite(project.width) || !Number.isFinite(project.height) || project.width < 50 || project.height < 50 || project.width > 5000 || project.height > 5000) throw new Error('Invalid canvas dimensions.');
  const json = JSON.stringify({
    format: PROJECT_FILE_FORMAT,
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    project: {
      title: project.title.slice(0, 160),
      width: project.width,
      height: project.height,
      category: project.category.slice(0, 80),
      canvasData: project.canvasData,
      ...(project.pages ? { pages: project.pages } : {}),
    },
  });
  if (byteLength(json) > MAX_PROJECT_FILE_BYTES) throw new Error('Project file is too large (maximum 12 MB).');
  return json;
}

/** Import as a NEW project: never overwrite an existing design or trust its id. */
export function parseProjectFile(text: string): ProjectItem {
  if (byteLength(text) > MAX_PROJECT_FILE_BYTES) throw new Error('Project file is too large (maximum 12 MB).');
  let file: unknown;
  try { file = JSON.parse(text); } catch { throw new Error('The file is not valid JSON.'); }
  if (!isRecord(file) || file.format !== PROJECT_FILE_FORMAT || file.version !== PROJECT_FILE_VERSION) throw new Error('Choose a supported UniTool DesignCraft backup (.json).');
  const project = file.project;
  if (!isRecord(project) || typeof project.title !== 'string' || !project.title.trim() || project.title.length > 160 ||
      typeof project.width !== 'number' || typeof project.height !== 'number' ||
      !Number.isInteger(project.width) || !Number.isInteger(project.height) ||
      project.width < 50 || project.height < 50 || project.width > 5000 || project.height > 5000 ||
      typeof project.category !== 'string' || project.category.length > 80) {
    throw new Error('Invalid project metadata or dimensions.');
  }
  validateCanvasData(project.canvasData);
  validatePages(project.pages);
  const now = Date.now();
  return {
    id: `proj-${now}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    title: project.title.trim(), width: project.width, height: project.height,
    category: project.category, canvasData: project.canvasData,
    ...(project.pages ? { pages: project.pages as ProjectItem['pages'] } : {}),
    createdAt: now, updatedAt: now,
  };
}

export function projectFileName(title: string): string {
  return `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 100) || 'design'}.unitool.json`;
}

export function downloadProjectFile(project: ProjectItem): void {
  const blob = new Blob([createProjectFile(project)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = projectFileName(project.title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
