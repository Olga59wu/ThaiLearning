<script setup lang="ts">
import { useTypingPageContext } from '@/composables/typing/useTypingPage'
import { LESSON_CATEGORY_ICON, lessonNoOfCategory } from '@/data/vocabCategories'

const {
  isDownloading, downloadProgress, downloadTotal, startDownload, initGame,
  allCategories, selectedCategories, toggleCategory, resetCategories,
  accuracy, stats, remainingCount,
} = useTypingPageContext()
</script>

<template>
  <!-- 頂部統計區 -->
  <div class="p-3 shrink-0">
    <div class="bg-white rounded-[1.5rem] p-4 shadow-xs border border-slate-100">
      <div class="flex items-center justify-between mb-3">
        <RouterLink to="/"
          class="flex items-center gap-1 px-2.5 py-1.5 -ml-1 text-[11px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd" />
          </svg>
          回大廳
        </RouterLink>

        <div class="flex items-center gap-1.5">
          <RouterLink to="/player"
            class="flex items-center gap-1 px-2.5 py-1.5 bg-white text-blue-500 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors text-[11px] font-bold shadow-xs"
            title="泰文隨身聽">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            隨身聽
          </RouterLink>

          <button @click="startDownload" :disabled="isDownloading" :class="['flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-[11px] font-bold shadow-xs',
            isDownloading ? 'bg-indigo-50 text-indigo-400 cursor-wait' : 'bg-white text-indigo-500 border border-indigo-100 hover:bg-indigo-50']">
            <svg v-if="isDownloading" class="animate-spin h-3.5 w-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>

            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>

            {{ isDownloading ? `下載中 ${downloadProgress}/${downloadTotal}` : '離線語音' }}
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center mb-3">
        <h1 class="text-base font-black text-blue-600 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          THAI MASTER
        </h1>
        <button @click="initGame(false)"
          class="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg active:rotate-180 transition-all duration-300 shadow-xs"
          title="重置遊戲">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>

      <div
        class="flex gap-2 overflow-x-auto no-scrollbar pt-2 pb-4 mb-1 flex-nowrap w-full items-center pl-1.5 pr-4 origin-top scale-95">
        <!-- 全部按鈕 -->
        <button @click="resetCategories" :class="['h-9 px-4 rounded-full border text-[10px] font-black transition-all duration-300 shrink-0 flex items-center justify-center shadow-xs',
          selectedCategories.length === 0
            ? 'bg-blue-50 text-blue-600 border-blue-400 shadow-blue-100/50'
            : 'bg-white text-slate-400 border-slate-100']">
          全部
        </button>

        <!-- 分類圓形按鈕 -->
        <button v-for="(_list, cat) in allCategories" :key="cat" @click="toggleCategory(cat)" :class="['w-10 h-10 rounded-full border transition-all duration-300 shrink-0 flex items-center justify-center text-lg relative shadow-xs',
          selectedCategories.includes(cat)
            ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-50/50 scale-105 z-10'
            : 'bg-white border-slate-50 text-slate-600 hover:border-slate-200']">
          <!-- 已移除底部的指示線 -->

          <span v-if="cat === '基礎與代名詞'">👥</span>
          <span v-else-if="cat === '疑問句工具'">❓</span>
          <span v-else-if="cat === '常用動詞'">🏃</span>
          <span v-else-if="cat === '形容詞與感覺'">🌈</span>
          <span v-else-if="cat === '數字與時間'">🕒</span>
          <span v-else-if="cat === '餐廳與交通'">🚗</span>
          <span v-else-if="cat === '自訂單字'">⭐</span>
          <span v-else-if="cat === '已學會'">✅</span>
          <!-- 課程分類（第N課）：📘＋課次 -->
          <span v-else-if="lessonNoOfCategory(cat) !== null" class="relative">{{ LESSON_CATEGORY_ICON }}<span
              class="absolute -bottom-1 -right-2 px-1 text-[9px] font-black leading-tight text-indigo-600 bg-white border border-indigo-200 rounded-full">{{ lessonNoOfCategory(cat) }}</span></span>
          <span v-else class="text-[10px] font-bold text-slate-400">{{ cat.substring(0, 1) }}</span>
        </button>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="text-center p-1.5 bg-slate-50 rounded-xl border border-slate-100">
          <div class="text-[8px] text-slate-400 font-bold uppercase tracking-widest">正確率</div>
          <div class="text-sm font-black">{{ accuracy }}%</div>
        </div>
        <div class="text-center p-1.5 bg-green-50 rounded-xl border border-green-100">
          <div class="text-[8px] text-green-600 font-bold uppercase tracking-widest">正確</div>
          <div class="text-sm font-black">{{ stats.correct }}</div>
        </div>
        <div class="text-center p-1.5 bg-blue-50 rounded-xl border border-blue-100">
          <div class="text-[8px] text-blue-500 font-bold uppercase tracking-widest">剩餘</div>
          <div class="text-sm font-black">{{ remainingCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
