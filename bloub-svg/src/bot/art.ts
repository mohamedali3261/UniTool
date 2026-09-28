export type ArtKind = 'svg' | 'text'

export interface ArtElement {
  id: string
  kind: ArtKind
  name: string
  content: string
  viewBox: string
  text: string
  colors: Array<{ source: string; target: string }>
  color: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  start: number
  duration: number
  visible: boolean
}

export const MAX_ART_ELEMENTS = 20
export const MAX_ART_MARKUP_BYTES = 150_000
export const MAX_CYCLE_ART_BYTES = 400_000
export const MAX_ART_TEXT_LENGTH = 500

export function clampArtTime(value: number): number {
  return Math.round(Math.max(0, Math.min(3600, value)) * 100) / 100
}

export function artOpacity(time: number, start: number, duration: number): number {
  const elapsed = time - start
  if (elapsed < 0 || elapsed > duration) return 0
  const edge = Math.min(0.18, duration / 4)
  return Math.min(1, elapsed / edge, (duration - elapsed) / edge)
}

export function makeArtElement(kind: ArtKind, start: number, name: string): ArtElement {
  return {
    id: crypto.randomUUID(),
    kind,
    name,
    content: '',
    viewBox: '0 0 100 100',
    text: kind === 'text' ? 'UniTool' : '',
    colors: [],
    color: '#17203a',
    x: -45,
    y: -25,
    width: 90,
    height: 50,
    rotation: 0,
    start: clampArtTime(start),
    duration: 3,
    visible: true
  }
}

export function recolorSvg(markup: string, colors: ArtElement['colors']): string {
  if (!colors.length) return markup
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return ''
  const replacements = new Map(colors.map(({ source, target }) => [source.toLowerCase(), target]))
  for (const element of [...doc.documentElement.querySelectorAll('*')]) {
    for (const attribute of ['fill', 'stroke', 'stop-color']) {
      const value = element.getAttribute(attribute)
      if (value) {
        const replacement = replacements.get(value.toLowerCase())
        if (replacement) element.setAttribute(attribute, replacement)
      }
    }
  }
  return [...doc.documentElement.childNodes]
    .map((node) => new XMLSerializer().serializeToString(node))
    .join('')
}
