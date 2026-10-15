<script setup lang="ts">
import type { Syllable, Tone } from '@/types/lesson'
import { TONE_LABEL, TONE_MARK } from '@/utils/tone'

// 照課本排法：（泰文）／聲調符號／羅馬拼音，一個音節一欄
withDefaults(defineProps<{ syllables: readonly Syllable[]; showThai?: boolean; size?: 'sm' | 'md' }>(), {
  showThai: false,
  size: 'md',
})

const TONE_COLOR: Record<Tone, string> = {
  mid: 'text-gray-400 dark:text-gray-500',
  low: 'text-sky-500 dark:text-sky-400',
  falling: 'text-rose-500 dark:text-rose-400',
  high: 'text-amber-500 dark:text-amber-400',
  rising: 'text-emerald-500 dark:text-emerald-400',
}
</script>

<template>
  <span class="inline-flex items-end gap-1.5 leading-none">
    <span v-for="(s, i) in syllables" :key="i" class="flex flex-col items-center gap-0.5"
      :title="`${s.th} ${s.roman}（${TONE_LABEL[s.tone]}聲）`">
      <span v-if="showThai" class="thai-font font-bold text-gray-700 dark:text-gray-200" :class="size === 'sm' ? 'text-sm' : 'text-lg'">{{ s.th }}</span>
      <span class="font-bold" :class="[TONE_COLOR[s.tone], size === 'sm' ? 'text-xs' : 'text-sm']">{{ TONE_MARK[s.tone] }}</span>
      <span class="font-mono text-gray-600 dark:text-gray-300" :class="size === 'sm' ? 'text-xs' : 'text-sm'">{{ s.roman }}</span>
    </span>
  </span>
</template>
