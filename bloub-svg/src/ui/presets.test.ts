import { describe, expect, it } from 'vitest'
import { minDurationOf } from '@/bot/cycles'
import { SEQUENCE } from '@/bot/states'
import { PRESETS } from './presets'

/**
 * Les presets sont ecrits a la main : exactement le genre de donnees qui
 * derive. Un etat renomme ailleurs, une duree tapee sous le plancher moteur —
 * et la galerie livre des montages que le lecteur rejoue mal.
 */
describe('presets de la galerie', () => {
  it('existe, avec des identifiants uniques', () => {
    expect(PRESETS.length).toBeGreaterThan(0)
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
  })

  it('ne contient que des etats du catalogue, sans repetition consecutive', () => {
    for (const p of PRESETS) {
      expect(p.blocks.length, p.id).toBeGreaterThan(0)
      for (let i = 0; i < p.blocks.length; i++) {
        expect(SEQUENCE, `${p.id}[${i}]`).toContain(p.blocks[i]!.state)
        if (i > 0) {
          expect(p.blocks[i]!.state, `${p.id}[${i}]`).not.toBe(p.blocks[i - 1]!.state)
        }
      }
    }
  })

  it('respecte le plancher moteur sur chaque duree', () => {
    for (const p of PRESETS) {
      for (const b of p.blocks) {
        expect(b.duration, `${p.id}/${b.state}`).toBeGreaterThanOrEqual(minDurationOf(b.state))
      }
    }
  })
})
