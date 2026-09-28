<script setup lang="ts">
import { ref } from 'vue'

export interface HistoryVersion {
  id: string
  label: string
  savedAt: number
}

const props = defineProps<{
  canUndo: boolean
  canRedo: boolean
  versions: HistoryVersion[]
  lang: 'ar' | 'en'
}>()
const emit = defineEmits<{
  undo: []
  redo: []
  restore: [index: number]
}>()
const open = ref(false)
const text = (ar: string, en: string) => props.lang === 'ar' ? ar : en
const date = (savedAt: number) => new Intl.DateTimeFormat(props.lang, {
  dateStyle: 'short',
  timeStyle: 'short'
}).format(savedAt)
</script>

<template>
  <div class="grid w-fit shrink-0 grid-cols-2 items-center gap-0 rounded-lg p-0.5 lg:gap-0.5">
    <button type="button" class="h-6 w-6 rounded-md text-xs leading-none hover:bg-black/5 disabled:opacity-35" :disabled="!canUndo" :aria-label="text('تراجع', 'Undo')" title="Ctrl+Z" @click="emit('undo')">↶</button>
    <button type="button" class="h-6 w-6 rounded-md text-xs leading-none hover:bg-black/5 disabled:opacity-35" :disabled="!canRedo" :aria-label="text('إعادة', 'Redo')" title="Ctrl+Shift+Z" @click="emit('redo')">↷</button>
    <button type="button" class="col-span-2 justify-self-center rounded-md px-1 py-1 text-[9px] font-medium leading-none hover:bg-black/5" :aria-expanded="open" @click="open = !open">
      {{ text('السجل', 'History') }}
    </button>
  </div>

  <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-20" @click.self="open = false">
    <section class="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-[var(--ink)] shadow-xl">
      <header class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold">{{ text('سجل نسخ المشروع', 'Project version history') }}</h2>
        <button type="button" class="rounded-md px-2 py-1 text-sm hover:bg-black/5" :aria-label="text('إغلاق', 'Close')" @click="open = false">×</button>
      </header>
      <p v-if="versions.length < 2" class="rounded-xl border border-dashed border-[var(--line)] p-4 text-center text-xs text-[var(--muted)]">
        {{ text('سيظهر سجل النسخ بعد أول تعديل.', 'Saved versions will appear after your first edit.') }}
      </p>
      <ol v-else class="space-y-2">
        <li v-for="(version, index) in versions" :key="version.id">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-3 py-2 text-start text-xs transition hover:bg-black/5"
            @click="emit('restore', index); open = false"
          >
            <span class="min-w-0 truncate font-medium">{{ version.label }}</span>
            <time class="shrink-0 text-[10px] text-[var(--muted)]">{{ date(version.savedAt) }}</time>
          </button>
        </li>
      </ol>
    </section>
  </div>
</template>
