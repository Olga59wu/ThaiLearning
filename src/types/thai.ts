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
