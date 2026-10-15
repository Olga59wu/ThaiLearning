import { describe, expect, it } from 'vitest'
import { strokesViewBox } from '@/composables/useHandwriting'

describe('strokesViewBox', () => {
  it('外框加 20% 留白（以長邊計算）', () => {
    // x 10～30（寬 20）、y 20～60（高 40）→ 留白 8
    expect(strokesViewBox(['M 10 20 L 30 60'])).toBe('2 12 36 56')
  })
  it('解析不到座標時回傳 null', () => {
    expect(strokesViewBox([])).toBeNull()
    expect(strokesViewBox(['M 5 5'])).toBeNull()
  })
})
