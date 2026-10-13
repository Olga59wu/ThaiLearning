import { defineStore } from 'pinia'
import { ref } from 'vue'
import { safeStorage } from '@/utils/storage'
import { saveProgressToCloud } from '@/services/db'
import type { ThaiItem } from '@/types/thai'

// thai.html 使用的 localStorage key（「重置所有數據」只清除這些）
export const THAI_LEARN_STORAGE_KEYS = [
  'theme',
  'showPinyin',
  'preferredRate',
  'thai_favorites',
  'thai_mistakes',
  'thai_correct_counts',
] as const

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** thai.html（泰語學習機）的持久化狀態 */
export const useThaiLearnStore = defineStore('thaiLearn', () => {
  const isDark = ref(safeStorage.get<string | null>('theme', null) === 'dark')
  const showPinyin = ref(safeStorage.get('showPinyin', true))
  // v-model 綁定 range input，拖動後會變成字串（與原版相同）
  const speechRate = ref<number | string>(safeStorage.get<number | string>('preferredRate', 0.8))
  const favorites = ref<string[]>(safeStorage.get<string[]>('thai_favorites', []))
  const mistakeList = ref<ThaiItem[]>(safeStorage.get<ThaiItem[]>('thai_mistakes', []))
  const correctCounts = ref<Record<string, number>>(
    safeStorage.get<Record<string, number>>('thai_correct_counts', {}),
  )

  const syncToCloud = () => {
    saveProgressToCloud('thai', {
      correctCounts: clone(correctCounts.value),
      favorites: clone(favorites.value),
      mistakeList: clone(mistakeList.value),
      lastPlayTime: Date.now(),
    })
  }

  /** 只清除 thai.html 自己的 key（原版是 localStorage.clear()） */
  const resetOwnData = () => {
    THAI_LEARN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  }

  return { isDark, showPinyin, speechRate, favorites, mistakeList, correctCounts, syncToCloud, resetOwnData }
})
