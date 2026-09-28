import { describe, expect, it } from 'vitest'
import { choisirTheme, estTheme, THEMES } from './themes'

/**
 * La regle est separee du module reactif (`theme.ts` lit `localStorage` et
 * `matchMedia` a l'import) pour pouvoir etre testee ici, sans navigateur.
 */
describe('choix du theme au demarrage', () => {
  it('respecte le choix memorise, quel que soit le reglage systeme', () => {
    expect(choisirTheme('nuit', false)).toBe('nuit')
    expect(choisirTheme('jour', true)).toBe('jour')
  })

  it('ignore un choix memorise qui n est pas un theme connu', () => {
    // le localStorage se modifie a la main : on ne lui fait pas confiance
    expect(choisirTheme('sombre', true)).toBe('nuit')
    expect(choisirTheme('', false)).toBe('jour')
    expect(choisirTheme(null, true)).toBe('nuit')
  })

  it('suit le systeme quand rien n a ete tranche', () => {
    expect(choisirTheme(null, false)).toBe('jour')
    expect(choisirTheme(undefined, true)).toBe('nuit')
  })
})

describe('catalogue des themes', () => {
  it('propose jour et nuit, avec un glyphe decoratif', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['jour', 'nuit'])
    for (const t of THEMES) expect(t.emoji.length).toBeGreaterThan(0)
  })

  it('reconnait ses identifiants et refuse le reste', () => {
    expect(estTheme('jour')).toBe(true)
    expect(estTheme('nuit')).toBe(true)
    expect(estTheme('dark')).toBe(false)
    expect(estTheme('')).toBe(false)
    expect(estTheme(null)).toBe(false)
  })
})
