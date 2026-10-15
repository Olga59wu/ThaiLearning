<script setup lang="ts">
import type { Syllable, Tone } from '@/types/lesson'
import { TONE_LABEL, TONE_MARK } from '@/utils/tone'

// 照課本排法：聲調符號在上、羅馬拼音在下，一個音節一欄
type Size = 'sm' | 'md' | 'lg' | 'xl'
withDefaults(defineProps<{ syllables: readonly Syllable[]; size?: Size }>(), { size: 'md' })

const TONE_COLOR: Record<Tone, string> = {
  mid: 'text-gray-400 dark:text-gray-500',
  low: 'text-sky-500 dark:text-sky-400',
  falling: 'text-rose-500 dark:text-rose-400',
  high: 'text-amber-500 dark:text-amber-400',
  rising: 'text-emerald-500 dark:text-emerald-400',
}
const MARK_SIZE: Record<Size, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-xl' }
const ROMAN_SIZE: Record<Size, string> = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl', xl: 'text-4xl' }
const GAP: Record<Size, string> = { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-2.5', xl: 'gap-4' }
</script>

<template>
  <span class="inline-flex flex-wrap items-end justify-center leading-none" :class="GAP[size]">
    <span v-for="(s, i) in syllables" :key="i" class="flex flex-col items-center gap-0.5" :title="`${s.roman}（${TONE_LABEL[s.tone]}聲）`">
      <span class="font-black" :class="[TONE_COLOR[s.tone], MARK_SIZE[size]]">{{ TONE_MARK[s.tone] }}</span>
      <span class="font-bold text-gray-800 dark:text-gray-100" :class="ROMAN_SIZE[size]">{{ s.roman }}</span>
    </span>
  </span>
</template>
