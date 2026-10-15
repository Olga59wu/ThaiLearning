<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import type { Denomination, LessonBlock, Syllable } from '@/types/lesson'
import { numberToSyllables, numberToThai, toThaiDigits } from '@/utils/thaiNumber'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ block: Extract<LessonBlock, { type: 'currency' }> }>()
const words = computed(() => props.block.words.map(resolveWord))

// 面額唸法＝數字唸法＋單位（單位的音節取自本區塊的 บาท／สตางค์）
const unitSyllables = (unit: Denomination['unit']): Syllable[] =>
  words.value.find((w) => w.th === unit)?.syllables ?? []
const UNIT_ZH: Record<Denomination['unit'], string> = { บาท: '泰銖', สตางค์: '分錢' }

const denominations = computed(() =>
  props.block.denominations.map((d) => ({
    ...d,
    th: numberToThai(d.value) + d.unit,
    syllables: [...numberToSyllables(d.value), ...unitSyllables(d.unit)],
  })),
)
</script>

<template>
  <BlockSection :title="block.title" :title-th="block.titleTh" icon="💰">
    <div class="flex flex-col gap-2 mb-5">
      <div v-for="w in words" :key="w.id" class="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50">
        <SpeakButton :text="w.th" />
        <ThaiReading :syllables="w.syllables" :th="w.th" align="start" />
        <span class="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ w.meaning }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div v-for="d in denominations" :key="d.value + d.unit"
        class="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-slate-600">
        <span class="text-2xl">{{ d.kind === 'coin' ? '🪙' : '💵' }}</span>
        <div class="flex flex-col gap-1.5 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="font-black text-gray-800 dark:text-white">{{ d.value }} {{ UNIT_ZH[d.unit] }}</span>
            <span class="thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(d.value) }}</span>
          </div>
          <ThaiReading :syllables="d.syllables" :th="d.th" size="sm" align="start" />
        </div>
        <div class="ml-auto"><SpeakButton :text="d.th" tts-only /></div>
      </div>
    </div>
  </BlockSection>
</template>
