// 元音的寫法（อ 表示子音位置）與念法：一律用 char 到 thaiData 查，不讀物件身上的欄位。
// 錯題清單（localStorage thai_mistakes／雲端 mistakeList）存的是整個題目物件，加這些欄位之前存下來的沒有
import { thaiData } from '@/data/thai'

const VOWELS = new Map(thaiData.flatMap((t) => (t.type === 'vowel' ? [[t.char, t] as const] : [])))

type CharItem = { type?: string; char?: string } | null | undefined

/** thaiData 母音的寫法；不是母音（或找不到）回傳 undefined */
export const thaiWriteBase = (item: CharItem): string | undefined =>
  item?.type === 'vowel' && item.char ? VOWELS.get(item.char)?.writeBase : undefined

/** 用 char 查寫法（/path、課程限定母音以外） */
export const thaiWriteBaseOfChar = (char: string): string | undefined => VOWELS.get(char)?.writeBase

/** thaiData 母音的念法（สระอะ…、獨立母音 รึ、รือ）；不是母音回傳 undefined */
export const thaiVowelSpeak = (item: CharItem): string | undefined =>
  item?.type === 'vowel' && item.char ? VOWELS.get(item.char)?.speakText : undefined
