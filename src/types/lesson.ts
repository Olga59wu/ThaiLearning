// 每週課程（src/data/lessons/lesson-XX.ts）的資料結構

/** 標準 5 種聲調 */
export type Tone = 'mid' | 'low' | 'falling' | 'high' | 'rising'

/** 一個音節：泰文（課本的發音拼法，例如 สะ-หวัด）、羅馬拼音、聲調 */
export interface Syllable {
  th: string
  roman: string
  tone: Tone
}

/** 連結到現有資料（不複製）：分類單字 id、/thai 項目的 char、sentenceData 的 thai */
export interface DataRef {
  vocabId?: string
  thaiChar?: string
  sentence?: string
}

interface WordBase {
  syllables: Syllable[]
  /** 課本上的完整中文（課程頁、考試用）；沒有時用分類單字的 zh */
  meaning?: string
  /** 數字字詞的值（測試時和 numberToThai 比對） */
  num?: number
  /** 是否放進「📘 第N課」分類，預設 true */
  inCategory?: boolean
}

/** 連結字：th／zh 從 thaiVocab 取得 */
export interface RefWord extends WordBase {
  kind: 'ref'
  ref: DataRef & { vocabId: string }
}

/** 新字：要給固定 id（`l01-0001` 格式），收藏／已學會才能用 id 比對 */
export interface NewWord extends WordBase {
  kind: 'new'
  id: string
  th: string
  zh: string
  ref?: DataRef
}

export type LessonWord = RefWord | NewWord

/** 解析後的字詞（RefWord 已帶入 th／zh） */
export interface ResolvedWord {
  id: string
  th: string
  zh: string
  syllables: Syllable[]
  meaning: string
  num?: number
  ref?: DataRef
  inCategory: boolean
}

export type Particle = 'ครับ' | 'ค่ะ'

export interface LessonPhrase {
  id: string
  /** 原形（不含 ครับ／ค่ะ） */
  base: LessonWord
  meaning: string
  /** 考試畫面隨機帶一個 */
  particles: Particle[]
  /** 有放進分類的語尾版本與其 id */
  variantIds?: Partial<Record<Particle, string>>
  /** 意思重疊的 phrase id，不可同時出現在選項 */
  confusableWith?: string[]
}

/** 數字範圍：min～max 再加上 extra */
export interface NumberPool {
  min: number
  max: number
  extra?: number[]
}

export type ExamQuestionType =
  | 'digitChoice' // 阿拉伯數字 → 選泰文數字
  | 'digitInput' // 泰文數字 → 輸入阿拉伯數字
  | 'digitHandwrite' // 阿拉伯數字 → 手寫泰文數字（自評 ✓／✗）
  | 'readingChoice' // 數字 → 選泰文唸法
  | 'listenNumber' // 聽發音 → 選數字
  | 'unitMeaning' // 單位泰文 → 選中文
  | 'phraseMeaning' // 常用語 → 選中文

export interface ExamConfig {
  numbers: NumberPool
  questions: { type: ExamQuestionType; count: number }[]
}

/** 面額（唸法由數字函式產生） */
export interface Denomination {
  value: number
  unit: 'บาท' | 'สตางค์'
  kind: 'coin' | 'note'
  /** 印刷說明，例如鈔票人像 */
  note?: string
}

/** 規則：說明與例子（例子會用數字函式產生唸法） */
export interface LessonRule {
  text: string
  examples: number[]
}

export type LessonBlock =
  | { type: 'vocab'; title: string; layout: 'numbers' | 'units' | 'plain'; words: LessonWord[] }
  | { type: 'currency'; title: string; words: LessonWord[]; denominations: Denomination[] }
  | { type: 'rules'; title: string; rules: LessonRule[] }
  | { type: 'phrases'; title: string; phrases: LessonPhrase[] }
  | { type: 'notes'; title: string; items: string[] }
  | { type: 'homework'; title: string; task: string; numbers: NumberPool }
  | { type: 'practice'; numberReading?: NumberPool }
  | { type: 'exam'; config: ExamConfig }

export interface Lesson {
  /** 課次（網址 /lessons/1） */
  no: number
  /** 上課日期 YYYY-MM-DD */
  date: string
  title: string
  /** 隨身聽／打字練習的分類名稱，例如 '📘 第1課' */
  category: string
  blocks: LessonBlock[]
}

export interface ExamWrongAnswer {
  type: ExamQuestionType
  prompt: string
  answer: string
  given: string | null
}

/** 考試紀錄：本機存完整，雲端只存摘要（每課最近一次帶 wrong） */
export interface LessonExamRecord {
  id: string
  lessonNo: number
  scope: 'lesson' | 'cumulative'
  /** 只重考錯題 */
  retry: boolean
  /** ISO 時間 */
  date: string
  correct: number
  total: number
  wrong?: ExamWrongAnswer[]
}
