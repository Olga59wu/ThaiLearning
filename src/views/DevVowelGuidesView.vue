<script setup lang="ts">
import { computed } from 'vue'
import { getLesson, lessonVowels } from '@/data/lessons'
import { vowelStrokes } from '@/data/lessons/vowels'
import { useLessonTheme } from '@/composables/lessons/useLessonTheme'
import { vowelWriteBase } from '@/composables/lessons/useVowelHandwriting'
import VowelGuide from '@/components/common/VowelGuide.vue'

// 開發用（只在 pnpm dev 註冊路由）：一次列出第 2 課 32 個母音的手寫底圖，有筆順的疊上橘色路徑，檢查對齊
const { isDark, toggleDark } = useLessonTheme()
const vowels = computed(() => {
  const lesson = getLesson(2)
  return lesson ? lessonVowels(lesson).map((v) => ({ v, base: vowelWriteBase(v), strokes: vowelStrokes(v) })) : []
})
</script>

<template>
  <div id="app" class="w-full max-w-5xl flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-800 dark:text-white">母音手寫底圖原型（開發用）</h1>
      <button @click="toggleDark" class="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-slate-700 dark:text-white shadow-xs">{{ isDark ? '☀️' : '🌙' }}</button>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">底圖比例同 /path（字高 68%、置中）；橘色是 thaiData 的筆順（座標 0～100，不縮放）。</p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="{ v, base, strokes } in vowels" :key="v.id" class="flex flex-col gap-1">
        <div class="relative aspect-square rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 overflow-hidden">
          <VowelGuide :text="base" :is-dark="isDark" class="absolute inset-0" />
          <svg v-if="strokes" class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <path v-for="(d, i) in strokes" :key="i" :d="d" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" opacity="0.8" />
          </svg>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ v.no }}. <span class="thai-font">{{ v.form }}</span>（底圖 <span class="thai-font">{{ base }}</span>）{{ strokes ? '✅ 有筆順' : '' }}</div>
      </div>
    </div>
  </div>
</template>
