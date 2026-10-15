<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LessonBlock } from '@/types/lesson'
import { numberToSyllables, numberToThai, toThaiDigits } from '@/utils/thaiNumber'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'
import WriteButton from '../WriteButton.vue'

const props = defineProps<{ block: Extract<LessonBlock, { type: 'homework' }> }>()
const { play } = useLessonAudioContext()

const numbers = computed(() =>
  Array.from({ length: props.block.numbers.max - props.block.numbers.min + 1 }, (_, i) => props.block.numbers.min + i),
)
// 點格子翻開唸法（再點一次蓋回去）
const revealed = ref<Set<number>>(new Set())
const toggle = (n: number) => {
  const next = new Set(revealed.value)
  if (next.has(n)) next.delete(n)
  else {
    next.add(n)
    play(numberToThai(n), true)
  }
  revealed.value = next
}
</script>

<template>
  <BlockSection :title="block.title" icon="✏️">
    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ block.task }}（點格子看答案，✍️ 練寫）</p>
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
      <div v-for="n in numbers" :key="n" role="button" tabindex="0" @click="toggle(n)" @keydown.enter="toggle(n)"
        class="relative flex flex-col items-center justify-center gap-1 min-h-20 p-2 pt-5 rounded-xl border cursor-pointer transition-all active:scale-95"
        :class="revealed.has(n)
          ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700'
          : 'bg-white border-gray-200 hover:border-emerald-300 dark:bg-slate-800 dark:border-slate-600'">
        <span class="text-2xl thai-font text-gray-800 dark:text-white">{{ toThaiDigits(n) }}</span>
        <template v-if="revealed.has(n)">
          <span class="text-xs font-mono text-gray-400">{{ n }}</span>
          <ThaiReading :syllables="numberToSyllables(n)" :th="numberToThai(n)" size="sm" />
        </template>
        <div class="absolute top-0 left-0"><WriteButton :num="n" /></div>
      </div>
    </div>
  </BlockSection>
</template>
