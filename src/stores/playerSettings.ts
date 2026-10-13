import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const readJson = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as T
  } catch {
    return fallback
  }
}

/**
 * thaiPlayer.html 的設定。localStorage 值格式與原版相同（布林／數字以字串存，例如 "true"、"0"）。
 * 只負責存檔；切換時的連動行為（重建清單、深色模式 class 等）在 usePlayerPage。
 */
export const usePlayerSettingsStore = defineStore('playerSettings', () => {
  const selectedCategories = ref<string[]>(readJson<string[]>('thai-selected-cats', []))
  const isShuffle = ref(localStorage.getItem('thai-shuffle') === 'true')
  const repeatMode = ref(parseInt(localStorage.getItem('thai-repeat') ?? '') || 0)
  const playbackRate = ref(parseFloat(localStorage.getItem('thai-rate') ?? '') || 1.0)
  const speakChineseOrder = ref(localStorage.getItem('thai-speak-order') !== 'false')
  const isMultiSelect = ref(localStorage.getItem('thai-multi') === 'true')
  const hideKnownWords = ref(localStorage.getItem('thai-hide-known') === 'true')
  const isDarkMode = ref(localStorage.getItem('thai-dark') === 'true')
  const selectedVoice = ref(localStorage.getItem('thai-voice') || '')
  const isFlashcardMode = ref(localStorage.getItem('thai-flashcard') === 'true')

  watch(selectedCategories, (v) => localStorage.setItem('thai-selected-cats', JSON.stringify(v)), { deep: true })
  watch(isShuffle, (v) => localStorage.setItem('thai-shuffle', String(v)))
  watch(repeatMode, (v) => localStorage.setItem('thai-repeat', String(v)))
  watch(playbackRate, (v) => localStorage.setItem('thai-rate', String(v)))
  watch(speakChineseOrder, (v) => localStorage.setItem('thai-speak-order', String(v)))
  watch(isMultiSelect, (v) => localStorage.setItem('thai-multi', String(v)))
  watch(hideKnownWords, (v) => localStorage.setItem('thai-hide-known', String(v)))
  watch(isDarkMode, (v) => localStorage.setItem('thai-dark', String(v)))
  watch(selectedVoice, (v) => localStorage.setItem('thai-voice', v))
  watch(isFlashcardMode, (v) => localStorage.setItem('thai-flashcard', String(v)))

  return {
    selectedCategories,
    isShuffle,
    repeatMode,
    playbackRate,
    speakChineseOrder,
    isMultiSelect,
    hideKnownWords,
    isDarkMode,
    selectedVoice,
    isFlashcardMode,
  }
})
