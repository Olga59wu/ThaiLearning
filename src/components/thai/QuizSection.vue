<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const {
  currentMode, quiz, quizModeLabel, mistakeList, favorites,
  speak, setQuizScope, startQuiz, nextQuizQuestion, handleQuizAnswer, getQuizOptClass,
} = useThaiPageContext()
</script>

<template>
  <section class="w-full max-w-2xl flex flex-col items-center">
    <div class="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs mb-6 border border-gray-100 dark:border-slate-700 transition-colors">
      <div v-show="currentMode !== 'favorites' && currentMode !== 'mistakes'" class="flex flex-wrap justify-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
        <button @click="setQuizScope('basic')" :class="quiz.scope === 'basic' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 border border-emerald-500' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all">基礎 (輔/元)</button>
        <button @click="setQuizScope('vocab')" :class="quiz.scope === 'vocab' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 border border-emerald-500' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all">單字</button>
        <button @click="setQuizScope('advanced')" :class="quiz.scope === 'advanced' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 border border-emerald-500' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all">進階 (聲調)</button>
        <!-- 新增「收藏」範圍按鈕（收藏複習入口），樣式沿用範圍按鈕；沒有收藏時 disabled -->
        <button @click="setQuizScope('favorites')" :disabled="favorites.length === 0" :class="quiz.scope === 'favorites' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 border border-emerald-500' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-700">收藏</button>
      </div>

      <div class="flex justify-between items-end mb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-emerald-100 text-emerald-500 rounded-lg">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div class="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Mode</div>
            <div class="text-gray-700 dark:text-gray-200 font-bold text-sm" v-html="quizModeLabel"></div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Score</div>
          <div class="text-emerald-600 dark:text-emerald-400 font-black text-xl">
            <span>{{ quiz.score }}</span> / <span>{{ quiz.total }}</span>
          </div>
        </div>
      </div>

      <div class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <div class="bg-linear-to-r/srgb from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500 relative" :style="{ width: quiz.total > 0 ? (quiz.score/quiz.total*100)+'%' : '0%' }"></div>
      </div>

      <div class="flex justify-between mt-3 px-1 items-center">
        <div class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
          錯題自動複習
        </div>
        <div class="flex gap-2">
          <button v-show="mistakeList.length > 0" @click="startQuiz('mistakes')" class="text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 px-3 py-1 rounded-full font-bold hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
            複習錯題 ({{ mistakeList.length }})
          </button>
          <button @click="startQuiz('normal')" class="text-xs font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
            ↺ 重新開始
          </button>
        </div>
      </div>
    </div>

    <div v-if="!quiz.finished" class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full text-center border-b-[6px] border-emerald-500 dark:border-emerald-600 relative pb-20 transition-colors">
      <div v-if="currentMode === 'quiz_hear'" class="mb-8">
        <div class="inline-block p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4">
          <span class="text-emerald-500 text-xs font-bold px-2">🔊 請聆聽</span>
        </div>
        <div class="relative group w-32 h-32 mx-auto">
          <button @click="speak(quiz.currentItem)" class="w-32 h-32 rounded-full bg-linear-to-br/srgb from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 flex items-center justify-center mx-auto transition-all transform active:scale-95 hover:scale-105 group-hover:ring-4 ring-emerald-100 dark:ring-emerald-800">
            <svg class="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          </button>
          <div class="absolute -bottom-8 w-full text-center text-xs font-bold text-gray-400">點擊播放</div>
        </div>
      </div>

      <div v-else class="mb-8">
        <div class="inline-block p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
          <span class="text-blue-500 text-xs font-bold px-2">👁️ 請問發音</span>
        </div>
        <div class="text-9xl font-bold text-gray-800 dark:text-white mb-2 transition-all cursor-default thai-font drop-shadow-xs">{{ quiz.currentItem?.char }}</div>
        <div class="text-sm text-gray-400 font-medium">請選擇下方正確的發音</div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div v-for="(opt, idx) in quiz.options" :key="idx" @click="handleQuizAnswer(opt)"
          :class="getQuizOptClass(opt)"
          class="h-24 border-2 rounded-2xl flex overflow-hidden transition-all active:scale-95 cursor-pointer shadow-xs select-none relative group">

          <div class="absolute top-1 right-1 text-[10px] text-gray-300 dark:text-gray-500 border dark:border-gray-500 px-1 rounded hidden md:block">{{ idx + 1 }}</div>

          <template v-if="currentMode === 'quiz_hear'">
            <div v-if="quiz.answered" class="flex flex-col items-center justify-center w-full h-full p-1 pointer-events-none">
              <div class="mb-1 text-3xl font-bold leading-none text-gray-800 thai-font dark:text-white">{{ opt.char }}</div>
              <div class="text-sm font-bold leading-tight text-center text-emerald-700 dark:text-emerald-400 thai-font">{{ opt.thaiLabel }}</div>
              <div class="text-xs text-center text-gray-500 scale-95 dark:text-gray-400">{{ opt.meaning }}</div>
            </div>
            <div v-else class="flex items-center justify-center w-full text-5xl font-bold text-gray-800 pointer-events-none thai-font dark:text-white group-hover:text-emerald-600 transition-colors">{{ opt.char }}</div>
          </template>
          <template v-else>
            <div @click.stop="speak({soundText: opt.soundText})" class="z-10 flex items-center justify-center w-1/3 transition-colors border-r border-gray-100 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 dark:border-slate-600 text-emerald-600 dark:text-emerald-400" title="試聽">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </div>
            <div class="flex flex-col items-center justify-center w-2/3 p-1">
              <span v-show="!quiz.answered" class="text-xs font-bold text-gray-400 pointer-events-none dark:text-gray-500 group-hover:text-gray-600">選擇此音</span>
              <span v-show="quiz.answered" class="text-lg font-bold thai-font text-emerald-700 dark:text-emerald-400">{{ opt.thaiLabel }}</span>
            </div>
          </template>
        </div>
      </div>

      <div class="mt-8 h-12 flex items-center justify-center font-bold text-lg" v-html="quiz.feedback"></div>

      <div class="mt-4 flex justify-center absolute bottom-6 left-0 w-full">
        <button v-show="quiz.answered" @click="nextQuizQuestion" class="px-8 py-3 bg-gray-800 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-full font-bold shadow-xl transform transition-all hover:scale-105 flex items-center gap-2">
          下一題
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
        </button>
      </div>
    </div>

    <div v-if="quiz.finished" class="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl w-full text-center border-b-8 border-yellow-400 transition-colors">
      <div class="text-7xl mb-6 animate-bounce">🎉</div>
      <h2 class="text-3xl font-black text-gray-800 dark:text-white mb-3">恭喜完成！</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-8 font-medium">您已經掌握了本模式的所有題目。</p>
      <button @click="startQuiz('normal')" class="px-10 py-4 bg-linear-to-r/srgb from-emerald-500 to-teal-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
        再次挑戰
      </button>
    </div>
  </section>
</template>
