<script setup lang="ts">
import { computed, ref } from 'vue'
import { LESSONS } from '@/data/lessons'
import type { ExamWrongAnswer, Lesson } from '@/types/lesson'
import { buildExam, examPlan, QUESTION_TYPE_LABEL, reshuffleQuestions, type ExamQuestion, type ExamScope } from '@/utils/lessonExam'
import ExamQuestionCard from './ExamQuestionCard.vue'
import ExamResult from './ExamResult.vue'

// 考試流程：設定（範圍）→ 作答 → 結果（只重考錯題／重新考試）
const props = defineProps<{ lesson: Lesson }>()

type Phase = 'setup' | 'running' | 'result'
const phase = ref<Phase>('setup')
const scope = ref<ExamScope>('lesson')
const isFirstLesson = computed(() => LESSONS[0]?.no === props.lesson.no)
const plan = computed(() => examPlan(LESSONS, props.lesson.no, scope.value))
const totalCount = computed(() => plan.value.questions.reduce((s, q) => s + q.count, 0))

const questions = ref<ExamQuestion[]>([])
const index = ref(0)
const results = ref<{ question: ExamQuestion; correct: boolean; given: string | null }[]>([])
const isRetry = ref(false)

const current = computed(() => questions.value[index.value])
const correctCount = computed(() => results.value.filter((r) => r.correct).length)
const wrongResults = computed(() => results.value.filter((r) => !r.correct))
const wrongAnswers = computed<ExamWrongAnswer[]>(() =>
  wrongResults.value.map((r) => ({ type: r.question.type, prompt: r.question.promptLabel, answer: r.question.answerLabel, given: r.given })),
)

const run = (qs: ExamQuestion[], retry: boolean) => {
  questions.value = qs
  index.value = 0
  results.value = []
  isRetry.value = retry
  phase.value = 'running'
  window.scrollTo({ top: 0 })
}

const start = () => run(buildExam(plan.value), false)
const retryWrong = () => run(reshuffleQuestions(wrongResults.value.map((r) => r.question)), true)

const onAnswer = (result: { correct: boolean; given: string | null }) => {
  if (current.value) results.value.push({ question: current.value, ...result })
}
const onNext = () => {
  if (index.value < questions.value.length - 1) index.value++
  else phase.value = 'result'
}
</script>

<template>
  <!-- 設定 -->
  <div v-if="phase === 'setup'" class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
    <div class="p-5 md:p-6">
      <h2 class="mb-4 text-lg font-bold text-gray-800 dark:text-white">📝 課前小考</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button @click="scope = 'lesson'"
          class="p-4 text-left border-2 rounded-2xl transition-all"
          :class="scope === 'lesson' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300'">
          <div class="font-bold text-gray-800 dark:text-white">只考本課</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">第 {{ lesson.no }} 課 {{ lesson.title }}</div>
        </button>
        <button @click="scope = 'cumulative'" :disabled="isFirstLesson"
          class="p-4 text-left border-2 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :class="scope === 'cumulative' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300'">
          <div class="font-bold text-gray-800 dark:text-white">累積考</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ isFirstLesson ? '第 1 課只有本課可以考' : `第 1 課到第 ${lesson.no} 課` }}
          </div>
        </button>
      </div>

      <ul class="mb-6 flex flex-col gap-1.5 text-sm">
        <li v-for="q in plan.questions" :key="q.type" class="flex justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50">
          <span class="text-gray-600 dark:text-gray-300">{{ QUESTION_TYPE_LABEL[q.type] }}</span>
          <span class="font-bold text-gray-800 dark:text-white">{{ q.count }} 題</span>
        </li>
      </ul>

      <button @click="start"
        class="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xs active:scale-[0.98] transition-all">
        開始考試（共 {{ totalCount }} 題）
      </button>
    </div>
  </div>

  <!-- 作答 -->
  <ExamQuestionCard v-else-if="phase === 'running' && current" :key="`${isRetry}-${current.id}-${index}`"
    :question="current" :index="index" :total="questions.length" @answer="onAnswer" @next="onNext" />

  <!-- 結果 -->
  <ExamResult v-else-if="phase === 'result'" :correct="correctCount" :total="results.length" :wrong="wrongAnswers" :retry="isRetry"
    @retry-wrong="retryWrong" @restart="start" @back="phase = 'setup'" />
</template>
