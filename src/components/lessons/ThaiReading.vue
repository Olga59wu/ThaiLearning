<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Syllable } from '@/types/lesson'
import { useLessonSettingsStore } from '@/stores/lessonSettings'
import ToneSyllables from './ToneSyllables.vue'

// 唸法顯示：主要是課本拼音＋聲調；「顯示泰文字」開啟時，泰文字縮小放在下方當參考
type Size = 'sm' | 'md' | 'lg' | 'xl'
withDefaults(defineProps<{ syllables: readonly Syllable[]; th: string; size?: Size; align?: 'center' | 'start' }>(), {
  size: 'md',
  align: 'center',
})

const { showThai } = storeToRefs(useLessonSettingsStore())
const THAI_SIZE: Record<Size, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' }
</script>

<template>
  <span class="inline-flex flex-col gap-1" :class="align === 'center' ? 'items-center' : 'items-start'">
    <ToneSyllables :syllables="syllables" :size="size" />
    <span v-if="showThai" class="thai-font text-gray-400 dark:text-gray-500 leading-tight" :class="THAI_SIZE[size]">{{ th }}</span>
  </span>
</template>
