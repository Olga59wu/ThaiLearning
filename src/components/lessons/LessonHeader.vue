<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { useLessonSettingsStore } from '@/stores/lessonSettings'

// 版面比照 /thai 的 ThaiHeader：左上返回、置中標題、右上深色模式（＋顯示泰文字開關）
withDefaults(defineProps<{ title: string; subtitle?: string; backTo: string; backLabel: string; thaiToggle?: boolean }>(), {
  thaiToggle: false,
})

const { isDark } = storeToRefs(useThaiLearnStore())
const { showThai } = storeToRefs(useLessonSettingsStore())
const toggleDark = () => {
  isDark.value = !isDark.value
}
</script>

<template>
  <header class="relative w-full text-center pt-8 md:pt-6 mb-6">
    <div class="absolute top-0 left-0 z-20">
      <RouterLink :to="backTo"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 no-underline transition-all bg-white/80 rounded-full shadow-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md hover:pl-2 glass-nav">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd" />
        </svg>
        {{ backLabel }}
      </RouterLink>
    </div>
    <div class="absolute top-0 right-0 z-20 flex items-center gap-2">
      <button v-if="thaiToggle" @click="showThai = !showThai" :aria-pressed="showThai" title="顯示泰文字"
        class="flex items-center gap-1.5 h-9 pl-3 pr-1.5 text-xs font-bold bg-white/80 dark:bg-gray-800/80 rounded-full shadow-xs border border-gray-200 dark:border-gray-600 transition-colors"
        :class="showThai ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
        泰文字
        <span class="relative inline-block w-8 h-5 rounded-full transition-colors" :class="showThai ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-all" :class="showThai ? 'left-3.5' : 'left-0.5'"></span>
        </span>
      </button>
      <button @click="toggleDark" title="切換模式"
        class="flex items-center justify-center w-9 h-9 text-yellow-500 hover:text-yellow-600 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-xs border border-gray-200 dark:border-gray-600 transition-colors">
        <svg v-if="isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>

    <div class="flex items-center justify-center gap-3 mt-10 md:mt-2 mb-2">
      <div
        class="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center text-2xl md:text-3xl border border-emerald-100 dark:border-slate-700">
        📘
      </div>
      <h1 class="text-2xl md:text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight">{{ title }}</h1>
    </div>
    <p v-if="subtitle" class="text-gray-500 dark:text-gray-400 text-sm font-medium">{{ subtitle }}</p>
  </header>
</template>
