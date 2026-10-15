import type { Syllable } from '@/types/lesson'
import { joinSyllables } from '@/utils/tone'

// 數字轉泰文唸法（第 1 課 泰文數字）
// 規則：
// - 個位數 1，前面有任何非 0 位數 → เอ็ด（11、21、101、1,000,001）
// - 十位數 2 → ยี่สิบ；十位數 1 → 只唸 สิบ（不唸 หนึ่งสิบ）
// - 百位以上的 1 要唸 หนึ่ง（หนึ่งร้อย、หนึ่งพัน）
// - 中間的 0 不唸；只有單獨的 0 唸 ศูนย์
// - 百萬以上以 ล้าน 為單位往上疊（สิบล้าน、ร้อยล้าน、พันล้าน）

const syl = (th: string, roman: string, tone: Syllable['tone']): Syllable => ({ th, roman, tone })

// 音節的拼音與聲調照課本
const DIGIT: readonly Syllable[] = [
  syl('ศูนย์', 'sun', 'rising'),
  syl('หนึ่ง', 'neung', 'low'),
  syl('สอง', 'song', 'rising'),
  syl('สาม', 'sam', 'rising'),
  syl('สี่', 'si', 'low'),
  syl('ห้า', 'ha', 'falling'),
  syl('หก', 'hok', 'low'),
  syl('เจ็ด', 'jed', 'low'),
  syl('แปด', 'paed', 'low'),
  syl('เก้า', 'kao', 'falling'),
]
const SIB = syl('สิบ', 'sib', 'low')
const YI = syl('ยี่', 'yi', 'falling')
const ED = syl('เอ็ด', 'ed', 'low')
const LAN = syl('ล้าน', 'lan', 'high')
// 百萬以下的單位：個位以外，由大到小（แสน 十萬 → ร้อย 百）
const UNITS: readonly [number, Syllable][] = [
  [100000, syl('แสน', 'saen', 'rising')],
  [10000, syl('หมื่น', 'meun', 'low')],
  [1000, syl('พัน', 'phan', 'mid')],
  [100, syl('ร้อย', 'roi', 'high')],
]

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙'

/** 讀法選項：全部 true 為正確唸法；關掉其中一個用來產生常見錯誤 */
interface ReadOptions {
  /** 個位 1 唸 เอ็ด（關掉 → สิบหนึ่ง） */
  ed: boolean
  /** 十位 2 唸 ยี่（關掉 → สองสิบ） */
  yi: boolean
  /** 十位 1 只唸 สิบ（關掉 → หนึ่งสิบ） */
  plainSib: boolean
}
const CORRECT: ReadOptions = { ed: true, yi: true, plainSib: true }

const assertNumber = (n: number) => {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`不支援的數字：${n}`)
}

/** 百萬以下（0～999,999）；hasHigher：前面還有 ล้าน 的部分 */
const readBelowMillion = (n: number, hasHigher: boolean, opt: ReadOptions): Syllable[] => {
  const out: Syllable[] = []
  let rest = n
  for (const [value, unit] of UNITS) {
    const d = Math.floor(rest / value)
    rest %= value
    if (d > 0) out.push(DIGIT[d]!, unit)
  }
  const tens = Math.floor(rest / 10)
  const ones = rest % 10
  if (tens === 1) {
    if (!opt.plainSib) out.push(DIGIT[1]!)
    out.push(SIB)
  } else if (tens === 2) {
    out.push(opt.yi ? YI : DIGIT[2]!, SIB)
  } else if (tens > 2) {
    out.push(DIGIT[tens]!, SIB)
  }
  if (ones === 1 && opt.ed && (hasHigher || n >= 10)) out.push(ED)
  else if (ones > 0) out.push(DIGIT[ones]!)
  return out
}

const read = (n: number, opt: ReadOptions): Syllable[] => {
  if (n === 0) return [DIGIT[0]!]
  const high = Math.floor(n / 1000000)
  const low = n % 1000000
  const out: Syllable[] = high > 0 ? [...read(high, opt), LAN] : []
  return [...out, ...readBelowMillion(low, high > 0, opt)]
}

/** 數字 → 泰文唸法的音節（含課本拼音與聲調） */
export const numberToSyllables = (n: number): Syllable[] => {
  assertNumber(n)
  return read(n, CORRECT)
}

/** 數字 → 泰文唸法，例如 21 → ยี่สิบเอ็ด */
export const numberToThai = (n: number): string => joinSyllables(numberToSyllables(n))

// 所有數字音節（解析用，長的先比對）
const ALL_NUMBER_SYLLABLES: readonly Syllable[] = [...DIGIT, SIB, YI, ED, LAN, ...UNITS.map(([, u]) => u)].sort(
  (a, b) => b.th.length - a.th.length,
)

/**
 * 由數字音節組成的泰文 → 音節（例如 หนึ่งสิบ → neung + sib）；含其他字時回傳 null。
 * 規則說明裡的 {เอ็ด} 這類標記用它顯示拼音與聲調。
 */
export const numberWordSyllables = (th: string): Syllable[] | null => {
  const out: Syllable[] = []
  let rest = th
  while (rest) {
    const s = ALL_NUMBER_SYLLABLES.find((x) => rest.startsWith(x.th))
    if (!s) return null
    out.push(s)
    rest = rest.slice(s.th.length)
  }
  return out.length > 0 ? out : null
}

/** 阿拉伯數字 → 泰文數字，例如 23 → ๒๓ */
export const toThaiDigits = (n: number): string => {
  assertNumber(n)
  return String(n).replace(/\d/g, (d) => THAI_DIGITS[Number(d)]!)
}

/** 泰文數字 → 阿拉伯數字字串（也接受混合輸入），例如 ๒๓ → 23 */
export const fromThaiDigits = (s: string): string =>
  s.replace(/[๐-๙]/g, (c) => String(THAI_DIGITS.indexOf(c)))

/**
 * 唸法的錯誤選項（音節）：先放常見錯誤（sib-neung、song-sib、neung-sib、單獨唸 ed），
 * 不足再補鄰近數字的正確唸法。回傳不含正確答案、不重複，最多 count 個。
 */
export const readingDistractorSyllables = (n: number, count = 3): Syllable[][] => {
  assertNumber(n)
  const correct = numberToThai(n)
  const result: Syllable[][] = []
  const add = (s: Syllable[]) => {
    const th = joinSyllables(s)
    if (th !== correct && !result.some((r) => joinSyllables(r) === th) && result.length < count) result.push(s)
  }
  add(read(n, { ...CORRECT, ed: false }))
  add(read(n, { ...CORRECT, yi: false }))
  add(read(n, { ...CORRECT, plainSib: false }))
  if (n === 1) add([ED])
  const neighbors = [n + 1, n - 1, n + 10, n - 10, n + 2, n - 2, n + 100, n + 20, n + 3]
  for (const m of neighbors) {
    if (m >= 0 && Number.isSafeInteger(m)) add(read(m, CORRECT))
  }
  return result
}

/** readingDistractorSyllables 的泰文版本 */
export const readingDistractors = (n: number, count = 3): string[] =>
  readingDistractorSyllables(n, count).map(joinSyllables)
