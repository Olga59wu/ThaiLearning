// 手寫底圖的版面規則：/path 底字、課程母音底圖（VowelGuide）共用。
// 筆順座標 0～100 對應底圖框，各處必須用同一套規則，筆順才會和底圖對齊。
//
// 規則：
// 1. 字級預設為框的 68%（原版 /path：500px 框、340px 字）；
//    量出來的字寬或字高超過框扣掉上下左右各 8% 邊距時，等比例縮小字級，讓整個字放得下。
// 2. 位置同 CSS 的 leading-none 置中：行高＝字級，行框垂直置中；字寬（advance）水平置中。
// 3. 置中後實際筆畫還是超出邊距時（例如 อุ 的 ุ 在下方、โ 的筆畫凸出 advance），平移推回邊距內。
// （2026-10-20 用 /dev/vowel-guides 檢查：thaiData 已有筆順的字（輔音、數字等 54 個）都在邊距內，不會被縮小或平移，已畫好的筆順不受影響）

export const GUIDE_FONT_RATIO = 0.68
export const GUIDE_MARGIN_RATIO = 0.08
export const GUIDE_FONT_FAMILY = 'Sarabun, sans-serif'

/** 字級為框 68% 時量到的大小 */
export interface GuideTextSize {
  width: number
  height: number
}

/** 純計算：框邊長與「字級 68% 時的字寬、字高」→ 實際字級 */
export const fitGuideFontSize = (boxSize: number, sizeAtBase: GuideTextSize): number => {
  const base = boxSize * GUIDE_FONT_RATIO
  const max = boxSize * (1 - 2 * GUIDE_MARGIN_RATIO)
  const scale = Math.min(1, sizeAtBase.width > 0 ? max / sizeAtBase.width : 1, sizeAtBase.height > 0 ? max / sizeAtBase.height : 1)
  return base * scale
}

/** 純計算：範圍 [start, end] 推進 [min, max] 需要的平移量（已在範圍內為 0） */
export const shiftInto = (start: number, end: number, min: number, max: number): number => {
  if (start < min) return min - start
  if (end > max) return max - end
  return 0
}

export const guideFont = (fontSize: number): string => `${fontSize}px ${GUIDE_FONT_FAMILY}`

export interface GuideLayout {
  fontSize: number
  /** 字級相對預設 68% 的比例（1 表示沒有縮小） */
  scale: number
  /** 文字起點 x（框座標，左上角為 0；已含平移） */
  x: number
  /** 基線 y（已含平移） */
  baseline: number
  /** 推回邊距內的平移量（/path 的 HTML 底字用 transform 套用） */
  shiftX: number
  shiftY: number
  /** 實際筆畫範圍（框座標，已含平移），用來檢查有沒有超出框 */
  ink: { left: number; right: number; top: number; bottom: number }
}

/** 字寬取 advance 與實際筆畫範圍的較大者（有的字筆畫會超出 advance） */
const measureSize = (ctx: CanvasRenderingContext2D, text: string): GuideTextSize => {
  const m = ctx.measureText(text)
  return {
    width: Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight),
    height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
  }
}

/** 用 canvas 量字，算出字級與位置；會改動 ctx.font（結束時設為實際字級） */
export const layoutGuideText = (ctx: CanvasRenderingContext2D, text: string, boxSize: number): GuideLayout => {
  const base = boxSize * GUIDE_FONT_RATIO
  ctx.font = guideFont(base)
  const fontSize = fitGuideFontSize(boxSize, measureSize(ctx, text))
  ctx.font = guideFont(fontSize)
  const m = ctx.measureText(text)
  const ascent = m.fontBoundingBoxAscent
  const descent = m.fontBoundingBoxDescent
  const centerX = (boxSize - m.width) / 2
  // 同 CSS：行框頂＋半行距（可能為負）＋ascent
  const centerBaseline = (boxSize - fontSize) / 2 + (fontSize - (ascent + descent)) / 2 + ascent
  const margin = boxSize * GUIDE_MARGIN_RATIO
  const shiftX = shiftInto(centerX - m.actualBoundingBoxLeft, centerX + m.actualBoundingBoxRight, margin, boxSize - margin)
  const shiftY = shiftInto(centerBaseline - m.actualBoundingBoxAscent, centerBaseline + m.actualBoundingBoxDescent, margin, boxSize - margin)
  const x = centerX + shiftX
  const baseline = centerBaseline + shiftY
  return {
    fontSize,
    scale: fontSize / base,
    x,
    baseline,
    shiftX,
    shiftY,
    ink: {
      left: x - m.actualBoundingBoxLeft,
      right: x + m.actualBoundingBoxRight,
      top: baseline - m.actualBoundingBoxAscent,
      bottom: baseline + m.actualBoundingBoxDescent,
    },
  }
}

/** 等 Sarabun 載入（否則會用後備字體量測）；失敗就用後備字體 */
export const loadGuideFont = async (text: string, boxSize: number): Promise<void> => {
  try {
    await document.fonts.load(guideFont(boxSize * GUIDE_FONT_RATIO), text)
  } catch {
    // 字型載入失敗就用後備字體
  }
}

let measureCtx: CanvasRenderingContext2D | null = null

/** 不畫圖時（例如 /path 的 HTML 底字）：用共用的離屏 canvas 量，回傳字級與平移量 */
export const guideTextLayoutFor = async (
  text: string,
  boxSize: number,
): Promise<{ fontSize: number; shiftX: number; shiftY: number }> => {
  await loadGuideFont(text, boxSize)
  measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!measureCtx || !text) return { fontSize: boxSize * GUIDE_FONT_RATIO, shiftX: 0, shiftY: 0 }
  const { fontSize, shiftX, shiftY } = layoutGuideText(measureCtx, text, boxSize)
  return { fontSize, shiftX, shiftY }
}

// ---- 母音寫法的配色：อ（子音位置）淺色、母音正常顏色 ----
// 全站共用：/thai 元音卡片、課程頁、考試、手寫底圖（課程頁、/thai）、/path 底字
// 手寫底圖（VowelGuide）：母音 gray-500，描寫時不搶筆跡
export const VOWEL_COLORS = {
  light: { consonant: '#e5e7eb', vowel: '#6b7280' }, // gray-200／gray-500
  dark: { consonant: '#334155', vowel: '#94a3b8' }, // slate-700／slate-400
}

// /path 底字（只有 /path）：母音 gray-300、อ 更淡，綠色筆畫和控制點疊在上面才看得清楚
export const PATH_GUIDE_COLORS: typeof VOWEL_COLORS = {
  light: { consonant: '#f3f4f6', vowel: '#d1d5db' }, // gray-100／gray-300
  dark: { consonant: '#1e293b', vowel: '#475569' }, // slate-800／slate-600
}

// 行內文字（VowelText：/thai 卡片、測驗、翻牌記憶、課程頁、考試）：母音同原本文字的 text-gray-800 / dark:text-white，小字的細筆畫也看得清楚
export const VOWEL_TEXT_COLORS: typeof VOWEL_COLORS = {
  light: { consonant: '#e5e7eb', vowel: '#1f2937' }, // gray-200／gray-800
  dark: { consonant: '#334155', vowel: '#ffffff' }, // slate-700／white
}

// 句子裡的小字（VowelForm inline，例如母音表說明的 อึ、อื）：母音同句子的 text-gray-500 / dark:text-gray-400，
// อ 比卡片稍深，14px 也看得清楚
export const VOWEL_INLINE_COLORS: typeof VOWEL_COLORS = {
  light: { consonant: '#d1d5db', vowel: '#6b7280' }, // gray-300／gray-500
  dark: { consonant: '#475569', vowel: '#9ca3af' }, // slate-600／gray-400
}

/**
 * 在 canvas 畫母音寫法（ctx.font 要先設好）：先整串畫正常顏色，再以 source-atop 在第一個 อ 上重畫淺色。
 * 泰文的上下母音和 อ 是同一個字形組合，分 span 上色會斷掉，所以用 canvas。
 * 第一個 อ 是子音位置（ออ、เออ 的第二個 อ 是母音的一部分，不改色）；沒有 อ 的（ฤ）整個是正常顏色。
 */
export const fillVowelText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  isDark: boolean,
  palette: typeof VOWEL_COLORS = VOWEL_COLORS,
) => {
  const colors = isDark ? palette.dark : palette.light
  ctx.fillStyle = colors.vowel
  ctx.fillText(text, x, baseline)
  const index = text.indexOf('อ')
  if (index < 0) return
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = colors.consonant
  ctx.fillText('อ', x + ctx.measureText(text.slice(0, index)).width, baseline)
  ctx.globalCompositeOperation = 'source-over'
}
