export type LogoMark = 'orbit' | 'spark' | 'diamond' | 'bolt';
export type LogoLayout = 'horizontal' | 'stacked';
export type LogoFont = 'sans' | 'serif' | 'mono';

export interface LogoDesign {
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  mark: LogoMark;
  layout: LogoLayout;
  font: LogoFont;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${xml(`${design.name}${design.tagline ? ` — ${design.tagline}` : ''}`)}">
<defs><linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${design.primary}"/><stop offset="100%" stop-color="${design.secondary}"/></linearGradient></defs>
<g transform="translate(${markX} ${markY}) scale(${markSize / 100})">${markSvg(design.mark, 'url(#brand-gradient)')}</g>
<text x="${textX}" y="${nameY}" fill="url(#brand-gradient)" font-family="${font}" font-size="${nameSize}" font-weight="700" letter-spacing="-.7"${horizontal ? '' : ' text-anchor="middle"'}${direction}>${xml(design.name || 'Your Brand')}</text>
${design.tagline ? `<text x="${textX}" y="${taglineY}" fill="${design.secondary}" font-family="${font}" font-size="${horizontal ? 15 : 14}" letter-spacing="1.4"${horizontal ? '' : ' text-anchor="middle"'}${taglineDirection}>${xml(design.tagline)}</text>` : ''}
</svg>`;
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
