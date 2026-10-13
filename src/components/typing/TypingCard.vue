<script setup lang="ts">
import { useTypingPageContext } from '@/composables/typing/useTypingPage'

const {
  isFinished, accuracy, initGame, currentWord, currentIndex, words,
  playCurrentWord, isKnownWord, toggleKnownWord, isCustomWord, toggleCustomWord,
  isWrong, nextCharToType, matchedText, inputValue, isTransitioning,
  handleTouchStart, handleTouchEnd,
} = useTypingPageContext()
</script>

<template>
  <!-- 單一單字展示區 (大字卡模式) -->
  <div class="flex-initial flex flex-col items-center justify-start px-6 pt-2 pb-4 mt-2 relative overflow-visible"
    @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <div class="w-full grid">
      <Transition name="card">
        <!-- 完成狀態 -->
        <div v-if="isFinished" class="col-start-1 row-start-1 w-full text-center flex flex-col items-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-black text-emerald-500">練習完成！</h2>
          <p class="text-slate-400 mt-2">正確率: {{ accuracy }}%</p>
          <button @click="initGame(true)"
            class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 active:scale-95 transition-all">
            再來一次
          </button>
        </div>

        <!-- 學習狀態 (單張大字卡) -->
        <div v-else-if="currentWord" :key="currentWord.th"
          class="col-start-1 row-start-1 w-full bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 flex flex-col items-center justify-center relative">

          <!-- 手動發音按鈕 -->
          <button @click="playCurrentWord"
            class="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-500 active:scale-90 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              class="opacity-80">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>

          <!-- 當前進度提示 -->
          <div class="absolute top-5 left-5 text-xs font-bold text-slate-300">
            {{ currentIndex + 1 }} / {{ words.length }}
          </div>

          <div class="absolute bottom-4 right-4 flex items-center gap-1 z-20">
            <button @click.stop="toggleKnownWord(currentWord)" class="p-2 active:scale-75 transition-transform"
              title="標記為已學會">
              <svg v-if="isKnownWord(currentWord)" class="text-emerald-500 drop-shadow-xs"
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <svg v-else class="text-slate-200 hover:text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="24"
                height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </button>

            <button @click.stop="toggleCustomWord(currentWord)" class="p-2 active:scale-75 transition-transform"
              title="加入自訂單字">
              <svg v-if="isCustomWord(currentWord)" class="text-yellow-400 drop-shadow-xs"
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                </polygon>
              </svg>
              <svg v-else class="text-slate-300 hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" width="24"
                height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                </polygon>
              </svg>
            </button>
          </div>
          <!-- 精細控制每個字母的顏色與指引 -->
          <div :class="[
            'font-bold thai-text mb-6 w-full mt-4 cursor-pointer active:scale-95 transition-transform duration-300 flex justify-center items-start relative',
            currentWord.th.length > 10 ? 'text-3xl' : 'text-5xl'
          ]" @click="playCurrentWord">

            <div class="relative inline-block Thai-typography-fix">
              <span class="text-slate-200 Thai-typography-fix">{{ currentWord.th }}</span>

              <span v-if="!isWrong && nextCharToType"
                class="absolute top-0 left-0 whitespace-pre pointer-events-none Thai-typography-fix next-char-guide">
                <span class="opacity-0 Thai-typography-fix">{{ matchedText }}</span><span
                  class="Thai-typography-fix">{{ nextCharToType }}</span>
              </span>

              <span class="absolute top-0 left-0 whitespace-pre pointer-events-none Thai-typography-fix"
                :class="isWrong ? 'text-red-500' : 'text-emerald-500'">
                {{ isWrong ? inputValue : matchedText }}
              </span>
            </div>

          </div>

          <div :class="[
            'text-lg font-bold px-4 py-1.5 rounded-full transition-all duration-300',
            isTransitioning ? 'bg-blue-50 text-blue-600 opacity-100 scale-110 shadow-xs' : 'bg-slate-50 text-slate-400 opacity-0 scale-95'
          ]">
            {{ currentWord.zh }}
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
