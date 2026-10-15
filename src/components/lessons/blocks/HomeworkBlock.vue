<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LessonBlock } from '@/types/lesson'
import { numberToSyllables, numberToThai, toThaiDigits } from '@/utils/thaiNumber'
import BlockSection from './BlockSection.vue'
import ToneSyllables from '../ToneSyllables.vue'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'

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
    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ block.task }}（點格子看答案）</p>
    <div class="grid grid-cols-5 gap-2">
      <button v-for="n in numbers" :key="n" type="button" @click="toggle(n)"
        class="flex flex-col items-center justify-center gap-1 min-h-20 p-2 rounded-xl border transition-all active:scale-95"
        :class="revealed.has(n)
          ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700'
          : 'bg-white border-gray-200 hover:border-emerald-300 dark:bg-slate-800 dark:border-slate-600'">
        <span class="text-2xl thai-font text-gray-800 dark:text-white">{{ toThaiDigits(n) }}</span>
        <template v-if="revealed.has(n)">
          <span class="text-xs font-mono text-gray-400">{{ n }}</span>
          <span class="text-sm font-bold thai-font text-emerald-700 dark:text-emerald-300">{{ numberToThai(n) }}</span>
          <div class="hidden sm:block"><ToneSyllables :syllables="numberToSyllables(n)" size="sm" /></div>
        </template>
      </button>
    </div>
  </BlockSection>
</template>
