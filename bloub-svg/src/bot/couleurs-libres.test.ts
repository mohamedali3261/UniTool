import { describe, expect, it } from 'vitest'
import { COLORS, DEFAULT_COLOR, estCouleur, estCouleurLibre } from './skins'

/**
 * La valeur stockee d'une couleur est soit un id de la palette, soit un hex
 * libre pose par le selecteur du navigateur. Le validateur est la seule porte :
 * s'il laisse passer un bricolage, il revient au rendu SVG avec une chaine
 * arbitraire pour teinte de corps.
 */
describe('couleurs libres du personnalisateur', () => {
  it('reconnait les ids de la palette et le defaut', () => {
    for (const c of COLORS) expect(estCouleur(c.id)).toBe(true)
    expect(estCouleur(DEFAULT_COLOR)).toBe(true)
  })

  it('reconnait exactement les hex #rrggbb', () => {
    expect(estCouleurLibre('#3b93f0')).toBe(true)
    expect(estCouleurLibre('#000000')).toBe(true)
    // trois ou huit chiffres, ou sans diese : non
    expect(estCouleurLibre('#fff')).toBe(false)
    expect(estCouleurLibre('#3b93f0ff')).toBe(false)
    expect(estCouleurLibre('3b93f0')).toBe(false)
    expect(estCouleurLibre('bleu')).toBe(false)
  })

  it('accepte un hex libre comme couleur complete', () => {
    expect(estCouleur('#ff8800')).toBe(true)
    // majuscules : le selecteur du navigateur rend en minuscules, on ne les
    // tolere pas ici pour que stockage et rendu restent canoniques
    expect(estCouleur('#FF8800')).toBe(false)
  })
})
