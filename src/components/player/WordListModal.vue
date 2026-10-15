<script setup lang="ts">
import { usePlayerPageContext } from '@/composables/player/usePlayerPage'

const {
  isModalOpen, searchQuery, modalCategory, allCategories, filteredModalWords,
  getCatIcon, resetAllProgress, replayCurrent, isKnownWord, toggleKnownWord, isCustomWord, toggleCustomWord, wordKey,
} = usePlayerPageContext()
</script>

<template>
  <div v-if="isModalOpen" class="fixed inset-0 z-[100] bg-white flex flex-col">
    <div class="p-4 border-b flex justify-between items-center shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="font-black text-slate-700">單字清單</h2>
        <!-- 重置按鈕 -->
        <button @click="resetAllProgress"
          class="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold active:scale-95 transition-all">
          🗑️ 重置進度
        </button>
      </div>

      <button @click="isModalOpen = false; searchQuery = ''"
        class="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <!-- 搜尋框區塊 -->
    <div class="px-4 py-2 bg-white shrink-0">
      <div class="relative flex items-center">
        <input v-model="searchQuery" type="text" placeholder="搜尋泰文或中文..."
          class="w-full bg-slate-100 border-none rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all">
        <svg class="absolute left-3 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <button v-if="searchQuery" @click="searchQuery = ''"
          class="absolute right-3 text-slate-400 font-bold text-lg">×</button>
      </div>
    </div>
    <!-- 分類切換 -->
    <div class="p-2 bg-slate-50 border-b flex gap-2 overflow-x-auto no-scrollbar">
      <button v-for="(_list, cat) in allCategories" :key="cat" @click="modalCategory = cat"
        :class="['px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all border flex items-center gap-1',
                            modalCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-200 text-slate-500']">
        <span>{{ getCatIcon(cat) }}</span>
        <span>{{ cat }}</span>
      </button>
    </div>
    <!-- 單字列表 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-for="item in filteredModalWords" :key="wordKey(item)"
        class="p-4 border-b flex justify-between items-center transition-colors">

        <div class="flex-1 cursor-pointer active:bg-blue-50" @click="replayCurrent(item)"
          :class="{'opacity-40': isKnownWord(item)}">
          <div class="text-xl font-black text-slate-800 tracking-tight">{{item.th}}</div>
          <div class="text-xs text-slate-400 font-bold mt-1">{{item.zh}}</div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button @click="replayCurrent(item)"
            class="p-2 text-blue-400 opacity-30 active:scale-90 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            </svg>
          </button>

          <button @click="toggleKnownWord(item)" class="p-2 active:scale-75 transition-transform">
            <svg v-if="isKnownWord(item)" class="text-emerald-500" xmlns="http://www.w3.org/2000/svg" width="20"
              height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else class="text-slate-200 hover:text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="20"
              height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </button>
          <button @click="toggleCustomWord(item)" class="p-2 active:scale-75 transition-transform" title="加入自訂單字">
            <svg v-if="isCustomWord(item)" class="text-yellow-400 drop-shadow-xs" xmlns="http://www.w3.org/2000/svg"
              width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
              </polygon>
            </svg>
            <svg v-else class="text-slate-200 hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" width="20"
              height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
              </polygon>
            </svg>
          </button>
        </div>
      </div>
      <div v-if="filteredModalWords.length === 0" class="text-center py-10 text-slate-300 font-bold">
        找不到相關單字...
      </div>
    </div>
  </div>
</template>
