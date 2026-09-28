import { describe, expect, it } from 'vitest'
import { MAX_BLOCS, clampDuration, type Block } from '@/bot/cycles'
import { SEQUENCE, type StateId } from '@/bot/states'
import { decoderMontage, encoderMontage, jsonVersMontage, montageVersJson } from './partage'

/**
 * Le partage vit a cote du stockage et sous la meme loi : l'entree (l'URL ici,
 * le localStorage la-bas) est modifiable a la main, donc tout ce qui ne se relit
 * pas est jete plutot que de casser le lecteur.
 */
const bloc = (state: string, duration: number): Block => ({
  state: state as StateId,
  duration
})

describe('aller-retour', () => {
  it('restitue exactement les blocs encodes', () => {
    // des durees deja dans les bornes : la relecture clampe comme le stockage,
    // un lien ne doit pas pouvoir contourner le plancher du moteur
    const blocs = [bloc('idle', 2), bloc('orbit', 3.4), bloc('burst', 2.4)]
    expect(decoderMontage(encoderMontage(blocs))).toEqual(blocs)
  })

  it('ne depend pas de l ordre des caracteres speciaux de la base64', () => {
    // un code riche en `+`, `/` et `=` doit survivre au passage base64url
    const blocs = SEQUENCE.slice(0, 12).map((s, i) =>
      bloc(s, clampDuration(s as StateId, 1 + i * 0.7))
    )
    const code = encoderMontage(blocs)
    expect(code).not.toMatch(/[+/=]/)
    expect(decoderMontage(code)).toEqual(blocs.map((b) => ({ ...b })))
  })

  it('produit un code utilisable dans un fragment d URL', () => {
    // le fragment est relu par URLSearchParams : il ne doit contenir que ce qui
    // y survit — lettres, chiffres, tiret et souligne
    const code = encoderMontage([bloc('comet', 5), bloc('egg', 2.1)])
    expect(code).toMatch(/^[\w-]+$/)
  })
})

describe('lecture hostile', () => {
  it('jette les codes illisibles', () => {
    expect(decoderMontage('')).toBe(null)
    expect(decoderMontage('pas un code')).toBe(null)
    expect(decoderMontage('####')).toBe(null)
  })

  it('jette une version inconnue ou une charge mal formee', () => {
    const faux = (contenu: object) => {
      let binaire = ''
      for (const octet of new TextEncoder().encode(JSON.stringify(contenu)))
        binaire += String.fromCharCode(octet)
      return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_')
    }
    expect(decoderMontage(faux({ v: 99, b: [['idle', 2]] }))).toBe(null)
    expect(decoderMontage(faux({ v: 1 }))).toBe(null)
    expect(decoderMontage(faux({ v: 1, b: 'idle' }))).toBe(null)
  })

  it('jette les etats hors catalogue, swirl compris', () => {
    const code = encoderMontage([bloc('swirl', 2), bloc('inconnu', 2)])
    expect(decoderMontage(code)).toBe(null)
  })

  it('ramene les durees dans les bornes de l editeur', () => {
    const lu = decoderMontage(encoderMontage([bloc('idle', 9999)]))
    expect(lu).toEqual([{ state: 'idle', duration: clampDuration('idle', 9999) }])
    expect(lu![0]!.duration).toBeLessThanOrEqual(10)
  })

  it('plafonne le nombre de blocs relus', () => {
    const trop = Array.from({ length: MAX_BLOCS + 50 }, () => bloc('idle', 2))
    expect(decoderMontage(encoderMontage(trop))!.length).toBe(MAX_BLOCS)
  })
})

describe('fichier JSON', () => {
  const blocs = [bloc('idle', 2), bloc('orbit', 3.5)]

  it('fait un aller-retour lisible, avec le nom', () => {
    const texte = montageVersJson({ name: 'Mon essai', blocks: blocs })
    // une archive se relit a l oeil : du JSON indente, pas une chaine compacte
    expect(texte).toContain('\n')
    const lu = jsonVersMontage(texte)!
    expect(lu.name).toBe('Mon essai')
    expect(lu.blocks).toEqual(blocs)
  })

  it('accepte un nom absent et le rend vide, jamais undefined', () => {
    const lu = jsonVersMontage(montageVersJson({ name: '', blocks: blocs }))
    expect(lu!.name).toBe('')
  })

  it('jette un fichier inconnu, sans version ou avec des blocs pourris', () => {
    expect(jsonVersMontage('pas du json')).toBe(null)
    expect(jsonVersMontage('{}')).toBe(null)
    expect(jsonVersMontage(JSON.stringify({ v: 99, b: [['idle', 2]] }))).toBe(null)
    expect(jsonVersMontage(JSON.stringify({ v: 1, b: 'rien' }))).toBe(null)
  })

  it('clamp les durees d un fichier bricole a la main, comme le lien', () => {
    const lu = jsonVersMontage(JSON.stringify({ v: 1, b: [['idle', 999]] }))!
    expect(lu.blocks[0]!.duration).toBe(clampDuration('idle', 999))
  })

  it('preserves custom SVG elements in JSON project backups', () => {
    const elements = [{
      id: 'art-1',
      kind: 'svg' as const,
      name: 'Badge',
      content: '<path fill="#123456" d="M0 0h10v10z"/>',
      viewBox: '0 0 10 10',
      text: '',
      colors: [{ source: '#123456', target: '#abcdef' }],
      color: '#123456',
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      rotation: 0,
      start: 0,
      duration: 2,
      visible: true
    }]
    const lu = jsonVersMontage(montageVersJson({ name: 'Art', blocks: blocs, elements }))!
    expect(lu.elements).toHaveLength(1)
    expect(lu.elements![0]!.colors).toEqual([{ source: '#123456', target: '#abcdef' }])
    expect(lu.elements![0]!.content).toContain('<path')
  })

  it('refuses incomplete, excessive or oversized custom-element backups', () => {
    expect(jsonVersMontage(JSON.stringify({
      v: 1,
      b: [['idle', 2]],
      elements: [{ id: 'invalid' }]
    }))).toBe(null)
    expect(jsonVersMontage(' '.repeat(1_000_001))).toBe(null)
  })
})
