<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { thaiData } from '@/data/thai'
import type { ThaiItem } from '@/types/thai'
import CharPickerModal from '@/components/path/CharPickerModal.vue'
import { usePageShell } from '@/composables/usePageShell'
import { useTimers } from '@/composables/useTimers'
import { GUIDE_FONT_RATIO, PATH_GUIDE_COLORS, guideTextLayoutFor } from '@/utils/guideLayout'
import { PATH_CANVAS_SIZE, canvasToStroke, strokeToCanvas } from '@/utils/strokeFrame'
import { thaiWriteBaseOfChar } from '@/data/thaiWriteBase'
import VowelGuide from '@/components/common/VowelGuide.vue'

usePageShell({
  htmlClass: 'shell-common shell-path',
  bodyClass: 'bg-gray-100 flex flex-col items-center p-4 h-screen overflow-hidden',
})

const { later, cancel } = useTimers()

interface Point {
  x: number
  y: number
}
type CharObj = Pick<ThaiItem, 'char'> & Partial<ThaiItem>

// 變數與綁定
const canvasEl = ref<HTMLCanvasElement | null>(null)
const inputCharEl = ref<HTMLDivElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const guideChar = ref('')
// 底字字級與位置：與課程母音底圖共用 utils/guideLayout 的規則（框的 68%＝原版 340px；放不下時等比例縮小、超出邊距時平移）
const GUIDE_BOX_SIZE = 500 // 底字框＝畫布 500px（CANVAS_SIZE 宣告在後面，這裡另外寫）
const guideStyle = ref({ fontSize: `${GUIDE_BOX_SIZE * GUIDE_FONT_RATIO}px`, transform: '' })
// 元音的底字：writeBase（อ 表示子音位置，例如 ◌ะ → อะ），用和課程頁、/thai 相同的 VowelGuide 畫（刻意和原版不同，原版底字是 ◌ 寫法）
const vowelGuideText = ref<string | undefined>(undefined)
const previewD = ref('')
const outputValue = ref('')
// 輸出要貼到哪裡：標明取代 thai.ts 的哪一筆（曾把 ฤๅ 的輸出貼到 ฤ 那一筆）
const outputTarget = ref('')
const smoothVal = ref('0.5')
const importText = ref('')
const IMPORT_PLACEHOLDER = '在此貼上完整物件代碼 (包含 char 和 strokes)'
const importPlaceholder = ref(IMPORT_PLACEHOLDER)
let importPlaceholderTimer: ReturnType<typeof setTimeout> | null = null
// 匯入失敗訊息：顯示在匯入框下方並保留貼上的內容；再次匯入或修改內容時清除
const importError = ref('')
const isPickerOpen = ref(false)
const isHoveringPoint = ref(false)
// 原版直接改按鈕 innerHTML 與 classList.replace，這裡改用狀態
const COPY_LABEL = '📋 複製完整物件'
const copyLabel = ref(COPY_LABEL)
const copyBg = ref('bg-emerald-500')
let copyTimer: ReturnType<typeof setTimeout> | null = null

let strokes: Point[][] = [[]]
let tension = 0.5
let currentCharObj: CharObj | null = null

const CANVAS_SIZE = PATH_CANVAS_SIZE
const HIT_RADIUS = 15

let isDragging = false
let dragStrokeIndex = -1
let dragPointIndex = -1
let hoverStrokeIndex = -1
let hoverPointIndex = -1
// 目前這次連續點擊（雙擊的兩下）新增到最後一筆畫的點數，雙擊斷筆時移除
let clickAddedCount = 0

// --- 功能函式 ---

const nextStroke = () => {
  const currentStroke = strokes[strokes.length - 1]!
  if (currentStroke.length > 0) {
    strokes.push([])
    render()
    const canvas = canvasEl.value!
    canvas.style.backgroundColor = '#f0fdf4'
    later(() => (canvas.style.backgroundColor = ''), 150)
  }
}

const openCharPicker = () => {
  isPickerOpen.value = true
}

const closeCharPicker = () => {
  isPickerOpen.value = false
}

const selectChar = (char: string) => {
  inputCharEl.value!.textContent = char // 改用 textContent
  drawGuide()
  isPickerOpen.value = false

  let foundItem = thaiData.find((d) => d.char === char)

  if (!foundItem) {
    foundItem = thaiData.find((d) => d.char.replace(/◌/g, '-') === char)
  }

  currentCharObj = foundItem ?? null

  if (foundItem && foundItem.strokes && foundItem.strokes.length > 0) {
    strokes = []
    foundItem.strokes.forEach((pathString) => {
      const points = parseSVGPath(pathString)
      if (points.length > 0) {
        strokes.push(points)
      }
    })
    if (strokes.length === 0) strokes.push([])
    render()
  } else {
    clearPath()
  }
}

const drawGuide = () => {
  // 1. 改用 textContent 取得 div 內的文字 (針對 contenteditable)
  const char = inputCharEl.value!.textContent ?? ''
  guideChar.value = char
  vowelGuideText.value = thaiWriteBaseOfChar(char)
  guideTextLayoutFor(char, GUIDE_BOX_SIZE).then(({ fontSize, shiftX, shiftY }) => {
    if (guideChar.value !== char) return
    guideStyle.value = { fontSize: `${fontSize}px`, transform: shiftX || shiftY ? `translate(${shiftX}px, ${shiftY}px)` : '' }
  })

  // 2. 強制置中樣式寫在 template 的 style（原版每次 drawGuide 設定，初始化時就會設定）

  // 3. 判斷字元是否變更，若變更則斷開與舊物件的連結
  if (currentCharObj && currentCharObj.char !== char) {
    currentCharObj = null
  }

  render()
}

const updateSmoothness = (val: string) => {
  tension = parseFloat(val)
  smoothVal.value = String(tension)
  render()
}

const undo = () => {
  const currentStroke = strokes[strokes.length - 1]!
  if (currentStroke.length > 0) {
    currentStroke.pop()
  } else if (strokes.length > 1) {
    strokes.pop()
    strokes[strokes.length - 1]!.pop()
  }
  render()
}

const clearPath = () => {
  strokes = [[]]
  render()
}

// 匯入成功訊息：顯示在 placeholder，3 秒後恢復（連續匯入時重新計時）
const showImportMessage = (message: string) => {
  importPlaceholder.value = message
  cancel(importPlaceholderTimer)
  importPlaceholderTimer = later(() => {
    importPlaceholder.value = IMPORT_PLACEHOLDER
  }, 3000)
}

const copyCode = async () => {
  if (!outputValue.value) return
  try {
    await navigator.clipboard.writeText(outputValue.value)
  } catch (error) {
    console.error('複製失敗:', error)
    return
  }
  copyLabel.value = '✅ 已複製'
  copyBg.value = 'bg-slate-700'
  // 連按時重新計時，固定恢復成原本的文字與底色
  cancel(copyTimer)
  copyTimer = later(() => {
    copyLabel.value = COPY_LABEL
    copyBg.value = 'bg-emerald-500'
  }, 1000)
}

// ✨✨ 核心修改：強化匯入功能 (修復字底圖 & 完整物件解析) ✨✨
const importPath = () => {
  const rawInput = importText.value
  if (!rawInput) return
  importError.value = ''

  // 1. 先解析 strokes；解析不到任何路徑就顯示失敗，不改動字底圖與畫布
  const parsedStrokes: Point[][] = []
  const matches = rawInput.match(/['"](M[^'"]+)['"]/g)

  if (matches && matches.length > 0) {
    matches.forEach((pathStr) => {
      const cleanPath = pathStr.replace(/['"]/g, '')
      const points = parseSVGPath(cleanPath)
      if (points.length > 0) parsedStrokes.push(points)
    })
  } else {
    // 相容舊模式 (只貼上單一路徑)
    let pathData = rawInput
    if (rawInput.includes('M')) {
      const start = rawInput.indexOf('M')
      let end = rawInput.lastIndexOf("'")
      if (end === -1) end = rawInput.lastIndexOf('"')
      if (end < start) end = rawInput.length
      pathData = rawInput.substring(start).replace(/['"],?$/, '').trim()
    }
    const points = parseSVGPath(pathData)
    if (points.length > 0) parsedStrokes.push(points)
  }

  if (parsedStrokes.length === 0) {
    importError.value = '❌ 匯入失敗：找不到筆順路徑（M 開頭），畫布未變更'
    return
  }

  // 2. 嘗試解析 "char" 屬性來顯示字底圖
  // 尋找 char: 'X' 或 char: "X"（支援輸出時跳脫的 \' \\）
  const charMatch = rawInput.match(/char:\s*(['"])((?:\\.|(?!\1)[^\\])+)\1/)
  if (charMatch && charMatch[2]) {
    const importedChar = charMatch[2].replace(/\\(.)/g, '$1')
    inputCharEl.value!.textContent = importedChar
    drawGuide() // 這一行會更新畫布背景的字底圖

    // 嘗試與資料庫連結 (為了保留其他屬性如 img, reading...)
    const foundItem = thaiData.find((d) => d.char === importedChar)

    if (foundItem) {
      currentCharObj = foundItem
    } else {
      // 如果是新字 (資料庫沒有)，我們至少記住這個 char，以便輸出時能生成基本結構
      currentCharObj = { char: importedChar }
    }
  }

  // 3. 套用解析到的 strokes
  strokes = parsedStrokes

  render()
  importText.value = ''
  showImportMessage('✅ 匯入成功！字底圖與筆順已更新')
}

const parseSVGPath = (pathData: string): Point[] => {
  if (!pathData.startsWith('M')) return []
  const commandPattern = /([MLQ])\s*([^MLQ]*)/g
  const commands: { type: string; args: number[] }[] = []
  let m: RegExpExecArray | null
  while ((m = commandPattern.exec(pathData)) !== null) {
    const args = m[2]!.trim().split(/[\s,]+/).map(Number)
    commands.push({ type: m[1]!, args: args })
  }
  const newPoints: Point[] = []
  const hasCurves = pathData.includes('Q')
  if (commands.length > 0 && commands[0]!.type === 'M') {
    newPoints.push({ x: commands[0]!.args[0]!, y: commands[0]!.args[1]! })
  }
  for (let i = 1; i < commands.length; i++) {
    const cmd = commands[i]!
    if (cmd.type === 'Q') {
      newPoints.push({ x: cmd.args[0]!, y: cmd.args[1]! })
    } else if (cmd.type === 'L') {
      if (!hasCurves || i === commands.length - 1) {
        newPoints.push({ x: cmd.args[0]!, y: cmd.args[1]! })
      }
    }
  }

  // 筆順座標 → 畫布 px（位移與換算規則在 utils/strokeFrame，母音底圖的筆順也用同一個框）
  return newPoints.map(strokeToCanvas)
}

// --- 演算法 ---
const getSmoothedPathString = (pts: Point[], smoothFactor: number) => {
  if (pts.length < 2) return ''
  // 修改這裡：傳入 true 代表處理 X 座標
  let d = `M ${round(pts[0]!.x, true)} ${round(pts[0]!.y, false)}`

  if (pts.length === 2) {
    d += ` L ${round(pts[1]!.x, true)} ${round(pts[1]!.y, false)}`
    return d
  }

  if (smoothFactor === 0) {
    for (let i = 1; i < pts.length; i++) d += ` L ${round(pts[i]!.x, true)} ${round(pts[i]!.y, false)}`
    return d
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]!
    const curr = pts[i]!
    const next = pts[i + 1]!
    const f = Math.min(smoothFactor, 0.5)
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
    const v2 = { x: next.x - curr.x, y: next.y - curr.y }
    const startQ = { x: curr.x - v1.x * f, y: curr.y - v1.y * f }
    const endQ = { x: curr.x + v2.x * f, y: curr.y + v2.y * f }

    d += ` L ${round(startQ.x, true)} ${round(startQ.y, false)}`
    d += ` Q ${round(curr.x, true)} ${round(curr.y, false)} ${round(endQ.x, true)} ${round(endQ.y, false)}`
  }
  d += ` L ${round(pts[pts.length - 1]!.x, true)} ${round(pts[pts.length - 1]!.y, false)}`
  return d
}

// 畫布 px → 筆順座標（與 parseSVGPath 的換算互為反向，見 utils/strokeFrame）
const round = (val: number, isX = false) => canvasToStroke(val, isX)

const getSmoothedPathStringPreview = (pts: Point[], smoothFactor: number) => {
  if (pts.length < 2) return ''
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  if (pts.length === 2) {
    d += ` L ${pts[1]!.x} ${pts[1]!.y}`
    return d
  }
  if (smoothFactor === 0) {
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i]!.x} ${pts[i]!.y}`
    return d
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]!
    const curr = pts[i]!
    const next = pts[i + 1]!
    const f = Math.min(smoothFactor, 0.5)
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
    const v2 = { x: next.x - curr.x, y: next.y - curr.y }
    const startQ = { x: curr.x - v1.x * f, y: curr.y - v1.y * f }
    const endQ = { x: curr.x + v2.x * f, y: curr.y + v2.y * f }
    d += ` L ${startQ.x} ${startQ.y}`
    d += ` Q ${curr.x} ${curr.y} ${endQ.x} ${endQ.y}`
  }
  d += ` L ${pts[pts.length - 1]!.x} ${pts[pts.length - 1]!.y}`
  return d
}

const render = () => {
  const canvas = canvasEl.value
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  let svgPreviewString = ''
  const resultStrings: string[] = []

  strokes.forEach((points, sIdx) => {
    if (points.length === 0) return

    // 骨架
    ctx!.beginPath()
    ctx!.lineWidth = 1
    ctx!.setLineDash([5, 5])
    ctx!.strokeStyle = '#94a3b8'
    ctx!.moveTo(points[0]!.x, points[0]!.y)
    for (let i = 1; i < points.length; i++) {
      ctx!.lineTo(points[i]!.x, points[i]!.y)
    }
    ctx!.stroke()
    ctx!.setLineDash([])

    // 控制點
    points.forEach((p, pIdx) => {
      ctx!.beginPath()
      if ((sIdx === dragStrokeIndex && pIdx === dragPointIndex) || (sIdx === hoverStrokeIndex && pIdx === hoverPointIndex)) {
        ctx!.fillStyle = '#f97316'
        ctx!.arc(p.x, p.y, 6, 0, Math.PI * 2)
      } else if (pIdx === 0) {
        ctx!.fillStyle = '#10b981'
        ctx!.arc(p.x, p.y, 5, 0, Math.PI * 2)
      } else {
        ctx!.fillStyle = '#3b82f6'
        ctx!.arc(p.x, p.y, 4, 0, Math.PI * 2)
      }
      ctx!.fill()
    })

    // Path
    const pathStr = getSmoothedPathString(points, tension)
    const prevStr = getSmoothedPathStringPreview(points, tension)

    svgPreviewString += prevStr + ' '
    resultStrings.push(pathStr)
  })

  previewD.value = svgPreviewString

  if (resultStrings.length > 0) {
    if (currentCharObj) {
      // 有物件時：複製物件並替換 strokes，輸出完整結構
      const newObj: Record<string, unknown> = { ...currentCharObj }
      newObj.strokes = resultStrings
      outputValue.value = objectToString(newObj) + ','
      outputTarget.value = `貼到 thai.ts：取代 char: '${currentCharObj.char}'${currentCharObj.thaiLabel ? `（${currentCharObj.thaiLabel}）` : ''} 那一筆`
    } else {
      // 無物件時 (自創字)：只輸出 strokes 陣列
      outputTarget.value = ''
      outputValue.value = `strokes: [\n${resultStrings.map((s) => `      ${quote(s)},`).join('\n')}\n    ],`
    }
  } else {
    outputValue.value = ''
    outputTarget.value = ''
  }
}

// 輸出成單引號字串，跳脫反斜線與單引號
const quote = (value: unknown) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const objectToString = (obj: Record<string, unknown>, indentLevel = 1): string => {
  const indent = '  '.repeat(indentLevel)
  const prevIndent = '  '.repeat(indentLevel - 1)
  let str = '{\n'

  for (const key in obj) {
    const value = obj[key]
    str += `${indent}${key}: `

    if (key === 'strokes' && Array.isArray(value)) {
      str += '[\n'
      value.forEach((v) => {
        str += `${indent}  ${quote(v)},\n`
      })
      str += `${indent}],\n`
    } else if (Array.isArray(value)) {
      str += `[${value.map((v) => quote(v)).join(', ')}],\n`
    } else if (typeof value === 'string') {
      str += `${quote(value)},\n`
    } else if (typeof value === 'object' && value !== null) {
      str += objectToString(value as Record<string, unknown>, indentLevel + 1) + ',\n'
    } else {
      str += `${value},\n`
    }
  }
  str += `${prevIndent}}`
  return str
}

// --- 滑鼠事件 ---
const getMousePos = (e: MouseEvent): Point => {
  const rect = canvasEl.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const findPointInfo = (pos: Point) => {
  for (let s = strokes.length - 1; s >= 0; s--) {
    const points = strokes[s]!
    for (let p = points.length - 1; p >= 0; p--) {
      const pt = points[p]!
      const dist = Math.sqrt((pt.x - pos.x) ** 2 + (pt.y - pos.y) ** 2)
      if (dist <= HIT_RADIUS) {
        return { sIdx: s, pIdx: p }
      }
    }
  }
  return null
}

const onMouseDown = (e: MouseEvent) => {
  const pos = getMousePos(e)
  const hit = findPointInfo(pos)

  if (e.button === 0) {
    // 每次新的點擊序列（不是雙擊的第二下）重新計算新增的點數
    if (e.detail <= 1) clickAddedCount = 0
    if (hit) {
      isDragging = true
      dragStrokeIndex = hit.sIdx
      dragPointIndex = hit.pIdx
    } else {
      if (strokes.length === 0) strokes.push([])
      const currentStroke = strokes[strokes.length - 1]!
      currentStroke.push(pos)
      clickAddedCount++
      isDragging = true
      dragStrokeIndex = strokes.length - 1
      dragPointIndex = currentStroke.length - 1
      render()
    }
  }
}

const onMouseMove = (e: MouseEvent) => {
  const pos = getMousePos(e)
  if (isDragging && dragStrokeIndex !== -1 && dragPointIndex !== -1) {
    strokes[dragStrokeIndex]![dragPointIndex] = pos
    render()
  } else {
    const hit = findPointInfo(pos)
    if (hit) {
      hoverStrokeIndex = hit.sIdx
      hoverPointIndex = hit.pIdx
      isHoveringPoint.value = true
    } else {
      hoverStrokeIndex = -1
      hoverPointIndex = -1
      isHoveringPoint.value = false
    }
    render()
  }
}

const endDrag = () => {
  isDragging = false
  dragStrokeIndex = -1
  dragPointIndex = -1
}

const onMouseUp = () => {
  endDrag()
  render()
}

// 移出畫布即結束拖曳並清除 hover 標示（之後在畫布外放開也不會殘留橘色點）
const onMouseLeave = () => {
  endDrag()
  hoverStrokeIndex = -1
  hoverPointIndex = -1
  isHoveringPoint.value = false
  render()
}

const onContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  const pos = getMousePos(e)
  const hit = findPointInfo(pos)
  if (hit) {
    strokes[hit.sIdx]!.splice(hit.pIdx, 1)
    if (strokes[hit.sIdx]!.length === 0 && strokes.length > 1) {
      strokes.splice(hit.sIdx, 1)
    }
    render()
  }
}

const onDblClick = (e: MouseEvent) => {
  e.preventDefault()
  // 雙擊的兩下 mousedown 若在空白處新增了點，斷筆前先移除（都在最後一筆畫的尾端）
  const currentStroke = strokes[strokes.length - 1]!
  const removeCount = Math.min(clickAddedCount, currentStroke.length)
  currentStroke.splice(currentStroke.length - removeCount, removeCount)
  clickAddedCount = 0
  nextStroke()
  render()
}

// 初始化
onMounted(() => {
  ctx = canvasEl.value!.getContext('2d')
  drawGuide()
})
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-lg flex gap-6 max-h-full max-w-6xl w-full h-full">
    <div class="flex flex-col gap-2 w-72 h-full">
      <RouterLink to="/" class="flex items-center gap-1.5 px-3 py-2 -ml-1 text-xs font-bold text-gray-500 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-all w-fit mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        回大廳
      </RouterLink>
      <div class="space-y-1">
        <h1 class="text-sm font-bold text-gray-700 uppercase tracking-wide">1. 字母設定</h1>
        <div class="flex gap-2">
          <div id="input-char" ref="inputCharEl" contenteditable="true"
            class="text-5xl border-2 border-emerald-100 focus:border-emerald-500 outline-hidden rounded-xl w-full text-center thai-font h-24 flex items-center justify-center bg-white transition-all overflow-visible pt-2"
            @input="drawGuide"></div>

          <button class="w-20 h-24 shrink-0 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors flex items-center justify-center shadow-xs border border-emerald-200" title="開啟選字表" @click="openCharPicker">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
        </div>
      </div>

      <div class="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <div class="flex justify-between items-center">
          <h1 class="text-xs font-bold text-gray-700">2. 圓潤度 (Smoothness)</h1>
          <span id="smooth-val" class="text-[10px] font-mono bg-slate-200 px-1.5 rounded text-slate-600">{{ smoothVal }}</span>
        </div>
        <input type="range" id="tension-slider" min="0" max="1" step="0.05" value="0.5" class="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" @input="updateSmoothness(($event.target as HTMLInputElement).value)">
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button class="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors border border-gray-200" @click="undo">
          ↩️ 復原
        </button>
        <button class="px-3 py-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-100" @click="clearPath">
          🗑️ 清空
        </button>
      </div>

      <div class="space-y-1 pt-1 border-t border-dashed border-gray-200">
        <h1 class="text-xs font-bold text-gray-700 uppercase tracking-wide">3. 匯入編輯 </h1>
        <textarea id="import-input" v-model="importText" class="w-full h-16 p-2 text-[9px] font-mono border rounded-lg bg-blue-50 text-slate-700 resize-none focus:outline-hidden focus:border-blue-400 placeholder-gray-400 leading-tight" :placeholder="importPlaceholder" @input="importError = ''"></textarea>
        <p v-if="importError" class="text-[10px] font-bold text-red-500 leading-tight">{{ importError }}</p>
        <button class="w-full px-2 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-xs" @click="importPath">
          📥 解析並載入
        </button>
      </div>

      <div class="flex flex-col gap-1 pt-1 border-t border-gray-200 flex-1 min-h-0">
        <h1 class="text-xs font-bold text-gray-700 uppercase tracking-wide">4. 輸出結果 (完整物件)</h1>
        <p v-if="outputTarget" id="output-target" class="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 thai-font">{{ outputTarget }}</p>
        <textarea id="output-path" :value="outputValue" class="w-full flex-1 p-2 text-[9px] font-mono border rounded-lg bg-slate-800 text-emerald-400 resize-none focus:outline-hidden leading-tight" readonly></textarea>
        <button id="btn-copy" :class="copyBg" class="w-full px-4 py-2 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm" @click="copyCode">
          <span>{{ copyLabel }}</span>
        </button>
      </div>
    </div>

    <div class="flex-1 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden select-none h-full">

      <div class="relative w-[500px] h-[500px] bg-white shadow-xs rounded-lg overflow-hidden border border-slate-200">
        <!-- 原版 drawGuide() 每次以 inline style 設定置中（初始化時就會執行） -->
        <!-- 母音底圖固定 500px（同畫布座標；外框 1px 邊線會讓 inset-0 只有 498px），顏色比彈窗淡，筆畫和控制點才看得清楚 -->
        <VowelGuide v-if="vowelGuideText" :text="vowelGuideText" :is-dark="false" :palette="PATH_GUIDE_COLORS" class="absolute top-0 left-0 z-0" :style="{ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }" />
        <div id="guide-text" v-else class="absolute inset-0 flex items-center justify-center text-[340px] leading-none text-gray-100 thai-font pointer-events-none z-0" style="display: flex; align-items: center; justify-content: center;" :style="guideStyle">{{ guideChar }}</div>

        <svg id="preview-svg" class="absolute inset-0 w-full h-full z-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <path id="preview-path" fill="none" stroke="#059669" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" :d="previewD" />
        </svg>

        <canvas id="canvas" ref="canvasEl" :width="CANVAS_SIZE" :height="CANVAS_SIZE" class="absolute inset-0 z-20" :class="{ 'hovering-point': isHoveringPoint }"
          @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseLeave" @contextmenu="onContextMenu" @dblclick="onDblClick"></canvas>
      </div>

      <div class="absolute bottom-4 right-6 text-xs text-slate-400">
        左鍵: 新增/拖曳 • 右鍵: 刪除點 • 雙點擊: 斷開筆畫
      </div>
    </div>
  </div>

  <CharPickerModal v-if="isPickerOpen" @select="selectChar" @close="closeCharPicker" />
</template>
