<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const { isDark, showPinyin, speechRate, voices, selectedVoiceIndex, modals, toggleDarkMode, togglePinyin, playSample } =
  useThaiPageContext()
</script>

<template>
  <header class="relative w-full text-center pt-8 md:pt-6 mb-6">
    <div class="absolute top-0 left-0 z-20 flex flex-col gap-2 sm:flex-row sm:items-center">
      <RouterLink to="/"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 no-underline transition-all bg-white/80 rounded-full shadow-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md hover:pl-2 glass-nav">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd" />
        </svg>
        大廳
      </RouterLink>
    </div>

    <div class="flex flex-col md:flex-row items-center justify-center gap-4 mb-3 mt-8 md:mt-0 relative">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center text-2xl md:text-3xl border border-emerald-100 dark:border-slate-700">
          🇹🇭
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          泰語<span class="text-emerald-600 dark:text-emerald-400">學習機</span>
        </h1>
      </div>

      <div
        class="flex items-center bg-white dark:bg-slate-800 rounded-full shadow-xs border border-gray-200 dark:border-slate-600 px-4 py-2 gap-4 select-none">
        <button @click="toggleDarkMode" class="text-yellow-500 hover:text-yellow-600 transition-colors"
          title="切換模式">
          <svg v-if="isDark" class="w-5 h-5 block" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-5 h-5 block" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
        <div class="w-px h-4 bg-gray-300 dark:bg-slate-600"></div>
        <button @click="modals.calc = true" class="text-emerald-500 hover:text-emerald-600 transition-colors"
          title="聲調計算機">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
        <div class="w-px h-4 bg-gray-300 dark:bg-slate-600"></div>
        <button @click="togglePinyin"
          :class="showPinyin ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-gray-500'"
          class="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold text-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>拼音</span>
        </button>
        <div class="w-px h-4 bg-gray-300 dark:bg-slate-600"></div>
        <button @click="modals.help = true" class="text-gray-400 hover:text-blue-500 transition-colors"
          title="使用說明">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>

    <p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-3">
      從字母、聲調到常用句的完整練習工具
    </p>

    <div
      class="flex flex-wrap items-center justify-center gap-3 px-4 py-2 mx-auto mt-4 text-xs text-gray-500 bg-white border border-gray-100 shadow-xs dark:text-gray-400 dark:bg-slate-800/80 rounded-2xl dark:border-slate-700 w-fit backdrop-blur-xs">
      <div class="flex items-center gap-2">
        <span>🐢</span>
        <input type="range" min="0.5" max="1.5" step="0.1" v-model="speechRate"
          class="h-1.5 w-20 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
        <span>🐇</span>
        <span class="ml-1 font-mono text-emerald-600 dark:text-emerald-400">{{ speechRate }}</span>
      </div>

      <div class="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>

      <div class="flex items-center gap-1">
        <div v-if="voices.length === 0" class="flex items-center gap-1 text-orange-500">
          ⚠️ 無語音
        </div>
        <select v-else v-model="selectedVoiceIndex" @change="playSample()"
          class="p-0 text-xs text-gray-600 bg-transparent border-none cursor-pointer focus:ring-0 dark:text-gray-300 max-w-[100px] truncate">
          <option v-for="(v, idx) in voices" :key="idx" :value="idx">{{ v.name.replace(/Microsoft |Google /g, '') }}</option>
        </select>
      </div>
    </div>
  </header>
</template>
