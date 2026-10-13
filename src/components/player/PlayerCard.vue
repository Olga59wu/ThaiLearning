<script setup lang="ts">
import { usePlayerPageContext } from '@/composables/player/usePlayerPage'

const {
  currentWord, currentWordCategory, currentIndex, playlist, isPlaying, isTransitioning,
  isFlashcardMode, isFlipped, showChinese, selectedCategories, hideKnownWords,
  getCatIcon, handleTouchStart, handleTouchEnd, handleContentClick, replayCurrent, reportBadAudio,
  isKnownWord, toggleKnownWord, isCustomWord, toggleCustomWord,
} = usePlayerPageContext()
</script>

<template>
  <!-- 播放器主視覺區域 (彈性縮放區) -->
  <div class="flex-1 flex flex-col items-center justify-center p-2 min-h-0" @touchstart="handleTouchStart"
    @touchend="handleTouchEnd">
    <div
      class="player-card grow flex flex-col bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-3 text-center relative w-full mb-2 overflow-hidden"
      :class="{
          'playing-glow border-blue-50': isPlaying,
          'card-transitioning': isTransitioning
        }">
      <div v-if="currentWord" class="w-full shrink-0 mb-4 z-20">
        <div class="flex justify-between items-center mb-1.5 px-1">
          <span class="text-[10px] font-black text-blue-500 tracking-tighter">
            {{ getCatIcon(currentWordCategory) }} {{ currentWordCategory }}
          </span>
          <span class="text-[10px] font-bold text-slate-400">
            {{ currentIndex + 1 }} / {{ playlist.length }}
          </span>
        </div>
        <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 progress-bar-inner transition-all duration-300"
            :style="{ width: playlist.length ? `${((currentIndex + 1) / playlist.length) * 100}%` : '0%' }"></div>
        </div>
      </div>

      <div v-if="currentWord"
        class="flex-1 flex flex-col items-center justify-center w-full min-h-0 perspective-1000 z-10"
        @click="handleContentClick">
        <div
          class="relative flex-1 w-full flex flex-col items-center justify-center transform-style-3d transition-transform duration-500 cursor-pointer"
          :class="{ 'rotate-y-180': isFlashcardMode && isFlipped }">

          <div
            class="absolute inset-0 flex flex-col items-center justify-center w-full h-full transition-opacity duration-300"
            :class="isFlashcardMode && isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'"
            style="transform: rotateY(0deg);">
            <div class="thai-text font-black text-slate-800 mb-2 leading-tight active:opacity-50" :class="[
                          currentWord.th.length > 15 ? 'text-3xl' :
                          currentWord.th.length > 10 ? 'text-4xl' :
                          currentWord.th.length > 6  ? 'text-5xl' : 'text-7xl'
                      ]" :style="isKnownWord(currentWord) ? 'opacity: 0.3;' : ''">
              {{ currentWord?.th }}
            </div>

            <div v-show="showChinese && !isFlashcardMode" class="text-xl text-slate-400 font-medium shrink-0 pt-2">
              {{ currentWord?.zh }}
            </div>

            <div v-show="isFlashcardMode && !isFlipped"
              class="absolute bottom-1 text-xs text-purple-500 font-bold animate-pulse">
              👆 點擊翻牌看答案
            </div>
          </div>

          <div
            class="absolute inset-0 flex flex-col items-center justify-center rotate-y-180 w-full h-full rounded-3xl border-2 border-dashed border-purple-300 transition-opacity duration-300"
            style="background-color: rgba(168, 85, 247, 0.08);"
            :class="isFlashcardMode && isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'">
            <div class="thai-text font-black text-slate-400 mb-2" :class="[
                          currentWord.th.length > 15 ? 'text-2xl' :
                          currentWord.th.length > 10 ? 'text-3xl' :
                          currentWord.th.length > 6  ? 'text-4xl' : 'text-5xl'
                      ]" :style="isKnownWord(currentWord) ? 'opacity: 0.3;' : ''">
              {{ currentWord?.th }}
            </div>
            <div class="text-lg text-purple-500 font-bold shrink-0 pt-2">
              {{ currentWord?.zh }}
            </div>
            <div class="absolute bottom-1 text-[10px] text-slate-400 font-bold">
              👆 點擊重聽
            </div>
          </div>

        </div>
      </div>

      <div v-else
        class="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold h-24 gap-2 text-sm">
        <template v-if="selectedCategories.length > 0 && hideKnownWords">
          <span class="text-2xl mb-1">🎉</span>
          <span>太棒了！這個分類的單字你已經全都會了</span>
          <button @click="hideKnownWords = false"
            class="mt-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs active:scale-95">取消隱藏</button>
        </template>
        <span v-else>請選擇分類並播放</span>
      </div>

      <!-- 右下角功能區塊：已學會打勾 & 收藏星星 -->
      <div class="absolute bottom-4 right-4 flex items-center gap-1 z-20">
        <!-- 已學會打勾按鈕 -->
        <button v-if="currentWord" @click.stop="toggleKnownWord(currentWord)"
          class="p-2 active:scale-75 transition-transform" title="標記為已學會">
          <svg v-if="isKnownWord(currentWord)" class="text-emerald-500 drop-shadow-xs"
            xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <svg v-else class="text-slate-200 hover:text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="22"
            height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </button>

        <!-- 收藏星星按鈕 -->
        <button v-if="currentWord" @click.stop="toggleCustomWord(currentWord)"
          class="p-2 active:scale-75 transition-transform" title="加入自訂單字">
          <svg v-if="isCustomWord(currentWord)" class="text-yellow-400 drop-shadow-xs"
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
            </polygon>
          </svg>
          <svg v-else class="text-slate-300 hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" width="18"
            height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
            </polygon>
          </svg>
        </button>
      </div>
      <div class="absolute bottom-4 left-4 flex items-center gap-1 z-20">
        <!-- 壞音檔回報按鈕 -->
        <button v-if="currentWord" @click.stop="reportBadAudio"
          class="p-2 text-slate-300 hover:text-red-500 active:scale-75 transition-all" title="標記音質不佳">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </button>

        <button v-if="currentWord && isFlashcardMode" @click.stop="replayCurrent()"
          class="p-2 text-slate-300 hover:text-blue-500 active:scale-75 transition-all" title="聆聽泰文發音">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
