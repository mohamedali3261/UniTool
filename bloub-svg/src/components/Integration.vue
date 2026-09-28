<script setup lang="ts">
import { computed, ref } from 'vue'
import BloubBot from '@/components/BloubBot.vue'
import { ANIM_IMAGES, ANIM_PAS } from '@/ui/export'
import { svgAutonome, telecharge, versSvgAnime } from '@/ui/capture'
import type { Cle } from '@/i18n'
import { t } from '@/i18n'

/**
 * La page INTEGRATION : transformer l'avatar en un morceau de code collable
 * n'importe ou. L'apercu est le composant vivant lui-meme (meme source de
 * dessin que l'export), et le snippet embarque le SVG en data URI — il marche
 * colle tel quel dans n'importe quelle page, sans hebergement.
 *
 * `suitTheme: false` sur l'apercu : le code produit doit sortir aux couleurs
 * canoniques, quel que soit l'habillage nuit/jour du moment.
 */
const props = defineProps<{ shape: string; color: string; expression: string; bouche: string }>()

const tailles = [128, 256, 512] as const
const taille = ref<number>(256)
type Fond = 'clair' | 'nuit' | 'none'
const fonds: Array<{ id: Fond; labelKey: Cle }> = [
  { id: 'clair', labelKey: 'integration.fond_clair' },
  { id: 'nuit', labelKey: 'integration.fond_nuit' },
  { id: 'none', labelKey: 'integration.fond_transparent' }
]
const fond = ref<Fond>('none')

type Format = 'statique' | 'anime'
const format = ref<Format>('statique')

/** Le papier des yeux suit le fond choisi ; transparent = teinte canonique claire. */
const papier = computed(() => (fond.value === 'nuit' ? '#10141f' : '#f9f9f9'))

const bot = ref<InstanceType<typeof BloubBot> | null>(null)

/* ------------------------------------------------------------- snippets */

function versDataUri(markup: string): string {
  // meme encodage par octets que le partage : btoa seul casse sur les accents
  let binaire = ''
  for (const octet of new TextEncoder().encode(markup)) binaire += String.fromCharCode(octet)
  return 'data:image/svg+xml;base64,' + btoa(binaire)
}

const markupStatique = computed(() => {
  const el = bot.value?.$el as SVGSVGElement | null | undefined
  if (!el) return ''
  return svgAutonome(el, taille.value)
})

/** Le snippet anime ne se calcule pas a la volee : il se GENERE au clic. */
const markupAnime = ref('')
const occupe = ref(false)

async function genereAnime() {
  if (occupe.value) return
  occupe.value = true
  try {
    const blob = await versSvgAnime(
      { shape: props.shape, color: props.color, expression: props.expression, bouche: props.bouche },
      taille.value,
      ANIM_IMAGES,
      ANIM_PAS
    )
    markupAnime.value = await blob.text()
  } finally {
    occupe.value = false
  }
}

const snippet = computed(() => {
  const markup = format.value === 'statique' ? markupStatique.value : markupAnime.value
  if (!markup) return ''
  return `<img src="${versDataUri(markup)}" width="${taille.value}" height="${taille.value}" alt="bloub" />`
})

/** Poids du snippet en Ko — un data URI embarque, ça mérite d'être dit. */
const poids = computed(() =>
  snippet.value ? `${(new Blob([snippet.value]).size / 1024).toFixed(1)} KB` : ''
)

/* ---------------------------------------------------------------- actions */

const copieFait = ref(false)
let minuteurCopie: ReturnType<typeof setTimeout> | undefined

async function copie() {
  if (!snippet.value) return
  await navigator.clipboard.writeText(snippet.value)
  copieFait.value = true
  clearTimeout(minuteurCopie)
  minuteurCopie = setTimeout(() => (copieFait.value = false), 1800)
}

function telechargeAnime() {
  if (!markupAnime.value) return
  telecharge(new Blob([markupAnime.value], { type: 'image/svg+xml' }), 'bloub-anime.svg')
}
</script>

<template>
  <div class="w-full">
    <p class="text-sm text-[var(--muted)]">{{ t('integration.intro') }}</p>

    <div class="mt-4 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <!-- apercu : carte de presentation, avec son etiquette de dimensions -->
      <div
        class="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)] p-8 lg:min-h-80"
        :class="fond === 'none' && 'damier'"
        :style="
          fond === 'clair'
            ? { background: '#f9f9f9' }
            : fond === 'nuit'
              ? { background: '#10141f' }
              : undefined
        "
      >
        <BloubBot
          ref="bot"
          :size="Math.min(taille, 360)"
          :shape="shape"
          :color="color"
          :expression="expression"
          :bouche="bouche"
          :paper="papier"
          :suit-theme="false"
          :frozen-at="format === 'statique' ? 1 : undefined"
        />
        <span
          class="absolute bottom-2 end-2 rounded-md bg-[var(--ink)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--paper)]"
        >
          {{ taille }}×{{ taille }}
        </span>
      </div>

      <!-- reglages : UNE carte, trois groupes empiles -->
      <aside class="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--carte)] p-4">
        <fieldset>
          <legend class="text-xs font-semibold">{{ t('integration.format') }}</legend>
          <div class="mt-1.5 flex rounded-xl border border-[var(--line)] p-0.5">
            <button
              v-for="(f, i) in ['statique', 'anime'] as const"
              :key="f"
              type="button"
              class="flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-medium transition"
              :class="
                format === f
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                  : 'text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]'
              "
              :aria-pressed="format === f"
              :autofocus="i === 0"
              @click="format = f"
            >
              {{ t(`integration.${f}`) }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="text-xs font-semibold">{{ t('integration.taille') }}</legend>
          <div class="mt-1.5 flex rounded-xl border border-[var(--line)] p-0.5">
            <button
              v-for="valeur in tailles"
              :key="valeur"
              type="button"
              class="flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-medium tabular-nums transition"
              :class="
                taille === valeur
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                  : 'text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]'
              "
              :aria-pressed="taille === valeur"
              @click="taille = valeur"
            >
              {{ valeur }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="text-xs font-semibold">{{ t('integration.fond') }}</legend>
          <div class="mt-1.5 flex rounded-xl border border-[var(--line)] p-0.5">
            <button
              v-for="f in fonds"
              :key="f.id"
              type="button"
              class="flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-medium transition"
              :class="
                fond === f.id
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                  : 'text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]'
              "
              :aria-pressed="fond === f.id"
              @click="fond = f.id"
            >
              {{ t(f.labelKey) }}
            </button>
          </div>
        </fieldset>

        <button
          v-if="format === 'anime'"
          type="button"
          class="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-3 text-sm font-medium text-[var(--paper)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          :disabled="occupe"
          @click="genereAnime"
        >
          {{ occupe ? t('export.cycleProgress') : t('integration.generer') }}
        </button>
      </aside>
    </div>

    <!-- le code : une CARTE avec barre de titre (nom, poids, copie), comme un
         bloc d'editeur — et defilement HORIZONTAL, le data URI est une seule
         longue ligne que replier rendrait illisible -->
    <div class="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--carte)]">
      <div class="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
        <h3 class="flex-1 text-xs font-semibold">{{ t('integration.code') }}</h3>
        <span
          v-if="poids"
          class="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--muted)]"
        >
          {{ poids }}
        </span>
        <button
          type="button"
          class="flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--ink)] px-2.5 text-xs font-medium text-[var(--paper)] transition hover:opacity-90 active:scale-95 disabled:cursor-default disabled:opacity-50"
          :disabled="!snippet"
          @click="copie"
        >
          <!-- solar:copy-linear, la meme que la barre d'export -->
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 11C6 8.17 6 6.76 6.88 5.88C7.76 5 9.17 5 12 5H15C17.83 5 19.24 5 20.12 5.88C21 6.76 21 8.17 21 11V16C21 18.83 21 20.24 20.12 21.12C19.24 22 17.83 22 15 22H12C9.17 22 7.76 22 6.88 21.12C6 20.24 6 18.83 6 16V11Z" />
              <path d="M6 19C4.34 19 3 17.66 3 16V10C3 6.23 3 4.34 4.17 3.17C5.34 2 7.23 2 11 2H15C16.66 2 18 3.34 18 5" />
            </g>
          </svg>
          {{ copieFait ? t('export.copied') : t('integration.copier') }}
        </button>
      </div>
      <pre
        class="max-h-44 overflow-auto p-3 text-[11px] leading-relaxed text-[var(--ink)] font-mono whitespace-pre"
      >{{ snippet || t('integration.vide') }}</pre>
      <div
        v-if="format === 'anime' && markupAnime"
        class="flex items-center justify-end border-t border-[var(--line)] px-3 py-2"
      >
        <button
          type="button"
          class="flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 text-xs transition hover:border-[var(--muted)] active:scale-95"
          @click="telechargeAnime"
        >
          <!-- fleche vers le bas : meme gabarit que le bouton d'export -->
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">
              <path d="M12 3V16M8 11.6L12 16L16 11.6" />
            </g>
          </svg>
          {{ t('integration.telecharger') }}
        </button>
      </div>
    </div>

    <p class="mt-3 text-xs text-[var(--muted)]">{{ t('integration.video_hint') }}</p>
  </div>
</template>
