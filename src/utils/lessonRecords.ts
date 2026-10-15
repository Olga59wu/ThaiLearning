// 考試紀錄的合併與雲端摘要（純函式）
// users/{uid} 是單一文件（上限 1 MB），所以雲端只存摘要：每課只有最近一次考試帶錯題明細
import type { LessonExamRecord } from '@/types/lesson'

export type LessonRecords = Record<string, LessonExamRecord[]>

/** 本機每課最多保留幾筆 */
export const LOCAL_LIMIT = 20

const byDateDesc = (a: LessonExamRecord, b: LessonExamRecord) => b.date.localeCompare(a.date)

export const newRecordId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** 本機與雲端以 id 聯集；同一筆兩邊都有時，保留有錯題明細的那份（本機優先）。每課新到舊、最多 LOCAL_LIMIT 筆 */
export const mergeRecords = (local: LessonRecords, cloud: LessonRecords | undefined): LessonRecords => {
  const result: LessonRecords = {}
  const keys = new Set([...Object.keys(local), ...Object.keys(cloud ?? {})])
  keys.forEach((key) => {
    const map = new Map<string, LessonExamRecord>()
    ;(cloud?.[key] ?? []).forEach((r) => map.set(r.id, r))
    ;(local[key] ?? []).forEach((r) => {
      const existing = map.get(r.id)
      map.set(r.id, !r.wrong && existing?.wrong ? existing : r)
    })
    result[key] = [...map.values()].sort(byDateDesc).slice(0, LOCAL_LIMIT)
  })
  return result
}

/** 新增一筆（放最前面），超過上限的舊紀錄刪掉 */
export const addRecord = (records: LessonRecords, record: LessonExamRecord): LessonRecords => {
  const key = String(record.lessonNo)
  return { ...records, [key]: [record, ...(records[key] ?? [])].sort(byDateDesc).slice(0, LOCAL_LIMIT) }
}

/** 雲端摘要：每課只有最近一次（第一筆）保留 wrong，其他只留分數 */
export const toCloudSummary = (records: LessonRecords): LessonRecords =>
  Object.fromEntries(
    Object.entries(records).map(([key, list]) => [
      key,
      [...list].sort(byDateDesc).map((r, i) => {
        if (i === 0) return { ...r }
        const { wrong: _wrong, ...summary } = r
        return summary
      }),
    ]),
  )

/** 卡片顯示的「最近一次考試」：最新一筆非重考的紀錄 */
export const latestRecord = (records: LessonRecords, lessonNo: number): LessonExamRecord | undefined =>
  records[String(lessonNo)]?.find((r) => !r.retry)

/** 兩份紀錄的內容是否相同（決定要不要回寫雲端） */
export const sameRecords = (a: LessonRecords | undefined, b: LessonRecords | undefined): boolean =>
  JSON.stringify(a ?? {}) === JSON.stringify(b ?? {})
