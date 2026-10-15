// 隨身聽、打字練習、音檔打包、離線語音使用的完整分類：原本的單字庫＋每週課程（「第N課」）
// thaiVocab.ts 是原版資料不修改，課程分類在這裡合併
import { VOCAB_CATEGORIES } from '@/data/thaiVocab'
import { LESSON_VOCAB_CATEGORIES, LESSONS } from '@/data/lessons'
import type { VocabCategories } from '@/types/thai'

export const ALL_VOCAB_CATEGORIES: VocabCategories = { ...VOCAB_CATEGORIES, ...LESSON_VOCAB_CATEGORIES }

const VOCAB_TH = new Set(Object.values(ALL_VOCAB_CATEGORIES).flatMap((list) => list.map((w) => w.th)))

/** 是否為分類裡的單字（音檔打包只會產生這些字的 mp3，其他直接用 TTS） */
export const isVocabText = (th: string): boolean => VOCAB_TH.has(th)

/** 課程分類的圖示 */
export const LESSON_CATEGORY_ICON = '📘'

/** 課程分類對應的課次（不是課程分類回傳 null） */
export const lessonNoOfCategory = (cat: string): number | null => LESSONS.find((l) => l.category === cat)?.no ?? null
