<script setup lang="ts">
import { usePlayerPageContext } from '@/composables/player/usePlayerPage'

const { allCategories, selectedCategories, toggleCategory, getCatIcon } = usePlayerPageContext()
</script>

<template>
  <!-- 分類選擇器 (固定高度) -->
  <div class="px-4 py-2 bg-slate-50 border-b shrink-0 z-10">
    <div class="flex gap-2 overflow-x-auto no-scrollbar py-1 items-center">
      <button @click="toggleCategory('all')"
        :class="['px-3 py-1 rounded-full text-[10px] font-black transition-all border shrink-0 h-7 flex items-center justify-center min-w-[50px]',
                          selectedCategories.length === 0 ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-400']">
        全部
      </button>
      <button v-for="(_list, cat) in allCategories" :key="cat" @click="toggleCategory(cat)"
        :class="['cat-btn-' + cat, selectedCategories.includes(cat) ? 'bg-blue-100 border-blue-400 shadow-xs' : 'bg-white border-slate-200 opacity-70']"
        class="px-3 py-1 rounded-full border transition-all shrink-0 flex items-center justify-center h-7 active:scale-95">
        <span class="text-sm">{{ getCatIcon(cat) }}</span>
        <span class="text-[9px] font-bold text-slate-600 ml-1" v-if="selectedCategories.includes(cat)">{{
          cat.substring(0,2) }}</span>
      </button>
    </div>
  </div>
</template>
