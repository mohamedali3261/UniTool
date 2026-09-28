import { SEQUENCE, STATES, STATE_BY_ID, type StateId } from './states'
import {
  MAX_ART_ELEMENTS,
  MAX_ART_MARKUP_BYTES,
  MAX_ART_TEXT_LENGTH,
  MAX_CYCLE_ART_BYTES,
  clampArtTime,
  type ArtElement
} from './art'
import { sanitizeSvgContent } from '../ui/svg-import'

/**
 * Un cycle est un montage : une suite de blocs, chacun un etat tenu pendant une
 * duree choisie. C'est la partie "editeur" du dossier, et elle en garde les
 * regles — donnees pures, aucune horloge, aucun import Vue : le meme cycle doit
 * pouvoir etre relu par les tests, par le lecteur et par la timeline.
 *
 * Un bloc n'a pas d'identifiant : c'est une position dans une liste, la cle de
 * rendu est l'index. Ca garde le JSON du localStorage lisible et les tests
 * deterministes.
 */
export interface Block {
  state: StateId
  duration: number
}

export interface Cycle {
  id: string
  name: string
  blocks: Block[]
  elements?: ArtElement[]
}

/**
 * Plancher commun a tous les blocs. Le moteur ne garde qu'une case d'historique
 * (`BotEngine.setState` ecrase `prev`), donc un bloc plus court que le fondu d'entree du
 * bloc suivant saute a l'image au lieu de se fondre.
 *
 * DERIVE du catalogue et non ecrit a la main. La valeur etait 0,6, ce qui marchait
 * uniquement parce que 0,6 se trouvait etre le plus long `morph` du catalogue — celui
 * d'`orbit`. Rien ne le garantissait : ajouter un etat qui morphe en 0,8 s aurait fait
 * trembler l'editeur sans qu'aucun test ne bronche. Maintenant le plancher suit.
 */
export const MIN_BLOCK = Math.max(...STATES.map((s) => s.morph))

/**
 * Garde-fou d'editeur, pas une mesure : allonger un bloc est sans risque (les
 * etats saturent leurs rampes et tiennent leur pose finale), mais une piste de
 * blocs d'une minute n'est plus lisible.
 */
export const MAX_BLOCK = 10

/**
 * Combien de blocs et de montages on accepte, a l'edition comme a la relecture.
 *
 * Ce ne sont pas des limites de produit mais des bornes contre un stockage hostile, qui
 * est modifiable et tient quelques megaoctets alors que rien en aval n'est dimensionne
 * pour ca : un seul cycle de 150 000 blocs, soit environ 4 Mo de JSON, donne 1 500 000 s
 * de duree, autant de graduations a allouer et une piste de 29 700 000 px de large.
 * L'onglet figeait en entrant dans la vue Animations.
 *
 * 200 blocs font une demi-heure de montage, largement au-dela de tout usage.
 */
export const MAX_BLOCS = 200
export const MAX_CYCLES = 50

/** Pas de la molette et du redimensionnement, en secondes. */
export const STEP = 0.1

const DEFAULT_CYCLE_ID = 'defaut'

/** Duree minimale d'un bloc : le plancher moteur, ou la mesure de l'etat. */
export function minDurationOf(state: StateId): number {
  return Math.max(MIN_BLOCK, STATE_BY_ID.get(state)?.minDuration ?? MIN_BLOCK)
}

/** Ramene une duree dans ses bornes et sur le pas, sans trainee de flottants. */
export function clampDuration(state: StateId, seconds: number): number {
  const snapped = Math.round(seconds / STEP) * STEP
  const bounded = Math.min(MAX_BLOCK, Math.max(minDurationOf(state), snapped))
  return Math.round(bounded * 100) / 100
}

export function makeBlock(state: StateId): Block {
  // la duree de reference est celle relevee sur la video pour cet etat
  return { state, duration: clampDuration(state, STATE_BY_ID.get(state)?.duration ?? 2) }
}

/**
 * Le montage releve sur la video : l'ordre de `SEQUENCE`, chaque etat tenu sa
 * duree mesuree. Il sert d'amorce au premier lancement, puis il appartient a
 * l'utilisateur — il s'edite et se stocke comme les autres. La reference, elle,
 * reste dans le code : vider le stockage la fait revenir.
 */
export function defaultCycle(): Cycle {
  return {
    /**
     * Nom vide = « jamais nomme par l'utilisateur », donc affiche dans la langue
     * courante. Ecrire ici « Cycle par defaut » l'aurait fige : le nom part au
     * localStorage des la premiere visite et redevient une donnee utilisateur,
     * que changer de langue ne retraduirait plus.
     */
    name: '',
    id: DEFAULT_CYCLE_ID,
    blocks: SEQUENCE.map(makeBlock)
  }
}

export function totalDuration(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + b.duration, 0)
}

/** Date de debut d'un bloc dans le montage. */
export function offsetOf(blocks: Block[], index: number): number {
  let acc = 0
  for (let i = 0; i < index && i < blocks.length; i++) acc += blocks[i]!.duration
  return acc
}

/**
 * Bloc joue a la date `t` et temps ecoule dedans. Au-dela du dernier bloc on
 * retombe au debut : la lecture boucle. L'appelant verifie que le montage n'est
 * pas vide.
 */
export function blockAt(blocks: Block[], t: number): { index: number; elapsed: number } {
  const total = totalDuration(blocks)
  if (!blocks.length || total <= 0) return { index: 0, elapsed: 0 }
  // le modulo n'est applique que s'il sert : sur une date deja dans le cycle il
  // n'ajouterait qu'une trainee de flottants au temps ecoule
  const wrapped = t >= 0 && t < total ? t : ((t % total) + total) % total
  let acc = 0
  for (let i = 0; i < blocks.length; i++) {
    const end = acc + blocks[i]!.duration
    if (wrapped < end) return { index: i, elapsed: wrapped - acc }
    acc = end
  }
  return { index: blocks.length - 1, elapsed: 0 }
}

/**
 * Ajoute une animation a la fin du montage (palette de droite ou carte « + »).
 *
 * Plafonnee a `MAX_BLOCS`, comme la relecture. Sans ca l'editeur laissait construire un
 * montage plus grand que ce que le stockage rend au rechargement, et le travail
 * disparaissait en silence — une borne de relecture qui n'est pas aussi une borne d'edition
 * est un piege, pas une protection.
 */
export function blocksWith(blocks: Block[], state: StateId): Block[] {
  if (blocks.length >= MAX_BLOCS) return blocks
  return [...blocks, makeBlock(state)]
}

/** Deplace un bloc, en rendant une nouvelle liste (les etats Vue sont remplaces). */
export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  const next = blocks.slice()
  const [moved] = next.splice(from, 1)
  if (!moved) return blocks
  next.splice(Math.min(Math.max(to, 0), next.length), 0, moved)
  return next
}

/** `Mon cycle`, `Mon cycle 2`, `Mon cycle 3`... — jamais deux fois le meme nom. */
export function uniqueName(base: string, cycles: Cycle[]): string {
  const taken = new Set(cycles.map((c) => c.name))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base} ${n}`)) n++
  return `${base} ${n}`
}

/** Identifiant sans collision, y compris avec un localStorage bricole a la main. */
export function nextCycleId(cycles: Cycle[]): string {
  const taken = new Set(cycles.map((c) => c.id))
  let n = 1
  while (taken.has(`c${n}`)) n++
  return `c${n}`
}

/* ------------------------------------------------- montage aleatoire */

/** Durees proposees au hasard ; celles sous le plancher moteur sont filtrees. */
const DUREES_ALEATOIRES = [1, 1.5, 2, 3, 4]

/**
 * Un montage d'improvisation : `nombre` blocs, jamais deux fois le meme etat de
 * suite (l'enchainement identique ne se lit pas comme un choix), et des durees
 * prises dans une short-list plutot qu'un nombre quelconque — un bloc de 2,37 s
 * n'a aucun sens a l'oreille.
 *
 * `rng` est injectable pour que les tests puissent figer le hasard ; la valeur
 * par defaut reste le vrai random pour l'interface.
 */
export function blocsAleatoires(nombre: number, rng: () => number = Math.random): Block[] {
  const out: Block[] = []
  let precedent: StateId | null = null
  while (out.length < nombre) {
    const etat = SEQUENCE[Math.floor(rng() * SEQUENCE.length)]!
    if (out.length && etat === precedent) continue
    precedent = etat
    const possibles = DUREES_ALEATOIRES.filter((d) => d >= minDurationOf(etat))
    // si l'etat impose un plancher au-dela de la short-list, c'est lui qui gagne
    const duree = possibles.length
      ? possibles[Math.floor(rng() * possibles.length)]!
      : clampDuration(etat, minDurationOf(etat))
    out.push({ state: etat, duration: duree })
  }
  return out
}

/* ------------------------------------------------------- lecture du stockage */

function parseBlock(raw: unknown): Block | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { state, duration } = raw as { state?: unknown; duration?: unknown }
  /*
   * Valide contre SEQUENCE et non contre `STATE_BY_ID` : ce dernier contient `swirl`, qui
   * est deliberement hors du catalogue — c'est la transition d'entree des reglages, un
   * test la verrouille hors de la palette et de la planche. Un montage utilisateur ne se
   * construit qu'a partir de la palette, donc un `swirl` ne peut y arriver que par un
   * stockage bricole a la main, et il n'y a aucune raison de l'y tolerer quand on l'exclut
   * partout ailleurs.
   */
  if (typeof state !== 'string' || !SEQUENCE.includes(state as StateId)) return null
  if (typeof duration !== 'number' || !Number.isFinite(duration)) return null
  return { state: state as StateId, duration: clampDuration(state as StateId, duration) }
}

function parseArtElement(raw: unknown): ArtElement | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Partial<ArtElement>
  if (
    typeof value.id !== 'string' || !value.id || value.id.length > 128 ||
    (value.kind !== 'svg' && value.kind !== 'text') ||
    typeof value.name !== 'string' || typeof value.content !== 'string' ||
    typeof value.viewBox !== 'string' || typeof value.text !== 'string' ||
    typeof value.color !== 'string' || !/^#[\da-f]{3,8}$/i.test(value.color) ||
    ![value.x, value.y, value.width, value.height, value.rotation, value.start, value.duration]
      .every((n) => typeof n === 'number' && Number.isFinite(n)) ||
    !Array.isArray(value.colors)
  ) return null

  const contentBytes = new TextEncoder().encode(value.content).byteLength
  if (contentBytes > MAX_ART_MARKUP_BYTES || value.text.length > MAX_ART_TEXT_LENGTH) return null
  const colors = value.colors.slice(0, 16).flatMap((entry) => {
    if (
      typeof entry !== 'object' || entry === null ||
      typeof entry.source !== 'string' || entry.source.length > 64 ||
      typeof entry.target !== 'string' || !/^#[\da-f]{3,8}$/i.test(entry.target)
    ) return []
    return [{ source: entry.source, target: entry.target }]
  })
  const sanitized = value.kind === 'svg'
    ? sanitizeSvgContent(value.content, value.viewBox)
    : null
  if (value.kind === 'svg' && !sanitized) return null
  const safeColors = sanitized
    ? sanitized.colors.map((color) => ({
        source: color.source,
        target: colors.find((stored) => stored.source.toLowerCase() === color.source.toLowerCase())?.target ?? color.target
      }))
    : colors

  return {
    id: value.id,
    kind: value.kind,
    name: value.name.slice(0, 120),
    content: sanitized?.content ?? value.content,
    viewBox: sanitized?.viewBox ?? value.viewBox.slice(0, 100),
    text: value.text,
    colors: safeColors,
    color: value.color,
    x: Math.max(-158, Math.min(158, value.x!)),
    y: Math.max(-158, Math.min(158, value.y!)),
    width: Math.max(1, Math.min(316, value.width!)),
    height: Math.max(1, Math.min(316, value.height!)),
    rotation: Math.max(-360, Math.min(360, value.rotation!)),
    start: clampArtTime(value.start!),
    duration: clampArtTime(value.duration!),
    visible: value.visible !== false
  }
}

function parseCycle(raw: unknown, seen: Cycle[]): Cycle | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { id, name, blocks, elements } = raw as {
    id?: unknown
    name?: unknown
    blocks?: unknown
    elements?: unknown
  }
  if (typeof id !== 'string' || !id) return null
  // le nom peut etre vide — c'est le montage d'amorce, qui suit la langue
  if (typeof name !== 'string') return null
  if (!Array.isArray(blocks)) return null
  // on tronque AVANT de relire : valider 150 000 blocs pour n'en garder que 200 serait
  // faire le travail qu'on cherche justement a eviter
  const kept = blocks
    .slice(0, MAX_BLOCS)
    .map(parseBlock)
    .filter((b): b is Block => b !== null)
  if (!kept.length) return null
  if (seen.some((c) => c.id === id)) return null
  const art = Array.isArray(elements)
    ? elements.slice(0, MAX_ART_ELEMENTS).map(parseArtElement).filter((e): e is ArtElement => e !== null)
    : []
  let bytes = 0
  const boundedArt = art.filter((element) => {
    bytes += new TextEncoder().encode(element.content).byteLength
    return bytes <= MAX_CYCLE_ART_BYTES
  })
  return { id, name, blocks: kept, ...(boundedArt.length ? { elements: boundedArt } : {}) }
}

/**
 * Le localStorage est modifiable a la main : on ne lui fait pas confiance, meme
 * regle que pour le hash de l'URL. Tout ce qui ne se relit pas est jete
 * silencieusement plutot que de casser l'application au demarrage.
 */
export function parseCycles(raw: string | null): Cycle[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  const out: Cycle[] = []
  for (const item of data.slice(0, MAX_CYCLES)) {
    const cycle = parseCycle(item, out)
    if (cycle) out.push(cycle)
  }
  return out
}
