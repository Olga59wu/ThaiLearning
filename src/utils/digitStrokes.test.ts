import { describe, expect, it } from 'vitest'
import { thaiData } from '@/data/thai'
import { strokesBBox } from '@/composables/useHandwriting'
import { composeNumberStrokes, translatePath } from '@/utils/digitStrokes'

const strokesOf = (char: string) => thaiData.find((t) => t.char === char)!.strokes!

describe('translatePath', () => {
  it('只移動 x 座標', () => {
    expect(translatePath('M 10 20 L 30.5 40 Q 1 2 3 4', 5)).toBe('M 15 20 L 35.5 40 Q 6 2 8 4')
  })
})

describe('composeNumberStrokes', () => {
  it('單一數字＝原本的筆順', () => {
    expect(composeNumberStrokes(2)).toEqual(strokesOf('๒'))
  })
  it('๐～๙ 都有筆順', () => {
    for (let n = 0; n <= 9; n++) expect(composeNumberStrokes(n), String(n)).toBeDefined()
  })
  it('多位數依序並排，不重疊', () => {
    const two = strokesOf('๒')
    const five = strokesOf('๕')
    const composed = composeNumberStrokes(25)!
    expect(composed).toHaveLength(two.length + five.length)
    expect(composed.slice(0, two.length)).toEqual(two)
    const first = strokesBBox(two)!
    const second = strokesBBox(composed.slice(two.length))!
    expect(second.minX).toBeCloseTo(first.maxX + 6, 0)
    // 高度不變
    expect(second.minY).toBeCloseTo(strokesBBox(five)!.minY, 5)
  })
  it('課本範圍內的數字都組得出來', () => {
    ;[10, 11, 20, 25, 35, 100, 101, 111, 121, 500, 1000].forEach((n) => expect(composeNumberStrokes(n), String(n)).toBeDefined())
  })
})
