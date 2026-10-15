import { thaiData } from '@/data/thai'
import { strokesBBox } from '@/composables/useHandwriting'
import { toThaiDigits } from '@/utils/thaiNumber'

// 泰文數字 ๐～๙ 的筆順（thaiData 的 numbers；๑๐ 以上沒有筆順，由單一數字組合）
const DIGIT_STROKES: Record<string, string[]> = Object.fromEntries(
  thaiData
    .filter((t) => t.type === 'numbers' && /^[๐-๙]$/.test(t.char) && t.strokes?.length)
    .map((t) => [t.char, t.strokes!]),
)

/** 數字之間的間距（筆順座標單位，畫布 0～100） */
const DIGIT_GAP = 6

const round = (v: number) => Math.round(v * 10) / 10

/** 路徑整體水平平移：路徑裡的數字兩兩一組為 (x, y)，x 加上 dx */
export const translatePath = (d: string, dx: number): string => {
  let index = 0
  return d.replace(/-?\d+(\.\d+)?/g, (num) => {
    const isX = index++ % 2 === 0
    return isX ? String(round(parseFloat(num) + dx)) : num
  })
}

/**
 * 數字的組合筆順：各位數依序並排（例如 ๒๕ = ๒ ＋ ๕），筆畫順序＝由左到右逐字。
 * 有任何一位沒有筆順時回傳 undefined。
 */
export const composeNumberStrokes = (n: number): string[] | undefined => {
  const result: string[] = []
  let cursor: number | null = null
  for (const char of toThaiDigits(n)) {
    const strokes = DIGIT_STROKES[char]
    const box = strokes && strokesBBox(strokes)
    if (!strokes || !box) return undefined
    // 第一個字不移動；之後每個字的左緣接在前一個字右緣＋間距
    const dx: number = cursor === null ? 0 : cursor - box.minX
    result.push(...(dx === 0 ? strokes : strokes.map((s) => translatePath(s, dx))))
    cursor = box.maxX + dx + DIGIT_GAP
  }
  return result
}
