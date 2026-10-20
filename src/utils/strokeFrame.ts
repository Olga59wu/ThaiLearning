// 筆順座標的參考框：/path 存座標、母音手寫底圖（彈窗、考試、/dev/vowel-guides）畫筆順共用。
//
// /path 的畫布是 500px 正方形（底字框），存檔座標＝畫布 px × 0.2 ＋ 位移（原版 /path 沿用的位移：x −2、y +18）。
// 所以底字框在筆順座標裡是 x −2～98、y 18～118，母音底圖上的筆順 SVG 用這個 viewBox 才會和底圖重疊。
// 輔音、數字的彈窗是依筆畫範圍自動縮放（strokesViewBox），不用這個框。

export interface Point {
  x: number
  y: number
}

export const PATH_CANVAS_SIZE = 500
export const STROKE_FRAME_SIZE = 100
const SCALE_FACTOR = STROKE_FRAME_SIZE / PATH_CANVAS_SIZE
/** 原版 /path 的位移（單位：筆順座標 0～100） */
export const STROKE_OFFSET: Readonly<Point> = { x: -2, y: 18 }

/** 母音底圖上的筆順 SVG viewBox：對應整個底字框 */
export const GUIDE_STROKES_VIEWBOX = `${STROKE_OFFSET.x} ${STROKE_OFFSET.y} ${STROKE_FRAME_SIZE} ${STROKE_FRAME_SIZE}`

/** /path 存檔：畫布 px → 筆順座標（四捨五入到 0.1） */
export const canvasToStroke = (val: number, isX: boolean): number =>
  Math.round((val * SCALE_FACTOR + (isX ? STROKE_OFFSET.x : STROKE_OFFSET.y)) * 10) / 10

/** /path 載入：筆順座標 → 畫布 px */
export const strokeToCanvas = (p: Point): Point => ({
  x: (p.x - STROKE_OFFSET.x) / SCALE_FACTOR,
  y: (p.y - STROKE_OFFSET.y) / SCALE_FACTOR,
})

/** SVG viewBox（正方形、preserveAspectRatio meet）下，筆順座標 → 框內比例 0～1 */
export const viewBoxToRatio = (viewBox: string, p: Point): Point => {
  const [minX, minY, width, height] = viewBox.trim().split(/[\s,]+/).map(Number) as [number, number, number, number]
  return { x: (p.x - minX) / width, y: (p.y - minY) / height }
}
