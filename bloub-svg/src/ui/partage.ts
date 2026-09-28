import { MAX_BLOCS, clampDuration, parseCycles, type Block } from '@/bot/cycles'
import { MAX_ART_ELEMENTS, type ArtElement } from '@/bot/art'
import { SEQUENCE, type StateId } from '@/bot/states'

/**
 * Partage d'un montage : par l'URL (`#montage=<code>`) ou par fichier JSON.
 *
 * Le code URL est du JSON compacte en base64url — base64 SANS `+` ni `/`, les
 * deux seuls caracteres que le fragment d'une URL a de bonnes raisons d'eviter.
 * Les blocs voyagent en paires `[etat, duree]` plutot qu'en objets : le lien
 * d'un montage ordinaire tient alors en quelques centaines de caracteres. Le
 * fichier, lui, est du JSON indente lisible a l'oeil — c'est une archive de
 * sauvegarde, pas quelque chose a recopier a la main.
 *
 * Module PUR, comme le reste de la couche donnees : ni DOM ni Vue, donc la
 * regle de validation se teste sans navigateur. La meme mecanique que
 * `parseCycles` s'applique aux deux formats — URL et fichier sont modifiables
 * a la main, on ne leur fait pas confiance, et tout ce qui ne se relit pas est
 * jete silencieusement.
 */

/** Version des DEUX formats ; ils avancent ensemble. */
const VERSION = 1

/** Longueur maximale d'un code accepte. Un montage legal (200 blocs) en fait ~5 000. */
const MAX_CODE = 16_384
export const MAX_MONTAGE_JSON_BYTES = 1_000_000

/**
 * Valide une liste brute de paires [etat, duree] et la ramene aux bornes de
 * l'editeur. Une seule regle pour le lien ET le fichier.
 */
function validerBlocs(brut: unknown): Block[] | null {
  if (!Array.isArray(brut)) return null
  const blocs: Block[] = []
  for (const brutBloc of brut.slice(0, MAX_BLOCS)) {
    if (!Array.isArray(brutBloc) || brutBloc.length !== 2) continue
    const [etat, duree] = brutBloc as [unknown, unknown]
    if (typeof etat !== 'string' || !SEQUENCE.includes(etat as StateId)) continue
    if (typeof duree !== 'number' || !Number.isFinite(duree)) continue
    blocs.push({ state: etat as StateId, duration: clampDuration(etat as StateId, duree) })
  }
  return blocs.length ? blocs : null
}

/**
 * Encode des blocs en code partageable. Ne valide pas : on encode ce que
 * l'editeur a deja contraint, jamais une entree hostile — c'est le travail de
 * `decoderMontage`.
 */
export function encoderMontage(blocs: Block[]): string {
  const json = JSON.stringify({ v: VERSION, b: blocs.map((b) => [b.state, b.duration]) })
  // TextEncoder puis charCode : `btoa` ne sait pas encoder au-dela du latin-1,
  // et la boucle par octets reste exacte quel que soit le contenu.
  let binaire = ''
  for (const octet of new TextEncoder().encode(json)) binaire += String.fromCharCode(octet)
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Relit un code en blocs valides, ou renvoie `null`. Une duree hors bornes est
 * ramenee par `clampDuration`, comme au stockage ; un etat inconnu — y compris
 * `swirl`, exclu du catalogue comme partout ailleurs — jette son bloc, et un
 * code qui ne rend aucun bloc valable echoue entierement.
 */
export function decoderMontage(code: string): Block[] | null {
  if (!code || code.length > MAX_CODE) return null
  let data: unknown
  try {
    const binaire = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
    const octets = Uint8Array.from(binaire, (c) => c.charCodeAt(0))
    data = JSON.parse(new TextDecoder().decode(octets))
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const { v, b } = data as { v?: unknown; b?: unknown }
  if (v !== VERSION) return null
  return validerBlocs(b)
}

/* --------------------------------------------------------- fichier JSON */

export interface MontageJson {
  /** Le nom voyage dans un fichier : vide = suit la langue du destinataire. */
  name: string
  blocks: Block[]
  elements?: ArtElement[]
}

/** Le montage en archive lisible, prete pour `telecharge`. */
export function montageVersJson(cycle: { name: string; blocks: Block[]; elements?: ArtElement[] }): string {
  return JSON.stringify(
    {
      v: VERSION,
      name: cycle.name,
      b: cycle.blocks.map((b) => [b.state, b.duration]),
      ...(cycle.elements?.length ? { elements: cycle.elements } : {})
    },
    null,
    2
  )
}

/** Relit un fichier exporte, ou renvoie `null` s'il n'est pas reconnu. */
export function jsonVersMontage(texte: string): MontageJson | null {
  if (new TextEncoder().encode(texte).byteLength > MAX_MONTAGE_JSON_BYTES) return null
  let data: unknown
  try {
    data = JSON.parse(texte)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const { v, name, b, elements } = data as {
    v?: unknown
    name?: unknown
    b?: unknown
    elements?: unknown
  }
  if (v !== VERSION) return null
  const blocks = validerBlocs(b)
  if (!blocks) return null
  if (elements !== undefined && (!Array.isArray(elements) || elements.length > MAX_ART_ELEMENTS)) {
    return null
  }
  const parsed = parseCycles(JSON.stringify([{
    id: 'import',
    name: typeof name === 'string' ? name : '',
    blocks,
    ...(elements === undefined ? {} : { elements })
  }]))[0]
  if (!parsed || (elements !== undefined && parsed.elements?.length !== elements.length)) return null
  return {
    name: typeof name === 'string' ? name : '',
    blocks: parsed.blocks,
    ...(parsed.elements ? { elements: parsed.elements } : {})
  }
}
