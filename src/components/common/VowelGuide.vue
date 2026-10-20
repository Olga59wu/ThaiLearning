<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 母音手寫底圖（例如 อะ）：อ 淺色、母音正常顏色。
 * 版面比照 /path 的底字（500px 框、字 340px＝68%、leading-none 置中），筆順座標 0～100 才能對齊。
 * 泰文的上下母音和 อ 是同一個字形組合，分 span 上色會斷掉，所以用 canvas：
 * 先整串畫正常顏色，再以 source-atop 在第一個 อ（子音位置）上重畫淺色，只改到 อ 的筆畫。
 */
const props = defineProps<{ text: string; isDark: boolean }>()

const FONT_RATIO = 0.68
const COLOR = {
  light: { consonant: '#e5e7eb', vowel: '#6b7280' }, // gray-200／gray-500
  dark: { consonant: '#334155', vowel: '#94a3b8' }, // slate-700／slate-400
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
let drawToken = 0
let observer: ResizeObserver | null = null

const draw = async () => {
  const canvas = canvasEl.value
  if (!canvas) return
  const token = ++drawToken
  const size = canvas.clientWidth
  const fontSize = size * FONT_RATIO
  const font = `${fontSize}px Sarabun, sans-serif`
  // 等 Sarabun 載入，否則會用後備字體量測
  try {
    await document.fonts.load(font, props.text)
  } catch {
    // 字型載入失敗就用後備字體
  }
  if (token !== drawToken || !canvasEl.value) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(size * dpr)
  canvas.height = Math.round(size * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // 同 CSS：行高＝字級（leading-none），行框在容器內置中，基線＝行框頂＋半行距＋ascent
  const m = ctx.measureText(props.text)
  const ascent = m.fontBoundingBoxAscent
  const descent = m.fontBoundingBoxDescent
  const x = (size - m.width) / 2
  const y = (size - fontSize) / 2 + (fontSize - (ascent + descent)) / 2 + ascent
  const colors = props.isDark ? COLOR.dark : COLOR.light

  ctx.fillStyle = colors.vowel
  ctx.fillText(props.text, x, y)

  // 第一個 อ 是子音位置（ออ、เออ 的第二個 อ 是母音的一部分，不改色）
  const index = props.text.indexOf('อ')
  if (index >= 0) {
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = colors.consonant
    ctx.fillText('อ', x + ctx.measureText(props.text.slice(0, index)).width, y)
    ctx.globalCompositeOperation = 'source-over'
  }
}

watch(() => [props.text, props.isDark], draw)

onMounted(() => {
  draw()
  if (canvasEl.value) {
    observer = new ResizeObserver(() => draw())
    observer.observe(canvasEl.value)
  }
})

onBeforeUnmount(() => {
  drawToken++
  observer?.disconnect()
})
</script>

<template>
  <canvas ref="canvasEl" class="w-full h-full pointer-events-none select-none"></canvas>
</template>
