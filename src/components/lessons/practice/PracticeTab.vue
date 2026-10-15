<script setup lang="ts">
import { computed } from 'vue'
import { blocksOf } from '@/data/lessons'
import { LESSON_CATEGORY_ICON } from '@/data/vocabCategories'
import type { Lesson } from '@/types/lesson'
import NumberReadingPractice from './NumberReadingPractice.vue'

const props = defineProps<{ lesson: Lesson }>()
const numberPool = computed(() => blocksOf(props.lesson, 'practice').find((b) => b.numberReading)?.numberReading)

const links = [
  { to: '/player', icon: '🎧', title: '隨身聽', desc: '自動播放單字發音' },
  { to: '/typing', icon: '⌨️', title: '打字練習', desc: '聽發音打出泰文' },
]
</script>

<template>
  <div class="w-full flex flex-col gap-5">
    <NumberReadingPractice v-if="numberPool" :pool="numberPool" />

    <div class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 p-5 md:p-6">
      <h2 class="mb-1 text-lg font-bold text-gray-800 dark:text-white">📚 單字練習</h2>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        進入後選「{{ LESSON_CATEGORY_ICON }} {{ lesson.category }}」分類，就只會練這一課的單字。
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to"
          class="group flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all">
          <span class="text-3xl">{{ link.icon }}</span>
          <div class="flex-1">
            <div class="font-bold text-gray-800 dark:text-white">{{ link.title }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ link.desc }}</div>
          </div>
          <svg class="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
