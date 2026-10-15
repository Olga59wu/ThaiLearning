// 每週課程考試：出題（純函式，方便測試）
import { blocksOf, lessonPhrases, lessonUnits, resolveWord } from '@/data/lessons'
import { PARTICLE_SYLLABLE } from '@/data/lessons/helpers'
import type { ExamQuestionType, Lesson, LessonPhrase, ResolvedWord, Syllable } from '@/types/lesson'
import { poolNumbers } from '@/utils/numberPool'
import { shuffleArray } from '@/utils/shuffle'
import { numberToSyllables, numberToThai, readingDistractorSyllables, toThaiDigits } from '@/utils/thaiNumber'
import { joinSyllables, romanOf } from '@/utils/tone'

/** 選項：唸法用 syllables＋th 顯示（依「泰文字」開關），其他顯示 text */
export interface ExamOption {
  key: string
  text?: string
  /** text 是泰文數字（用泰文字型） */
  thaiDigits?: boolean
  syllables?: Syllable[]
  th?: string
}

export interface ExamQuestion {
  id: string
  type: ExamQuestionType
  /** 數字題的數字 */
  num?: number
  /** 題目的唸法（單位、常用語、聽音題） */
  reading?: { syllables: Syllable[]; th: string }
  options?: ExamOption[]
  answerKey: string
  /** 結果頁與紀錄用（不含泰文字母，只有泰文數字與拼音） */
  promptLabel: string
  answerLabel: string
}

export const OPTION_COUNT = 4

export const QUESTION_TYPE_LABEL: Record<ExamQuestionType, string> = {
  digitChoice: '數字 → 選泰文數字',
  digitInput: '泰文數字 → 輸入數字',
  digitHandwrite: '數字 → 手寫泰文數字',
  readingChoice: '數字 → 選唸法',
  listenNumber: '聽發音 → 選數字',
  unitMeaning: '單位 → 選中文',
  phraseMeaning: '常用語 → 選中文',
}

// ---- 數字 → 泰文數字：易混淆的字 ----
const CONFUSABLE: Record<string, string[]> = { '2': ['3'], '3': ['2'], '4': ['5'], '5': ['4'], '8': ['9'], '9': ['8'] }

/** 泰文數字的錯誤選項：優先把某一位換成易混淆的字（๒↔๓、๔↔๕、๘↔๙），不足再調換位數或換成其他數字 */
export const digitDistractors = (n: number, count = OPTION_COUNT - 1): string[] => {
  const s = String(n)
  const result: string[] = []
  const add = (candidate: string) => {
    if (candidate !== s && !result.includes(candidate) && !(candidate.length > 1 && candidate.startsWith('0')) && result.length < count)
      result.push(candidate)
  }
  // 1. 易混淆：每一位各換一次，再兩位一起換
  const positions = [...s].map((c, i) => ({ c, i })).filter(({ c }) => CONFUSABLE[c])
  positions.forEach(({ c, i }) => CONFUSABLE[c]!.forEach((r) => add(s.slice(0, i) + r + s.slice(i + 1))))
  if (positions.length > 1) add([...s].map((c) => CONFUSABLE[c]?.[0] ?? c).join(''))
  // 2. 位數調換（例如 12 ↔ 21）
  if (s.length > 1) add([...s].reverse().join(''))
  // 3. 隨機換掉一位
  for (let tries = 0; result.length < count && tries < 100; tries++) {
    const i = Math.floor(Math.random() * s.length)
    const d = String(Math.floor(Math.random() * 10))
    add(s.slice(0, i) + d + s.slice(i + 1))
  }
  return result.map((x) => toThaiDigits(Number(x)))
}

/** 聽音題的錯誤選項：唸法相近的數字（位數調換、±10、±1…） */
export const listenDistractors = (n: number, count = OPTION_COUNT - 1): number[] => {
  const s = String(n)
  const candidates = [
    s.length > 1 ? Number([...s].reverse().join('')) : -1,
    n + 10, n - 10, n + 1, n - 1, n + 11, n - 11, n + 9, n + 2, n + 100,
  ]
  const result: number[] = []
  candidates.forEach((m) => {
    if (m >= 0 && m !== n && !result.includes(m) && result.length < count) result.push(m)
  })
  return result
}

// ---- 題目產生 ----
const numberQuestion = (type: ExamQuestionType, n: number, id: string): ExamQuestion => {
  const syllables = numberToSyllables(n)
  const th = numberToThai(n)
  switch (type) {
    case 'digitChoice':
      return {
        id, type, num: n,
        options: shuffleArray([toThaiDigits(n), ...digitDistractors(n)]).map((t) => ({ key: t, text: t, thaiDigits: true })),
        answerKey: toThaiDigits(n),
        promptLabel: `${n} → 泰文數字`,
        answerLabel: toThaiDigits(n),
      }
    case 'digitInput':
      return { id, type, num: n, answerKey: String(n), promptLabel: `${toThaiDigits(n)} → 阿拉伯數字`, answerLabel: String(n) }
    case 'digitHandwrite':
      return { id, type, num: n, answerKey: 'correct', promptLabel: `${n} → 手寫`, answerLabel: toThaiDigits(n) }
    case 'readingChoice':
      return {
        id, type, num: n,
        options: shuffleArray([syllables, ...readingDistractorSyllables(n)]).map((s) => ({
          key: joinSyllables(s), syllables: s, th: joinSyllables(s), text: romanOf(s),
        })),
        answerKey: th,
        promptLabel: `${n} → 唸法`,
        answerLabel: romanOf(syllables),
      }
    case 'listenNumber':
      return {
        id, type, num: n,
        reading: { syllables, th },
        options: shuffleArray([n, ...listenDistractors(n)]).map((m) => ({ key: String(m), text: m.toLocaleString('en-US') })),
        answerKey: String(n),
        promptLabel: `🔊 ${romanOf(syllables)}`,
        answerLabel: String(n),
      }
    default:
      throw new Error(`不是數字題：${type}`)
  }
}

const unitQuestion = (unit: ResolvedWord, units: ResolvedWord[], id: string): ExamQuestion => {
  const others = shuffleArray(units.filter((u) => u.meaning !== unit.meaning).map((u) => u.meaning))
  const meanings = [unit.meaning, ...[...new Set(others)].slice(0, OPTION_COUNT - 1)]
  return {
    id, type: 'unitMeaning',
    reading: { syllables: unit.syllables, th: unit.th },
    options: shuffleArray(meanings).map((m) => ({ key: m, text: m })),
    answerKey: unit.meaning,
    promptLabel: romanOf(unit.syllables),
    answerLabel: unit.meaning,
  }
}

/** 常用語題：隨機帶 ครับ／ค่ะ；錯誤選項排除自己與意思重疊（confusableWith）的句子 */
const phraseQuestion = (phrase: LessonPhrase, phrases: LessonPhrase[], id: string): ExamQuestion => {
  const base = resolveWord(phrase.base)
  const particle = phrase.particles[Math.floor(Math.random() * phrase.particles.length)]
  const syllables = particle ? [...base.syllables, PARTICLE_SYLLABLE[particle]] : base.syllables
  const excluded = new Set([phrase.id, ...(phrase.confusableWith ?? [])])
  const others = shuffleArray(phrases.filter((p) => !excluded.has(p.id) && !p.confusableWith?.includes(phrase.id)))
  const meanings = [phrase.meaning, ...[...new Set(others.map((p) => p.meaning))].slice(0, OPTION_COUNT - 1)]
  return {
    id, type: 'phraseMeaning',
    reading: { syllables, th: base.th + (particle ?? '') },
    options: shuffleArray(meanings).map((m) => ({ key: m, text: m })),
    answerKey: phrase.meaning,
    promptLabel: romanOf(syllables),
    answerLabel: phrase.meaning,
  }
}

// ---- 考卷 ----
export type ExamScope = 'lesson' | 'cumulative'

export interface ExamPlan {
  numbers: number[]
  units: ResolvedWord[]
  phrases: LessonPhrase[]
  questions: { type: ExamQuestionType; count: number }[]
}

/**
 * 考試範圍：只考本課＝本課的設定；累積＝第 1 課到本課，
 * 題型取聯集、題數取各課設定的最大值、題目內容合併各課資料
 */
export const examPlan = (lessons: readonly Lesson[], no: number, scope: ExamScope): ExamPlan => {
  const included = lessons.filter((l) => (scope === 'lesson' ? l.no === no : l.no <= no))
  const counts = new Map<ExamQuestionType, number>()
  const numbers = new Set<number>()
  included.forEach((l) =>
    blocksOf(l, 'exam').forEach((b) => {
      poolNumbers(b.config.numbers).forEach((n) => numbers.add(n))
      b.config.questions.forEach((q) => counts.set(q.type, Math.max(counts.get(q.type) ?? 0, q.count)))
    }),
  )
  const unitMap = new Map<string, ResolvedWord>()
  included.flatMap(lessonUnits).forEach((u) => unitMap.set(u.id, u))
  const phraseMap = new Map<string, LessonPhrase>()
  included.flatMap(lessonPhrases).forEach((p) => phraseMap.set(p.id, p))
  return {
    numbers: [...numbers].sort((a, b) => a - b),
    units: [...unitMap.values()],
    phrases: [...phraseMap.values()],
    questions: [...counts].map(([type, count]) => ({ type, count })),
  }
}

/** 依考試範圍出題：同一題型內的題目不重複，整份考卷順序隨機 */
export const buildExam = (plan: ExamPlan): ExamQuestion[] => {
  const questions: ExamQuestion[] = []
  plan.questions.forEach(({ type, count }) => {
    if (type === 'unitMeaning') {
      shuffleArray(plan.units).slice(0, count).forEach((u, i) => questions.push(unitQuestion(u, plan.units, `${type}-${i}`)))
    } else if (type === 'phraseMeaning') {
      shuffleArray(plan.phrases).slice(0, count).forEach((p, i) => questions.push(phraseQuestion(p, plan.phrases, `${type}-${i}`)))
    } else {
      shuffleArray(plan.numbers).slice(0, count).forEach((n, i) => questions.push(numberQuestion(type, n, `${type}-${i}`)))
    }
  })
  return shuffleArray(questions)
}

/** 只重考錯題：同樣的題目，重新打亂題目與選項順序 */
export const reshuffleQuestions = (questions: readonly ExamQuestion[]): ExamQuestion[] =>
  shuffleArray(questions).map((q) => (q.options ? { ...q, options: shuffleArray(q.options) } : q))

/** 數字輸入：接受泰文數字、逗號與空白 */
export const normalizeNumberInput = (input: string): string | null => {
  const value = input.replace(/[๐-๙]/g, (c) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c))).replace(/[\s,]/g, '')
  return /^\d+$/.test(value) ? String(Number(value)) : null
}
