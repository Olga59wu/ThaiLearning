import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { thaiData } from '@/data/thai'
import { strokesBBox } from '@/composables/useHandwriting'
import { canvasToStroke, GUIDE_STROKES_VIEWBOX, PATH_CANVAS_SIZE, strokeToCanvas, viewBoxToRatio } from '@/utils/strokeFrame'

describe('筆順參考框（/path 與母音手寫底圖一致）', () => {
  const sara = thaiData.find((t) => t.char === '◌ะ')
  const strokes = sara?.strokes ?? []

  it('สระอะ 有筆順', () => {
    expect(strokes.length).toBeGreaterThan(0)
  })

  it('/path 的換算與彈窗 viewBox 的換算，算出的外框（底字框內比例）一致', () => {
    const box = strokesBBox(strokes)!
    const corners = [{ x: box.minX, y: box.minY }, { x: box.maxX, y: box.maxY }]
    // /path：筆順座標 → 畫布 px → 除以畫布邊長
    const viaPath = corners.map((p) => {
      const c = strokeToCanvas(p)
      return { x: c.x / PATH_CANVAS_SIZE, y: c.y / PATH_CANVAS_SIZE }
    })
    // 彈窗、VowelGuide、/dev/vowel-guides：SVG viewBox
    const viaModal = corners.map((p) => viewBoxToRatio(GUIDE_STROKES_VIEWBOX, p))
    viaPath.forEach((p, i) => {
      expect(viaModal[i]!.x).toBeCloseTo(p.x, 6)
      expect(viaModal[i]!.y).toBeCloseTo(p.y, 6)
    })
    // สระอะ 的 ะ 在底字框右半、垂直中段（原本的錯誤會往下偏 18%）
    expect(viaModal[0]!.y).toBeGreaterThan(0.3)
    expect(viaModal[1]!.y).toBeLessThan(0.8)
  })

  it('/path 存檔與載入互為反向（已畫的筆順重新載入位置不變）', () => {
    for (const p of [{ x: 0, y: 0 }, { x: 250, y: 250 }, { x: 500, y: 500 }, { x: 123, y: 456 }]) {
      const s = { x: canvasToStroke(p.x, true), y: canvasToStroke(p.y, false) }
      const back = strokeToCanvas(s)
      expect(back.x).toBeCloseTo(p.x, 0)
      expect(back.y).toBeCloseTo(p.y, 0)
    }
  })

  it('母音底圖上的筆順 SVG 都使用共用的 viewBox', () => {
    for (const file of ['src/components/common/HandwritingPad.vue', 'src/views/DevVowelGuidesView.vue']) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).toContain(':viewBox="GUIDE_STROKES_VIEWBOX"')
      expect(src, file).not.toContain('viewBox="0 0 100 100"')
    }
  })
})
