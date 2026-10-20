import { describe, expect, it } from 'vitest'
import { fitGuideFontSize, GUIDE_FONT_RATIO, shiftInto } from '@/utils/guideLayout'

describe('手寫底圖版面', () => {
  const BOX = 500
  const base = BOX * GUIDE_FONT_RATIO // 340
  const max = BOX * 0.84 // 左右各留 8%

  it('放得下時維持框的 68%（/path 原版 340px）', () => {
    expect(fitGuideFontSize(BOX, { width: 300, height: 300 })).toBe(base)
    expect(fitGuideFontSize(BOX, { width: max, height: max })).toBe(base)
  })
  it('太寬或太高時等比例縮小到剛好放進邊距內', () => {
    expect(fitGuideFontSize(BOX, { width: max * 2, height: 200 })).toBeCloseTo(base / 2)
    expect(fitGuideFontSize(BOX, { width: 200, height: max * 1.25 })).toBeCloseTo(base / 1.25)
    // 寬高都超過時取縮比較多的那個
    expect(fitGuideFontSize(BOX, { width: max * 2, height: max * 4 })).toBeCloseTo(base / 4)
  })
  it('量不到大小（空字串）時不縮放', () => {
    expect(fitGuideFontSize(BOX, { width: 0, height: 0 })).toBe(base)
  })
  it('超出邊距時平移推回，已在範圍內不動', () => {
    expect(shiftInto(50, 400, 40, 460)).toBe(0)
    expect(shiftInto(20, 300, 40, 460)).toBe(20)
    expect(shiftInto(200, 505, 40, 460)).toBe(-45)
  })
})
