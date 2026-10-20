<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fillVowelText, GUIDE_FONT_FAMILY, VOWEL_TEXT_COLORS } from '@/utils/guideLayout'

/**
 * 母音寫法（全站共用：/thai 元音卡片、測驗、翻牌記憶、課程頁、考試）：อ 淺色、母音同原本文字的顏色（VOWEL_TEXT_COLORS）。
 * 不用課本的「-」表示子音位置（iPhone Safari 會在掛在「-」上的上下母音前面補虛線圈 ◌）。
 * 佔位大小同一般文字（寬＝字寬、高＝行高）；凸出行框的上下母音依實際筆畫範圍多留空間，以負 margin 抵銷（同 HTML 文字的 overflow）。
 */
const props = withDefaults(
  defineProps<{ text: string; isDark: boolean; fontSize: number; bold?: boolean; lineHeight?: number; palette?: typeof VOWEL_TEXT_COLORS }>(),
  { bold: false, lineHeight: 1.2, palette: () => VOWEL_TEXT_COLORS },
)

const canvasEl = ref<HTMLCanvasElement | null>(null)
const box = ref({ width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 })
let drawToken = 0

const draw = async () => {
  const token = ++drawToken
  const fs = props.fontSize
  const font = `${props.bold ? 700 : 400} ${fs}px ${GUIDE_FONT_FAMILY}`
  try {
    await document.fonts.load(font, props.text)
  } catch {
    // 字型載入失敗就用後備字體
  }
  const canvas = canvasEl.value
  if (token !== drawToken || !canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.font = font
  const m = ctx.measureText(props.text)
  const lineH = fs * props.lineHeight
  const width = Math.ceil(m.width)
  // 同 CSS：行框內的基線＝半行距＋ascent
  const lineBaseline = (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent
  // 筆畫超出行框（上下母音）或字寬（凸出 advance）的部分，各多留 2px
  const EXTRA = 2
  const pad = {
    top: Math.ceil(Math.max(0, m.actualBoundingBoxAscent - lineBaseline)) + EXTRA,
    bottom: Math.ceil(Math.max(0, lineBaseline + m.actualBoundingBoxDescent - lineH)) + EXTRA,
    left: Math.ceil(Math.max(0, m.actualBoundingBoxLeft)) + EXTRA,
    right: Math.ceil(Math.max(0, m.actualBoundingBoxRight - width)) + EXTRA,
  }
  box.value = { width, height: lineH, ...pad }

  const dpr = window.devicePixelRatio || 1
  const cssW = width + pad.left + pad.right
  const cssH = lineH + pad.top + pad.bottom
  canvas.width = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.font = font // 改 canvas 尺寸會重設 context 狀態
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const baseline = pad.top + lineBaseline
  fillVowelText(ctx, props.text, pad.left, baseline, props.isDark, props.palette)
}

watch(() => [props.text, props.isDark, props.fontSize, props.bold, props.palette], draw)
onMounted(draw)
onBeforeUnmount(() => {
  drawToken++
})
</script>

<template>
  <span class="inline-block align-top" :style="{ width: `${box.width}px`, height: `${box.height}px` }" role="img" :aria-label="text">
    <canvas ref="canvasEl" class="block pointer-events-none select-none"
      :style="{ width: `${box.width + box.left + box.right}px`, height: `${box.height + box.top + box.bottom}px`, margin: `${-box.top}px ${-box.right}px ${-box.bottom}px ${-box.left}px` }"></canvas>
  </span>
</template>
