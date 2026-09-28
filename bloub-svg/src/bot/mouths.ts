/**
 * Les bouches du personnalisateur : une seconde couche de visage, independante
 * des expressions (qui ne jouent que sur les yeux).
 *
 * Une bouche est un TROU de plus dans le masque — meme mecanisme que les yeux :
 * elle laisse voir le fond, donc elle reste coherente sur n'importe quelle
 * couleur de corps et dans tout export. Les traces sont ecrits en unites de
 * rayon de boule, centre sur le point de la bouche (`mouthPose`), y vers le bas.
 *
 * `fill` distingue les bouches tracees (arc de sourire) des bouches pleines
 * (bouche ouverte du rire) ; `w` est l'epaisseur du trait pour les premieres.
 */
export type MouthId = 'aucun' | 'sourire' | 'rire' | 'afflige' | 'etonne'

export interface BotMouth {
  id: MouthId
  /** trace local, centre origine ; vide pour « aucun » */
  d: string
  fill?: boolean
  w?: number
}

export const MOUTHS: BotMouth[] = [
  { id: 'aucun', d: '' },
  {
    id: 'sourire',
    d: 'M-0.16 -0.02 Q0 0.10 0.16 -0.02',
    w: 0.05
  },
  {
    id: 'rire',
    // l'arc superieur sourit deja : la cavite s'ouvre dessous, pleine
    d: 'M-0.17 -0.02 Q0 0.07 0.17 -0.02 Q0.13 0.22 0 0.22 Q-0.13 0.22 -0.17 -0.02 Z',
    fill: true
  },
  {
    id: 'afflige',
    d: 'M-0.14 0.05 Q0 -0.06 0.14 0.05',
    w: 0.05
  },
  {
    id: 'etonne',
    d: 'M-0.085 0 A0.085 0.105 0 1 1 0.085 0 A0.085 0.105 0 1 1 -0.085 0 Z',
    fill: true
  }
]

export const MOUTH_BY_ID = new Map<string, BotMouth>(MOUTHS.map((m) => [m.id, m]))
export const DEFAULT_MOUTH: MouthId = 'aucun'
