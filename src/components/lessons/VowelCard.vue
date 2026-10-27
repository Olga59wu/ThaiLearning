<script setup lang="ts">
import { computed } from 'vue'
import { vowelDeprecated, vowelLabel, vowelPosition, vowelSpeakText, vowelWriteBase } from '@/data/lessons/vowels'
import type { LessonVowel } from '@/types/lesson'
import { toneOrdinalLabel } from '@/utils/tone'
import ToneSyllables from './ToneSyllables.vue'
import ThaiReading from './ThaiReading.vue'
import SpeakButton from './SpeakButton.vue'
import WriteButton from './WriteButton.vue'
import PencilNotes from './PencilNotes.vue'
import VowelForm from './VowelForm.vue'

// 一個母音：寫法（不受「泰文字」開關影響，這課就是在學字形）、สระ 名稱、拼音＋注音、聲調、位置
const props = defineProps<{ vowel: LessonVowel }>()
const v = computed(() => props.vowel)
const position = computed(() => vowelPosition(v.value))
const deprecated = computed(() => vowelDeprecated(v.value))
const reading = computed(() => [{ th: v.value.withO, roman: v.value.roman, tone: v.value.tone }])
const nameTh = computed(() => v.value.name?.map((s) => s.th).join('') ?? '')
</script>

<template>
  <div class="relative flex flex-col items-center gap-1.5 p-3 pt-8 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600"
    :class="deprecated ? 'opacity-60' : ''">
    <span class="absolute top-2 left-3 text-xs font-bold text-gray-300 dark:text-gray-500">{{ v.no }}</span>
    <div class="absolute top-1 right-1 flex items-center gap-0.5">
      <WriteButton :vowel="v" />
      <!-- 念法：สระ＋母音（th_สระอะ.mp3） -->
      <SpeakButton :text="vowelSpeakText(v)" />
    </div>

    <!-- 母音寫法、สระ 名稱：同 /thai 元音卡片（text-3xl 粗體：30px、36 / 30；綠字 thaiLabel） -->
    <div class="text-3xl font-bold thai-font text-gray-800 dark:text-white"><VowelForm :write-base="vowelWriteBase(v)" :font-size="30" :line-height="36 / 30" /></div>
    <div class="text-sm font-semibold thai-font text-emerald-600 dark:text-emerald-400">{{ vowelLabel(v) }}</div>
    <div class="flex items-end gap-1">
      <ToneSyllables :syllables="reading" />
      <span v-if="v.zhuyin" class="text-base font-bold text-gray-500 dark:text-gray-400 leading-none">（{{ v.zhuyin }}）</span>
    </div>
    <div class="text-[11px] font-bold text-gray-400 dark:text-gray-500">{{ toneOrdinalLabel(v.tone) }}</div>

    <ThaiReading v-if="v.name" :syllables="v.name" :th="nameTh" size="sm" />

    <div class="flex flex-wrap justify-center gap-1">
      <span v-if="position" class="px-2 py-0.5 text-[11px] rounded-full bg-white text-gray-500 border border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-600">位置：{{ position }}</span>
      <span v-if="v.note" class="px-2 py-0.5 text-[11px] rounded-full bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300">{{ v.note }}</span>
      <span v-if="deprecated" class="px-2 py-0.5 text-[11px] rounded-full bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300">已停用</span>
    </div>

    <PencilNotes :notes="v.pencil" align="center" />
  </div>
</template>
