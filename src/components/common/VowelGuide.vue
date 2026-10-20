<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fillVowelText, layoutGuideText, loadGuideFont, type GuideLayout } from '@/utils/guideLayout'

/**
 * 母音手寫底圖（例如 อะ）：อ 淺色、母音正常顏色。
 * 字級與位置用 utils/guideLayout（與 /path 底字同一套規則：68%，放不下就等比例縮小），筆順座標 0～100 才能對齊。
 * 上色用 fillVowelText（與 /thai 元音卡片相同配色）。
 */
const props = defineProps<{ text: string; isDark: boolean }>()
const emit = defineEmits<{ layout: [layout: GuideLayout, boxSize: number] }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let drawToken = 0
let observer: ResizeObserver | null = null

const draw = async () => {
  const canvas = canvasEl.value
  if (!canvas) return
  const token = ++drawToken
  const size = canvas.clientWidth
  if (size === 0) return
  await loadGuideFont(props.text, size)
  if (token !== drawToken || !canvasEl.value) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(size * dpr)
  canvas.height = Math.round(size * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const layout = layoutGuideText(ctx, props.text, size)
  fillVowelText(ctx, props.text, layout.x, layout.baseline, props.isDark)
  emit('layout', layout, size)
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
