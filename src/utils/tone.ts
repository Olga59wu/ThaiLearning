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

/** 課本的「第 N 聲」：第 1 聲＝中、第 2 聲＝低、第 3 聲＝降、第 4 聲＝高、第 5 聲＝升 */
export const TONE_ORDINAL: Record<Tone, 1 | 2 | 3 | 4 | 5> = {
  mid: 1,
  low: 2,
  falling: 3,
  high: 4,
  rising: 5,
}

/** 例如「第2聲」 */
export const toneOrdinalLabel = (tone: Tone): string => `第${TONE_ORDINAL[tone]}聲`

/** 音節組回泰文（不含分隔） */
export const joinSyllables = (syllables: readonly Syllable[]): string => syllables.map((s) => s.th).join('')

/** 課本格式的拼音，例如 yi-sib-ed */
export const romanOf = (syllables: readonly Syllable[]): string => syllables.map((s) => s.roman).join('-')
