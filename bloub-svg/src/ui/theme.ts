import { computed, ref, watchEffect } from 'vue'
import { ecris, lis } from './stockage'
import { choisirTheme, estTheme, type Theme } from './themes'

export { THEMES, type Theme } from './themes'

/*
 * Le reglage systeme est SUIVI et pas lu une seule fois — meme regle que
 * `prefers-reduced-motion` dans `App.vue` : le reglage change en cours de
 * session, et c'est meme son usage. Un `matches` fige a l'import l'ignorerait.
 */
const sombre = window.matchMedia('(prefers-color-scheme: dark)')
const courant = ref<Theme>(choisirTheme(lis('theme'), sombre.matches))

sombre.addEventListener('change', (e) => {
  // un choix explicite gagne toujours : sans lui seulement, on suit le systeme
  if (estTheme(lis('theme'))) return
  courant.value = e.matches ? 'nuit' : 'jour'
})

/**
 * L'attribut `data-theme` du document porte la palette (voir `styles.css`) :
 * les variables CSS se permutent d'un seul selecteur, aucun composant ne lit
 * le theme pour se styler lui-meme.
 */
watchEffect(() => {
  document.documentElement.dataset.theme = courant.value
})

/** Theme courant, en lecture et en ecriture (`v-model` compris). */
export const theme = computed<Theme>({
  get: () => courant.value,
  set: (valeur) => {
    if (!estTheme(valeur)) return
    const changed = courant.value !== valeur
    courant.value = valeur
    if (changed && window.parent !== window) window.parent.postMessage({ type: 'unitool-svg-theme-change', theme: valeur === 'nuit' ? 'dark' : 'light' }, window.location.origin)
    ecris('theme', valeur)
  }
})

/*
 * Ce que devient le BOT la nuit. Deux choix d'interface, et non des mesures :
 *
 * - l'encre relevee sur la video (#0a0a0c, skins.ts) est noire ; sur un fond
 *   nuit elle disparait. Le mode nuit l'inverse en clair, exactement comme le
 *   favicon.svg s'inverse deja selon le scheme — les couleurs posees par
 *   l'utilisateur, elles, restent ce qu'il a choisi ;
 * - le papier est la couleur que portent les YEUX du bot (des formes peintes
 *   sous le masque, voir BloubBot.vue). Il doit valoir le fond de la page, sinon
 *   les yeux restent ceux du jour sur une page nuit.
 *
 * Les exports, eux, ne suivent JAMAIS le theme : un GIF ou un sprite sheet doit
 * sortir aux couleurs canoniques quel que soit l'habillage du moment (voir le
 * `suitTheme: false` de capture.ts).
 */
export const ENCRE_NUIT = '#edeff5'
export const PAPIER_NUIT = '#101010'

// The embedding UniTool header is authoritative on load. Accept messages only
// from that same-origin parent; native settings changes notify it in return.
window.addEventListener('message', (event: MessageEvent) => {
  if (window.parent === window || event.source !== window.parent || event.origin !== window.location.origin) return
  if (event.data?.type !== 'unitool-appearance-change') return
  if (event.data.theme === 'light' || event.data.theme === 'dark') theme.value = event.data.theme === 'dark' ? 'nuit' : 'jour'
})
