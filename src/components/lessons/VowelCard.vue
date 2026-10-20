<script setup lang="ts">
import { computed } from 'vue'
import { vowelPosition } from '@/data/lessons/vowels'
import type { LessonVowel } from '@/types/lesson'
import { toneOrdinalLabel } from '@/utils/tone'
import ToneSyllables from './ToneSyllables.vue'
import ThaiReading from './ThaiReading.vue'
import SpeakButton from './SpeakButton.vue'
import WriteButton from './WriteButton.vue'
import PencilNotes from './PencilNotes.vue'

// 一個母音：課本字形（不受「泰文字」開關影響，這課就是在學字形）、搭配 อ、拼音＋注音、聲調、位置
const props = defineProps<{ vowel: LessonVowel }>()
const v = computed(() => props.vowel)
const position = computed(() => vowelPosition(v.value))
const reading = computed(() => [{ th: v.value.withO, roman: v.value.roman, tone: v.value.tone }])
const nameTh = computed(() => v.value.name?.map((s) => s.th).join('') ?? '')
</script>

<template>
  <div class="relative flex flex-col items-center gap-1.5 p-3 pt-8 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600"
    :class="v.deprecated ? 'opacity-60' : ''">
    <span class="absolute top-2 left-3 text-xs font-bold text-gray-300 dark:text-gray-500">{{ v.no }}</span>
    <div class="absolute top-1 right-1 flex items-center gap-0.5">
      <WriteButton :vowel="v" />
      <!-- 單一母音沒有打包音檔，直接用 TTS -->
      <SpeakButton :text="v.withO" tts-only />
    </div>

    <div class="text-4xl leading-tight thai-font text-gray-800 dark:text-white">{{ v.form }}</div>
    <div class="text-lg leading-tight thai-font text-emerald-600 dark:text-emerald-400">{{ v.withO }}</div>
    <div class="flex items-end gap-1">
      <ToneSyllables :syllables="reading" />
      <span v-if="v.zhuyin" class="text-base font-bold text-gray-500 dark:text-gray-400 leading-none">（{{ v.zhuyin }}）</span>
    </div>
    <div class="text-[11px] font-bold text-gray-400 dark:text-gray-500">{{ toneOrdinalLabel(v.tone) }}</div>

    <ThaiReading v-if="v.name" :syllables="v.name" :th="nameTh" size="sm" />

    <div class="flex flex-wrap justify-center gap-1">
      <span v-if="position" class="px-2 py-0.5 text-[11px] rounded-full bg-white text-gray-500 border border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-600">位置：{{ position }}</span>
      <span v-if="v.note" class="px-2 py-0.5 text-[11px] rounded-full bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300">{{ v.note }}</span>
      <span v-if="v.deprecated" class="px-2 py-0.5 text-[11px] rounded-full bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300">已停用</span>
    </div>

    <PencilNotes :notes="v.pencil" align="center" />
  </div>
</template>
