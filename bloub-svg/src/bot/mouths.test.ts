import { describe, expect, it } from 'vitest'
import { DEFAULT_MOUTH, MOUTHS, MOUTH_BY_ID } from './mouths'

/**
 * La bouche est un trou du masque : un `d` mal forme ne se verrait pas a la
 * compilation, il produirait un trou silencieusement casse — d'ou ces verrous
 * de forme sur le catalogue.
 */
describe('catalogue des bouches', () => {
  it('existe, avec des identifiants uniques et un defaut present', () => {
    expect(MOUTHS.length).toBeGreaterThan(1)
    expect(new Set(MOUTHS.map((m) => m.id)).size).toBe(MOUTHS.length)
    expect(MOUTH_BY_ID.get(DEFAULT_MOUTH)?.id).toBe('aucun')
  })

  it('trace chaque bouche non vide, et trace ou remplit — jamais les deux vides', () => {
    for (const m of MOUTHS) {
      if (m.id === 'aucun') {
        expect(m.d).toBe('')
        continue
      }
      // un chemin ferme par une commande M... et qui revient
      expect(m.d.startsWith('M'), m.id).toBe(true)
      if (m.fill) {
        expect(m.d.endsWith('Z'), `${m.id} : pleine mais pas fermee`).toBe(true)
      } else {
        expect(m.w ?? 0, `${m.id} : tracee sans epaisseur`).toBeGreaterThan(0)
      }
    }
  })
})
