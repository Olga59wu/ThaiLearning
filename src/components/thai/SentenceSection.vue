<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const { sentenceCats, sentence, showPinyin, speak, setSentenceCat, nextSentence } = useThaiPageContext()
</script>

<template>
  <section class="flex flex-col items-center w-full max-w-2xl">
    <div class="relative w-full pb-12 overflow-hidden bg-white border-b-8 shadow-xl dark:bg-slate-800 rounded-3xl border-emerald-500 dark:border-emerald-600">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
      <div class="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div class="w-full mb-6 overflow-x-auto no-scrollbar">
          <div class="flex items-center justify-center gap-2 min-w-max">
            <button v-for="cat in sentenceCats" :key="cat.id" @click="setSentenceCat(cat.id)"
              :class="sentence.category === cat.id ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'"
              class="px-4 py-1.5 text-xs font-bold transition-colors rounded-full whitespace-nowrap">
              {{ cat.label }}
            </button>
          </div>
        </div>

        <div class="px-4 mb-8 text-5xl font-bold leading-relaxed text-gray-800 transition-all md:text-6xl thai-font dark:text-white drop-shadow-xs">
          {{ sentence.current?.thai }}
        </div>

        <button @click="speak({ soundText: sentence.current?.soundText })"
          class="flex items-center justify-center w-24 h-24 mb-10 text-white transition-all rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 hover:shadow-xl active:scale-95 group ring-4 ring-emerald-100 dark:ring-emerald-900/30">
          <svg class="w-12 h-12 group-hover:scale-110 transition-transform"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>

        <div class="w-full transition-all duration-300 transform" :class="sentence.revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'">
          <div v-show="showPinyin" class="mb-2 font-mono text-xl font-medium text-gray-500 dark:text-gray-400 pinyin-text tracking-wide">{{ sentence.current?.reading }}</div>
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ sentence.current?.meaning }}</div>
        </div>

        <div class="flex justify-center w-full gap-4 mt-10">
          <button @click="sentence.revealed = !sentence.revealed"
            class="px-6 py-3 rounded-full border-2 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold transition-all text-sm active:scale-95 bg-white dark:bg-slate-700">
            {{ sentence.revealed ? '隱藏翻譯' : '顯示翻譯' }}
          </button>
          <button @click="nextSentence"
            class="px-8 py-3 rounded-full bg-gray-800 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white shadow-lg font-bold transition-all flex items-center gap-2 text-sm active:scale-95 transform hover:scale-105">
            下一句
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
