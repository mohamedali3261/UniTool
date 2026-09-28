<script setup lang="ts">
import BloubBot from '@/components/BloubBot.vue'
import { POSES } from '@/bot/states'
import { PRESETS, type Preset } from '@/ui/presets'
import { mmss } from '@/ui/timeline'
import { totalDuration } from '@/bot/cycles'
import { t } from '@/i18n'

/**
 * La galerie : des montages curates, chacun montre FIGE sur la pose de son
 * premier bloc — une vignette animee par carte ferait tourner autant de boucles
 * rAF qu'il y a de cartes (meme regle que les vignettes du personnalisateur).
 * Le lecteur, lui, rejoue tout a l'ajout : l'apercu vivant est a un clic.
 */
defineProps<{ shape: string; color: string; expression: string; bouche: string }>()
const emit = defineEmits<{ charger: [preset: Preset] }>()
</script>

<template>
  <div class="w-full">
    <p class="text-sm text-[var(--muted)]">{{ t('gallery.intro') }}</p>

    <div
      class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
    >
      <article
        v-for="p in PRESETS"
        :key="p.id"
        class="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--carte)] p-3 transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        <div class="flex items-center justify-center py-2">
          <BloubBot
            :state="p.blocks[0]!.state"
            :size="110"
            :shape="shape"
            :color="color"
            :expression="expression"
            :bouche="bouche"
            :frozen-at="POSES[p.blocks[0]!.state]"
          />
        </div>

        <h3 class="mt-1 text-sm font-semibold">{{ t(`presets.${p.id}`) }}</h3>
        <p class="mt-0.5 text-xs leading-snug text-[var(--muted)]">
          {{ t(`presets.${p.id}_detail`) }}
        </p>

        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-xs tabular-nums text-[var(--muted)]">
            {{ p.blocks.length }} · {{ mmss(totalDuration(p.blocks)) }}
          </span>
          <button
            type="button"
            class="flex h-8 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--ink)] px-3 text-xs font-medium text-[var(--paper)] transition hover:opacity-90 active:scale-95"
            @click="emit('charger', p)"
          >
            {{ t('gallery.charger') }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
