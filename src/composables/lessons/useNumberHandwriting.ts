import { computed, inject, nextTick, provide, ref, type InjectionKey } from 'vue'
import { storeToRefs } from 'pinia'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { useHandwriting } from '@/composables/useHandwriting'
import { composeNumberStrokes } from '@/utils/digitStrokes'

/**
 * 課程頁的數字手寫彈窗：數字卡片、作業格的 ✍️ 呼叫 open(n)，彈窗由 LessonView 顯示。
 * 底圖與筆順用組合後的數字（例如 ๒๕ = ๒ ＋ ๕）。
 */
const createNumberHandwriting = () => {
  const { isDark } = storeToRefs(useThaiLearnStore())
  const hw = useHandwriting({ isDark })
  const target = ref<number | null>(null)
  const strokes = computed(() => (target.value === null ? undefined : composeNumberStrokes(target.value)))

  const open = (n: number) => {
    target.value = n
    // 同 /thai openHW：彈窗掛上後設定畫布與縮放
    nextTick(() => {
      if (hw.initCanvas()) hw.autoZoomSvg(strokes.value)
    })
  }
  const close = () => {
    target.value = null
  }

  return { hw, isDark, target, strokes, open, close }
}

type NumberHandwriting = ReturnType<typeof createNumberHandwriting>
const KEY: InjectionKey<NumberHandwriting> = Symbol('numberHandwriting')

export const provideNumberHandwriting = (): NumberHandwriting => {
  const ctx = createNumberHandwriting()
  provide(KEY, ctx)
  return ctx
}

export const useNumberHandwritingContext = (): NumberHandwriting => {
  const ctx = inject(KEY)
  if (!ctx) throw new Error('useNumberHandwritingContext() 必須在 provideNumberHandwriting() 之下使用')
  return ctx
}
