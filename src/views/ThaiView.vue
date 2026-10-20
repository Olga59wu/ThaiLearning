<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { usePageShell } from '@/composables/usePageShell'
import { provideThaiPage } from '@/composables/thai/useThaiPage'
import { loadProgressFromCloud } from '@/services/db'
import { safeStorage } from '@/utils/storage'
import type { ThaiCloudData } from '@/types/thai'
import ThaiHeader from '@/components/thai/ThaiHeader.vue'
import LearnSection from '@/components/thai/LearnSection.vue'
import ToneTrainingSection from '@/components/thai/ToneTrainingSection.vue'
import QuizSection from '@/components/thai/QuizSection.vue'
import SentenceSection from '@/components/thai/SentenceSection.vue'
import MemoryGameSection from '@/components/thai/MemoryGameSection.vue'
import ToneCalcModal from '@/components/thai/ToneCalcModal.vue'
import HelpModal from '@/components/thai/HelpModal.vue'
import HandwritingModal from '@/components/common/HandwritingModal.vue'

usePageShell({
  htmlClass: 'shell-common shell-learning',
  bodyClass:
    'theme-thai min-h-screen flex flex-col items-center p-4 pb-20 transition-colors duration-300 bg-linear-to-b/srgb from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800',
})

const {
  currentMode, modeOptions, modals, toast, isDark, speechRate, correctCounts, favorites, mistakeList,
  switchMode, initVoices, handleKeydown, hw, hwItem, hwGuideText,
} = provideThaiPage()

// 原版 watch(isDark, { immediate: true })：切換 <html class="dark"> 並存檔
watch(
  isDark,
  (val) => {
    document.documentElement.classList.toggle('dark', val)
    safeStorage.set('theme', val ? 'dark' : 'light')
  },
  { immediate: true },
)
watch(speechRate, (val) => safeStorage.set('preferredRate', val))

let disposed = false
onMounted(async () => {
  initVoices()
  window.speechSynthesis.onvoiceschanged = initVoices
  document.addEventListener('keydown', handleKeydown)

  // 原版 initAuthListener 成功回呼：載入雲端進度（未登入由 router guard 導回登入頁）
  const d = await loadProgressFromCloud()
  if (disposed) return
  const thai = d?.thai as ThaiCloudData | undefined
  if (thai) {
    // 雲端資料一併寫回 localStorage（原版要等下一次變動才會存）
    if (thai.correctCounts) { correctCounts.value = thai.correctCounts; safeStorage.set('thai_correct_counts', correctCounts.value) }
    if (thai.favorites) { favorites.value = thai.favorites; safeStorage.set('thai_favorites', favorites.value) }
    if (thai.mistakeList) { mistakeList.value = thai.mistakeList; safeStorage.set('thai_mistakes', mistakeList.value) }
  }
})

// SPA 換頁清理（原版換頁時由瀏覽器自動處理）
onBeforeUnmount(() => {
  disposed = true
  document.removeEventListener('keydown', handleKeydown)
  window.speechSynthesis.onvoiceschanged = null
  window.speechSynthesis.cancel()
  document.documentElement.classList.remove('dark')
})
</script>

<template>
  <div id="app" class="w-full max-w-5xl flex flex-col items-center">
    <ThaiHeader />

    <div class="w-full max-w-4xl flex flex-wrap justify-center gap-3 mb-6">
      <button v-for="mode in modeOptions" :key="mode.id" @click="switchMode(mode.id)"
        :class="currentMode === mode.id ? 'active-tab shadow-md' : 'inactive-tab shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700'"
        class="px-5 py-2.5 text-sm md:text-base rounded-full font-bold transition-all border flex items-center gap-2 transform active:scale-95">
        {{ mode.icon }} {{ mode.label }}
      </button>
    </div>

    <LearnSection v-if="currentMode === 'learn'" />
    <ToneTrainingSection v-if="currentMode === 'tone_training'" />
    <QuizSection v-if="currentMode.startsWith('quiz')" />
    <SentenceSection v-if="currentMode === 'sentence_practice'" />
    <MemoryGameSection v-if="currentMode === 'game_memory'" />

    <!-- Modals -->
    <ToneCalcModal v-if="modals.calc" />
    <HelpModal v-if="modals.help" />
    <HandwritingModal v-if="modals.writing" :hw="hw" :is-dark="isDark" fit-viewport @close="modals.writing = false"
      :title="hwItem?.thaiLabel || hwItem?.soundText || hwItem?.name || ''" :strokes="hwItem?.strokes" :fallback-char="hwItem?.char" :guide-text="hwGuideText" />

    <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur text-white px-6 py-3 rounded-full transition-opacity duration-300 pointer-events-none text-sm font-medium z-50 shadow-2xl flex items-center gap-2" :class="toast.show ? 'opacity-100' : 'opacity-0'">
      <svg class="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.618.786l-5-4A1 1 0 013 12V8a1 1 0 01.382-.786l5-4zM13.923 13.383a1 1 0 01-1.414-1.414 2.5 2.5 0 000-3.536 1 1 0 111.414-1.414 4.5 4.5 0 010 6.364z" clip-rule="evenodd" /></svg>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>
