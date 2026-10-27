// 元音的寫法（อ 表示子音位置）與念法：一律用 char 到 thaiData 查，不讀物件身上的欄位。
// 錯題清單（localStorage thai_mistakes／雲端 mistakeList）存的是整個題目物件，加這些欄位之前存下來的沒有
import { thaiData } from '@/data/thai'

const VOWELS = new Map(thaiData.flatMap((t) => (t.type === 'vowel' ? [[t.char, t] as const] : [])))

type CharItem = { type?: string; char?: string } | null | undefined

/** thaiData 母音的寫法；不是母音（或找不到）回傳 undefined */
export const thaiWriteBase = (item: CharItem): string | undefined =>
  item?.type === 'vowel' && item.char ? VOWELS.get(item.char)?.writeBase : undefined

/** 用 char 查寫法（/path 底字用） */
export const thaiWriteBaseOfChar = (char: string): string | undefined => VOWELS.get(char)?.writeBase

// Google TTS 會把這些 สระX 的 สระ 念成「sa」：實際播放改念 สะ-หระ-X。
// 音檔檔名跟著念法變（th_สะ-หระ-อำ.mp3）：手機的音檔快取是 cache-first，檔名不同才會抓新檔
const SA_RA_VOWELS = new Set(['อำ', 'อึ', 'อุ', 'แอะ', 'แอ', 'โอะ', 'โอ', 'เออะ', 'เออ', 'เอือ'])

/** thaiData 的 speakText → 實際播放的念法（音檔檔名、TTS 都用它） */
export const vowelSpokenText = (speakText: string): string => {
  const vowel = speakText.replace(/^สระ/, '')
  return vowel !== speakText && SA_RA_VOWELS.has(vowel) ? `สะ-หระ-${vowel}` : speakText
}

/** thaiData 母音的念法（สระอะ…、สะ-หระ-อำ…、獨立母音 รึ、รือ）；不是母音回傳 undefined */
export const thaiVowelSpeak = (item: CharItem): string | undefined => {
  const speakText = item?.type === 'vowel' && item.char ? VOWELS.get(item.char)?.speakText : undefined
  return speakText === undefined ? undefined : vowelSpokenText(speakText)
}
