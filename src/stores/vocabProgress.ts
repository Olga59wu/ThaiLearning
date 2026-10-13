import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FULL_VOCAB } from '@/data/thaiVocab'
import { safeStorage } from '@/utils/storage'
import type { ThaiCloudData, VocabWord } from '@/types/thai'

/**
 * 舊資料（沒有 id）轉成目前單字庫的物件。
 * 先用 th + zh 比對；對不上再用 th 對應第一筆；都找不到就移除。
 */
export const migrateToId = (arr: VocabWord[]): { mutated: boolean; newArr: VocabWord[] } => {
  let mutated = false
  const newArr = arr
    .map((old) => {
      if (old.id) return old
      mutated = true
      return (
        FULL_VOCAB.find((w) => w.th === old.th && w.zh === old.zh) ||
        FULL_VOCAB.find((w) => w.th === old.th) ||
        null
      )
    })
    .filter((w): w is VocabWord => Boolean(w))
  return { mutated, newArr }
}

/** Player / Typing / Downloader 共用的單字清單（localStorage） */
export const useVocabProgressStore = defineStore('vocabProgress', () => {
  const customList = ref<VocabWord[]>([])
  const knownWords = ref<VocabWord[]>([])
  // 壞音檔名單（Player 回報後改用 TTS）
  const brokenAudio = ref<string[]>([])
  // 已打包名單（Downloader 用）
  const mp3History = ref<string[]>([])

  /** 原版每頁重新載入時都會重新讀取 localStorage */
  const loadFromStorage = () => {
    customList.value = safeStorage.get<VocabWord[]>('thai-custom-list', [])
    knownWords.value = safeStorage.get<VocabWord[]>('thai-known-words', [])
    brokenAudio.value = safeStorage.get<string[]>('thai-broken-audio', [])
    mp3History.value = safeStorage.get<string[]>('thai-mp3-history', [])
  }

  /**
   * 套用雲端載入的收藏／已學會／壞音檔名單（Player、Typing 共用）：
   * 有資料的欄位覆蓋本機 → UUID 遷移 → 寫回 localStorage（原版不寫回，要等下一次變動才存）。
   * @returns 遷移時是否改動了資料（需要回寫雲端）
   */
  const applyCloudData = (thai: ThaiCloudData): boolean => {
    if (thai.customList) customList.value = thai.customList
    if (thai.knownWords) knownWords.value = thai.knownWords
    if (thai.brokenAudio) brokenAudio.value = thai.brokenAudio

    // --- Firebase 資料 UUID 無痛遷移邏輯 ---
    const km = migrateToId(knownWords.value)
    const cm = migrateToId(customList.value)
    knownWords.value = km.newArr
    customList.value = cm.newArr

    safeStorage.set('thai-custom-list', customList.value)
    safeStorage.set('thai-known-words', knownWords.value)
    safeStorage.set('thai-broken-audio', brokenAudio.value)

    return km.mutated || cm.mutated
  }

  return { customList, knownWords, brokenAudio, mp3History, loadFromStorage, applyCloudData }
})
