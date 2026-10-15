import type { NumberPool } from '@/types/lesson'

/** 數字範圍展開成不重複的數字清單（min～max 再加上 extra，依大小排序） */
export const poolNumbers = (pool: NumberPool): number[] => {
  const set = new Set<number>()
  for (let n = pool.min; n <= pool.max; n++) set.add(n)
  pool.extra?.forEach((n) => set.add(n))
  return [...set].sort((a, b) => a - b)
}

/** 從清單隨機取一個，避免和上一個相同（清單只有一個時例外） */
export const pickRandom = <T>(list: readonly T[], avoid?: T): T => {
  if (list.length === 0) throw new Error('清單是空的')
  const candidates = list.length > 1 && avoid !== undefined ? list.filter((x) => x !== avoid) : list
  return candidates[Math.floor(Math.random() * candidates.length)]!
}
