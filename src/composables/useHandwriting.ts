import { ref, type Ref } from 'vue'
import { useTimers } from '@/composables/useTimers'

/**
 * 筆順路徑的外框（含 20% 留白），給 SVG viewBox 用；解析不到座標時回傳 null。
 * （原 /thai autoZoomSvg 的計算）
 */
export const strokesViewBox = (strokes: readonly string[]): string | null => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  strokes.forEach((stroke) => {
    const matches = stroke.match(/-?\d+(\.\d+)?/g)
    if (matches) {
      for (let i = 0; i < matches.length - 1; i += 2) {
        const x = parseFloat(matches[i]!)
        const y = parseFloat(matches[i + 1]!)
        if (!isNaN(x) && !isNaN(y)) {
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }
  })
  if (minX !== Infinity && maxX > minX) {
    const w = maxX - minX
    const h = maxY - minY
    // Provide 20% padding around the bounding box
    const padX = Math.max(w, h) * 0.2
    const padY = Math.max(w, h) * 0.2
    return `${minX - padX} ${minY - padY} ${w + padX * 2} ${h + padY * 2}`
  }
  return null
}

/**
 * 手寫畫布與筆順動畫（從 /thai 的 useThaiPage 抽出，/thai 與課程考試共用）。
 * - containerRef：畫布外框（裡面的 .stroke-anim-path 是筆順動畫路徑）
 * - canvasRef：手寫用的 <canvas>
 * 元素掛上後呼叫 initCanvas()；筆順路徑存在時呼叫 autoZoomSvg()
 */
export const useHandwriting = (options: { isDark: Ref<boolean> }) => {
  const { later } = useTimers()

  const strokeSpeed = ref<number | string>(60)
  const inkColor = ref('#059669')
  const containerRef = ref<HTMLDivElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const svgViewBox = ref('0 0 100 100')

  let hwCanvas: HTMLCanvasElement | null = null
  let hwCtx: CanvasRenderingContext2D | null = null

  /** 依外框大小設定畫布並綁定滑鼠／觸控繪圖；元素或 context 不存在時回傳 false */
  const initCanvas = (): boolean => {
    hwCanvas = canvasRef.value; const container = containerRef.value
    if (!hwCanvas || !container) return false
    const canvas = hwCanvas
    hwCtx = canvas.getContext('2d')
    const ctx = hwCtx
    if (!ctx) return false
    canvas.width = container.offsetWidth; canvas.height = container.offsetHeight
    ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = inkColor.value
    let isDrawing = false
    const getXY = (e: MouseEvent | TouchEvent): [number, number] => {
      const r = canvas.getBoundingClientRect()
      const pt = 'touches' in e ? e.touches[0]! : e
      return [pt.clientX - r.left, pt.clientY - r.top]
    }
    canvas.onmousedown = canvas.ontouchstart = (e: MouseEvent | TouchEvent) => { e.preventDefault(); isDrawing = true; ctx.beginPath(); ctx.moveTo(...getXY(e)) }
    canvas.onmousemove = canvas.ontouchmove = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (isDrawing) { ctx.lineTo(...getXY(e)); ctx.stroke() } }
    canvas.onmouseup = canvas.ontouchend = canvas.onmouseleave = (e?: Event) => { e?.preventDefault(); isDrawing = false }
    return true
  }

  const setInkColor = (c: string) => {
    inkColor.value = c === '#1f2937' && options.isDark.value ? '#f3f4f6' : c
    if (hwCtx) hwCtx.strokeStyle = inkColor.value
  }

  /** 依筆順路徑調整 viewBox；沒有路徑時不變動 */
  const autoZoomSvg = (strokes: readonly string[] | undefined) => {
    if (!strokes) return
    svgViewBox.value = strokesViewBox(strokes) ?? '10 30 80 80' // safe fallback
  }

  const clear = () => {
    if (hwCtx && hwCanvas) hwCtx.clearRect(0, 0, hwCanvas.width, hwCanvas.height)
    containerRef.value?.querySelectorAll('.stroke-anim-path').forEach((p) => p.classList.remove('active'))
  }

  /** 清除後依序播放外框內所有 .stroke-anim-path 的筆順動畫 */
  const playAnim = () => {
    clear()
    later(() => {
      let d = 0; const base = Number(strokeSpeed.value)
      containerRef.value?.querySelectorAll<SVGPathElement>('.stroke-anim-path').forEach((p) => {
        let len = parseFloat(p.style.getPropertyValue('--len')); if (!len) { len = p.getTotalLength(); p.style.setProperty('--len', String(len + 1)) }
        const dur = Math.max(0.15, len / base); p.style.setProperty('--duration', dur + 's'); p.style.setProperty('--delay', d + 's')
        p.classList.add('active'); d += dur
      })
    }, 20)
  }

  return { strokeSpeed, inkColor, containerRef, canvasRef, svgViewBox, initCanvas, setInkColor, autoZoomSvg, clear, playAnim }
}
