import { describe, expect, it } from 'vitest'
import type { LessonExamRecord } from '@/types/lesson'
import { addRecord, latestRecord, LOCAL_LIMIT, mergeRecords, sameRecords, toCloudSummary } from '@/utils/lessonRecords'

const rec = (id: string, day: number, extra: Partial<LessonExamRecord> = {}): LessonExamRecord => ({
  id,
  lessonNo: 1,
  scope: 'lesson',
  retry: false,
  date: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  correct: 20,
  total: 24,
  wrong: [{ type: 'digitInput', prompt: '๒๓ → 阿拉伯數字', answer: '23', given: '32' }],
  ...extra,
})

describe('mergeRecords', () => {
  it('以 id 聯集，新到舊排序', () => {
    const merged = mergeRecords({ '1': [rec('a', 13)] }, { '1': [rec('b', 14)] })
    expect(merged['1']!.map((r) => r.id)).toEqual(['b', 'a'])
  })
  it('同一筆：雲端只有摘要時保留本機明細；本機沒有明細時用雲端的', () => {
    const local = rec('a', 13)
    const { wrong: _w, ...summary } = local
    expect(mergeRecords({ '1': [local] }, { '1': [summary] })['1']![0]!.wrong).toHaveLength(1)
    expect(mergeRecords({ '1': [summary] }, { '1': [local] })['1']![0]!.wrong).toHaveLength(1)
  })
  it('每課最多保留 LOCAL_LIMIT 筆', () => {
    const many = Array.from({ length: 25 }, (_, i) => rec(`r${i}`, i + 1))
    expect(mergeRecords({ '1': many }, undefined)['1']).toHaveLength(LOCAL_LIMIT)
    expect(mergeRecords({ '1': many }, undefined)['1']![0]!.id).toBe('r24')
  })
})

describe('toCloudSummary', () => {
  it('只有最近一次保留錯題明細', () => {
    const summary = toCloudSummary({ '1': [rec('a', 13), rec('b', 14), rec('c', 12)] })
    expect(summary['1']!.map((r) => r.id)).toEqual(['b', 'a', 'c'])
    expect(summary['1']![0]!.wrong).toHaveLength(1)
    expect(summary['1']![1]).not.toHaveProperty('wrong')
    expect(summary['1']![2]).not.toHaveProperty('wrong')
  })
})

describe('addRecord／latestRecord', () => {
  it('新紀錄在最前面；最近一次考試不算重考', () => {
    let records = addRecord({}, rec('a', 13))
    records = addRecord(records, rec('b', 14, { retry: true, correct: 3, total: 4 }))
    expect(records['1']!.map((r) => r.id)).toEqual(['b', 'a'])
    expect(latestRecord(records, 1)?.id).toBe('a')
    expect(latestRecord(records, 2)).toBeUndefined()
  })
})

describe('sameRecords', () => {
  it('比較內容', () => {
    expect(sameRecords({ '1': [rec('a', 1)] }, { '1': [rec('a', 1)] })).toBe(true)
    expect(sameRecords({ '1': [rec('a', 1)] }, undefined)).toBe(false)
    expect(sameRecords(undefined, {})).toBe(true)
  })
})
