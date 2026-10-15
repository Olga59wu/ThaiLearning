<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import type { Denomination, LessonBlock, Syllable } from '@/types/lesson'
import { numberToSyllables, numberToThai, toThaiDigits } from '@/utils/thaiNumber'
import BlockSection from './BlockSection.vue'
import ToneSyllables from '../ToneSyllables.vue'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ block: Extract<LessonBlock, { type: 'currency' }> }>()
const words = computed(() => props.block.words.map(resolveWord))

// 面額唸法＝數字唸法＋單位（單位的音節取自本區塊的 บาท／สตางค์）
const unitSyllables = (unit: Denomination['unit']): Syllable[] =>
  words.value.find((w) => w.th === unit)?.syllables ?? []

const denominations = computed(() =>
  props.block.denominations.map((d) => ({
    ...d,
    th: numberToThai(d.value) + d.unit,
    syllables: [...numberToSyllables(d.value), ...unitSyllables(d.unit)],
  })),
)
</script>

<template>
  <BlockSection :title="block.title" icon="💰">
    <div class="flex flex-col gap-2 mb-5">
      <div v-for="w in words" :key="w.id" class="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50">
        <SpeakButton :text="w.th" />
        <span class="text-xl font-bold thai-font text-gray-800 dark:text-white">{{ w.th }}</span>
        <ToneSyllables :syllables="w.syllables" size="sm" />
        <span class="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ w.meaning }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div v-for="d in denominations" :key="d.value + d.unit"
        class="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-slate-600">
        <span class="text-2xl">{{ d.kind === 'coin' ? '🪙' : '💵' }}</span>
        <div class="flex flex-col gap-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="font-black text-gray-800 dark:text-white">{{ d.value }} {{ d.unit === 'บาท' ? '泰銖' : '分錢' }}</span>
            <span class="thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(d.value) }} {{ d.unit }}</span>
          </div>
          <div class="thai-font text-sm text-gray-600 dark:text-gray-300">{{ d.th }}</div>
          <ToneSyllables :syllables="d.syllables" size="sm" />
        </div>
        <div class="ml-auto"><SpeakButton :text="d.th" tts-only /></div>
      </div>
    </div>
  </BlockSection>
</template>
