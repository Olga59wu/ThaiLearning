<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const {
  modals, hwItem, hwSvgViewBox, isDark, inkColor, strokeSpeed,
  canvasContainerRef, hwCanvasRef, setInkColor, playHWAnim, clearHW,
} = useThaiPageContext()

// 把畫布容器與 canvas 元素交給頁面邏輯（openHW / clearHW / playHWAnim 使用）
const setContainerEl = (el: unknown) => { canvasContainerRef.value = el as HTMLDivElement | null }
const setCanvasEl = (el: unknown) => { hwCanvasRef.value = el as HTMLCanvasElement | null }
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" @click.self="modals.writing = false">
    <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 dark:bg-slate-700 dark:border-slate-600">
        <h3 class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
          <span class="text-xl">✍️</span> 手寫練習:
          <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400 thai-font">{{ hwItem?.thaiLabel || hwItem?.soundText || hwItem?.name }}</span>
        </h3>
        <button @click="modals.writing = false" class="p-1 text-gray-400 transition-colors rounded-full hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-600 focus:outline-hidden">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="p-5 bg-gray-50 dark:bg-slate-700/30 flex-1 overflow-y-auto">
        <div class="relative flex items-center justify-center w-full overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-600 cursor-crosshair touch-none aspect-square mx-auto" id="canvas-container" :ref="setContainerEl">
          <template v-if="hwItem?.strokes && hwItem.strokes.length > 0">
            <svg class="absolute top-0 left-0 w-full h-full z-0 pointer-events-none p-4" :viewBox="hwSvgViewBox" preserveAspectRatio="xMidYMid meet">
              <g><path v-for="(d, i) in hwItem.strokes" :key="'g'+i" :d="d" class="stroke-guide-path" /></g>
              <g><path v-for="(d, i) in hwItem.strokes" :key="'a'+i" :d="d" class="stroke-anim-path" /></g>
            </svg>
          </template>
          <template v-else>
            <div class="absolute text-[12rem] text-gray-100 dark:text-slate-700 font-bold thai-font select-none pointer-events-none flex items-center justify-center h-full w-full pb-4 z-0">{{ hwItem?.char }}</div>
          </template>
          <canvas id="hw-canvas" :ref="setCanvasEl" class="absolute top-0 left-0 z-10 w-full h-full touch-none"></canvas>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between px-5 py-4 border-t border-gray-100 bg-white dark:bg-slate-800 dark:border-slate-600 gap-2">
        <div class="flex gap-2">
          <button v-for="c in ['#059669', '#2563eb', '#1f2937']" :key="c" @click="setInkColor(c)" :style="{backgroundColor: c === '#1f2937' && isDark ? '#f3f4f6' : c}" class="w-7 h-7 rounded-full shadow-xs transition-transform hover:scale-110" :class="inkColor === c || (c==='#1f2937' && inkColor==='#f3f4f6') ? 'ring-2 ring-offset-2 ring-'+(c==='#059669'?'emerald-600':c==='#2563eb'?'blue-600':isDark?'gray-300':'gray-800') + ' dark:ring-offset-slate-800' : ''"></button>
        </div>
        <div v-show="hwItem?.strokes" class="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-full px-3 py-1.5 shadow-xs border border-gray-100 dark:border-slate-600">
          <button @click="playHWAnim" class="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white transition-all transform active:scale-95 bg-orange-400 rounded-full hover:bg-orange-500 shadow-xs hover:shadow">
            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
            筆順範例
          </button>
          <div class="flex items-center gap-1.5 border-l pl-3 border-gray-200 dark:border-slate-600">
            <span class="text-[11px] filter grayscale opacity-60">🐢</span>
            <input type="range" min="20" max="150" step="5" v-model="strokeSpeed" class="w-16 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 dark:bg-slate-600" />
            <span class="text-[11px] filter grayscale opacity-60">🐇</span>
          </div>
        </div>
        <button @click="clearHW" class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 transition-colors bg-red-50 border border-transparent rounded-full hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          清除
        </button>
      </div>
    </div>
  </div>
</template>
