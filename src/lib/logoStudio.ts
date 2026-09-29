export type LogoMark = 'orbit' | 'spark' | 'diamond' | 'bolt';
export type LogoLayout = 'horizontal' | 'stacked';
export type LogoFont = 'sans' | 'serif' | 'mono';
export type LogoElementType = 'circle' | 'square' | 'triangle' | 'star' | 'text' | 'svg';

export interface LogoElement {
  id: string;
  name: string;
  type: LogoElementType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  color: string;
  text: string;
  svg: string;
  viewBox: string;
}

export interface LogoDesign {
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  mark: LogoMark;
  layout: LogoLayout;
  font: LogoFont;
  elements: LogoElement[];
}

const xml = (value: string) => value.replace(/[<>&'"]/g, (char) => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
}[char]!));

const FONT_FAMILY: Record<LogoFont, string> = {
  sans: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, Times New Roman, serif',
  mono: 'Courier New, monospace',
};

function markSvg(mark: LogoMark, color: string): string {
  const fill = `fill="${color}"`;
  switch (mark) {
    case 'spark':
      return `<path ${fill} d="M50 4 60 38 94 50 60 62 50 96 40 62 6 50 40 38Z"/><circle cx="50" cy="50" r="9" fill="#0F1115"/>`;
    case 'diamond':
      return `<path ${fill} d="M50 4 91 50 50 96 9 50Z"/><path fill="#0F1115" d="m50 23 24 27-24 27-24-27Z"/>`;
    case 'bolt':
      return `<path ${fill} d="M57 3 19 54h25l-5 43 38-54H52Z"/>`;
    default:
      return `<circle cx="50" cy="50" r="43" ${fill}/><circle cx="50" cy="50" r="26" fill="#0F1115"/><circle cx="68" cy="30" r="8" fill="#fff"/>`;
  }
}

export function makeLogoSvg(design: LogoDesign): string {
  const horizontal = design.layout === 'horizontal';
  const viewBox = horizontal ? '0 0 560 160' : '0 0 360 300';
  const markSize = horizontal ? 112 : 120;
  const markX = horizontal ? 22 : 120;
  const markY = horizontal ? 24 : 18;
  const textX = horizontal ? 158 : 180;
  const nameY = horizontal ? 83 : 190;
  const nameSize = horizontal ? 42 : 38;
  const taglineY = horizontal ? 117 : 226;
  const font = FONT_FAMILY[design.font];
  const direction = /[\u0600-\u06FF]/.test(design.name) ? ' direction="rtl" unicode-bidi="plaintext"' : '';
  const taglineDirection = /[\u0600-\u06FF]/.test(design.tagline) ? ' direction="rtl" unicode-bidi="plaintext"' : '';
  const centerX = horizontal ? markX + markSize / 2 : 180;
  const centerY = markY + markSize / 2;
  const layers = design.elements.map(element => {
    const transform = `translate(${centerX + element.x} ${centerY + element.y}) rotate(${element.rotation}) scale(${element.size / 100})`;
    const opacity = Math.max(0, Math.min(1, element.opacity));
    let shape = '';

    switch (element.type) {
      case 'circle':
        shape = `<circle cx="0" cy="0" r="40" fill="${element.color}"/>`;
        break;
      case 'square':
        shape = `<rect x="-36" y="-36" width="72" height="72" rx="10" fill="${element.color}"/>`;
        break;
      case 'triangle':
        shape = `<path d="M0-44 42 32H-42Z" fill="${element.color}"/>`;
        break;
      case 'star':
        shape = `<path d="M0-46 11-15 44-14 18 6 27 39 0 20-27 39-18 6-44-14-11-15Z" fill="${element.color}"/>`;
        break;
      case 'text':
        shape = `<text x="0" y="8" text-anchor="middle" fill="${element.color}" font-family="${FONT_FAMILY[design.font]}" font-size="26" font-weight="700">${xml(element.text || element.name)}</text>`;
        break;
      case 'svg':
        shape = `<svg x="-50" y="-50" width="100" height="100" viewBox="${xml(element.viewBox)}" preserveAspectRatio="xMidYMid meet">${element.svg}</svg>`;
        break;
    }

    return `<g id="layer-${xml(element.id)}" data-name="${xml(element.name)}" opacity="${opacity}" transform="${transform}">${shape}</g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${xml(`${design.name}${design.tagline ? ` — ${design.tagline}` : ''}`)}">
<defs><linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${design.primary}"/><stop offset="100%" stop-color="${design.secondary}"/></linearGradient></defs>
<g transform="translate(${markX} ${markY}) scale(${markSize / 100})">${markSvg(design.mark, 'url(#brand-gradient)')}</g>
${layers}
<text x="${textX}" y="${nameY}" fill="url(#brand-gradient)" font-family="${font}" font-size="${nameSize}" font-weight="700" letter-spacing="-.7"${horizontal ? '' : ' text-anchor="middle"'}${direction}>${xml(design.name || 'Your Brand')}</text>
${design.tagline ? `<text x="${textX}" y="${taglineY}" fill="${design.secondary}" font-family="${font}" font-size="${horizontal ? 15 : 14}" letter-spacing="1.4"${horizontal ? '' : ' text-anchor="middle"'}${taglineDirection}>${xml(design.tagline)}</text>` : ''}
</svg>`;
}

const SAFE_SVG_TAGS = new Set(['g', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon']);
const SAFE_SVG_ATTRIBUTES = new Set([
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2',
  'width', 'height', 'points', 'fill', 'fill-rule', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'opacity', 'transform', 'viewBox',
]);

export function sanitizeImportedSvg(source: string): { svg: string; viewBox: string } {
  if (new Blob([source]).size > 150_000) throw new Error('SVG file exceeds the 150 KB limit.');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = document.documentElement;
  if (
    root.localName !== 'svg' ||
    (root.namespaceURI !== null && root.namespaceURI !== 'http://www.w3.org/2000/svg') ||
    document.querySelector('parsererror')
  ) {
    throw new Error('The selected file is not valid SVG.');
  }

  const viewBox = root.getAttribute('viewBox') ?? '0 0 100 100';
  const dimensions = viewBox.trim().split(/[,\s]+/).map(Number);
  if (dimensions.length !== 4 || dimensions.some(value => !Number.isFinite(value)) || dimensions[2] <= 0 || dimensions[3] <= 0) {
    throw new Error('The SVG must have a valid viewBox.');
  }

  const elements = [...root.querySelectorAll('*')];
  if (elements.length > 200) throw new Error('SVG files can contain at most 200 vector elements.');
  for (const element of elements) {
    if (
      (element.namespaceURI !== null && element.namespaceURI !== 'http://www.w3.org/2000/svg') ||
      !SAFE_SVG_TAGS.has(element.localName)
    ) {
      throw new Error(`Unsupported SVG element: ${element.localName}.`);
    }
    for (const attribute of [...element.attributes]) {
      if (!SAFE_SVG_ATTRIBUTES.has(attribute.name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (/url\s*\(|javascript:|https?:|data:/i.test(attribute.value)) {
        throw new Error('External references are not allowed in imported SVG.');
      }
    }
  }

  return {
    svg: [...root.childNodes].map(node => new XMLSerializer().serializeToString(node)).join(''),
    viewBox,
  };
}

function kotlinString(value: string): string {
  return JSON.stringify(value).replace(/\$/g, '\\$');
}

export function makeKotlinExport(svg: string): string {
  return `package com.example.brand

import android.graphics.Color as AndroidColor
import android.util.Base64
import android.webkit.WebView
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

// Keep the original vector artwork sharp at every display size.
private const val BRAND_LOGO_SVG = ${kotlinString(svg)}

@Composable
fun BrandLogo(modifier: Modifier = Modifier) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            val encodedSvg = Base64.encodeToString(
                BRAND_LOGO_SVG.toByteArray(Charsets.UTF_8),
                Base64.NO_WRAP
            )
            WebView(context).apply {
                setBackgroundColor(AndroidColor.TRANSPARENT)
                settings.javaScriptEnabled = false
                loadDataWithBaseURL(
                    null,
                    "<html><body style='margin:0;background:transparent'>" +
                        "<img style='width:100%;height:100%;object-fit:contain' " +
                        "src='data:image/svg+xml;base64,$encodedSvg'/></body></html>",
                    "text/html",
                    "UTF-8",
                    null
                )
            }
        }
    )
}`;
}
