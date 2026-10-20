// 母音連結 thaiData（筆順、位置說明）；獨立一個檔，避免隨身聽／打字（vocabCategories）跟著載入 thaiData
import { thaiData } from '@/data/thai'
import type { ThaiItem } from '@/types/thai'
import type { LessonVowel } from '@/types/lesson'

/** 母音連結的 thaiData 項目；ฦ、ฦๅ 沒有 */
export const vowelThaiItem = (v: LessonVowel): ThaiItem | undefined =>
  v.thaiChar === undefined ? undefined : thaiData.find((t) => t.type === 'vowel' && t.char === v.thaiChar)

/** 位置說明：thaiData meaning 括號內的字（例如「短音 A (後)」→「後」、「前/心卷」整段照抄） */
export const vowelPosition = (v: LessonVowel): string | undefined =>
  vowelThaiItem(v)?.meaning.match(/\(([^)]+)\)/)?.[1]

/** 母音的筆順（共用 thaiData；沒有就是 undefined） */
export const vowelStrokes = (v: LessonVowel): string[] | undefined => {
  const strokes = vowelThaiItem(v)?.strokes
  return strokes && strokes.length > 0 ? strokes : undefined
}
