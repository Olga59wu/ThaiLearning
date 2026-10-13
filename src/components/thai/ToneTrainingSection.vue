<script setup lang="ts">
import { tonePracticeSeries } from '@/data/thai'
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const {
  toneTraining, toneHeaders, toneGraphs, toneColors, currentTonePracticeChars, animatingToneIdx, toneChallengeOpts,
  speak, playToneSequence, triggerToneButtonAnimation, startNewToneChallenge, checkToneGuess, getToneBtnStyle, isToneOptSelected,
} = useThaiPageContext()
</script>

<template>
  <section class="flex-col items-center w-full max-w-2xl flex">
    <div
      class="w-full bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 transition-colors">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-indigo-100 text-indigo-500 rounded-lg">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-gray-700 dark:text-white">
            五音階對照與特訓
          </h2>
        </div>
        <div class="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
          <button @click="toneTraining.mode = 'compare'"
            :class="toneTraining.mode === 'compare' ? 'bg-white shadow-xs text-emerald-600 dark:bg-slate-600 dark:text-white' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-600'"
            class="px-3 py-1.5 text-xs font-bold rounded-md transition-all">
            對照
          </button>
          <button @click="startNewToneChallenge"
            :class="toneTraining.mode === 'challenge' ? 'bg-white shadow-xs text-emerald-600 dark:bg-slate-600 dark:text-white' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-600'"
            class="px-3 py-1.5 text-xs font-bold rounded-md transition-all">
            挑戰
          </button>
        </div>
      </div>

      <div v-show="toneTraining.mode === 'compare'">
        <div class="flex items-center gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <span class="text-xs font-bold text-gray-400 whitespace-nowrap">選擇發音:</span>
          <button v-for="base in tonePracticeSeries" :key="base.base" @click="toneTraining.currentToneBase = base.base"
            :class="toneTraining.currentToneBase === base.base ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white text-gray-600 hover:bg-gray-50'"
            class="w-12 h-12 rounded-full text-xs font-bold border flex flex-col items-center justify-center transition-colors">
            <span>{{ base.base }}</span><span>({{ base.chars[0] }})</span>
          </button>
        </div>

        <button @click="playToneSequence"
          class="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-lg bg-teal-600 text-white font-bold shadow-md hover:bg-teal-700 active:scale-95 transition-all">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          連續播放 (自動朗讀)
        </button>

        <div class="grid grid-cols-5 gap-2 mb-1 mt-4">
          <div v-for="t in toneHeaders" :key="t" class="text-center text-[10px] text-gray-400 dark:text-gray-500 font-bold" v-html="t"></div>
        </div>
        <div class="grid grid-cols-5 gap-2" id="tone-display-grid">
          <button v-for="(char, idx) in currentTonePracticeChars" :key="idx" @click="speak(char); triggerToneButtonAnimation(idx)"
            :class="[toneColors[idx], animatingToneIdx === idx ? 'ring-4 ring-emerald-300' : '']"
            class="flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all active:scale-95 h-24 relative overflow-hidden shadow-xs">
            <div class="mb-1 opacity-80 w-full h-8 tone-svg-container relative" :class="{'tone-animating': animatingToneIdx === idx}">
              <svg class="w-full h-full absolute top-0 left-0" viewBox="0 0 40 20">
                <line x1="0" y1="5" x2="40" y2="5" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2 2" />
                <line x1="0" y1="10" x2="40" y2="10" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2 2" />
                <line x1="0" y1="15" x2="40" y2="15" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2 2" />
              </svg>
              <svg class="w-full h-full absolute top-0 left-0" viewBox="0 0 40 20" v-html="toneGraphs[idx]"></svg>
            </div>
            <div class="text-2xl font-bold thai-font z-10">{{ char }}</div>
          </button>
        </div>
        <div class="mt-4 text-center text-xs text-gray-400">
          💡 點擊上方按鈕聆聽不同聲調的差異
        </div>
      </div>

      <div v-show="toneTraining.mode === 'challenge'" class="text-center py-4 relative">
        <div class="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-orange-600 bg-orange-100 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
          🔥 連勝: <span>{{ toneTraining.streak }}</span>
        </div>

        <div class="mb-8 relative mt-4">
          <button @click="speak(toneTraining.targetChar)"
            class="w-32 h-32 rounded-full bg-linear-to-br/srgb from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 flex items-center justify-center mx-auto transition-all transform active:scale-95 hover:scale-105 group ring-4 ring-emerald-100 dark:ring-emerald-800">
            <svg class="h-14 w-14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <div class="absolute -bottom-6 w-full text-center text-xs font-bold text-gray-400">點擊重聽</div>
        </div>

        <div class="grid grid-cols-5 gap-2">
          <button v-for="(btnOpt, idx) in toneChallengeOpts" :key="idx" @click="checkToneGuess(idx)"
            :class="getToneBtnStyle(idx)"
            class="h-24 rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-all group border-2">
            <span class="text-xl font-bold" :class="isToneOptSelected(idx) ? 'text-current' : 'text-gray-700 dark:text-white'">{{ btnOpt.sym }}</span>
            <span class="text-[10px]" :class="isToneOptSelected(idx) ? '' : 'text-gray-400 group-hover:text-emerald-500'">{{ btnOpt.label }}</span>
          </button>
        </div>
        <div class="h-8 mt-6 text-sm font-bold text-center" v-html="toneTraining.feedback"></div>
        <div class="flex justify-center h-12 mt-2">
          <button v-show="toneTraining.isLocked" @click="startNewToneChallenge"
            class="flex items-center gap-2 px-8 py-3 font-bold text-white transition-all transform bg-gray-800 rounded-full shadow-lg hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 hover:scale-105 active:scale-95">
            下一題
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
