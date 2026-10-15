import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCloudStore } from '@/stores/cloud'
import { safeStorage } from '@/utils/storage'
import type { LessonExamRecord } from '@/types/lesson'
import {
  addRecord as addTo,
  latestRecord,
  mergeRecords,
  sameRecords,
  toCloudSummary,
  type LessonRecords,
} from '@/utils/lessonRecords'

const STORAGE_KEY = 'thai-lesson-exams'
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export type RecordSyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

/**
 * 每週課程考試紀錄：
 * - 本機 localStorage thai-lesson-exams：完整紀錄（含錯題），每課最多 20 筆
 * - 雲端 users/{uid}.thai.lessonExams：摘要，每課只有最近一次帶錯題
 */
export const useLessonRecordsStore = defineStore('lessonRecords', () => {
  const cloud = useCloudStore()
  const records = ref<LessonRecords>(safeStorage.get<LessonRecords>(STORAGE_KEY, {}))
  const syncStatus = ref<RecordSyncStatus>('idle')

  const saveLocal = () => safeStorage.set(STORAGE_KEY, records.value)

  const push = async (): Promise<boolean> => {
    syncStatus.value = 'syncing'
    const ok = await cloud.saveThai({ lessonExams: clone(toCloudSummary(records.value)) })
    syncStatus.value = ok ? 'synced' : 'error'
    return ok
  }

  // 這次進頁後是否成功讀過雲端。沒讀到（離線或讀取失敗）時不上傳：
  // 上傳會整個取代雲端該課的陣列，可能蓋掉其他裝置的紀錄
  let cloudLoaded = false

  /** 進課程頁時：每頁重新讀本機，再與雲端聯集；本機有雲端沒有的紀錄就回寫雲端 */
  const syncFromCloud = async () => {
    records.value = safeStorage.get<LessonRecords>(STORAGE_KEY, {})
    const thai = await cloud.loadThai()
    if (!thai) return
    cloudLoaded = true
    const cloudRecords = thai.lessonExams
    records.value = mergeRecords(records.value, cloudRecords)
    saveLocal()
    if (!sameRecords(toCloudSummary(records.value), cloudRecords) && Object.keys(records.value).length > 0) await push()
  }

  /** 考完寫入本機並上傳雲端摘要（還沒讀過雲端就先合併再上傳）；回傳是否上傳成功 */
  const addRecord = async (record: LessonExamRecord): Promise<boolean> => {
    records.value = addTo(records.value, record)
    saveLocal()
    if (!cloudLoaded) {
      syncStatus.value = 'syncing'
      await syncFromCloud() // 成功時會合併並上傳
      if (!cloudLoaded) {
        syncStatus.value = 'error'
        return false
      }
      return (syncStatus.value as RecordSyncStatus) === 'synced'
    }
    return push()
  }

  const recordsOf = (lessonNo: number): LessonExamRecord[] => records.value[String(lessonNo)] ?? []
  const latestOf = (lessonNo: number) => latestRecord(records.value, lessonNo)

  return { records, syncStatus, syncFromCloud, addRecord, recordsOf, latestOf }
})
