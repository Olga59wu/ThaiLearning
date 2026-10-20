import { computed, inject, nextTick, provide, ref, type InjectionKey } from 'vue'
import { storeToRefs } from 'pinia'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { useHandwriting } from '@/composables/useHandwriting'
import { vowelStrokes } from '@/data/lessons/vowels'
import type { LessonVowel } from '@/types/lesson'

/** 母音手寫的底圖：課本練習頁搭配 อ 寫（อะ、อา…），獨立母音寫字本身 */
export const vowelWriteBase = (v: LessonVowel): string => v.writeBase ?? v.withO

/**
 * 課程頁的母音手寫彈窗：母音卡片的 ✍️ 呼叫 open(v)，彈窗由 LessonView 顯示。
 * 筆順共用 thaiData；底圖對齊 /path 的座標，不做 autoZoom。
 */
const createVowelHandwriting = () => {
  const { isDark } = storeToRefs(useThaiLearnStore())
  const hw = useHandwriting({ isDark })
  const target = ref<LessonVowel | null>(null)
  const strokes = computed(() => (target.value ? vowelStrokes(target.value) : undefined))
  const guideText = computed(() => (target.value ? vowelWriteBase(target.value) : undefined))

  const open = (v: LessonVowel) => {
    target.value = v
    nextTick(() => hw.initCanvas())
  }
  const close = () => {
    target.value = null
  }

  return { hw, isDark, target, strokes, guideText, open, close }
}

type VowelHandwriting = ReturnType<typeof createVowelHandwriting>
const KEY: InjectionKey<VowelHandwriting> = Symbol('vowelHandwriting')

export const provideVowelHandwriting = (): VowelHandwriting => {
  const ctx = createVowelHandwriting()
  provide(KEY, ctx)
  return ctx
}

export const useVowelHandwritingContext = (): VowelHandwriting => {
  const ctx = inject(KEY)
  if (!ctx) throw new Error('useVowelHandwritingContext() 必須在 provideVowelHandwriting() 之下使用')
  return ctx
}
