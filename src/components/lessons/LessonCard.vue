<script setup lang="ts">
import type { Lesson } from '@/types/lesson'

defineProps<{ lesson: Lesson; latestScore: { correct: number; total: number } | null }>()
</script>

<template>
  <RouterLink :to="`/lessons/${lesson.no}`"
    class="group block bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl border border-gray-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
    <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 transition-transform group-hover:scale-125 duration-500"></div>
    <div class="relative flex items-start justify-between gap-3">
      <div>
        <div class="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-wider">第 {{ lesson.no }} 課</div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white mt-1">{{ lesson.title }}</h2>
        <div class="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{{ lesson.date }}</div>
      </div>
      <div class="text-right shrink-0">
        <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500">最近一次考試</div>
        <div v-if="latestScore" class="text-2xl font-black text-gray-800 dark:text-white">
          {{ latestScore.correct }}<span class="text-sm text-gray-400"> / {{ latestScore.total }}</span>
        </div>
        <div v-else class="text-sm font-bold text-gray-300 dark:text-slate-600 mt-1">尚未考試</div>
      </div>
    </div>
    <div class="relative mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400">
      <span>進入課程</span>
      <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </div>
  </RouterLink>
</template>
