import { MAX_ART_MARKUP_BYTES } from '@/bot/art'

const SVG_NS = 'http://www.w3.org/2000/svg'
let importSequence = 0
const SAFE_ELEMENTS = new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'text',
  'tspan'
])
const SAFE_ATTRIBUTES = new Set([
  'viewBox', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height', 'd', 'points', 'fill', 'fill-rule', 'fill-opacity',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform', 'offset',
  'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'spreadMethod',
  'clip-path', 'mask', 'id', 'font-size', 'font-family', 'font-weight',
  'text-anchor', 'dominant-baseline'
])

export interface ImportedSvg {
  content: string
  viewBox: string
  colors: Array<{ source: string; target: string }>
}

function safePaint(value: string): boolean {
  return /^(?:none|transparent|currentcolor|#[\da-f]{3,8}|rgba?\([#\da-z.% ,/-]+\)|[a-z]{1,20}|url\(#[\w:.-]+\))$/i.test(value)
}

function safeAttribute(name: string, value: string): boolean {
  if (!SAFE_ATTRIBUTES.has(name) || name.toLowerCase().startsWith('on')) return false
  if (['fill', 'stroke', 'stop-color', 'clip-path', 'mask'].includes(name)) return safePaint(value)
  if (name === 'id') return /^[\w:.-]{1,128}$/.test(value)
  return !/javascript:|data:|https?:|url\((?!#[\w:.-]+\))/i.test(value)
}

function sanitizeElement(element: Element): boolean {
  if (element.namespaceURI !== SVG_NS || !SAFE_ELEMENTS.has(element.localName)) {
    element.remove()
    return false
  }
  for (const attribute of [...element.attributes]) {
    if (!safeAttribute(attribute.name, attribute.value)) element.removeAttribute(attribute.name)
  }
  for (const child of [...element.children]) sanitizeElement(child)
  return true
}

export function sanitizeSvg(source: string): ImportedSvg | null {
  if (new TextEncoder().encode(source).byteLength > MAX_ART_MARKUP_BYTES) return null
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml')
  const root = doc.documentElement
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS || doc.querySelector('parsererror')) return null

  const rawViewBox = root.getAttribute('viewBox')
  const dimensions = rawViewBox?.trim().split(/[\s,]+/).map(Number)
  const viewBox =
    dimensions?.length === 4 &&
    dimensions.every(Number.isFinite) &&
    dimensions[2]! > 0 &&
    dimensions[3]! > 0 &&
    dimensions.every((n) => Math.abs(n) <= 1_000_000)
      ? dimensions.join(' ')
      : null
  if (!viewBox) return null

  for (const attribute of [...root.attributes]) {
    if (attribute.name !== 'viewBox' && !SAFE_ATTRIBUTES.has(attribute.name)) {
      root.removeAttribute(attribute.name)
    }
  }
  for (const child of [...root.children]) sanitizeElement(child)

  const prefix = `unitool-${++importSequence}-`
  const ids = new Map<string, string>()
  for (const element of [root, ...root.querySelectorAll('[id]')]) {
    const id = element.getAttribute('id')
    if (id) {
      const renamed = `${prefix}${id}`.slice(0, 128)
      ids.set(id, renamed)
      element.setAttribute('id', renamed)
    }
  }
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attribute of ['fill', 'stroke', 'clip-path', 'mask']) {
      const value = element.getAttribute(attribute)
      const match = value?.match(/^url\(#([\w:.-]+)\)$/)
      const renamed = match && ids.get(match[1]!)
      if (renamed) element.setAttribute(attribute, `url(#${renamed})`)
    }
  }

  const colorSet = new Set<string>()
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attribute of ['fill', 'stroke', 'stop-color']) {
      const value = element.getAttribute(attribute)
      if (value && safePaint(value) && !/^(none|transparent|currentcolor|url\()/i.test(value)) {
        colorSet.add(value)
      }
    }
  }

  const wrapper = doc.createElementNS(SVG_NS, 'g')
  for (const attribute of [...root.attributes]) {
    if (attribute.name !== 'viewBox' && attribute.name !== 'xmlns') {
      wrapper.setAttribute(attribute.name, attribute.value)
    }
  }
  while (root.firstChild) wrapper.append(root.firstChild)

  return {
    content: new XMLSerializer().serializeToString(wrapper),
    viewBox,
    colors: [...colorSet].slice(0, 16).map((source) => ({ source, target: source }))
  }
}

export function sanitizeSvgContent(content: string, viewBox: string): ImportedSvg | null {
  const escapedViewBox = viewBox.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
  return sanitizeSvg(`<svg xmlns="${SVG_NS}" viewBox="${escapedViewBox}">${content}</svg>`)
}

export async function readSvgFile(file: File): Promise<ImportedSvg> {
  if (file.size > MAX_ART_MARKUP_BYTES) throw new Error('SVG file is larger than 150 KB')
  if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') throw new Error('Choose an SVG file')
  const imported = sanitizeSvg(await file.text())
  if (!imported) throw new Error('The SVG file is invalid or contains unsupported content')
  return imported
}
