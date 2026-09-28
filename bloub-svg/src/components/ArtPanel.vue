<script setup lang="ts">
import { ref } from 'vue'
import {
  MAX_ART_ELEMENTS,
  makeArtElement,
  type ArtElement
} from '@/bot/art'
import { readSvgFile } from '@/ui/svg-import'
import { t } from '@/i18n'
import type { ImportedSvg } from '@/ui/svg-import'

const props = defineProps<{ elements: ArtElement[]; time: number; lang: 'ar' | 'en' }>()
const emit = defineEmits<{
  add: [element: ArtElement]
  update: [element: ArtElement]
  remove: [id: string]
}>()
const file = ref<HTMLInputElement | null>(null)
const importError = ref('')

const text = (ar: string, en: string) => props.lang === 'ar' ? ar : en

function addText() {
  emit('add', makeArtElement('text', props.time, text('نص جديد', 'New text')))
}

function update(element: ArtElement, key: keyof ArtElement, value: string | number | boolean) {
  emit('update', { ...element, [key]: value })
}

function updateColor(element: ArtElement, index: number, target: string) {
  emit('update', {
    ...element,
    colors: element.colors.map((color, i) => i === index ? { ...color, target } : color)
  })
}

async function importSvg(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  input.value = ''
  if (!selected) return

  try {
    const imported: ImportedSvg = await readSvgFile(selected)
    const element = makeArtElement('svg', props.time, selected.name.replace(/\.svg$/i, ''))
    element.content = imported.content
    element.viewBox = imported.viewBox
    element.colors = imported.colors
    element.width = 72
    element.height = 72
    emit('add', element)
    importError.value = ''
  } catch (error) {
    importError.value = error instanceof Error
      ? error.message
      : text('تعذّر استيراد ملف SVG.', 'Unable to import this SVG file.')
  }
}
</script>

<template>
  <section class="space-y-4">
    <div>
      <h2 class="text-sm font-semibold">{{ text('العناصر المخصصة', 'Custom elements') }}</h2>
      <p class="mt-1 text-xs text-[var(--muted)]">
        {{ text('أضف نصًا أو استورد SVG، ثم اضبط موضعه ولونه ومدة ظهوره في المونتاج.', 'Add text or import an SVG, then edit its position, colors and timeline duration.') }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button type="button" class="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-medium hover:bg-black/5" :disabled="elements.length >= MAX_ART_ELEMENTS" @click="addText">
        {{ text('إضافة نص', 'Add text') }}
      </button>
      <button type="button" class="rounded-xl bg-[var(--ink)] px-3 py-2 text-xs font-medium text-[var(--paper)] hover:opacity-90" :disabled="elements.length >= MAX_ART_ELEMENTS" @click="file?.click()">
        {{ text('استيراد SVG', 'Import SVG') }}
      </button>
    </div>
    <input ref="file" class="sr-only" type="file" accept=".svg,image/svg+xml" @change="importSvg">
    <p v-if="importError" class="text-xs text-[var(--danger)]" role="alert">{{ importError }}</p>

    <p v-if="!elements.length" class="rounded-xl border border-dashed border-[var(--line)] p-4 text-center text-xs text-[var(--muted)]">
      {{ text('لم تتم إضافة عناصر بعد.', 'No custom elements yet.') }}
    </p>

    <article v-for="element in elements" :key="element.id" class="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--carte)] p-3">
      <div class="flex items-center gap-2">
        <input class="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2 py-1.5 text-xs" :value="element.name" :aria-label="text('اسم العنصر', 'Element name')" maxlength="120" @change="update(element, 'name', ($event.target as HTMLInputElement).value)">
        <label class="flex items-center gap-1 text-[10px] text-[var(--muted)]">
          <input type="checkbox" :checked="element.visible" @change="update(element, 'visible', ($event.target as HTMLInputElement).checked)">
          {{ text('إظهار', 'Show') }}
        </label>
        <button type="button" class="rounded-md px-2 py-1 text-xs text-[var(--danger)] hover:bg-black/5" :aria-label="text('حذف العنصر', 'Remove element')" @click="emit('remove', element.id)">×</button>
      </div>

      <label v-if="element.kind === 'text'" class="block text-xs">
        {{ text('النص', 'Text') }}
        <textarea class="mt-1 block w-full resize-y rounded-lg border border-[var(--line)] bg-transparent px-2 py-1.5 text-xs" :value="element.text" maxlength="500" rows="2" @input="update(element, 'text', ($event.target as HTMLTextAreaElement).value)" />
      </label>

      <label v-if="element.kind === 'text'" class="flex items-center justify-between text-xs">
        {{ text('لون النص', 'Text color') }}
        <input type="color" :value="element.color" @input="update(element, 'color', ($event.target as HTMLInputElement).value)">
      </label>

      <div v-if="element.kind === 'svg' && element.colors.length" class="space-y-1.5">
        <p class="text-[10px] font-medium text-[var(--muted)]">{{ text('ألوان ملف SVG', 'SVG colors') }}</p>
        <label v-for="(color, index) in element.colors" :key="`${color.source}-${index}`" class="flex items-center justify-between gap-2 text-xs">
          <span class="min-w-0 truncate">{{ color.source }}</span>
          <input type="color" :value="color.target" :aria-label="`${text('تغيير اللون', 'Change color')} ${color.source}`" @input="updateColor(element, index, ($event.target as HTMLInputElement).value)">
        </label>
      </div>

      <div class="grid grid-cols-2 gap-x-3 gap-y-2">
        <label class="text-[10px] text-[var(--muted)]">X
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="-158" max="158" :value="element.x" @change="update(element, 'x', Number(($event.target as HTMLInputElement).value))">
        </label>
        <label class="text-[10px] text-[var(--muted)]">Y
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="-158" max="158" :value="element.y" @change="update(element, 'y', Number(($event.target as HTMLInputElement).value))">
        </label>
        <label class="text-[10px] text-[var(--muted)]">{{ text('العرض', 'Width') }}
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="1" max="316" :value="element.width" @change="update(element, 'width', Number(($event.target as HTMLInputElement).value))">
        </label>
        <label class="text-[10px] text-[var(--muted)]">{{ text('الارتفاع', 'Height') }}
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="1" max="316" :value="element.height" @change="update(element, 'height', Number(($event.target as HTMLInputElement).value))">
        </label>
        <label class="text-[10px] text-[var(--muted)]">{{ text('الدوران', 'Rotation') }}
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="-360" max="360" :value="element.rotation" @change="update(element, 'rotation', Number(($event.target as HTMLInputElement).value))">
        </label>
        <label class="text-[10px] text-[var(--muted)]">{{ text('بداية الظهور (ث)', 'Start time (s)') }}
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="0" step="0.1" :value="element.start" @change="update(element, 'start', Number(($event.target as HTMLInputElement).value))">
        </label>
        <label class="col-span-2 text-[10px] text-[var(--muted)]">{{ text('مدة الظهور (ث)', 'Visible for (s)') }}
          <input class="mt-1 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]" type="number" min="0.1" step="0.1" :value="element.duration" @change="update(element, 'duration', Number(($event.target as HTMLInputElement).value))">
        </label>
      </div>
    </article>

    <p class="text-center text-[10px] text-[var(--muted)]">{{ elements.length }} / {{ MAX_ART_ELEMENTS }}</p>
  </section>
</template>
