import { defineStore } from 'pinia'
import { loadProgressFromCloud, saveProgressToCloud } from '@/services/db'
import type { ThaiCloudData } from '@/types/thai'

/**
 * 雲端 users/{uid}.thai 的快取（原版 Player/Typing/Downloader 的 cachedCloudThaiData）。
 * 上傳時先展開快取，保護其他頁面的欄位不被洗掉。
 */
export const useCloudStore = defineStore('cloud', () => {
  let cachedThai: ThaiCloudData = {}

  /** 每頁載入時重新下載；有 thai 資料才回傳並快取 */
  const loadThai = async (): Promise<ThaiCloudData | null> => {
    cachedThai = {}
    const cloudData = await loadProgressFromCloud()
    const thai = cloudData?.thai as ThaiCloudData | undefined
    if (!thai) return null
    cachedThai = thai
    return thai
  }

  const saveThai = (payload: Partial<ThaiCloudData>) =>
    saveProgressToCloud('thai', { ...cachedThai, ...payload })

  return { loadThai, saveThai }
})
