<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExamQuestionType, LessonVowel, VowelPracticeMode } from '@/types/lesson'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'
import { vowelSpeakText, vowelWriteBase } from '@/data/lessons/vowels'
import { practiceVowelQuestion, practiceVowels, vowelLengthPairs, type ExamQuestion, type VowelPracticeFilter } from '@/utils/lessonExam'
import ExamQuestionCard from '../exam/ExamQuestionCard.vue'
import VowelForm from '../VowelForm.vue'

// 母音練習（不計分、不存紀錄、題數不限）：題目與顯示沿用考試（practiceVowelQuestion → vowelQuestion、ExamQuestionCard）
// 長短對照聽不是測驗：點一組就連續念短音、長音
const props = defineProps<{ vowels: LessonVowel[]; modes: VowelPracticeMode[] }>()
const { playSequence, stop } = useLessonAudioContext()

const MODE_INFO: Record<VowelPracticeMode, { label: string; type?: ExamQuestionType }> = {
  sound: { label: '看字選音', type: 'vowelSound' },
  listen: { label: '聽音選字', type: 'vowelListen' },
  length: { label: '長短音', type: 'vowelLength' },
  position: { label: '位置', type: 'vowelPosition' },
  handwrite: { label: '手寫', type: 'vowelHandwrite' },
  pairs: { label: '長短對照聽' },
}
const FILTERS: { id: VowelPracticeFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'short', label: '短音' },
  { id: 'long', label: '長音' },
  { id: 'special', label: '特殊母音' },
  { id: 'independent', label: '獨立母音' },
]

const mode = ref<VowelPracticeMode>(props.modes[0] ?? 'sound')
const filter = ref<VowelPracticeFilter>('all')
const excludeDeprecated = ref(true)
const stats = ref({ correct: 0, total: 0, streak: 0 })

const questionType = computed(() => MODE_INFO[mode.value].type)
const inRange = computed(() => practiceVowels(props.vowels, filter.value, excludeDeprecated.value))
// 錯誤選項不受範圍限制（短音範圍也要出得了長音的另一半），只排除已停用
const distractorPool = computed(() => practiceVowels(props.vowels, 'all', excludeDeprecated.value))

const question = ref<ExamQuestion>()
// 長短對照聽：正在播放的那一組（短音的 id）
const playingPair = ref<string | null>(null)
let seq = 0
const nextQuestion = () => {
  const type = questionType.value
  question.value = type && practiceVowelQuestion(type, inRange.value, distractorPool.value, `practice-${++seq}`, question.value?.vowel?.id)
}
// 換模式或範圍：重新出題（答對數、連續答對不歸零）
watch([mode, filter, excludeDeprecated], () => {
  stop()
  playingPair.value = null
  nextQuestion()
}, { immediate: true })

const onAnswer = ({ correct }: { correct: boolean }) => {
  stats.value.total++
  if (correct) {
    stats.value.correct++
    stats.value.streak++
  } else {
    stats.value.streak = 0
  }
}

// ---- 長短對照聽 ----
const pairs = computed(() => vowelLengthPairs(props.vowels, filter.value, excludeDeprecated.value))
const playPair = ([short, long]: [LessonVowel, LessonVowel]) => {
  playingPair.value = short.id
  playSequence([vowelSpeakText(short), vowelSpeakText(long)], () => {
    if (playingPair.value === short.id) playingPair.value = null
  })
}

const chipClass = (active: boolean) =>
  active ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-300 shadow-xs' : 'text-gray-500 dark:text-gray-400'
</script>

<template>
  <div class="w-full flex flex-col gap-5">
    <!-- 設定 -->
    <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
      <div class="p-5 md:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">🔤 母音練習</h2>
          <span v-if="questionType" class="text-xs font-bold text-gray-400 dark:text-gray-500">
            答對 {{ stats.correct }} / {{ stats.total }}・連續答對 {{ stats.streak }}
          </span>
        </div>
        <div class="flex flex-wrap justify-center gap-1 p-1 mb-4 bg-gray-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto">
          <button v-for="m in modes" :key="m" @click="mode = m"
            class="px-3 py-1.5 text-xs font-bold rounded-xl transition-all" :class="chipClass(mode === m)">
            {{ MODE_INFO[m].label }}
          </button>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <div class="flex flex-wrap justify-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
            <button v-for="f in FILTERS" :key="f.id" @click="filter = f.id"
              class="px-3 py-1 text-xs font-bold rounded-lg transition-all" :class="chipClass(filter === f.id)">
              {{ f.label }}
            </button>
          </div>
          <label class="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input v-model="excludeDeprecated" type="checkbox" class="accent-emerald-500" />
            排除已停用
          </label>
        </div>
      </div>
    </div>

    <!-- 長短對照聽 -->
    <div v-if="mode === 'pairs'" class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 p-5 md:p-6">
      <div class="mb-4 text-sm text-center text-gray-400 dark:text-gray-500">點一組，連續播放短音、長音</div>
      <div v-if="pairs.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button v-for="pair in pairs" :key="pair[0].id" @click="playPair(pair)"
          class="flex flex-col items-center gap-1 px-3 py-3 border-2 rounded-2xl transition-all active:scale-95"
          :class="playingPair === pair[0].id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600'">
          <span class="flex items-center gap-2 text-3xl font-bold thai-font text-gray-800 dark:text-white">
            <VowelForm :write-base="vowelWriteBase(pair[0])" :font-size="30" :line-height="36 / 30" />
            <span class="text-base text-gray-300 dark:text-gray-500">／</span>
            <VowelForm :write-base="vowelWriteBase(pair[1])" :font-size="30" :line-height="36 / 30" />
          </span>
          <span class="text-sm font-bold text-gray-500 dark:text-gray-400">
            {{ pair[0].roman }}<template v-if="pair[0].zhuyin">（{{ pair[0].zhuyin }}）</template>
          </span>
        </button>
      </div>
      <div v-else class="py-6 text-sm text-center text-gray-400 dark:text-gray-500">這個範圍沒有長短音配對</div>
    </div>

    <!-- 測驗 -->
    <ExamQuestionCard v-else-if="question" :key="question.id" :question="question" practice @answer="onAnswer" @next="nextQuestion" />
    <div v-else class="w-full py-10 text-sm text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700">
      這個範圍沒有這種題目
    </div>
  </div>
</template>
