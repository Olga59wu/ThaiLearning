import type { Particle, Syllable, Tone } from '@/types/lesson'

const MARK_TO_TONE: Record<string, Tone> = {
  '—': 'mid',
  'ˇ': 'low',
  'ˋ': 'falling',
  '~': 'high',
  '/': 'rising',
}

/**
 * 用課本的寫法描述音節，方便對照照片檢查：
 * `sy('ยี่ yi ˋ | สิบ sib ˇ')` → 每段「泰文 拼音 聲調符號」，以 | 分隔
 * 聲調符號：— 中、ˇ 低、ˋ 降、~ 高、/ 升
 */
export const sy = (text: string): Syllable[] =>
  text.split('|').map((part) => {
    const [th, roman, mark, ...rest] = part.trim().split(/\s+/)
    const tone = mark ? MARK_TO_TONE[mark] : undefined
    if (!th || !roman || !tone || rest.length > 0) throw new Error(`音節格式錯誤：「${part}」`)
    return { th, roman, tone }
  })

/** 語尾 ครับ／ค่ะ 的音節（課本 p259） */
export const PARTICLE_SYLLABLE: Record<Particle, Syllable> = {
  ครับ: { th: 'ครับ', roman: 'khrab', tone: 'high' },
  ค่ะ: { th: 'ค่ะ', roman: 'kha', tone: 'falling' },
}
