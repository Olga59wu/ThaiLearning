<script setup lang="ts">
import type { useHandwriting } from '@/composables/useHandwriting'
import HandwritingPad from './HandwritingPad.vue'

// 手寫練習彈窗（/thai 與每週課程共用；原 components/thai/HandwritingModal.vue，DOM 與 class 不變）
defineProps<{
  hw: ReturnType<typeof useHandwriting>
  isDark: boolean
  title: string
  strokes?: string[]
  fallbackChar?: string
}>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 dark:bg-slate-700 dark:border-slate-600">
        <h3 class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
          <span class="text-xl">✍️</span> 手寫練習:
          <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400 thai-font">{{ title }}</span>
        </h3>
        <button @click="emit('close')" class="p-1 text-gray-400 transition-colors rounded-full hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-600 focus:outline-hidden">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <HandwritingPad :hw="hw" :is-dark="isDark" :strokes="strokes" :fallback-char="fallbackChar" />
    </div>
  </div>
</template>
