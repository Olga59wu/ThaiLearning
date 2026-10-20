<script setup lang="ts">
import { computed } from 'vue'
import type { ExamWrongAnswer } from '@/types/lesson'
import type { RecordSyncStatus } from '@/stores/lessonRecords'
import { QUESTION_TYPE_LABEL } from '@/utils/lessonExam'
import ExamLabel from './ExamLabel.vue'

const props = defineProps<{ correct: number; total: number; wrong: ExamWrongAnswer[]; retry: boolean; syncStatus: RecordSyncStatus }>()
const emit = defineEmits<{ retryWrong: []; restart: []; back: [] }>()

const percent = computed(() => (props.total ? Math.round((props.correct / props.total) * 100) : 0))
const message = computed(() =>
  percent.value === 100 ? '🎉 全對！' : percent.value >= 80 ? '👍 很棒！' : percent.value >= 60 ? '💪 再加油' : '📖 再複習一下',
)
</script>

<template>
  <div class="w-full flex flex-col gap-5">
    <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
      <div class="p-6 flex flex-col items-center gap-2 text-center">
        <div class="text-sm font-bold text-gray-400 dark:text-gray-500">{{ retry ? '錯題重考' : '考試結果' }}</div>
        <div class="text-6xl font-black text-gray-800 dark:text-white">
          {{ correct }}<span class="text-2xl text-gray-400"> / {{ total }}</span>
        </div>
        <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ percent }} 分　{{ message }}</div>
        <div class="text-xs font-bold" :class="syncStatus === 'error' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'">
          {{ syncStatus === 'syncing' ? '☁️ 紀錄同步中…' : syncStatus === 'error' ? '⚠️ 雲端同步失敗（紀錄已存在本機，下次進課程頁會再同步）' : '☁️ 紀錄已儲存' }}
        </div>
        <div class="flex flex-wrap justify-center gap-3 mt-4">
          <button v-if="wrong.length > 0" @click="emit('retryWrong')"
            class="px-6 py-2.5 rounded-full bg-orange-400 hover:bg-orange-500 text-white font-bold text-sm shadow-xs active:scale-95 transition-all">
            只重考錯題（{{ wrong.length }} 題）
          </button>
          <button @click="emit('restart')"
            class="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xs active:scale-95 transition-all">
            重新考試
          </button>
          <button @click="emit('back')"
            class="px-6 py-2.5 rounded-full border-2 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-300 hover:border-gray-400 font-bold text-sm active:scale-95 transition-all bg-white dark:bg-slate-700">
            回考試設定
          </button>
        </div>
      </div>
    </div>

    <div v-if="wrong.length > 0" class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 p-5 md:p-6">
      <h2 class="mb-4 text-lg font-bold text-gray-800 dark:text-white">❌ 錯題</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="(w, i) in wrong" :key="i" class="p-3 rounded-2xl bg-red-50/60 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
          <div class="text-xs font-bold text-gray-400 dark:text-gray-500">{{ QUESTION_TYPE_LABEL[w.type] }}</div>
          <div class="mt-1 font-bold text-gray-800 dark:text-white thai-font"><ExamLabel :text="w.prompt" /></div>
          <div class="mt-1 flex flex-wrap gap-x-4 text-sm thai-font">
            <span class="text-emerald-600 dark:text-emerald-400">正確：<ExamLabel :text="w.answer" :font-size="14" :line-height="20 / 14" /></span>
            <span class="text-red-500 dark:text-red-400">你的答案：<ExamLabel :text="w.given ?? '（未作答）'" :font-size="14" :line-height="20 / 14" /></span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
