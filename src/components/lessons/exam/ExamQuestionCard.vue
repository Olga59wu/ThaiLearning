<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'
import { useHandwriting } from '@/composables/useHandwriting'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { composeNumberStrokes } from '@/utils/digitStrokes'
import { normalizeNumberInput, QUESTION_TYPE_LABEL, type ExamQuestion } from '@/utils/lessonExam'
import { numberToSyllables, numberToThai, toThaiDigits } from '@/utils/thaiNumber'
import { TONE_MARK, toneOrdinalLabel } from '@/utils/tone'
import ThaiReading from '../ThaiReading.vue'
import ToneSyllables from '../ToneSyllables.vue'
import HandwritingPad from '@/components/common/HandwritingPad.vue'
import VowelForm from '../VowelForm.vue'

// 一道考題（換題時父層以 :key 重建，狀態自動歸零）
// practice：母音練習共用（不顯示進度與題號，手寫題一出現就念發音）
const props = withDefaults(defineProps<{ question: ExamQuestion; index?: number; total?: number; practice?: boolean }>(), { index: 0, total: 1, practice: false })
const emit = defineEmits<{ answer: [result: { correct: boolean; given: string | null }]; next: [] }>()

const { play } = useLessonAudioContext()
const { isDark } = storeToRefs(useThaiLearnStore())
const hw = useHandwriting({ isDark })

const q = computed(() => props.question)
const isLast = computed(() => !props.practice && props.index === props.total - 1)
const answered = ref(false)
const isCorrect = ref(false)
const selectedKey = ref<string | null>(null)
const input = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const revealed = ref(false) // 手寫題：看答案

const isListen = computed(() => q.value.type === 'listenNumber' || q.value.type === 'vowelListen')
const isHandwrite = computed(() => q.value.type === 'digitHandwrite' || q.value.type === 'vowelHandwrite')
const LENGTH_LABEL = { short: '短音', long: '長音' } as const
// 母音的位置說明（例如「後」、「前/心卷」）
const vowelPositionText = computed(() => (q.value.vowel?.position ? `位置：${q.value.vowel.position}` : ''))
const answerOption = computed(() => q.value.options?.find((o) => o.key === q.value.answerKey))

const numReading = computed(() =>
  q.value.num === undefined ? null : { syllables: numberToSyllables(q.value.num), th: numberToThai(q.value.num) },
)
// 母音的發音（拼音＋聲調）；泰文就是題目的字形，不顯示
const vowelReading = computed(() =>
  q.value.vowel ? [{ th: q.value.vowel.withO, roman: q.value.vowel.roman, tone: q.value.vowel.tone }] : null,
)
// 數字：組合筆順（autoZoom）；母音：thaiData 的筆順疊在底圖上（不縮放）
const strokes = computed(() => q.value.strokes ?? (q.value.num === undefined ? undefined : composeNumberStrokes(q.value.num)))

// play() 會先查有沒有 mp3（母音 th_สระอะ.mp3、分類單字），沒有才用 TTS
const speakText = (th: string) => play(th)
const speakPrompt = () => {
  const text = q.value.reading?.th ?? q.value.speakText
  if (text) speakText(text)
}
// 答完念出正確唸法（聽音題不再重複）
const speakAnswer = () => {
  if (isListen.value) return
  if (numReading.value) speakText(numReading.value.th)
  else if (q.value.speakText) speakText(q.value.speakText)
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
  speakAnswer()
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
  // 母音的筆順對齊底圖座標，不縮放
  if (!q.value.guideText) hw.autoZoomSvg(strokes.value)
  await nextTick()
  if (strokes.value) hw.playAnim()
  if (numReading.value) speakText(numReading.value.th)
  else if (q.value.speakText) speakText(q.value.speakText)
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
  // 位置題看不到字形，一出現就念發音
  if (isListen.value || q.value.type === 'vowelPosition' || (props.practice && q.value.type === 'vowelHandwrite')) speakPrompt()
  if (q.value.type === 'digitInput') nextTick(() => inputEl.value?.focus())
  if (isHandwrite.value) nextTick(() => hw.initCanvas())
})
</script>

<template>
  <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <!-- 進度（練習沒有） -->
    <div v-if="practice" class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
    <div v-else class="h-1.5 bg-gray-100 dark:bg-slate-700">
      <div class="h-full bg-linear-to-r/srgb from-emerald-400 to-teal-500 transition-all" :style="{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }"></div>
    </div>
    <div class="p-5 md:p-6">
      <div class="flex items-center justify-between mb-6 text-xs font-bold text-gray-400 dark:text-gray-500">
        <span>{{ QUESTION_TYPE_LABEL[q.type] }}</span>
        <span v-if="!practice">第 {{ index + 1 }} / {{ total }} 題</span>
      </div>

      <!-- 題目 -->
      <div class="flex flex-col items-center justify-center gap-3 mb-6 min-h-28">
        <div v-if="q.type === 'digitInput'" class="text-6xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(q.num!) }}</div>
        <button v-else-if="isListen" @click="speakPrompt" title="再聽一次"
          class="flex items-center justify-center w-24 h-24 text-white transition-all rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 ring-4 ring-emerald-100 dark:ring-emerald-900/30">
          <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <!-- 母音寫法（不受「泰文字」開關影響）＋สระ 名稱（同 /thai） -->
        <div v-else-if="(q.type === 'vowelSound' || q.type === 'vowelLength') && q.vowel" class="flex flex-col items-center gap-1">
          <div class="text-7xl font-bold leading-tight thai-font text-gray-800 dark:text-white"><VowelForm :write-base="q.vowel.writeBase" :font-size="72" :line-height="1.25" /></div>
          <div class="text-2xl thai-font text-emerald-600 dark:text-emerald-400">{{ q.vowel.label }}</div>
        </div>
        <!-- 手寫母音：看發音（拼音＋注音＋聲調＋長短）寫字形 -->
        <div v-else-if="q.type === 'vowelHandwrite' && q.vowel && vowelReading" class="flex flex-wrap items-center justify-center gap-3">
          <ToneSyllables :syllables="vowelReading" size="xl" />
          <span v-if="q.vowel.zhuyin" class="text-3xl font-bold text-gray-500 dark:text-gray-400">（{{ q.vowel.zhuyin }}）</span>
          <span class="text-sm font-bold text-gray-400 dark:text-gray-500">{{ toneOrdinalLabel(q.vowel.tone) }}<template v-if="q.vowel.length">・{{ LENGTH_LABEL[q.vowel.length] }}</template></span>
          <button @click="speakPrompt" title="播放發音"
            class="flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-90 transition-all dark:bg-emerald-900/30 dark:text-emerald-400">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
        <!-- 位置：不顯示字形，只有 สระ 名稱＋發音（拼音＋注音＋聲調），答完才看到字形 -->
        <div v-else-if="q.type === 'vowelPosition' && q.vowel && vowelReading" class="flex flex-col items-center gap-2">
          <div class="text-3xl thai-font text-emerald-600 dark:text-emerald-400">{{ q.vowel.label }}</div>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <ToneSyllables :syllables="vowelReading" size="xl" />
            <span v-if="q.vowel.zhuyin" class="text-3xl font-bold text-gray-500 dark:text-gray-400">（{{ q.vowel.zhuyin }}）</span>
            <span class="text-sm font-bold text-gray-400 dark:text-gray-500">{{ toneOrdinalLabel(q.vowel.tone) }}</span>
            <button @click="speakPrompt" title="播放發音"
              class="flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-90 transition-all dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
          <div class="text-sm text-gray-400 dark:text-gray-500">母音寫在子音的哪裡？</div>
        </div>
        <!-- 人稱代名詞：情境 -->
        <div v-else-if="q.type === 'pronounChoice'" class="text-3xl font-black text-gray-800 dark:text-white">{{ q.context }}</div>
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
      <div v-if="q.options" class="grid gap-3" :class="q.type === 'vowelPosition' ? 'grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'">
        <button v-for="opt in q.options" :key="opt.key" @click="choose(opt.key)" :disabled="answered"
          class="flex items-center justify-center min-h-16 px-4 py-3 border-2 rounded-2xl transition-all active:scale-95 font-bold text-gray-800 dark:text-white"
          :class="optionClass(opt.key)">
          <!-- 母音發音：拼音＋注音＋聲調，不顯示泰文 -->
          <span v-if="opt.syllables && opt.hideThai" class="flex items-end gap-1">
            <ToneSyllables :syllables="opt.syllables" />
            <span v-if="opt.zhuyin" class="text-base text-gray-500 dark:text-gray-400 leading-none">（{{ opt.zhuyin }}）</span>
          </span>
          <ThaiReading v-else-if="opt.syllables" :syllables="opt.syllables" :th="opt.th!" />
          <span v-else-if="opt.vowelWriteBase" class="text-4xl font-bold thai-font"><VowelForm :write-base="opt.vowelWriteBase" :font-size="36" :line-height="40 / 36" /></span>
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

      <!-- 作答：手寫（數字、母音） -->
      <div v-else-if="isHandwrite" class="flex flex-col items-center gap-4">
        <div class="w-full max-w-sm flex flex-col rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-600">
          <HandwritingPad :hw="hw" :is-dark="isDark" :strokes="strokes" :guide-text="q.guideText" :show-guide="revealed" />
        </div>
        <button v-if="!revealed" @click="reveal"
          class="px-8 py-2.5 rounded-full bg-orange-400 hover:bg-orange-500 text-white font-bold text-sm shadow-xs active:scale-95 transition-all">
          看答案
        </button>
        <div v-else class="flex flex-col items-center gap-3 p-4 w-full rounded-2xl bg-gray-50 dark:bg-slate-700/50">
          <div v-if="q.num !== undefined" class="flex items-baseline gap-3">
            <span class="text-4xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(q.num) }}</span>
            <ThaiReading v-if="numReading" :syllables="numReading.syllables" :th="numReading.th" size="sm" />
          </div>
          <div v-else-if="q.vowel" class="flex flex-wrap items-baseline justify-center gap-3">
            <span class="text-4xl font-bold thai-font text-gray-800 dark:text-white"><VowelForm :write-base="q.vowel.writeBase" :font-size="36" :line-height="40 / 36" /></span>
            <span class="text-2xl thai-font text-gray-500 dark:text-gray-400">{{ q.vowel.label }}</span>
            <span v-if="vowelPositionText" class="text-sm font-bold text-gray-500 dark:text-gray-400">{{ vowelPositionText }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">寫對了嗎？</span>
            <button @click="grade(true)" class="w-12 h-12 text-xl font-black text-white rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all">✓</button>
            <button @click="grade(false)" class="w-12 h-12 text-xl font-black text-white rounded-full bg-red-400 hover:bg-red-500 active:scale-95 transition-all">✗</button>
          </div>
        </div>
      </div>

      <!-- 對錯與正確答案（手寫題自評後直接下一題） -->
      <div v-if="answered && !isHandwrite" class="flex flex-col items-center gap-3 mt-6 p-4 rounded-2xl"
        :class="isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'">
        <div class="font-bold" :class="isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
          {{ isCorrect ? '⭕ 答對了！' : '❌ 正確答案' }}
        </div>
        <div v-if="q.num !== undefined" class="flex flex-wrap items-center justify-center gap-3">
          <span class="text-3xl font-black text-gray-800 dark:text-white">{{ q.num.toLocaleString('en-US') }}</span>
          <span class="text-2xl thai-font text-emerald-600 dark:text-emerald-400">{{ toThaiDigits(q.num) }}</span>
          <ThaiReading v-if="numReading" :syllables="numReading.syllables" :th="numReading.th" />
        </div>
        <!-- 母音：寫法＋สระ 名稱＋發音＋長短 -->
        <div v-else-if="q.vowel && vowelReading" class="flex flex-wrap items-center justify-center gap-3">
          <span class="text-3xl font-bold thai-font text-gray-800 dark:text-white"><VowelForm :write-base="q.vowel.writeBase" :font-size="30" :line-height="36 / 30" /></span>
          <span class="text-2xl thai-font text-emerald-600 dark:text-emerald-400">{{ q.vowel.label }}</span>
          <ToneSyllables :syllables="vowelReading" />
          <span v-if="q.vowel.zhuyin" class="font-bold text-gray-500 dark:text-gray-400">（{{ q.vowel.zhuyin }}）</span>
          <span class="text-sm font-bold text-gray-500 dark:text-gray-400">{{ TONE_MARK[q.vowel.tone] }} {{ toneOrdinalLabel(q.vowel.tone) }}<template v-if="q.vowel.length">・{{ LENGTH_LABEL[q.vowel.length] }}</template></span>
          <span v-if="vowelPositionText" class="text-sm font-bold text-gray-500 dark:text-gray-400">{{ vowelPositionText }}</span>
        </div>
        <ThaiReading v-else-if="q.type === 'pronounChoice' && answerOption?.syllables" :syllables="answerOption.syllables" :th="answerOption.th!" />
        <div v-else class="text-lg font-bold text-gray-800 dark:text-white">{{ q.answerLabel }}</div>
        <button v-if="q.options" @click="emit('next')"
          class="px-8 py-2.5 rounded-full bg-gray-800 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold text-sm active:scale-95 transition-all">
          {{ isLast ? '看結果' : '下一題 →' }}
        </button>
      </div>
    </div>
  </div>
</template>
