import { afterEach, describe, expect, it } from 'vitest'
import { sanitizeSvg, sanitizeSvgContent } from './svg-import'

const svg = (content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">${content}</svg>`

describe('SVG import sanitization', () => {
  afterEach(() => document.body.replaceChildren())

  it('keeps editable vector paths and identifies their colors', () => {
    const imported = sanitizeSvg(svg('<path fill="#123456" d="M0 0h10v10z"/>'))
    expect(imported?.viewBox).toBe('0 0 100 50')
    expect(imported?.colors).toEqual([{ source: '#123456', target: '#123456' }])
    expect(imported?.content).toContain('fill="#123456"')
  })

  it('preserves inherited root paint values on imported artwork', () => {
    const imported = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" fill="#123456"><path d="M0 0h10v10z"/></svg>'
    )
    expect(imported?.colors).toEqual([{ source: '#123456', target: '#123456' }])
    expect(imported?.content).toContain('fill="#123456"')
  })

  it('sanitizes persisted SVG fragments before they are rendered', () => {
    const imported = sanitizeSvgContent(
      '<script>alert(1)</script><path onclick="alert(1)" fill="#123456" d="M0 0h1v1z"/>',
      '0 0 10 10'
    )
    expect(imported?.content).toContain('<path')
    expect(imported?.content).not.toMatch(/script|onclick/i)
  })

  it('removes scripts, event handlers, foreign content and external references', () => {
    const imported = sanitizeSvg(svg(
      '<script>alert(1)</script><foreignObject><div>bad</div></foreignObject>' +
      '<path onclick="alert(1)" fill="url(https://evil.test/a)" d="M0 0h1v1z"/>'
    ))
    expect(imported?.content).not.toMatch(/script|foreignObject|onclick|evil\.test/i)
    expect(imported?.content).toContain('<path')
  })

  it('rejects malformed documents and invalid view boxes', () => {
    expect(sanitizeSvg('<svg><path></svg>')).toBeNull()
    expect(sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 2"/>')).toBeNull()
  })

  it('rejects oversized SVG files', () => {
    expect(sanitizeSvg(svg(`<text>${'x'.repeat(160_000)}</text>`))).toBeNull()
  })
})
