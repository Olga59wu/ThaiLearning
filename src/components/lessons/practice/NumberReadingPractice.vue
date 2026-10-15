<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { NumberPool, Syllable } from '@/types/lesson'
import { isVocabText } from '@/data/vocabCategories'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'
import { fromThaiDigits, numberToSyllables, numberToThai, readingDistractorSyllables, toThaiDigits } from '@/utils/thaiNumber'
import { joinSyllables } from '@/utils/tone'
import { pickRandom, poolNumbers } from '@/utils/numberPool'
import { shuffleArray } from '@/utils/shuffle'
import ThaiReading from '../ThaiReading.vue'

// 數字練習（不計分、不存紀錄）：
// - choice：看阿拉伯數字 → 選拼音唸法（錯誤選項為常見錯誤唸法）
// - digits：看泰文數字 → 輸入阿拉伯數字
// - listen：聽發音 → 輸入阿拉伯數字
const props = defineProps<{ pool: NumberPool }>()
const { play } = useLessonAudioContext()

type Mode = 'choice' | 'digits' | 'listen'
const MODES: { id: Mode; label: string }[] = [
  { id: 'choice', label: '選唸法' },
  { id: 'digits', label: '看泰文數字' },
  { id: 'listen', label: '聽音' },
]
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
  options.value = shuffleArray([syllables.value, ...readingDistractorSyllables(current.value)]).map((s) => ({
    th: joinSyllables(s),
    syllables: s,
  }))
  selected.value = null
  input.value = ''
  answered.value = false
  isCorrect.value = false
  if (mode.value === 'listen') speak()
  if (mode.value !== 'choice') nextTick(() => inputEl.value?.focus())
}

const finish = (correct: boolean) => {
  answered.value = true
  isCorrect.value = correct
  stats.value.total++
  if (correct) stats.value.correct++
  if (mode.value !== 'listen') speak()
}

const choose = (th: string) => {
  if (answered.value) return
  selected.value = th
  finish(th === answer.value)
}

// 輸入阿拉伯數字（也接受泰文數字、逗號與空白）
const submitNumber = () => {
  if (answered.value) {
    nextQuestion()
    return
  }
  const value = fromThaiDigits(input.value).replace(/[\s,]/g, '')
  if (!/^\d+$/.test(value)) return
  finish(Number(value) === current.value)
}

const setMode = (m: Mode) => {
  mode.value = m
  nextQuestion()
}

const optionClass = (th: string) => {
  if (!answered.value) return 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600'
  if (th === answer.value) return 'bg-emerald-100 border-emerald-500 dark:bg-emerald-900/40'
  if (th === selected.value) return 'bg-red-100 border-red-500 shake-anim dark:bg-red-900/40'
  return 'bg-white border-gray-100 opacity-50 dark:bg-slate-700 dark:border-slate-600'
}

nextQuestion()
</script>

<template>
  <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
    <div class="p-5 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 class="text-lg font-bold text-gray-800 dark:text-white">🔢 數字練習</h2>
        <span class="text-xs font-bold text-gray-400 dark:text-gray-500">答對 {{ stats.correct }} / {{ stats.total }}</span>
      </div>
      <div class="flex flex-wrap gap-1 p-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto">
        <button v-for="m in MODES" :key="m.id" @click="setMode(m.id)"
          class="px-3 py-1.5 text-xs font-bold rounded-xl transition-all"
          :class="mode === m.id ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-300 shadow-xs' : 'text-gray-500 dark:text-gray-400'">
          {{ m.label }}
        </button>
      </div>

      <!-- 題目 -->
      <div class="flex flex-col items-center mb-6 min-h-28 justify-center">
        <template v-if="mode === 'choice'">
          <div class="text-6xl font-black text-gray-800 dark:text-white">{{ current.toLocaleString('en-US') }}</div>
          <div class="mt-1 text-sm text-gray-400 dark:text-gray-500">選出正確唸法</div>
        </template>
        <template v-else-if="mode === 'digits'">
          <div class="text-6xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(current) }}</div>
          <div class="mt-1 text-sm text-gray-400 dark:text-gray-500">輸入阿拉伯數字</div>
        </template>
        <template v-else>
          <button @click="speak" title="再聽一次"
            class="flex items-center justify-center w-24 h-24 text-white transition-all rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 ring-4 ring-emerald-100 dark:ring-emerald-900/30">
            <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <div class="mt-3 text-sm text-gray-400 dark:text-gray-500">聽發音，輸入阿拉伯數字</div>
        </template>
      </div>

      <!-- 作答 -->
      <div v-if="mode === 'choice'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button v-for="opt in options" :key="opt.th" @click="choose(opt.th)" :disabled="answered"
          class="flex justify-center px-4 py-3 border-2 rounded-2xl transition-all active:scale-95"
          :class="optionClass(opt.th)">
          <ThaiReading :syllables="opt.syllables" :th="opt.th" />
        </button>
      </div>
      <form v-else class="flex gap-2 max-w-sm mx-auto" @submit.prevent="submitNumber">
        <input ref="inputEl" v-model="input" :readonly="answered" inputmode="numeric" autocomplete="off" placeholder="例如 23"
          class="flex-1 min-w-0 px-4 py-3 text-2xl font-bold text-center border-2 rounded-2xl outline-hidden bg-white dark:bg-slate-700 dark:text-white"
          :class="!answered ? 'border-gray-200 focus:border-emerald-400 dark:border-slate-600' : isCorrect ? 'border-emerald-500' : 'border-red-500'" />
        <button type="submit" class="px-5 py-3 font-bold text-white rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all">
          {{ answered ? '下一題' : '確認' }}
        </button>
      </form>

      <!-- 答案 -->
      <div v-if="answered" class="flex flex-col items-center gap-3 mt-6 p-4 rounded-2xl"
        :class="isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'">
        <div class="font-bold" :class="isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
          {{ isCorrect ? '⭕ 答對了！' : '❌ 正確答案' }}
        </div>
        <div class="flex items-baseline gap-3">
          <span class="text-3xl font-black text-gray-800 dark:text-white">{{ current.toLocaleString('en-US') }}</span>
          <span class="text-2xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(current) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <ThaiReading :syllables="syllables" :th="answer" size="lg" />
          <button @click="speak" title="播放發音" class="text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform">🔊</button>
        </div>
        <button v-if="mode === 'choice'" @click="nextQuestion"
          class="px-8 py-2.5 rounded-full bg-gray-800 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold text-sm active:scale-95 transition-all">
          下一題 →
        </button>
      </div>
    </div>
  </div>
</template>
