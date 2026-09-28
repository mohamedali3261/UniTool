import { clampDuration, type Block } from '@/bot/cycles'
import { STATE_BY_ID, type StateId } from '@/bot/states'

/**
 * Montages prets a l'emploi du GALERIE : des enchainements curates, pas
 * generes — chacun raconte une intention (accueillir, notifier, reflechir...).
 *
 * Les durees passent par `clampDuration` comme partout : un preset ne peut pas
 * contourner le plancher moteur, meme ecrit a la main ici. Le test verrouille
 * que tout id reste dans le catalogue et que rien n'est descendu sous sa mesure.
 */
/** Enumere : le gabarit `presets.${id}` des libelles doit compiler contre lui. */
export type PresetId =
  | 'accueil'
  | 'notifications'
  | 'reflexion'
  | 'joie'
  | 'nuit'
  | 'surprises'

export interface Preset {
  id: PresetId
  blocks: Block[]
}

/** Un bloc de preset : etat, duree optionnelle (sinon la duree mesuree). */
const bloc = (state: StateId, duree?: number): Block => ({
  state,
  duration: clampDuration(state, duree ?? STATE_BY_ID.get(state)?.duration ?? 2)
})

export const PRESETS: Preset[] = [
  {
    id: 'accueil',
    blocks: [bloc('idle'), bloc('wink'), bloc('wide', 1.5), bloc('idle', 3)]
  },
  {
    id: 'notifications',
    blocks: [
      bloc('notify'),
      bloc('alert', 1.5),
      bloc('notify'),
      bloc('exclaim', 1.5),
      bloc('idle', 2.5)
    ]
  },
  {
    // un moment de recherche, l'eclair, puis on lance
    id: 'reflexion',
    blocks: [bloc('thinking', 3), bloc('exclaim', 1.5), bloc('play', 2), bloc('idle', 2)]
  },
  {
    id: 'joie',
    blocks: [bloc('wink', 1.5), bloc('exclaim', 1.5), bloc('burst'), bloc('idle', 2)]
  },
  {
    id: 'nuit',
    blocks: [bloc('sleep', 4), bloc('idle', 1.5), bloc('sleep', 4)]
  },
  {
    id: 'surprises',
    blocks: [bloc('wide', 1.5), bloc('egg'), bloc('hexagon'), bloc('comet'), bloc('idle', 2)]
  }
]
