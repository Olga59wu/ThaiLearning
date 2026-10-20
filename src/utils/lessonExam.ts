// 每週課程考試：出題（純函式，方便測試）
import { blocksOf, lessonPhrases, lessonPronounCells, lessonUnits, lessonVowels, resolveWord } from '@/data/lessons'
import { vowelSpeakText, vowelStrokes, vowelWriteBase } from '@/data/lessons/vowels'
import { PARTICLE_SYLLABLE } from '@/data/lessons/helpers'
import type { ExamQuestionType, Lesson, LessonPhrase, LessonVowel, PronounCell, ResolvedWord, Syllable, Tone } from '@/types/lesson'
import { poolNumbers } from '@/utils/numberPool'
import { shuffleArray } from '@/utils/shuffle'
import { numberToSyllables, numberToThai, readingDistractorSyllables, toThaiDigits } from '@/utils/thaiNumber'
import { joinSyllables, romanOf, TONE_MARK, toneOrdinalLabel } from '@/utils/tone'

/** 選項：唸法用 syllables＋th 顯示（依「泰文字」開關），其他顯示 text */
export interface ExamOption {
  key: string
  text?: string
  /** text 是泰文數字（用泰文字型） */
  thaiDigits?: boolean
  syllables?: Syllable[]
  th?: string
  /** 母音發音選項：拼音後面的注音 */
  zhuyin?: string
  /** 不顯示泰文（母音發音選項：泰文就是題目的字形，顯示等於給答案） */
  hideThai?: boolean
  /** 母音字形選項：搭配 อ 的寫法（畫成課本字形，例如 อะ → -ะ） */
  vowelWriteBase?: string
}

/** 母音題的題目資料 */
export interface ExamVowel {
  form: string
  /** 搭配 อ 的寫法：畫課本字形（VowelForm）、結果頁文字用它（「-ิ」這種寫法在 iPhone 會出現 ◌） */
  writeBase: string
  withO: string
  roman: string
  zhuyin?: string
  tone: Tone
  length?: 'short' | 'long'
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
  /** 母音題的題目 */
  vowel?: ExamVowel
  /** 人稱代名詞題的情境（例如「我・女生・禮貌」） */
  context?: string
  /** 答完念出的泰文（母音、人稱代名詞） */
  speakText?: string
  /** 手寫母音：筆順與底圖 */
  strokes?: string[]
  guideText?: string
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
  vowelSound: '看母音 → 選發音',
  vowelListen: '聽發音 → 選母音',
  vowelLength: '看母音 → 長音／短音',
  vowelHandwrite: '聽發音 → 手寫母音',
  pronounChoice: '人稱代名詞 → 選拼音',
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

// ---- 母音 ----
/** 發音相近的母音（課本編號）：短音配短音、長音配長音 */
const SIMILAR_VOWELS: readonly (readonly [number, number])[] = [
  [13, 15], [14, 16], // โอะ／เอาะ、โอ／ออ
  [9, 11], [10, 12], // เอะ／แอะ、เอ／แอ
  [17, 15], [18, 16], // เออะ／เอาะ、เออ／ออ
  [19, 21], [20, 22], // เอียะ／เอือะ、เอีย／เอือ
  [5, 7], [6, 8], // อึ／อุ、อือ／อู
]

/** 長短音的另一半：1↔2、3↔4…23↔24，獨立母音 29↔30、31↔32；特殊母音沒有 */
export const vowelPartnerNo = (v: LessonVowel): number | undefined => {
  if (v.group === 'special' || v.length === undefined) return undefined
  return v.no % 2 === 1 ? v.no + 1 : v.no - 1
}

/** 發音（拼音＋聲調）相同的母音視為同一個發音（例如 ใ- 與 ไ- 都是 ai 第 1 聲） */
export const vowelSoundKey = (v: LessonVowel): string => `${v.roman}|${v.tone}`

export const vowelSoundLabel = (v: LessonVowel): string =>
  `${v.roman}${v.zhuyin ? `（${v.zhuyin}）` : ''} ${TONE_MARK[v.tone]} ${toneOrdinalLabel(v.tone)}`

/**
 * 母音的錯誤選項：先放長短音的另一半（อิ／อี）、再放發音相近的（โอะ／เอาะ、เอะ／แอะ…），不足再隨機；
 * 發音相同的不重複出現，也不和答案同音（ใ-／ไ-）
 */
export const vowelDistractors = (v: LessonVowel, pool: readonly LessonVowel[], count = OPTION_COUNT - 1): LessonVowel[] => {
  const byNo = (n: number | undefined) => (n === undefined ? undefined : pool.find((x) => x.no === n))
  const similar = SIMILAR_VOWELS.flatMap(([a, b]) => (a === v.no ? [b] : b === v.no ? [a] : []))
  const ordered = [
    ...[vowelPartnerNo(v), ...similar].map(byNo).filter((x): x is LessonVowel => x !== undefined),
    ...shuffleArray(pool),
  ]
  const usedSounds = new Set([vowelSoundKey(v)])
  const result: LessonVowel[] = []
  for (const x of ordered) {
    if (result.length >= count) break
    if (usedSounds.has(vowelSoundKey(x))) continue
    usedSounds.add(vowelSoundKey(x))
    result.push(x)
  }
  return result
}

const examVowel = (v: LessonVowel): ExamVowel => ({ form: v.form, writeBase: vowelWriteBase(v), withO: v.withO, roman: v.roman, zhuyin: v.zhuyin, tone: v.tone, length: v.length })
const vowelSyllables = (v: LessonVowel): Syllable[] => [{ th: v.withO, roman: v.roman, tone: v.tone }]
const LENGTH_LABEL = { short: '短音', long: '長音' } as const

const vowelQuestion = (type: ExamQuestionType, v: LessonVowel, pool: readonly LessonVowel[], id: string): ExamQuestion => {
  // 念法統一用 vowelSpeakText（สระ＋母音；獨立母音 รึ…）
  const base = { id, type, vowel: examVowel(v), speakText: vowelSpeakText(v) }
  switch (type) {
    case 'vowelSound':
      return {
        ...base,
        options: shuffleArray([v, ...vowelDistractors(v, pool)]).map((x) => ({
          key: vowelSoundKey(x), syllables: vowelSyllables(x), th: x.withO, zhuyin: x.zhuyin, hideThai: true, text: vowelSoundLabel(x),
        })),
        answerKey: vowelSoundKey(v),
        promptLabel: vowelWriteBase(v),
        answerLabel: vowelSoundLabel(v),
      }
    case 'vowelListen':
      return {
        ...base,
        options: shuffleArray([v, ...vowelDistractors(v, pool)]).map((x) => ({ key: x.id, vowelWriteBase: vowelWriteBase(x), text: vowelWriteBase(x) })),
        answerKey: v.id,
        promptLabel: `🔊 ${vowelSoundLabel(v)}`,
        answerLabel: vowelWriteBase(v),
      }
    case 'vowelLength':
      return {
        ...base,
        // 固定順序：短音在左、長音在右
        options: (['short', 'long'] as const).map((len) => ({ key: len, text: LENGTH_LABEL[len] })),
        answerKey: v.length!,
        promptLabel: vowelWriteBase(v),
        answerLabel: LENGTH_LABEL[v.length!],
      }
    case 'vowelHandwrite':
      return {
        ...base,
        answerKey: 'correct',
        strokes: vowelStrokes(v),
        guideText: vowelWriteBase(v),
        promptLabel: `${vowelSoundLabel(v)} → 手寫`,
        answerLabel: vowelWriteBase(v),
      }
    default:
      throw new Error(`不是母音題：${type}`)
  }
}

// ---- 人稱代名詞 ----
export type ExamPronounCell = PronounCell & { word: ResolvedWord }

const GENDER_LABEL = { male: '男生', female: '女生' } as const
export const pronounContext = (c: PronounCell): string => `${c.person}・${GENDER_LABEL[c.gender]}・${c.level}`

/** 人稱代名詞的錯誤選項：優先同一人稱的其他說法，再補其他代名詞；同一個字只出現一次 */
export const pronounDistractors = (cell: ExamPronounCell, cells: readonly ExamPronounCell[], count = OPTION_COUNT - 1): ResolvedWord[] => {
  const ordered = [...shuffleArray(cells.filter((c) => c.person === cell.person)), ...shuffleArray(cells)].map((c) => c.word)
  const result: ResolvedWord[] = []
  for (const w of ordered) {
    if (result.length >= count) break
    if (w.id === cell.word.id || result.some((r) => r.id === w.id)) continue
    result.push(w)
  }
  return result
}

const pronounQuestion = (cell: ExamPronounCell, cells: readonly ExamPronounCell[], id: string): ExamQuestion => ({
  id,
  type: 'pronounChoice',
  context: pronounContext(cell),
  speakText: cell.word.th,
  options: shuffleArray([cell.word, ...pronounDistractors(cell, cells)]).map((w) => ({
    key: w.id, syllables: w.syllables, th: w.th, text: romanOf(w.syllables),
  })),
  answerKey: cell.word.id,
  promptLabel: pronounContext(cell),
  answerLabel: romanOf(cell.word.syllables),
})

// ---- 考卷 ----
export type ExamScope = 'lesson' | 'cumulative'

/** 題庫：題目從這裡抽 */
export interface ExamPools {
  numbers: number[]
  units: ResolvedWord[]
  phrases: LessonPhrase[]
  vowels: LessonVowel[]
  pronounCells: ExamPronounCell[]
}

export interface ExamPlanQuestion {
  type: ExamQuestionType
  count: number
}

/** 一課的出題：題目從該課的題庫抽 */
export interface ExamSection {
  lessonNo: number
  pools: ExamPools
  questions: ExamPlanQuestion[]
}

/** 考試計畫：最上層的題庫是所有課合併（錯誤選項從這裡挑），questions 是各課加總（設定畫面顯示用） */
export interface ExamPlan extends ExamPools {
  questions: ExamPlanQuestion[]
  sections: ExamSection[]
}

/** 各題型的題庫（題數不能超過題庫大小） */
const NUMBER_TYPES: readonly ExamQuestionType[] = ['digitChoice', 'digitInput', 'digitHandwrite', 'readingChoice', 'listenNumber']
const vowelPool = (type: ExamQuestionType, vowels: readonly LessonVowel[]): LessonVowel[] => {
  if (type === 'vowelLength') return vowels.filter((v) => v.length !== undefined)
  // 手寫：有筆順的才出（目前沒有母音筆順，等使用者在 /path 畫）
  if (type === 'vowelHandwrite') return vowels.filter((v) => vowelStrokes(v) !== undefined)
  return [...vowels]
}
const poolSize = (type: ExamQuestionType, pools: ExamPools): number => {
  if (NUMBER_TYPES.includes(type)) return pools.numbers.length
  if (type === 'unitMeaning') return pools.units.length
  if (type === 'phraseMeaning') return pools.phrases.length
  if (type === 'pronounChoice') return pools.pronounCells.length
  return vowelPool(type, pools.vowels).length
}

const uniqueBy = <T>(items: T[], key: (item: T) => string): T[] => [...new Map(items.map((x) => [key(x), x])).values()]

/** 一課的題庫 */
const lessonPools = (l: Lesson): ExamPools => {
  const numbers = new Set<number>()
  blocksOf(l, 'exam').forEach((b) => {
    if (b.config.numbers) poolNumbers(b.config.numbers).forEach((n) => numbers.add(n))
  })
  return {
    numbers: [...numbers].sort((a, b) => a - b),
    units: uniqueBy(lessonUnits(l), (u) => u.id),
    phrases: uniqueBy(lessonPhrases(l), (p) => p.id),
    vowels: uniqueBy(lessonVowels(l), (v) => v.id),
    pronounCells: lessonPronounCells(l),
  }
}

const mergePools = (pools: ExamPools[]): ExamPools => ({
  numbers: [...new Set(pools.flatMap((p) => p.numbers))].sort((a, b) => a - b),
  units: uniqueBy(pools.flatMap((p) => p.units), (u) => u.id),
  phrases: uniqueBy(pools.flatMap((p) => p.phrases), (p) => p.id),
  vowels: uniqueBy(pools.flatMap((p) => p.vowels), (v) => v.id),
  pronounCells: pools.flatMap((p) => p.pronounCells),
})

/** 累積考：每課每種題型的題數減半（無條件進位，至少 1 題） */
export const cumulativeCount = (count: number): number => Math.max(1, Math.ceil(count / 2))

/**
 * 考試範圍：只考本課＝本課的設定；
 * 累積＝第 1 課到本課，每課各自出題（題數減半，題目從該課的題庫抽），錯誤選項從所有課合併的題庫挑。
 * 題數不超過題庫大小；題庫是空的題型不出（例如還沒有筆順的手寫母音）
 */
export const examPlan = (lessons: readonly Lesson[], no: number, scope: ExamScope): ExamPlan => {
  const included = lessons.filter((l) => (scope === 'lesson' ? l.no === no : l.no <= no))
  const sections: ExamSection[] = included.map((l) => {
    const pools = lessonPools(l)
    const questions = blocksOf(l, 'exam')
      .flatMap((b) => b.config.questions)
      .map((q) => ({ type: q.type, count: Math.min(scope === 'lesson' ? q.count : cumulativeCount(q.count), poolSize(q.type, pools)) }))
      .filter((q) => q.count > 0)
    return { lessonNo: l.no, pools, questions }
  })
  // 設定畫面：同題型各課加總（依第一次出現的順序）
  const totals = new Map<ExamQuestionType, number>()
  sections.forEach((s) => s.questions.forEach((q) => totals.set(q.type, (totals.get(q.type) ?? 0) + q.count)))
  return {
    ...mergePools(sections.map((s) => s.pools)),
    questions: [...totals].map(([type, count]) => ({ type, count })),
    sections,
  }
}

/** 依考試範圍出題：各課從自己的題庫抽，同一課同題型的題目不重複，整份考卷順序隨機 */
export const buildExam = (plan: ExamPlan): ExamQuestion[] => {
  const questions: ExamQuestion[] = []
  plan.sections.forEach(({ lessonNo, pools, questions: qs }) => {
    qs.forEach(({ type, count }) => {
      const id = (i: number) => `${type}-${lessonNo}-${i}`
      if (type === 'unitMeaning') {
        shuffleArray(pools.units).slice(0, count).forEach((u, i) => questions.push(unitQuestion(u, plan.units, id(i))))
      } else if (type === 'phraseMeaning') {
        shuffleArray(pools.phrases).slice(0, count).forEach((p, i) => questions.push(phraseQuestion(p, plan.phrases, id(i))))
      } else if (type === 'pronounChoice') {
        shuffleArray(pools.pronounCells).slice(0, count).forEach((c, i) => questions.push(pronounQuestion(c, plan.pronounCells, id(i))))
      } else if (type.startsWith('vowel')) {
        // 題目從該題型的題庫抽，錯誤選項從全部母音挑
        shuffleArray(vowelPool(type, pools.vowels)).slice(0, count).forEach((v, i) => questions.push(vowelQuestion(type, v, plan.vowels, id(i))))
      } else {
        shuffleArray(pools.numbers).slice(0, count).forEach((n, i) => questions.push(numberQuestion(type, n, id(i))))
      }
    })
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
