import { describe, expect, it } from 'vitest'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLORS, SHAPES } from '@/bot/skins'
import { STATES } from '@/bot/states'
import { formePlurielle, interpoler } from './format'
import { choisirLangue, LANGUES, tagDe } from './langues'
import ar from './locales/ar'
import en from './locales/en'

/**
 * On importe les dictionnaires et les modules purs, jamais `./index` : celui-ci
 * lit `localStorage`, `navigator` et `document` a l'import, donc il exige un
 * navigateur. C'est precisement pour ca que la regle de choix de langue et la
 * mecanique de texte vivent dans des fichiers separes.
 */
const DICTIONNAIRES = { ar, en }

describe('choix de la langue au demarrage', () => {
  it('respecte le choix memorise, quelles que soient les preferences du navigateur', () => {
    expect(choisirLangue('ar', ['en-US', 'en'])).toBe('ar')
    expect(choisirLangue('en', ['ar-EG'])).toBe('en')
  })

  it('ignore un choix memorise qui n est pas une langue connue', () => {
    // le localStorage se modifie a la main : on ne lui fait pas confiance
    // (un ancien visiteur qui aurait garde `fr` retombe sur la detection)
    expect(choisirLangue('de', ['en-GB'])).toBe('en')
    expect(choisirLangue('fr', ['ar-EG'])).toBe('ar')
    expect(choisirLangue('', ['en-GB'])).toBe('en')
  })

  it('suit l ordre des preferences du navigateur, pas leur simple presence', () => {
    expect(choisirLangue(null, ['en-US', 'ar-EG'])).toBe('en')
    expect(choisirLangue(null, ['ar-EG', 'en-US'])).toBe('ar')
  })

  it('reduit une etiquette complete a sa langue', () => {
    // le piege : `ar-EG-x-pri` ne se coupe pas au premier tiret par hasard
    expect(choisirLangue(null, ['ar-EG'])).toBe('ar')
    expect(choisirLangue(null, ['en-GB-oxendict'])).toBe('en')
  })

  it('saute les langues qu on ne parle pas et les etiquettes invalides', () => {
    expect(choisirLangue(null, ['de-DE', 'ja', 'en'])).toBe('en')
    expect(choisirLangue(null, ['pas une etiquette', 'ar'])).toBe('ar')
  })

  it('retombe sur l arabe quand rien ne correspond', () => {
    expect(choisirLangue(null, ['de-DE', 'ja-JP'])).toBe('ar')
    expect(choisirLangue(null, [])).toBe('ar')
  })
})

describe('completude des dictionnaires', () => {
  /**
   * La presence des cles est deja garantie a la compilation (`en` est type
   * `typeof ar`). Ce qu'on verifie ici, c'est ce que le type ne voit pas :
   * une valeur vide, ou une traduction restee en arabe par oubli.
   */
  function feuilles(objet: object, prefixe = ''): Array<[string, string]> {
    return Object.entries(objet).flatMap(([cle, valeur]) =>
      typeof valeur === 'string'
        ? [[`${prefixe}${cle}`, valeur] as [string, string]]
        : feuilles(valeur as object, `${prefixe}${cle}.`)
    )
  }

  it('n a aucune valeur vide, dans aucune langue', () => {
    for (const [langue, dico] of Object.entries(DICTIONNAIRES)) {
      for (const [cle, valeur] of feuilles(dico)) {
        expect(valeur.trim(), `${langue}.${cle}`).not.toBe('')
      }
    }
  })

  it('traduit vraiment les libelles des catalogues, sans les recopier de l arabe', () => {
    // Les noms de marque et les gabarits purs (« {state}, {duration} ») sont
    // identiques d'une langue a l'autre, c'est normal — on ne regarde donc que
    // les catalogues, ou chaque entree est un vrai mot a traduire.
    for (const famille of ['states', 'shapes', 'colors', 'expressions'] as const) {
      for (const [cle, valeur] of feuilles(ar[famille])) {
        expect(feuilles(en[famille]).find(([k]) => k === cle)![1], `en ${famille}.${cle}`).not.toBe(
          valeur
        )
      }
    }
  })

  it('couvre les quatre catalogues du bot, entree par entree', () => {
    const cles = (famille: object) => feuilles(famille).map(([k]) => k)
    expect(cles(ar.states).sort()).toEqual(STATES.map((s) => s.id).sort())
    expect(cles(ar.shapes).sort()).toEqual(SHAPES.map((s) => s.id).sort())
    expect(cles(ar.colors).sort()).toEqual(COLORS.map((c) => c.id).sort())
    expect(cles(ar.expressions).sort()).toEqual(EXPRESSIONS.map((e) => e.id).sort())
  })
})

describe('substitution', () => {
  it('remplace toutes les occurrences d un parametre', () => {
    expect(interpoler('{a} و{a}', { a: 'x' })).toBe('x وx')
  })

  it('accepte les nombres et plusieurs parametres', () => {
    expect(interpoler('{etat}، {duree}', { etat: 'سكون', duree: 2 })).toBe('سكون، 2')
  })

  it('laisse visible un parametre sans valeur, plutot que de le vider', () => {
    // un « {name} » a l'ecran se remarque ; une chaine vide passe inapercue
    expect(interpoler('حذف «{name}»؟', {})).toBe('حذف «{name}»؟')
  })
})

describe('pluriel', () => {
  /**
   * La mecanique est independante du catalogue des langues : on la teste donc
   * avec des etiquettes `Intl` quelconques, y compris celles qu'on ne propose
   * plus, pour garder couvertes les regles subtiles (zero singulier en
   * francais, une seule forme en chinois).
   */
  it('range zero avec le singulier en francais, avec le pluriel en anglais', () => {
    const gabarit = 'un | plusieurs'
    expect(formePlurielle(gabarit, 0, 'fr')).toBe('un')
    expect(formePlurielle(gabarit, 0, 'en')).toBe('plusieurs')
  })

  it('distingue un de deux dans les deux langues', () => {
    const gabarit = 'un | plusieurs'
    for (const tag of ['fr', 'en']) {
      expect(formePlurielle(gabarit, 1, tag)).toBe('un')
      expect(formePlurielle(gabarit, 2, tag)).toBe('plusieurs')
    }
  })

  it('rend la forme unique quand la langue n a pas de pluriel', () => {
    for (const n of [0, 1, 2, 17]) {
      expect(formePlurielle('{n} 个动画', n, 'zh-Hans')).toBe('{n} 个动画')
    }
  })

  it('donne a l arabe une forme unique ici, a l anglais deux', () => {
    // la phrase arabe de suppression est construite pour ne pas declencher le
    // pluriel : l'arabe a six formes dans `Intl.PluralRules`, inutile de les
    // ecrire pour un texte qui n'en varie pas.
    expect(ar.dialog.removeDetail.includes(' | ')).toBe(false)
    expect(en.dialog.removeDetail.split(' | ')).toHaveLength(2)
  })
})

describe('catalogue des langues', () => {
  it('propose les deux langues, avec un drapeau et un endonyme', () => {
    expect(LANGUES.map((l) => l.id)).toEqual(['ar', 'en'])
    for (const l of LANGUES) {
      expect(l.emoji.length, l.id).toBeGreaterThan(0)
      expect(l.nom.trim(), l.id).not.toBe('')
    }
  })

  it('donne une etiquette BCP 47 que `Intl` sait lire', () => {
    for (const l of LANGUES) {
      const tag = tagDe(l.id)
      expect(new Intl.Locale(tag).language, l.id).toBe(l.id)
      // c'est cette etiquette qui formate les nombres : elle doit donner un
      // chiffre decimal utiliseable — chiffres orientaux compris, l'arabe les
      // emploie par defaut (« ٢٫٤ » comme « 2,4 » sont valides)
      const formate = new Intl.NumberFormat(tag).format(2.4)
      expect(formate, l.id).toMatch(/^[0-9\u0660-\u0669]+[.,\u066B][0-9\u0660-\u0669]$/)
    }
  })
})
