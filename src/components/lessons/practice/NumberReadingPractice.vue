<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { NumberPool } from '@/types/lesson'
import { isVocabText } from '@/data/vocabCategories'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'
import { numberToSyllables, numberToThai, readingDistractorSyllables, toThaiDigits } from '@/utils/thaiNumber'
import { joinSyllables } from '@/utils/tone'
import type { Syllable } from '@/types/lesson'
import { pickRandom, poolNumbers } from '@/utils/numberPool'
import { shuffleArray } from '@/utils/shuffle'
import ThaiReading from '../ThaiReading.vue'

// 數字唸法練習：隨機出數字，選出或打出正確泰文唸法（不計分、不存紀錄）
const props = defineProps<{ pool: NumberPool }>()
const { play } = useLessonAudioContext()

type Mode = 'choice' | 'typing'
const mode = ref<Mode>('choice')
const numbers = computed(() => poolNumbers(props.pool))

const current = ref(0)
const options = ref<{ th: string; syllables: Syllable[] }[]>([])
const selected = ref<string | null>(null)
const input = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const stats = ref({ correct: 0, total: 0 })
const inputEl = ref<HTMLInputElement | null>(null)

const answer = computed(() => numberToThai(current.value))
const syllables = computed(() => numberToSyllables(current.value))

const speak = () => play(answer.value, !isVocabText(answer.value))

const nextQuestion = () => {
  current.value = pickRandom(numbers.value, current.value)
  options.value = shuffleArray([syllables.value, ...readingDistractorSyllables(current.value)]).map((s) => ({ th: joinSyllables(s), syllables: s }))
  selected.value = null
  input.value = ''
  answered.value = false
  isCorrect.value = false
  if (mode.value === 'typing') nextTick(() => inputEl.value?.focus())
}

const finish = (correct: boolean) => {
  answered.value = true
  isCorrect.value = correct
  stats.value.total++
  if (correct) stats.value.correct++
  speak()
}

const choose = (opt: string) => {
  if (answered.value) return
  selected.value = opt
  finish(opt === answer.value)
}

// 打字：忽略空白
const normalize = (s: string) => s.replace(/\s+/g, '')
const submitTyping = () => {
  if (answered.value) {
    nextQuestion()
    return
  }
  if (!normalize(input.value)) return
  finish(normalize(input.value) === answer.value)
}

const setMode = (m: Mode) => {
  mode.value = m
  nextQuestion()
}

const optionClass = (opt: string) => {
  if (!answered.value) return 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600'
  if (opt === answer.value) return 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
  if (opt === selected.value) return 'bg-red-100 border-red-500 text-red-800 shake-anim dark:bg-red-900/40 dark:text-red-200'
  return 'bg-white border-gray-100 opacity-50 dark:bg-slate-700 dark:border-slate-600'
}

nextQuestion()
</script>

<template>
  <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
    <div class="p-5 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 class="text-lg font-bold text-gray-800 dark:text-white">🔢 數字唸法練習</h2>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-gray-400 dark:text-gray-500">答對 {{ stats.correct }} / {{ stats.total }}</span>
          <div class="flex p-1 bg-gray-100 dark:bg-slate-700 rounded-full">
            <button v-for="m in (['choice', 'typing'] as const)" :key="m" @click="setMode(m)"
              class="px-3 py-1 text-xs font-bold rounded-full transition-all"
              :class="mode === m ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-300 shadow-xs' : 'text-gray-500 dark:text-gray-400'">
              {{ m === 'choice' ? '選擇' : '打字' }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center mb-6">
        <div class="text-6xl font-black text-gray-800 dark:text-white">{{ current.toLocaleString('en-US') }}</div>
        <div class="mt-1 text-3xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(current) }}</div>
      </div>

      <div v-if="mode === 'choice'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button v-for="opt in options" :key="opt.th" @click="choose(opt.th)" :disabled="answered"
          class="flex justify-center px-4 py-3 border-2 rounded-2xl transition-all active:scale-95"
          :class="optionClass(opt.th)">
          <ThaiReading :syllables="opt.syllables" :th="opt.th" />
        </button>
      </div>

      <form v-else class="flex gap-2" @submit.prevent="submitTyping">
        <input ref="inputEl" v-model="input" :readonly="answered" lang="th" autocomplete="off" placeholder="輸入泰文唸法"
          class="flex-1 min-w-0 px-4 py-3 text-xl border-2 rounded-2xl thai-font outline-hidden bg-white dark:bg-slate-700 dark:text-white"
          :class="!answered ? 'border-gray-200 focus:border-emerald-400 dark:border-slate-600' : isCorrect ? 'border-emerald-500' : 'border-red-500'" />
        <button type="submit" class="px-5 py-3 font-bold text-white rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all">
          {{ answered ? '下一題' : '確認' }}
        </button>
      </form>

      <div v-if="answered" class="flex flex-col items-center gap-2 mt-6 p-4 rounded-2xl"
        :class="isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'">
        <div class="font-bold" :class="isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
          {{ isCorrect ? '⭕ 答對了！' : '❌ 正確答案' }}
        </div>
        <div class="flex items-center gap-3">
          <ThaiReading :syllables="syllables" :th="answer" size="lg" />
          <button @click="speak" title="播放發音" class="text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform">🔊</button>
        </div>
        <button v-if="mode === 'choice'" @click="nextQuestion"
          class="mt-2 px-8 py-2.5 rounded-full bg-gray-800 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold text-sm active:scale-95 transition-all">
          下一題 →
        </button>
      </div>
    </div>
  </div>
</template>
