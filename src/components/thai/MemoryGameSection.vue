<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const { memory, initMemoryGame, flipMemoryCard } = useThaiPageContext()
</script>

<template>
  <section class="w-full max-w-2xl flex flex-col items-center">
    <div class="w-full bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 transition-colors">
      <div class="flex items-center justify-between mb-4 px-2">
        <div class="text-sm font-bold text-gray-600 dark:text-gray-400">配對遊戲</div>
        <div class="px-3 py-1 text-xs font-bold text-orange-600 bg-orange-100 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
          步數: <span>{{ memory.moves }}</span>
        </div>
      </div>

      <div class="relative">
        <div class="grid grid-cols-3 gap-3 md:grid-cols-4">
          <div v-for="(card, index) in memory.cards" :key="index" @click="flipMemoryCard(card)"
            class="aspect-square bg-white dark:bg-slate-700 rounded-2xl cursor-pointer shadow-xs relative transform transition-transform duration-300 hover:scale-105 border border-gray-100 dark:border-slate-600"
            :class="{'flipped': card.flipped, 'shake-anim': card.shake, 'pointer-events-none': card.matched || memory.lock}">
            <div v-if="!card.flipped && !card.matched" class="absolute inset-0 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/50 rounded-2xl opacity-80">
              <div class="flex flex-col items-center opacity-40"><span class="text-3xl filter grayscale transition-all">🇹🇭</span></div>
            </div>
            <div v-else class="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border-2 shadow-md p-1"
              :class="card.matched ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50' : (card.shake ? 'border-red-400' : 'border-emerald-500')"
              v-html="card.content"></div>
          </div>
        </div>

        <!-- 修正原版 bug：原版條件為 matched === 6（每組 +2，配對 3 組就會顯示），改為全部卡片配對完成 -->
        <div v-if="memory.cards.length > 0 && memory.matched === memory.cards.length" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-xl transition-all">
          <div class="text-6xl mb-2 animate-bounce">🏆</div>
          <h3 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">恭喜通關！</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">總步數：<span class="font-bold">{{ memory.moves }}</span></p>
          <button @click="initMemoryGame" class="px-6 py-2 bg-emerald-500 text-white rounded-full font-bold shadow-lg hover:bg-emerald-600 active:scale-95 transition-all">再玩一次</button>
        </div>
      </div>

      <div class="flex justify-center mt-6">
        <button @click="initMemoryGame" class="flex items-center gap-2 px-6 py-2 font-bold text-white transition-all rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          新的一局
        </button>
      </div>
    </div>
  </section>
</template>
