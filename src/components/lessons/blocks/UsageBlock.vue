<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import type { LessonBlock } from '@/types/lesson'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import SpeakButton from '../SpeakButton.vue'
import PencilNotes from '../PencilNotes.vue'

// 用法（課本 p257）：「複數：พวก（puak）＋人稱代名詞」，下面列出例子
const props = defineProps<{ block: Extract<LessonBlock, { type: 'usage' }> }>()
const items = computed(() =>
  props.block.items.map((item) => ({ ...item, word: resolveWord(item.word), examples: item.examples.map(resolveWord) })),
)
</script>

<template>
  <BlockSection :title="block.title" icon="🧩">
    <div class="flex flex-col gap-5">
      <div v-for="(item, i) in items" :key="i">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
          <span v-if="item.label" class="font-bold text-gray-700 dark:text-gray-200">{{ item.label }}：</span>
          <ThaiReading :syllables="item.word.syllables" :th="item.word.th" align="start" />
          <SpeakButton :text="item.word.th" />
          <span v-if="item.pattern" class="font-bold text-gray-700 dark:text-gray-200">{{ item.pattern }}</span>
          <PencilNotes :notes="item.pencil" />
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="w in item.examples" :key="w.id" class="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50">
            <SpeakButton :text="w.th" />
            <ThaiReading :syllables="w.syllables" :th="w.th" align="start" />
            <span class="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">{{ w.meaning }}</span>
          </div>
        </div>
      </div>
    </div>
  </BlockSection>
</template>
