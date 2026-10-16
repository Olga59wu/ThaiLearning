<script setup lang="ts">
import type { ThaiItemType } from '@/types/thai'
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const {
  learnCategories, currentFilter, currentToneFilter, showCommonOnly, filteredLearnData, animatingCards,
  favorites, showPinyin, clickLearnCard, openHW, toggleStar,
} = useThaiPageContext()

// 只有這些 type 提供手寫練習（刻意和原版不同：水果、動物、顏色、日期、家人不顯示筆圖示）
const HANDWRITING_TYPES: readonly string[] = ['consonant', 'vowel', 'toneMark', 'numbers'] satisfies ThaiItemType[]
const hasHandwriting = (type: string) => HANDWRITING_TYPES.includes(type)
</script>

<template>
  <section class="w-full max-w-5xl">
    <div
      class="flex flex-col items-center bg-white dark:bg-slate-800/80 backdrop-blur p-2 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 mb-6 transition-colors">
      <div class="flex v3-space-x-2 overflow-x-auto w-full md:justify-center p-2 no-scrollbar">
        <template v-for="cat in learnCategories" :key="cat.id">
          <div v-if="cat.id === 'divider'" class="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-1 shrink-0 self-center"></div>
          <button v-else @click="currentFilter = cat.id; currentToneFilter = 'All';"
            :class="currentFilter === cat.id ? 'category-active' : 'category-inactive'"
            class="px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5">
            {{ cat.label }}
          </button>
        </template>
      </div>

      <div v-if="currentFilter === 'consonant'"
        class="flex items-center justify-center w-full mt-2 v3-space-x-2 bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded-xl max-w-md">
        <div class="flex items-center border-r border-gray-200 dark:border-slate-700 pr-2 mr-1">
          <label class="relative inline-flex items-center cursor-pointer scale-75">
            <input type="checkbox" v-model="showCommonOnly" class="sr-only peer" />
            <div
              class="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500">
            </div>
            <span
              class="ml-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">常用字</span>
          </label>
        </div>
        <span class="px-1 text-[10px] font-bold text-gray-400">分類</span>

        <button v-for="t in ['All', 'Mid', 'High', 'Low']" :key="t" @click="currentToneFilter = t"
          :class="currentToneFilter === t ? 'sub-active bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-400 font-bold' : 'sub-inactive hover:bg-white dark:hover:bg-slate-700'"
          class="text-xs px-3 py-1 rounded-lg border transition-all flex items-center gap-1">
          <span v-if="t !== 'All'" :class="t === 'Mid' ? 'bg-green-500' : t === 'High' ? 'bg-red-500' : 'bg-blue-500'" class="w-2 h-2 rounded-full inline-block"></span>
          {{ t === 'All' ? '全' : t === 'Mid' ? '中' : t === 'High' ? '高' : '低' }}
        </button>
      </div>
    </div>

    <div class="flex items-center justify-center gap-2 mb-4">
      <span
        class="text-xs text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">💡
        提示</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">點擊卡片發音<template v-if="hasHandwriting(currentFilter)">，點擊筆圖示可手寫練習</template></span>
    </div>

    <div v-if="filteredLearnData.length === 0" class="w-full text-center text-gray-400 py-10">暫無資料</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
      <div v-for="(item, index) in filteredLearnData" :key="item.soundText || item.char"
        @click="clickLearnCard(item)"
        :style="{ animationDelay: (index * 0.05) + 's' }"
        :class="['bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 card-hover cursor-pointer transition-all duration-200 flex flex-col relative overflow-hidden group select-none h-full justify-between min-h-[160px]', (item.char === 'ฃ' || item.char === 'ฅ') ? 'opacity-60 grayscale-[0.8]' : '', animatingCards[item.soundText || item.char] ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' : '']">

        <div v-if="item.char === 'ฃ' || item.char === 'ฅ'" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span class="rotate-12 border-2 border-red-500/40 text-red-500/40 text-[10px] font-bold px-1 rounded uppercase tracking-tighter">淘汰字根</span>
        </div>

        <div class="absolute top-2 right-9 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
        </div>

        <button v-if="hasHandwriting(item.type)" @click.stop="openHW(item)" class="absolute top-2 left-2 p-1.5 transition-all hover:scale-110 z-20 text-gray-300 dark:text-gray-600 hover:text-emerald-500 dark:hover:text-emerald-400" title="手寫練習">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button @click.stop="toggleStar(item.soundText || item.char)" :class="favorites.includes(item.soundText || item.char) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'" class="absolute top-2 right-2 p-1.5 transition-all hover:scale-110 z-20" title="收藏">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        </button>

        <div class="flex-1 w-full relative flex items-center justify-center">
          <div v-if="['days', 'family'].includes(item.type)" class="flex flex-col items-center justify-center h-full pt-2 w-full">
            <div class="font-bold text-gray-800 dark:text-white thai-font text-center leading-relaxed w-full px-1 mb-1" :class="item.char.length > 5 ? 'text-3xl' : 'text-5xl'">{{ item.char }}</div>
            <div v-show="showPinyin" class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-center pinyin-text">{{ item.reading || item.soundText }}</div>
          </div>
          <div v-else-if="['fruits', 'animals', 'colors'].includes(item.type)" class="flex flex-col items-center justify-center h-full pt-4 w-full">
            <div class="w-12 h-12 mb-3 rounded-full bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center text-3xl shadow-xs border border-gray-100 dark:border-slate-600">{{ item.img || '📌' }}</div>
            <div class="font-bold text-gray-800 dark:text-white thai-font text-center leading-relaxed w-full px-1" :class="item.char.length > 5 ? 'text-2xl' : 'text-4xl'">{{ item.char }}</div>
            <div v-show="showPinyin" class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 text-center pinyin-text">{{ item.reading || item.soundText }}</div>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-full pt-4 relative w-full">
            <div class="absolute bottom-0 left-0">
              <span v-if="item.toneClass" :class="item.toneClass === 'Mid' ? 'bg-green-100 text-green-600 border-green-200' : item.toneClass === 'High' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-100 text-blue-600 border-blue-200'" class="text-[10px] px-1.5 py-0.5 rounded border">{{ item.toneClass === 'Mid' ? '中' : item.toneClass === 'High' ? '高' : '低' }}</span>
              <span v-if="item.duration" :class="item.duration === 'Long' ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-orange-100 text-orange-600 border-orange-200'" class="text-[10px] px-1.5 py-0.5 rounded border">{{ item.duration === 'Long' ? '長' : '短' }}</span>
            </div>
            <div class="font-bold text-gray-800 dark:text-white thai-font mb-2 text-center" :class="(item.type === 'vowel' || (item.char && item.char.length > 3)) ? 'text-3xl' : 'text-5xl'">{{ item.char }}</div>
            <div class="mb-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 thai-font text-center min-h-[1.25rem]">{{ item.thaiLabel || '' }}</div>
            <div v-show="showPinyin" class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center pinyin-text uppercase tracking-wider">{{ item.name || item.reading || '' }}</div>
          </div>
        </div>

        <div class="w-full pt-2 mt-auto text-sm font-medium text-center text-gray-600 border-t border-gray-100 dark:text-gray-300 dark:border-slate-700 leading-tight flex items-center justify-center">
          <template v-if="['days', 'family'].includes(item.type) && item.img">
            <div class="flex items-center justify-center gap-2"><span class="text-xl filter drop-shadow-xs">{{item.img}}</span><span>{{item.meaning}}</span></div>
          </template>
          <template v-else-if="!['fruits', 'animals', 'colors'].includes(item.type) && item.img">
            <div class="flex items-center justify-center gap-2"><span class="text-lg opacity-80 filter grayscale-[0.3] group-hover:grayscale-0 transition-all">{{item.img}}</span><span>{{item.meaning}}</span></div>
          </template>
          <template v-else>
            <span>{{ item.meaning }}</span>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
