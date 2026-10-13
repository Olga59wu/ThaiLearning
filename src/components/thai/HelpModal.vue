<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const { modals, resetAllData } = useThaiPageContext()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center w-full h-full modal backdrop-blur-xs bg-gray-900/60 p-4" @click.self="modals.help = false">
    <div class="w-11/12 mx-auto overflow-y-auto bg-white shadow-2xl dark:bg-slate-800 md:max-w-md rounded-3xl p-6">
      <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
        <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">使用指南</p>
        <button @click="modals.help = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div class="my-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <div>
          <h3 class="mb-1 font-bold text-gray-800 dark:text-white">功能優化</h3>
          <ul class="pl-5 space-y-1 list-disc text-gray-500 dark:text-gray-400">
            <li><strong>📈 全新架構</strong>：已全面載入最新版本系統。</li>
            <li><strong>🔥 挑戰連勝</strong>：聲調挑戰模式新增計數。</li>
            <li><strong>▶️ 自動播放</strong>：聲調訓練可一次播放。</li>
            <li><strong>⭐ 重點收藏</strong>：點擊星星收藏字母。</li>
          </ul>
        </div>
        <div>
          <h3 class="mb-1 font-bold text-gray-800 dark:text-white">數據管理</h3>
          <button @click="resetAllData" class="w-full px-4 py-3 mt-2 text-xs font-bold text-center text-red-600 transition-colors border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50">🗑️ 重置所有數據與設定</button>
        </div>
      </div>
    </div>
  </div>
</template>
