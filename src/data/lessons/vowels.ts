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

/** 母音的名稱（同 /thai 卡片綠字的 thaiLabel，例如 สระอะ、ตัว ฤ）；ฦ、ฦๅ 沒有連結，照 ฤ 的格式 */
export const vowelLabel = (v: LessonVowel): string => vowelThaiItem(v)?.thaiLabel ?? `ตัว ${v.form}`

/** 母音的念法（課本 p40「สระ＋母音發音」）：有連結的用 thaiData 的 speakText（單一來源），ฦ、ฦๅ 直接念 withO（ลึ、ลือ） */
export const vowelSpeakText = (v: LessonVowel): string => vowelThaiItem(v)?.speakText ?? v.withO

/** 母音的筆順（有連結的共用 thaiData，ฦ、ฦๅ 用課程資料；沒有就是 undefined） */
export const vowelStrokes = (v: LessonVowel): string[] | undefined => {
  const strokes = v.thaiChar === undefined ? v.strokes : vowelThaiItem(v)?.strokes
  return strokes && strokes.length > 0 ? strokes : undefined
}

/** 不在 thaiData 的母音（ฦ、ฦๅ），/path 的「泰語元音」tab 也列出來，筆順要寫進課程檔 */
export const LESSON_ONLY_VOWELS: { lessonNo: number; vowel: LessonVowel }[] = LESSONS.flatMap((l) =>
  l.blocks.flatMap((b) => (b.type === 'vowels' ? b.vowels.filter((v) => v.thaiChar === undefined).map((vowel) => ({ lessonNo: l.no, vowel })) : [])),
)

/** 考試結果、錯題紀錄的文字是不是母音寫法（是就用 VowelForm 畫） */
const VOWEL_WRITE_BASES = new Set([
  ...thaiData.flatMap((t) => (t.type === 'vowel' && t.writeBase ? [t.writeBase] : [])),
  ...LESSON_ONLY_VOWELS.map(({ vowel }) => vowelWriteBase(vowel)),
])
export const isVowelWriteBase = (text: string | null | undefined): text is string => !!text && VOWEL_WRITE_BASES.has(text)

/** /thai、/path 用：thaiData 母音或課程限定母音的寫法；不是母音就回傳 undefined */
export const writeBaseOfChar = (char: string): string | undefined =>
  thaiWriteBaseOfChar(char) ??
  LESSON_ONLY_VOWELS.find(({ vowel }) => vowel.form === char)?.vowel.writeBase

/**
 * 母音的音檔（只有泰文）：thaiData 所有母音＋課程限定母音的念法。
 * 母音不放進「第N課」分類（隨身聽不播），但課程頁、/thai、考試要播 mp3，pnpm audio:fetch 另外抓這份清單
 */
export const VOWEL_AUDIO_TEXTS: string[] = [
  ...new Set([
    ...thaiData.flatMap((t) => (t.type === 'vowel' && t.speakText ? [t.speakText] : [])),
    ...LESSON_ONLY_VOWELS.map(({ vowel }) => vowelSpeakText(vowel)),
  ]),
]
