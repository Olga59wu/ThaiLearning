<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { isVocabText } from '@/data/vocabCategories'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'
import { useHandwriting } from '@/composables/useHandwriting'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { composeNumberStrokes } from '@/utils/digitStrokes'
import { normalizeNumberInput, QUESTION_TYPE_LABEL, type ExamQuestion } from '@/utils/lessonExam'
import { numberToSyllables, numberToThai, toThaiDigits } from '@/utils/thaiNumber'
import ThaiReading from '../ThaiReading.vue'
import HandwritingPad from '@/components/common/HandwritingPad.vue'

// 一道考題（換題時父層以 :key 重建，狀態自動歸零）
const props = defineProps<{ question: ExamQuestion; index: number; total: number }>()
const emit = defineEmits<{ answer: [result: { correct: boolean; given: string | null }]; next: [] }>()

const { play } = useLessonAudioContext()
const { isDark } = storeToRefs(useThaiLearnStore())
const hw = useHandwriting({ isDark })

const q = computed(() => props.question)
const isLast = computed(() => props.index === props.total - 1)
const answered = ref(false)
const isCorrect = ref(false)
const selectedKey = ref<string | null>(null)
const input = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const revealed = ref(false) // 手寫題：看答案

const numReading = computed(() =>
  q.value.num === undefined ? null : { syllables: numberToSyllables(q.value.num), th: numberToThai(q.value.num) },
)
const strokes = computed(() => (q.value.num === undefined ? undefined : composeNumberStrokes(q.value.num)))

const speakText = (th: string) => play(th, !isVocabText(th))
const speakPrompt = () => {
  if (q.value.reading) speakText(q.value.reading.th)
}

const finish = (correct: boolean, given: string | null) => {
  answered.value = true
  isCorrect.value = correct
  emit('answer', { correct, given })
}

const choose = (key: string) => {
  if (answered.value) return
  selectedKey.value = key
  const opt = q.value.options?.find((o) => o.key === key)
  finish(key === q.value.answerKey, opt?.text ?? key)
  // 數字題答完念出正確唸法（聽音題不再重複）
  if (numReading.value && q.value.type !== 'listenNumber') speakText(numReading.value.th)
}

const submitInput = () => {
  if (answered.value) {
    emit('next')
    return
  }
  const value = normalizeNumberInput(input.value)
  if (value === null) return
  finish(value === q.value.answerKey, value)
  if (numReading.value) speakText(numReading.value.th)
}

// 手寫題：看答案 → 顯示字形並播放筆順 → 自己按 ✓／✗
const reveal = async () => {
  revealed.value = true
  await nextTick()
  hw.autoZoomSvg(strokes.value)
  await nextTick()
  hw.playAnim()
  if (numReading.value) speakText(numReading.value.th)
}
const grade = (correct: boolean) => {
  finish(correct, correct ? '✓' : '✗')
  emit('next')
}

const optionClass = (key: string) => {
  if (!answered.value) return 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600'
  if (key === q.value.answerKey) return 'bg-emerald-100 border-emerald-500 dark:bg-emerald-900/40'
  if (key === selectedKey.value) return 'bg-red-100 border-red-500 shake-anim dark:bg-red-900/40'
  return 'bg-white border-gray-100 opacity-50 dark:bg-slate-700 dark:border-slate-600'
}

onMounted(() => {
  if (q.value.type === 'listenNumber') speakPrompt()
  if (q.value.type === 'digitInput') nextTick(() => inputEl.value?.focus())
  if (q.value.type === 'digitHandwrite') nextTick(() => hw.initCanvas())
})
</script>

<template>
  <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <!-- 進度 -->
    <div class="h-1.5 bg-gray-100 dark:bg-slate-700">
      <div class="h-full bg-linear-to-r/srgb from-emerald-400 to-teal-500 transition-all" :style="{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }"></div>
    </div>
    <div class="p-5 md:p-6">
      <div class="flex items-center justify-between mb-6 text-xs font-bold text-gray-400 dark:text-gray-500">
        <span>{{ QUESTION_TYPE_LABEL[q.type] }}</span>
        <span>第 {{ index + 1 }} / {{ total }} 題</span>
      </div>

      <!-- 題目 -->
      <div class="flex flex-col items-center justify-center gap-3 mb-6 min-h-28">
        <div v-if="q.type === 'digitInput'" class="text-6xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(q.num!) }}</div>
        <button v-else-if="q.type === 'listenNumber'" @click="speakPrompt" title="再聽一次"
          class="flex items-center justify-center w-24 h-24 text-white transition-all rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 ring-4 ring-emerald-100 dark:ring-emerald-900/30">
          <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <div v-else-if="q.reading" class="flex items-center gap-4">
          <ThaiReading :syllables="q.reading.syllables" :th="q.reading.th" size="xl" />
          <button @click="speakPrompt" title="播放發音"
            class="flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-90 transition-all dark:bg-emerald-900/30 dark:text-emerald-400">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
        <div v-else class="text-6xl font-black text-gray-800 dark:text-white">{{ q.num?.toLocaleString('en-US') }}</div>
      </div>

      <!-- 作答：選擇題 -->
      <div v-if="q.options" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button v-for="opt in q.options" :key="opt.key" @click="choose(opt.key)" :disabled="answered"
          class="flex items-center justify-center min-h-16 px-4 py-3 border-2 rounded-2xl transition-all active:scale-95 font-bold text-gray-800 dark:text-white"
          :class="optionClass(opt.key)">
          <ThaiReading v-if="opt.syllables" :syllables="opt.syllables" :th="opt.th!" />
          <span v-else :class="opt.thaiDigits ? 'text-4xl thai-font font-normal' : q.type === 'listenNumber' ? 'text-3xl font-black' : 'text-lg'">{{ opt.text }}</span>
        </button>
      </div>

      <!-- 作答：輸入數字 -->
      <form v-else-if="q.type === 'digitInput'" class="flex gap-2 max-w-sm mx-auto" @submit.prevent="submitInput">
        <input ref="inputEl" v-model="input" :readonly="answered" inputmode="numeric" autocomplete="off" placeholder="輸入阿拉伯數字"
          class="flex-1 min-w-0 px-4 py-3 text-2xl font-bold text-center border-2 rounded-2xl outline-hidden bg-white dark:bg-slate-700 dark:text-white"
          :class="!answered ? 'border-gray-200 focus:border-emerald-400 dark:border-slate-600' : isCorrect ? 'border-emerald-500' : 'border-red-500'" />
        <button type="submit" class="px-5 py-3 font-bold text-white rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all">
          {{ answered ? (isLast ? '看結果' : '下一題') : '確認' }}
        </button>
      </form>

      <!-- 作答：手寫 -->
      <div v-else-if="q.type === 'digitHandwrite'" class="flex flex-col items-center gap-4">
        <div class="w-full max-w-sm flex flex-col rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-600">
          <HandwritingPad :hw="hw" :is-dark="isDark" :strokes="strokes" :show-guide="revealed" />
        </div>
        <button v-if="!revealed" @click="reveal"
          class="px-8 py-2.5 rounded-full bg-orange-400 hover:bg-orange-500 text-white font-bold text-sm shadow-xs active:scale-95 transition-all">
          看答案
        </button>
        <div v-else class="flex flex-col items-center gap-3 p-4 w-full rounded-2xl bg-gray-50 dark:bg-slate-700/50">
          <div class="flex items-baseline gap-3">
            <span class="text-4xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(q.num!) }}</span>
            <ThaiReading v-if="numReading" :syllables="numReading.syllables" :th="numReading.th" size="sm" />
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">寫對了嗎？</span>
            <button @click="grade(true)" class="w-12 h-12 text-xl font-black text-white rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all">✓</button>
            <button @click="grade(false)" class="w-12 h-12 text-xl font-black text-white rounded-full bg-red-400 hover:bg-red-500 active:scale-95 transition-all">✗</button>
          </div>
        </div>
      </div>

      <!-- 對錯與正確答案（手寫題自評後直接下一題） -->
      <div v-if="answered && q.type !== 'digitHandwrite'" class="flex flex-col items-center gap-3 mt-6 p-4 rounded-2xl"
        :class="isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'">
        <div class="font-bold" :class="isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
          {{ isCorrect ? '⭕ 答對了！' : '❌ 正確答案' }}
        </div>
        <div v-if="q.num !== undefined" class="flex flex-wrap items-center justify-center gap-3">
          <span class="text-3xl font-black text-gray-800 dark:text-white">{{ q.num.toLocaleString('en-US') }}</span>
          <span class="text-2xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(q.num) }}</span>
          <ThaiReading v-if="numReading" :syllables="numReading.syllables" :th="numReading.th" />
        </div>
        <div v-else class="text-lg font-bold text-gray-800 dark:text-white">{{ q.answerLabel }}</div>
        <button v-if="q.options" @click="emit('next')"
          class="px-8 py-2.5 rounded-full bg-gray-800 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold text-sm active:scale-95 transition-all">
          {{ isLast ? '看結果' : '下一題 →' }}
        </button>
      </div>
    </div>
  </div>
</template>
