<script setup lang="ts">
import { useNumberHandwritingContext } from '@/composables/lessons/useNumberHandwriting'

// ✍️ 打開數字手寫彈窗（樣式比照 /thai 學習卡片左上角的手寫按鈕）
const props = defineProps<{ num: number }>()
const { open } = useNumberHandwritingContext()
</script>

<template>
  <button type="button" @click.stop="open(props.num)" title="手寫練習"
    class="p-1.5 transition-all hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-emerald-500 dark:hover:text-emerald-400">
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  </button>
</template>
