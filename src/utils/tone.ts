import type { Syllable, Tone } from '@/types/lesson'

// 課本的聲調符號（課本印的低聲是「v」，畫面用 ˇ）
export const TONE_MARK: Record<Tone, string> = {
  mid: '—',
  low: 'ˇ',
  falling: 'ˋ',
  high: '~',
  rising: '/',
}

export const TONE_LABEL: Record<Tone, string> = {
  mid: '中',
  low: '低',
  falling: '降',
  high: '高',
  rising: '升',
}

/** 音節組回泰文（不含分隔） */
export const joinSyllables = (syllables: readonly Syllable[]): string => syllables.map((s) => s.th).join('')

/** 課本格式的拼音，例如 yi-sib-ed */
export const romanOf = (syllables: readonly Syllable[]): string => syllables.map((s) => s.roman).join('-')
