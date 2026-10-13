<script setup lang="ts">
import { usePlayerPageContext } from '@/composables/player/usePlayerPage'

const {
  isShuffle, repeatMode, playbackRate, voices, selectedVoice, isPlaying, speakChineseOrder, showChinese,
  isFlashcardMode, hideKnownWords, isMultiSelect, togglePlay, next, prev, toggleFlashcardMode,
} = usePlayerPageContext()
</script>

<template>
  <!-- 播放控制區 (固定高度) -->
  <div
    class="bg-slate-50 border-t shrink-0 p-5 sm:p-6 pt-3 rounded-t-[2rem] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] z-10">
    <!-- 模式與速度 -->
    <!-- 模式與速度 (修正對齊版) -->
    <div class="flex justify-between items-center mb-5 px-4 gap-1">
      <!-- 隨機播放 -->
      <button @click="isShuffle = !isShuffle" :class="isShuffle ? 'text-blue-600' : 'text-slate-300'"
        class="transition-all p-1 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
          <path d="m18 2 4 4-4 4" />
          <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
          <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
          <path d="m18 14 4 4-4 4" />
        </svg>
      </button>

      <!-- 中間群組：將速度與老師放在同一個容器中並置中對齊 -->
      <div class="flex-1 flex items-center justify-center gap-2">
        <!-- 播放速度 -->
        <div class="flex items-center bg-white border border-slate-200 rounded-full px-2 h-7 shadow-xs">
          <select v-model="playbackRate"
            class="text-[9px] font-black bg-transparent outline-hidden text-slate-500 cursor-pointer">
            <option :value="0.7">0.7x 慢速</option>
            <option :value="1.0">1.0x 正常</option>
            <option :value="1.2">1.2x 快速</option>
            <option :value="1.5">1.5x 極速</option>
          </select>
        </div>

        <!-- 發音老師 (移除 mt-2，確保水平對齊) -->
        <div v-if="voices.length > 1"
          class="flex items-center bg-white border border-slate-200 rounded-full px-2 h-7 shadow-xs gap-1 overflow-hidden">
          <span class="text-[8px] font-bold text-slate-400 shrink-0">老師:</span>
          <select v-model="selectedVoice"
            class="text-[9px] bg-transparent border-none text-blue-600 font-bold outline-hidden cursor-pointer max-w-[100px] truncate">
            <option v-for="v in voices" :key="v.name" :value="v.name">
              {{ v.name.replace('Microsoft', '').replace('Google', '').replace('Thai', '').replace('(',
              '').replace(')', '').trim() || v.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 循環模式 -->
      <button @click="repeatMode = (repeatMode + 1) % 3" :class="repeatMode > 0 ? 'text-blue-600' : 'text-slate-300'"
        class="transition-all p-1 shrink-0">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span v-if="repeatMode === 2"
            class="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[7px] font-bold rounded-full w-3 h-3 flex items-center justify-center">1</span>
        </div>
      </button>
    </div>

    <!-- 主控制鈕 -->
    <div class="flex items-center justify-center gap-8 mb-4">
      <button @click="prev" class="text-slate-400 active:scale-90 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z" />
        </svg>
      </button>

      <button @click="togglePlay"
        class="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
        <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
          fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      </button>

      <button @click="next" class="text-slate-400 active:scale-90 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 18l8.5-6L5 6v12zM13 6v12l8.5-6L13 6z" />
        </svg>
      </button>
    </div>

    <!-- 功能開關 -->
    <div class="flex justify-between gap-3">
      <button @click="speakChineseOrder = !speakChineseOrder"
        :class="['flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all',
                  speakChineseOrder ? 'bg-blue-600 border-blue-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white']">
        {{ speakChineseOrder ? '中 → 泰 朗讀' : '泰 → 中 朗讀' }}
      </button>
      <button @click="showChinese = !showChinese"
        :class="['flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all',
                           showChinese ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400']">
        顯示中文
      </button>
      <button @click="toggleFlashcardMode"
        :class="['flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all',
                  isFlashcardMode ? 'bg-purple-600 border-purple-600 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-400']">
        🃏 單字卡模式
      </button>
    </div>
    <!-- ★ 新增：進階清單設定 (過濾與複選) ★ -->
    <div class="flex justify-center items-center gap-8 mt-5 pt-4 border-t border-slate-200/60">
      <!-- 過濾已學會開關 -->
      <button @click="hideKnownWords = !hideKnownWords"
        class="flex items-center gap-2 active:scale-95 transition-transform">
        <span class="text-xs font-bold transition-colors"
          :class="hideKnownWords ? 'text-emerald-500' : 'text-slate-400'">隱藏已學會 ✅</span>
        <div class="w-7 h-4 rounded-full relative transition-colors duration-200"
          :class="hideKnownWords ? 'bg-emerald-500' : 'bg-slate-300'">
          <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-xs"
            :class="hideKnownWords ? 'left-3.5' : 'left-0.5'"></div>
        </div>
      </button>

      <!-- 分類複選開關 -->
      <button @click="isMultiSelect = !isMultiSelect"
        class="flex items-center gap-2 active:scale-95 transition-transform">
        <span class="text-xs font-bold transition-colors"
          :class="isMultiSelect ? 'text-blue-500' : 'text-slate-400'">分類複選模式</span>
        <div class="w-7 h-4 rounded-full relative transition-colors duration-200"
          :class="isMultiSelect ? 'bg-blue-500' : 'bg-slate-300'">
          <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-xs"
            :class="isMultiSelect ? 'left-3.5' : 'left-0.5'"></div>
        </div>
      </button>
    </div>
  </div>
</template>
