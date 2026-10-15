import { describe, expect, it } from 'vitest'
import { pickRandom, poolNumbers } from '@/utils/numberPool'

describe('poolNumbers', () => {
  it('展開範圍並加上 extra，去重排序', () => {
    expect(poolNumbers({ min: 0, max: 3, extra: [100, 2] })).toEqual([0, 1, 2, 3, 100])
  })
})

describe('pickRandom', () => {
  it('不會連續取到同一個', () => {
    for (let i = 0; i < 50; i++) expect(pickRandom([1, 2], 1)).toBe(2)
  })
  it('只有一個時照樣回傳', () => {
    expect(pickRandom([5], 5)).toBe(5)
  })
})
