/**
 * Catalogue des themes et regle de choix. Volontairement sans DOM ni Vue, sur
 * le modele de `src/i18n/langues.ts` : la regle se teste sans navigateur.
 */

export type ThemeId = 'jour' | 'nuit'

/** L'emoji est decoratif ; le libelle vient de `t('settings.theme_<id>')`. */
export const THEMES: Array<{ id: ThemeId; emoji: string }> = [
  { id: 'jour', emoji: '☀️' },
  { id: 'nuit', emoji: '🌙' }
]

export type Theme = ThemeId

export function estTheme(valeur: string | null | undefined): valeur is Theme {
  return THEMES.some((t) => t.id === valeur)
}

/**
 * Theme au demarrage : un choix memorise gagne toujours — quelqu'un qui a pose
 * « nuit » ne veut pas retrouver « jour » parce que son systeme a change. Sinon
 * on suit le reglage du systeme, qui est la seule opinion qu'on connaisse deja.
 */
export function choisirTheme(memorise: string | null | undefined, systemeSombre: boolean): Theme {
  if (estTheme(memorise)) return memorise
  return systemeSombre ? 'nuit' : 'jour'
}
