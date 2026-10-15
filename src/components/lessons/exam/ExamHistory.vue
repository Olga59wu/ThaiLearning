<script setup lang="ts">
import { ref } from 'vue'
import type { LessonExamRecord } from '@/types/lesson'
import { QUESTION_TYPE_LABEL } from '@/utils/lessonExam'

// 歷次考試：摘要列表，點開看錯題（雲端同步來的舊紀錄沒有錯題明細）
defineProps<{ records: LessonExamRecord[] }>()
const openId = ref<string | null>(null)

const pad = (n: number) => String(n).padStart(2, '0')
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toggle = (id: string) => {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 p-5 md:p-6">
    <h2 class="mb-4 text-lg font-bold text-gray-800 dark:text-white">📊 歷次分數</h2>
    <p v-if="records.length === 0" class="text-sm text-gray-400 dark:text-gray-500">還沒有考試紀錄</p>
    <ul v-else class="flex flex-col gap-2">
      <li v-for="r in records" :key="r.id" class="rounded-2xl border border-gray-100 dark:border-slate-600 overflow-hidden">
        <button @click="toggle(r.id)" class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
          <span class="font-mono text-xs text-gray-400 dark:text-gray-500">{{ formatDate(r.date) }}</span>
          <span class="text-xs px-2 py-0.5 rounded-lg font-bold"
            :class="r.scope === 'cumulative' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'">
            {{ r.scope === 'cumulative' ? '累積' : '本課' }}
          </span>
          <span v-if="r.retry" class="text-xs px-2 py-0.5 rounded-lg font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">錯題重考</span>
          <span class="ml-auto font-black text-gray-800 dark:text-white">{{ r.correct }}<span class="text-xs text-gray-400"> / {{ r.total }}</span></span>
          <span class="text-gray-300 dark:text-gray-600 text-xs">{{ openId === r.id ? '▲' : '▼' }}</span>
        </button>
        <div v-if="openId === r.id" class="px-4 pb-3 text-sm">
          <p v-if="!r.wrong" class="text-gray-400 dark:text-gray-500">此紀錄的錯題只存在原本的裝置</p>
          <p v-else-if="r.wrong.length === 0" class="text-emerald-600 dark:text-emerald-400 font-bold">全對 🎉</p>
          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="(w, i) in r.wrong" :key="i" class="p-2 rounded-xl bg-red-50/60 dark:bg-red-900/10">
              <div class="text-xs text-gray-400 dark:text-gray-500">{{ QUESTION_TYPE_LABEL[w.type] }}</div>
              <div class="font-bold text-gray-800 dark:text-white thai-font">{{ w.prompt }}</div>
              <div class="flex flex-wrap gap-x-4 thai-font">
                <span class="text-emerald-600 dark:text-emerald-400">正確：{{ w.answer }}</span>
                <span class="text-red-500 dark:text-red-400">你的答案：{{ w.given ?? '（未作答）' }}</span>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>
