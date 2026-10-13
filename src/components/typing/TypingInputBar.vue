<script setup lang="ts">
import { useTypingPageContext } from '@/composables/typing/useTypingPage'

const { isWrong, inputValue, handleInput, keepFocus, initAudioEngine, isFinished, setInputRef } =
  useTypingPageContext()
</script>

<template>
  <!-- 輸入區 -->
  <div class="p-2 bg-slate-50/70 backdrop-blur-md border-t border-slate-200 shrink-0 z-50">
    <div :class="[
      'p-3 rounded-2xl shadow-lg border-2 flex items-center gap-3 transition-all duration-200',
      isWrong ? 'border-red-500 bg-red-50 shadow-red-200' : 'border-blue-500 bg-white shadow-blue-100'
    ]">
      <div :class="['transition-colors', isWrong ? 'text-red-600' : 'text-blue-600 opacity-50']">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
          <path d="M6 8h.01"></path>
          <path d="M10 8h.01"></path>
          <path d="M14 8h.01"></path>
          <path d="M18 8h.01"></path>
          <path d="M8 12h.01"></path>
          <path d="M12 12h.01"></path>
          <path d="M16 12h.01"></path>
          <path d="M7 16h10"></path>
        </svg>
      </div>
      <input :ref="setInputRef" type="text" inputmode="search" v-model="inputValue" @input="handleInput"
        @blur="keepFocus" @focus="initAudioEngine" name="thai_search_final_v9" autocomplete="off" autocorrect="off"
        autocapitalize="none" spellcheck="false" :placeholder="isFinished ? '已完成！' : '按空白驗證跳轉...'"
        :disabled="isFinished"
        class="flex-1 bg-transparent text-lg font-bold outline-hidden h-10 placeholder:text-slate-300 disabled:opacity-50" />
    </div>
  </div>
</template>
