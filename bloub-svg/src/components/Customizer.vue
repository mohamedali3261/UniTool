<script setup lang="ts">
import BotTile from '@/components/BotTile.vue'
import { EXPRESSIONS } from '@/bot/expressions'
import { MOUTHS } from '@/bot/mouths'
import { COLORS, SHAPES, estCouleurLibre } from '@/bot/skins'
import { t } from '@/i18n'
import { computed } from 'vue'

const shape = defineModel<string>('shape', { required: true })
const color = defineModel<string>('color', { required: true })
const expression = defineModel<string>('expression', { required: true })
const bouche = defineModel<string>('bouche', { required: true })

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1

/**
 * « Surprise » : une combinaison entiere, et jamais celle deja affichee — chaque
 * dimension est re-piochee HORS de sa valeur courante, donc le clic garantit un
 * changement visible meme sur le catalogue d'une seule entree.
 */
function piocheAutre(liste: readonly string[], actuel: string): string {
  const autres = liste.filter((v) => v !== actuel)
  const pool = autres.length ? autres : liste
  return pool[Math.floor(Math.random() * pool.length)]!
}

const formesIds = SHAPES.map((s) => s.id)
const couleursIds = COLORS.map((c) => c.id)
const expressionsIds = EXPRESSIONS.map((e) => e.id)

function surprise() {
  shape.value = piocheAutre(formesIds, shape.value)
  color.value = piocheAutre(couleursIds, color.value)
  expression.value = piocheAutre(expressionsIds, expression.value)
}

/*
 * Couleur LIBRE : la pastille qui ouvre le sélecteur natif du navigateur. La
 * valeur voyage en hex et remplace la palette ; re-cliquer une pastille de la
 * palette revient en arriere.
 */
const perso = computed(() => estCouleurLibre(color.value))
const PERSO_DEFAUT = '#3b93f0'

function choisitLibre(e: Event) {
  const v = (e.target as HTMLInputElement).value.toLowerCase()
  if (estCouleurLibre(v)) color.value = v
}
</script>

<template>
  <div>
    <!--
      UNE section par catalogue, et c'est tout : les formes ensemble, les
      expressions ensemble. Les sous-groupes d'avant coupaient des familles de
      seize en paquets de quatre — plus de clics pour trouver, aucun gain de
      lecture. L'ordre est celui des catalogues (`SHAPES`, `EXPRESSIONS`), qui
      alternent volontairement geometrie et organique.
    -->
    <h2 class="text-sm font-semibold">{{ t('panel.shape') }}</h2>
    <section class="mt-1.5 rounded-2xl border border-[var(--line)] p-2">
      <div class="grid grid-cols-4 gap-1.5">
        <BotTile
          v-for="s in SHAPES"
          :key="s.id"
          :label="t(`shapes.${s.id}`)"
          :selected="s.id === shape"
          :shape="s.id"
          :color="color"
          :expression="expression"
          :frozen-at="PREVIEW_AT"
          @click="shape = s.id"
        />
      </div>
    </section>

    <h2 class="mt-4 text-sm font-semibold">{{ t('panel.expression') }}</h2>
    <section class="mt-1.5 rounded-2xl border border-[var(--line)] p-2">
      <div class="grid grid-cols-4 gap-1.5">
        <BotTile
          v-for="e in EXPRESSIONS"
          :key="e.id"
          :label="t(`expressions.${e.id}`)"
          :selected="e.id === expression"
          :shape="shape"
          :color="color"
          :expression="e.id"
          :frozen-at="PREVIEW_AT"
          @click="expression = e.id"
        />
      </div>
    </section>

    <h2 class="mt-4 text-sm font-semibold">{{ t('panel.mouth') }}</h2>
    <!--
      La bouche est une couche a part : un trou de plus dans le masque, pose sur
      le meme repere tournant que les yeux. Chaque bouton montre le trace REEL,
      pas une icone approximative — meme gabarit de boite que les deux catalogues.
    -->
    <section class="mt-1.5 rounded-2xl border border-[var(--line)] p-2">
      <div class="grid grid-cols-5 gap-1.5">
        <button
          v-for="m in MOUTHS"
          :key="m.id"
          type="button"
          class="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 p-1 transition"
          :class="
            m.id === bouche ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'
          "
          :aria-label="t(`mouths.${m.id}`)"
          :aria-pressed="m.id === bouche"
          @click="bouche = m.id"
        >
          <!-- le trace reel, en miniature -->
          <svg viewBox="-0.3 -0.22 0.6 0.44" class="h-6 w-8" aria-hidden="true">
            <path
              v-if="m.d"
              :d="m.d"
              :fill="m.fill ? 'currentColor' : 'none'"
              stroke="currentColor"
              :stroke-width="m.w ?? 0"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="w-full truncate text-center text-[10px] leading-none text-[var(--muted)]">
            {{ t(`mouths.${m.id}`) }}
          </span>
        </button>
      </div>
    </section>

    <h2 class="mt-4 text-sm font-semibold">{{ t('panel.color') }}</h2>
    <div class="mt-1.5 rounded-2xl border border-[var(--line)] p-2">
      <div class="grid grid-cols-6 gap-1.5">
        <button
          v-for="c in COLORS"
          :key="c.id"
          type="button"
          class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
          :class="
            c.id === color ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'
          "
          :aria-label="t(`colors.${c.id}`)"
          :aria-pressed="c.id === color"
          @click="color = c.id"
        >
          <!-- liseré interne : sinon la pastille creme disparait sur fond clair -->
          <span
            class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
            :style="{ background: c.hex }"
          />
        </button>

        <!-- la pastille libre : arc-en-ciel tant qu'aucun hex n'est pose, la
             couleur choisie ensuite ; l'<input type="color"> natif couvre
             l'etiquette entiere et porte le nom accessible -->
        <label
          class="relative flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
          :class="perso ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'"
          :aria-label="t('panel.couleur_perso')"
        >
          <span
            class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
            :style="{
              background: perso
                ? color
                : 'conic-gradient(#e8483f, #f0b429, #3ecf8e, #3b93f0, #8b5cf6, #e152b0, #e8483f)'
            }"
          />
          <input
            type="color"
            class="absolute inset-0 cursor-pointer opacity-0"
            :value="perso ? color : PERSO_DEFAUT"
            :aria-label="t('panel.couleur_perso')"
            @input="choisitLibre"
          />
        </label>
      </div>
    </div>

    <button
      type="button"
      class="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium transition hover:border-[var(--muted)] active:scale-[0.98]"
      @click="surprise"
    >
      <!-- de a six faces : le hasard du personnalisateur -->
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3.75"
          y="3.75"
          width="16.5"
          height="16.5"
          rx="4.25"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <g fill="currentColor">
          <circle cx="8.6" cy="8.6" r="1.35" />
          <circle cx="12" cy="12" r="1.35" />
          <circle cx="15.4" cy="15.4" r="1.35" />
        </g>
      </svg>
      {{ t('panel.surprise') }}
    </button>
  </div>
</template>
