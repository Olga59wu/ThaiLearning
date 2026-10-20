<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fillVowelText, GUIDE_FONT_FAMILY } from '@/utils/guideLayout'

/**
 * 行內的母音寫法（例如 /thai 元音卡片的 อะ）：อ 淺色、母音正常顏色，配色同手寫底圖（fillVowelText）。
 * 佔位大小同一般文字（寬＝字寬、高＝行高）；canvas 上下左右多留空間畫凸出行框的上下母音，以負 margin 抵銷。
 */
const props = withDefaults(defineProps<{ text: string; isDark: boolean; fontSize: number; bold?: boolean; lineHeight?: number }>(), {
  bold: false,
  lineHeight: 1.2,
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const box = ref({ width: 0, height: 0, padX: 0, padY: 0 })
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
  const padX = fs * 0.3
  const padY = fs * 0.6
  const width = Math.ceil(m.width)
  box.value = { width, height: lineH, padX, padY }

  const dpr = window.devicePixelRatio || 1
  const cssW = width + padX * 2
  const cssH = lineH + padY * 2
  canvas.width = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.font = font // 改 canvas 尺寸會重設 context 狀態
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  // 同 CSS：行框頂＋半行距＋ascent
  const baseline = padY + (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent
  fillVowelText(ctx, props.text, padX, baseline, props.isDark)
}

watch(() => [props.text, props.isDark, props.fontSize, props.bold], draw)
onMounted(draw)
onBeforeUnmount(() => {
  drawToken++
})
</script>

<template>
  <span class="inline-block align-top" :style="{ width: `${box.width}px`, height: `${box.height}px` }" role="img" :aria-label="text">
    <canvas ref="canvasEl" class="block pointer-events-none select-none"
      :style="{ width: `${box.width + box.padX * 2}px`, height: `${box.height + box.padY * 2}px`, margin: `${-box.padY}px ${-box.padX}px` }"></canvas>
  </span>
</template>
