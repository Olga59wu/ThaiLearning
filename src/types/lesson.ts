// 每週課程（src/data/lessons/lesson-XX.ts）的資料結構

/** 標準 5 種聲調 */
export type Tone = 'mid' | 'low' | 'falling' | 'high' | 'rising'

/** 一個音節：泰文（課本的發音拼法，例如 สะ-หวัด）、羅馬拼音、聲調 */
export interface Syllable {
  th: string
  roman: string
  tone: Tone
}

/** 鉛筆筆記：使用者自己在課本上的手寫補充（和課本印刷內容分開顯示） */
export interface PencilNote {
  /** 課本頁碼 */
  page: number
  text: string
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
  /** 數字單位的位值（10、100…），內容頁顯示用 */
  placeValue?: number
  /** 課本上的補充（例如位數大寫 佰） */
  note?: string
  /** 中文音檔要念的文字（pnpm audio:fetch）：有填就用它，沒填才套用清理規則（去掉括號內容、「/」改「，」）；用在括號內的說明是重點時 */
  zhSpeak?: string
  /** 是否放進「📘 第N課」分類，預設 true */
  inCategory?: boolean
  pencil?: PencilNote[]
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
  placeValue?: number
  note?: string
  ref?: DataRef
  inCategory: boolean
  pencil?: PencilNote[]
}

export type Particle = 'ครับ' | 'ค่ะ'

export interface LessonPhrase {
  id: string
  /** 原形（不含 ครับ／ค่ะ） */
  base: LessonWord
  meaning: string
  /** 考試畫面隨機帶一個 */
  particles: Particle[]
  /** 有放進分類的語尾版本（固定 id，zh 為分類顯示用） */
  variants?: { particle: Particle; id: string; zh: string }[]
  /** 意思重疊的 phrase id（可跨課），不可同時出現在選項 */
  confusableWith?: string[]
  pencil?: PencilNote[]
}

/** 母音分組：短音、長音、特殊、獨立 */
export type VowelGroup = 'short' | 'long' | 'special' | 'independent'

/** 母音（課本寫法；一律用 thaiChar 連結 thaiData，寫法、筆順、念法、位置說明、已停用都以 thaiData 為準） */
export interface LessonVowel {
  /** 固定 id（`l02-v01` 格式） */
  id: string
  /** 課本編號 1～32 */
  no: number
  /** 課本字形，- 表示子音位置（例如 -ะ） */
  form: string
  /** 搭配 อ 的寫法（獨立母音是借用的唸法，例如 รึ）；發音用它 */
  withO: string
  /** 課本拼音 */
  roman: string
  /** 課本括號內的注音（有的才填） */
  zhuyin?: string
  tone: Tone
  /** 長短音；特殊母音沒有 */
  length?: 'short' | 'long'
  group: VowelGroup
  /** thaiData 的 char（例如 ◌ะ） */
  thaiChar: string
  /** 母音名稱（例如 ไม้ม้วน） */
  name?: Syllable[]
  /** 課本上的補充（例如只有 20 個單字） */
  note?: string
  pencil?: PencilNote[]
}

export type PronounPerson = '我' | '你/您' | '他/她'
export type PronounLevel = '一般' | '禮貌' | '謙卑' | '尊稱'

/** 人稱代名詞表的一格：wordId 指向 pronouns 區塊 words 解析後的 id */
export interface PronounCell {
  person: PronounPerson
  gender: 'male' | 'female'
  level: PronounLevel
  wordId: string
  pencil?: PencilNote[]
}

/** 用法：一個字＋例子（例如 複數 พวก＋人稱代名詞） */
export interface UsageItem {
  /** 例如「複數」 */
  label?: string
  word: LessonWord
  /** 字後面的說明，例如「＋人稱代名詞」、「的用法」 */
  pattern?: string
  examples: LessonWord[]
  pencil?: PencilNote[]
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
  | 'vowelSound' // 看母音字形 → 選發音（拼音＋注音＋聲調）
  | 'vowelListen' // 聽母音發音 → 選字形
  | 'vowelLength' // 看母音 → 判斷長音／短音
  | 'vowelHandwrite' // 看發音 → 手寫母音（有筆順的才出；自評 ✓／✗）
  | 'pronounChoice' // 人稱代名詞：看情境 → 選拼音

export interface ExamConfig {
  /** 數字題的範圍（沒有數字題時不用填） */
  numbers?: NumberPool
  questions: { type: ExamQuestionType; count: number }[]
}

/** 面額（唸法由數字函式產生） */
export interface Denomination {
  value: number
  unit: 'บาท' | 'สตางค์'
  kind: 'coin' | 'note'
}

/** 規則：說明與例子（例子會用數字函式產生唸法） */
export interface LessonRule {
  /** 說明文字；泰文用 {泰文} 標記（例如 {เอ็ด}），畫面顯示成拼音＋聲調，關閉泰文字時不顯示泰文 */
  text: string
  examples: number[]
}

export type LessonBlock =
  | { type: 'vocab'; title: string; titleTh?: string; layout: 'numbers' | 'units' | 'plain'; words: LessonWord[] }
  | { type: 'currency'; title: string; titleTh?: string; words: LessonWord[]; denominations: Denomination[] }
  | { type: 'rules'; title: string; rules: LessonRule[] }
  | { type: 'phrases'; title: string; phrases: LessonPhrase[] }
  | { type: 'notes'; title: string; items: string[] }
  | { type: 'homework'; title: string; task: string; numbers: NumberPool }
  | { type: 'practice'; numberReading?: NumberPool }
  | { type: 'exam'; config: ExamConfig }
  | {
      type: 'vowels'
      title: string
      titleTh?: string
      /** 標題的唸法（例如 สระ sa-ra） */
      intro?: Syllable[]
      summary?: string
      vowels: LessonVowel[]
      /** 分組標題旁的鉛筆筆記 */
      groupPencil?: Partial<Record<VowelGroup, PencilNote[]>>
    }
  | { type: 'pronouns'; title: string; words: LessonWord[]; cells: PronounCell[] }
  | { type: 'usage'; title: string; items: UsageItem[] }

export interface Lesson {
  /** 課次（網址 /lessons/1） */
  no: number
  /** 上課日期 YYYY-MM-DD */
  date: string
  title: string
  /** 隨身聽／打字練習的分類名稱，例如 '第1課'（不含 emoji 與空白；圖示 📘 由 LESSON_CATEGORY_ICON 顯示） */
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
