import type { LessonExamRecord } from '@/types/lesson'

// data/thai.js（thai.html、path 頁使用）
export type ToneClass = 'Mid' | 'High' | 'Low'

export type ThaiItemType =
  | 'consonant'
  | 'vowel'
  | 'toneMark'
  | 'numbers'
  | 'fruits'
  | 'animals'
  | 'colors'
  | 'days'
  | 'family'

export interface ThaiItem {
  type: ThaiItemType
  char: string
  thaiLabel: string
  soundText: string
  name: string
  meaning: string
  reading: string
  img?: string
  toneClass?: ToneClass
  isCommon?: boolean
  duration?: 'Long' | 'Short'
  vowelLength?: 'Long' | 'Short'
  /** 母音的寫法：用 อ 表示子音位置（例如 ◌ะ → อะ），/thai 卡片、手寫底圖、/path 底字、課程頁共用；char 維持 ◌ 寫法（收藏、錯題、課程 ref 的識別碼） */
  writeBase?: string
  /** 母音的念法（課本 p40「สระ＋母音發音」，例如 สระอะ；獨立母音直接念 รึ、รือ）：/thai、課程頁、考試共用，音檔也用它（th_สระอะ.mp3） */
  speakText?: string
  finalType?: string
  strokes?: string[]
}

export type SentenceCategory = 'Basic' | 'Shopping' | 'Food' | 'Travel' | 'Emergency'

export interface Sentence {
  cat: SentenceCategory
  thai: string
  soundText: string
  meaning: string
  reading: string
}

export interface TonePracticeSeries {
  base: string
  chars: string[]
  reading: string
}

export interface ToneExample {
  thai: string
  read: string
  desc: string
}

export type ToneKey = 'Mid' | 'Low' | 'Falling' | 'High' | 'Rising' | 'Unknown'

// data/thaiTyping.js（隨身聽、打字、Downloader 使用）
export interface VocabWord {
  id: string
  th: string
  zh: string
}

export type VocabCategories = Record<string, VocabWord[]>

// Firestore users/{uid}.thai
export interface ThaiCloudData {
  correctCounts?: Record<string, number>
  favorites?: string[]
  mistakeList?: ThaiItem[]
  lastPlayTime?: number
  customList?: VocabWord[]
  knownWords?: VocabWord[]
  brokenAudio?: string[]
  mp3History?: string[]
  lastSelectedCategories?: string[]
  lastPlayedWord?: string | null
  playerLastUpdated?: number
  /** 每週課程考試紀錄（key 為課次；雲端只存摘要，見 stores/lessonRecords） */
  lessonExams?: Record<string, LessonExamRecord[]>
  [key: string]: unknown
}
