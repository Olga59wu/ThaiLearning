// 元音的寫法（อ 表示子音位置）：一律用 char 到 thaiData 查，不讀物件身上的 writeBase。
// 錯題清單（localStorage thai_mistakes／雲端 mistakeList）存的是整個題目物件，加 writeBase 之前存下來的沒有這個欄位
import { thaiData } from '@/data/thai'

const WRITE_BASE = new Map(thaiData.flatMap((t) => (t.type === 'vowel' && t.writeBase ? [[t.char, t.writeBase] as const] : [])))

/** thaiData 母音的寫法；不是母音（或找不到）回傳 undefined */
export const thaiWriteBase = (item: { type?: string; char?: string } | null | undefined): string | undefined =>
  item?.type === 'vowel' && item.char ? WRITE_BASE.get(item.char) : undefined

/** 用 char 查（/path、課程限定母音以外） */
export const thaiWriteBaseOfChar = (char: string): string | undefined => WRITE_BASE.get(char)
