<script setup lang="ts">
import { langue, LANGUES, t } from '@/i18n'
import { THEMES, theme } from '@/ui/theme'
import { changeSuivi, suitPointeur } from '@/ui/follow'
import { fondApercu } from '@/ui/preview-background'

/** L'auteur, affiche dans les credits. */
const AUTEUR = 'Eng.Mohamed Ali'

/**
 * Clavier des groupes de radios — langue ET theme, meme contrat.
 *
 * Declarer `role="radiogroup"` PROMET ce comportement, et des `<button>` ne le
 * donnent pas tout seuls : les fleches doivent deplacer le choix, et le groupe
 * entier ne doit compter que pour UN arret de tabulation. D'ou aussi le
 * `tabindex` mobile dans le gabarit — seule l'option cochee est atteignable par
 * Tab, les fleches font le reste, comme dans un groupe de radios natif.
 */
function fleches(event: KeyboardEvent, index: number, total: number, choisit: (i: number) => void) {
  const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!pas) return
  event.preventDefault()
  // on tourne en rond, comme un groupe de radios natif
  const cible = (index + pas + total) % total
  choisit(cible)
  // le focus suit le choix, sinon les fleches suivantes repartent de l'ancien
  const boutons = (event.currentTarget as HTMLElement).parentElement?.children
  const suivant = boutons?.[cible]
  if (suivant instanceof HTMLElement) suivant.focus()
}

const clavierLangue = (e: KeyboardEvent, i: number) =>
  fleches(e, i, LANGUES.length, (k) => (langue.value = LANGUES[k]!.id))
const clavierTheme = (e: KeyboardEvent, i: number) =>
  fleches(e, i, THEMES.length, (k) => (theme.value = THEMES[k]!.id))
</script>

<template>
  <div class="settings-content">
    <section class="settings-section">
    <h2 class="text-sm font-semibold">{{ t('settings.language') }}</h2>

    <!--
      Un groupe de boutons radio et non un `<select>` : les deux choix se
      montrent entierement, et le drapeau ne se lit pas dans une liste
      deroulante fermee.

      Chaque bouton porte son `aria-label` en clair plutot que de compter sur le
      nom deduit de son contenu : sur un radio reconstruit, ce calcul n'est pas
      rendu de la meme facon partout, et le nom est ce qui rend le choix
      annoncable. Il reprend exactement le texte visible, comme l'exige le
      critere « intitule dans le nom ».

      `lang` est sur le bouton et pas sur le texte : le nom accessible en herite,
      donc la synthese vocale prononce « العربية » avec la voix arabe et
      « English » avec la voix anglaise, quelle que soit la langue affichee.
    -->
    <div class="settings-options mt-2" role="radiogroup" :aria-label="t('settings.language')">
      <button
        v-for="(l, i) in LANGUES"
        :key="l.id"
        type="button"
        role="radio"
        :aria-checked="l.id === langue"
        :aria-label="l.nom"
        :lang="l.tag"
        :tabindex="l.id === langue ? 0 : -1"
        @keydown="clavierLangue($event, i)"
        class="settings-option flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-start text-sm transition"
        :class="
          l.id === langue
            ? 'border-[var(--ink)] bg-[var(--carte)] font-medium'
            : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)]'
        "
        @click="langue = l.id"
      >
        <!-- le drapeau est decoratif : le nom de la langue dit deja tout, et un
             lecteur d'ecran annoncerait « drapeau de la France » pour rien -->
        <span class="text-base leading-none" aria-hidden="true">{{ l.emoji }}</span>
        <span class="flex-1">{{ l.nom }}</span>
        <svg
          v-if="l.id === langue"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          class="shrink-0"
        >
          <path
            d="M2.5 6.4 4.8 8.7 9.5 3.6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    </section>

    <section class="settings-section">
    <h2 class="text-sm font-semibold">{{ t('settings.appearance') }}</h2>

    <!-- Meme gabarit que la langue : deux choix visibles, fleches au clavier.
         Le libelle vient du dictionnaire (theme_jour / theme_nuit) ; l'emoji,
         lui, est decoratif. -->
    <div class="settings-options mt-2" role="radiogroup" :aria-label="t('settings.appearance')">
      <button
        v-for="(th, i) in THEMES"
        :key="th.id"
        type="button"
        role="radio"
        :aria-checked="th.id === theme"
        :aria-label="t(`settings.theme_${th.id}`)"
        :tabindex="th.id === theme ? 0 : -1"
        @keydown="clavierTheme($event, i)"
        class="settings-option flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-start text-sm transition"
        :class="
          th.id === theme
            ? 'border-[var(--ink)] bg-[var(--carte)] font-medium'
            : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)]'
        "
        @click="theme = th.id"
      >
        <span class="text-base leading-none" aria-hidden="true">{{ th.emoji }}</span>
        <span class="flex-1">{{ t(`settings.theme_${th.id}`) }}</span>
        <svg
          v-if="th.id === theme"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          class="shrink-0"
        >
          <path
            d="M2.5 6.4 4.8 8.7 9.5 3.6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    </section>

    <section class="settings-section">
    <h2 class="text-sm font-semibold">{{ t('settings.previewBackground') }}</h2>
    <div class="mt-2 grid grid-cols-2 gap-2">
      <button
        type="button"
        class="rounded-xl border px-3 py-2 text-xs transition"
        :class="fondApercu === 'transparent' ? 'border-[var(--ink)] bg-[var(--carte)]' : 'border-[var(--line)] text-[var(--muted)]'"
        :aria-pressed="fondApercu === 'transparent'"
        @click="fondApercu = 'transparent'"
      >
        {{ t('settings.transparent') }}
      </button>
      <label class="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-xs">
        <span>{{ t('settings.customBackground') }}</span>
        <input
          type="color"
          :value="fondApercu === 'transparent' ? '#f9f9f9' : fondApercu"
          :aria-label="t('settings.customBackground')"
          @input="fondApercu = ($event.target as HTMLInputElement).value"
        />
      </label>
    </div>
    </section>

    <section class="settings-section">
    <h2 class="text-sm font-semibold">{{ t('settings.followCursor') }}</h2>
    <label class="mt-2 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--line)] px-3 py-2.5 text-xs">
      <input
        class="mt-0.5 accent-[var(--ink)]"
        type="checkbox"
        :checked="suitPointeur"
        @change="changeSuivi(($event.target as HTMLInputElement).checked)"
      />
      <span class="flex flex-col gap-1">
        <span>{{ t('settings.followCursor') }}</span>
        <span class="text-[10px] text-[var(--muted)]">{{ t('settings.followCursorHint') }}</span>
      </span>
    </label>
    </section>

    <section class="settings-section">
    <h2 class="text-sm font-semibold">{{ t('settings.about') }}</h2>

    <p class="mt-2 text-xs text-[var(--muted)]">
      {{ t('settings.credits', { name: AUTEUR }) }}
    </p>
    </section>
  </div>
</template>

<style scoped>
.settings-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.25rem;
}

.settings-section {
  min-width: 0;
}

.settings-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.settings-option {
  min-width: 0;
  min-height: 44px;
  padding-inline: 0.625rem;
}

@media (width < 23rem) {
  .settings-options {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
