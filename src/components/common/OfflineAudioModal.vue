<script setup lang="ts">
import type { DownloadModalState } from '@/composables/useOfflineAudioDownload'

// Player / Typing 共用的離線音檔下載確認／成功彈窗（只有成功訊息第二行不同）
defineProps<{
  modal: DownloadModalState
  successMessage: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <div v-if="modal.show" class="fixed inset-0 z-[120] flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" @click="emit('close')"></div>

    <div
      class="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 transform transition-all flex flex-col items-center text-center">

      <template v-if="modal.type === 'confirm'">
        <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
          <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
        </div>
        <h3 class="text-xl font-black text-slate-800 mb-2 tracking-tight">準備下載離線音檔？</h3>
        <p class="text-sm text-slate-500 font-medium mb-6 leading-relaxed">這將會把發音快取至手機中，<br>可能需要一點時間與網路流量。</p>
        <div class="flex gap-3 w-full">
          <button @click="emit('close')"
            class="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold active:scale-95 transition-all">取消</button>
          <button @click="emit('confirm')"
            class="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all">開始下載</button>
        </div>
      </template>

      <template v-else-if="modal.type === 'success'">
        <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <span class="text-3xl">✈️</span>
        </div>
        <h3 class="text-xl font-black text-slate-800 mb-2 tracking-tight">下載完成！</h3>
        <p class="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
          成功快取 <strong class="text-emerald-500 text-lg">{{ modal.successCount }}</strong>
          個音檔。<br>{{ successMessage }}
        </p>
        <button @click="emit('close')"
          class="w-full py-2.5 px-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">太棒了</button>
      </template>

    </div>
  </div>
</template>
