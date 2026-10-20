// 母音連結 thaiData（寫法、筆順、位置說明）；獨立一個檔，避免隨身聽／打字（vocabCategories）跟著載入 thaiData
import { thaiData } from '@/data/thai'
import { thaiWriteBaseOfChar } from '@/data/thaiWriteBase'
import type { ThaiItem } from '@/types/thai'
import type { LessonVowel } from '@/types/lesson'
import { LESSONS } from './registry'

/** 母音連結的 thaiData 項目；ฦ、ฦๅ 沒有 */
export const vowelThaiItem = (v: LessonVowel): ThaiItem | undefined =>
  v.thaiChar === undefined ? undefined : thaiData.find((t) => t.type === 'vowel' && t.char === v.thaiChar)

/** 位置說明：thaiData meaning 括號內的字（例如「短音 A (後)」→「後」、「前/心卷」整段照抄） */
export const vowelPosition = (v: LessonVowel): string | undefined =>
  vowelThaiItem(v)?.meaning.match(/\(([^)]+)\)/)?.[1]

/** 母音的寫法（อ 表示子音位置，例如 อะ）：有連結的用 thaiData 的 writeBase（單一來源），ฦ、ฦๅ 用課程資料 */
export const vowelWriteBase = (v: LessonVowel): string => vowelThaiItem(v)?.writeBase ?? v.writeBase ?? v.withO

/** 母音的筆順（有連結的共用 thaiData，ฦ、ฦๅ 用課程資料；沒有就是 undefined） */
export const vowelStrokes = (v: LessonVowel): string[] | undefined => {
  const strokes = v.thaiChar === undefined ? v.strokes : vowelThaiItem(v)?.strokes
  return strokes && strokes.length > 0 ? strokes : undefined
}

/** 不在 thaiData 的母音（ฦ、ฦๅ），/path 的「泰語元音」tab 也列出來，筆順要寫進課程檔 */
export const LESSON_ONLY_VOWELS: { lessonNo: number; vowel: LessonVowel }[] = LESSONS.flatMap((l) =>
  l.blocks.flatMap((b) => (b.type === 'vowels' ? b.vowels.filter((v) => v.thaiChar === undefined).map((vowel) => ({ lessonNo: l.no, vowel })) : [])),
)

/** /thai、/path 用：thaiData 母音或課程限定母音的寫法；不是母音就回傳 undefined */
export const writeBaseOfChar = (char: string): string | undefined =>
  thaiWriteBaseOfChar(char) ??
  LESSON_ONLY_VOWELS.find(({ vowel }) => vowel.form === char)?.vowel.writeBase
