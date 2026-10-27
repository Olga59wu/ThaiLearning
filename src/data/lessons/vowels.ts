// 母音連結 thaiData（寫法、筆順、念法、位置說明、已停用）；獨立一個檔，避免隨身聽／打字（vocabCategories）跟著載入 thaiData
import { thaiData } from '@/data/thai'
import { vowelSpokenText } from '@/data/thaiWriteBase'
import type { ThaiItem } from '@/types/thai'
import type { LessonVowel } from '@/types/lesson'

/** 母音連結的 thaiData 項目（測試保證每個 thaiChar 都找得到） */
export const vowelThaiItem = (v: LessonVowel): ThaiItem | undefined =>
  thaiData.find((t) => t.type === 'vowel' && t.char === v.thaiChar)

/** 位置說明：thaiData meaning 括號內的字（例如「短音 A (後)」→「後」、「前/心卷」整段照抄） */
export const vowelPosition = (v: LessonVowel): string | undefined =>
  vowelThaiItem(v)?.meaning.match(/\(([^)]+)\)/)?.[1]

/** 母音的寫法（อ 表示子音位置，例如 อะ）：thaiData 的 writeBase（單一來源）；找不到時用課本字形把 - 換成 อ */
export const vowelWriteBase = (v: LessonVowel): string => vowelThaiItem(v)?.writeBase ?? v.form.replace(/-/g, 'อ')

/** 母音的名稱（同 /thai 卡片綠字的 thaiLabel，例如 สระอะ、ตัว ฤ） */
export const vowelLabel = (v: LessonVowel): string => vowelThaiItem(v)?.thaiLabel ?? v.form

/** 母音的念法（課本 p40「สระ＋母音發音」）：thaiData 的 speakText（單一來源，經 vowelSpokenText，部分改念 สะ-หระ-X） */
export const vowelSpeakText = (v: LessonVowel): string => {
  const speakText = vowelThaiItem(v)?.speakText
  return speakText === undefined ? v.withO : vowelSpokenText(speakText)
}

/** 母音的筆順（共用 thaiData；沒有就是 undefined） */
export const vowelStrokes = (v: LessonVowel): string[] | undefined => {
  const strokes = vowelThaiItem(v)?.strokes
  return strokes && strokes.length > 0 ? strokes : undefined
}

/** 已停用（ฦ、ฦๅ）：thaiData 的 deprecated */
export const vowelDeprecated = (v: LessonVowel): boolean => vowelThaiItem(v)?.deprecated === true

/** 考試結果、錯題紀錄的文字是不是母音寫法（是就用 VowelForm 畫） */
const VOWEL_WRITE_BASES = new Set(thaiData.flatMap((t) => (t.type === 'vowel' && t.writeBase ? [t.writeBase] : [])))
export const isVowelWriteBase = (text: string | null | undefined): text is string => !!text && VOWEL_WRITE_BASES.has(text)

/**
 * 母音的音檔（只有泰文）：thaiData 所有母音的念法。
 * 母音不放進「第N課」分類（隨身聽不播），但課程頁、/thai、考試要播 mp3，pnpm audio:fetch 另外抓這份清單
 */
export const VOWEL_AUDIO_TEXTS: string[] = [
  ...new Set(thaiData.flatMap((t) => (t.type === 'vowel' && t.speakText ? [vowelSpokenText(t.speakText)] : []))),
]
