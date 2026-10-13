<script setup lang="ts">
import { usePageShell } from '@/composables/usePageShell'

usePageShell({
  htmlClass: 'shell-404',
  bodyClass: 'bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4 transition-colors',
})

const goBack = () => history.back()
</script>

<template>
  <div class="max-w-md w-full text-center animate-fade-in-up">
    <div class="text-9xl mb-4 animate-float select-none">
      🪐
    </div>
    <h1 class="text-8xl font-black text-transparent bg-clip-text bg-linear-to-r/srgb from-indigo-500 via-purple-500 to-pink-500 mb-2">
      404
    </h1>
    <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">
      哎呀！這裡什麼都沒有...
    </h2>
    <p class="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-4">
      您要找的頁面可能已經被黑洞吸走了，<br>或者網址輸入有誤。
    </p>
    <!-- 按鈕區 -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center px-4">
      <RouterLink to="/" class="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        返回大廳
      </RouterLink>
      <button @click="goBack" class="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
        回上一頁
      </button>
    </div>
    <div class="mt-12 text-xs text-gray-400 dark:text-gray-600 font-mono">
      Error Code: 404_PAGE_NOT_FOUND
    </div>
  </div>
</template>
