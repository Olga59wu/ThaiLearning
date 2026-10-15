<script setup lang="ts">
import { computed } from 'vue'
import { numberWordSyllables } from '@/utils/thaiNumber'
import ThaiReading from './ThaiReading.vue'

// 規則說明：{泰文} 標記顯示成拼音＋聲調（泰文字依開關縮小顯示在下方）
const props = defineProps<{ text: string }>()

const parts = computed(() =>
  props.text.split(/(\{[^}]+\})/).filter(Boolean).map((part) => {
    const m = part.match(/^\{(.+)\}$/)
    const syllables = m ? numberWordSyllables(m[1]!) : null
    return m && syllables ? { th: m[1]!, syllables } : { text: part }
  }),
)
</script>

<template>
  <span class="inline-flex flex-wrap items-end gap-x-1.5 gap-y-1">
    <template v-for="(p, i) in parts" :key="i">
      <ThaiReading v-if="'syllables' in p" :syllables="p.syllables!" :th="p.th!" size="sm"
        class="px-1.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30" />
      <span v-else class="pb-1">{{ p.text }}</span>
    </template>
  </span>
</template>
