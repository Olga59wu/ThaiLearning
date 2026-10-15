<script setup lang="ts">
import { computed } from 'vue'
import { blocksOf } from '@/data/lessons'
import { LESSON_CATEGORY_ICON } from '@/data/vocabCategories'
import type { Lesson } from '@/types/lesson'
import NumberReadingPractice from './NumberReadingPractice.vue'

const props = defineProps<{ lesson: Lesson }>()
const numberPool = computed(() => blocksOf(props.lesson, 'practice').find((b) => b.numberReading)?.numberReading)

// 打字練習要打泰文字母，學字母之前先不放（見 TODO.md）
const playerLink = computed(() => ({ path: '/player', query: { cat: props.lesson.category } }))
</script>

<template>
  <div class="w-full flex flex-col gap-5">
    <NumberReadingPractice v-if="numberPool" :pool="numberPool" />

    <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 p-5 md:p-6">
      <h2 class="mb-4 text-lg font-bold text-gray-800 dark:text-white">📚 單字練習</h2>
      <RouterLink :to="playerLink"
        class="group flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all">
        <span class="text-3xl">🎧</span>
        <div class="flex-1">
          <div class="font-bold text-gray-800 dark:text-white">隨身聽</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">自動播放「{{ LESSON_CATEGORY_ICON }} {{ lesson.category }}」的單字發音</div>
        </div>
        <svg class="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>
