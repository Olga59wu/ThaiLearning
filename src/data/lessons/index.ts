// 每週課程：解析連結字詞、整理分類（課程清單在 registry.ts）
import { FULL_VOCAB } from '@/data/thaiVocab'
import type { VocabCategories, VocabWord } from '@/types/thai'
import type { Lesson, LessonBlock, LessonPhrase, LessonVowel, LessonWord, PronounCell, ResolvedWord } from '@/types/lesson'
import { LESSONS } from './registry'

export { getLesson, latestLesson, LESSONS } from './registry'

/** RefWord 帶入 thaiVocab 的 th／zh；找不到 id 直接丟錯（測試會抓到） */
export const resolveWord = (w: LessonWord): ResolvedWord => {
  if (w.kind === 'new') {
    return {
      id: w.id,
      th: w.th,
      zh: w.zh,
      syllables: w.syllables,
      meaning: w.meaning ?? w.zh,
      num: w.num,
      placeValue: w.placeValue,
      note: w.note,
      ref: w.ref,
      inCategory: w.inCategory ?? true,
      pencil: w.pencil,
    }
  }
  const vocab = FULL_VOCAB.find((v) => v.id === w.ref.vocabId)
  if (!vocab) throw new Error(`找不到連結的單字 id：${w.ref.vocabId}`)
  return {
    id: vocab.id,
    th: vocab.th,
    zh: vocab.zh,
    syllables: w.syllables,
    meaning: w.meaning ?? vocab.zh,
    num: w.num,
    placeValue: w.placeValue,
    note: w.note,
    ref: w.ref,
    inCategory: w.inCategory ?? true,
    pencil: w.pencil,
  }
}

type BlockOf<T extends LessonBlock['type']> = Extract<LessonBlock, { type: T }>

export const blocksOf = <T extends LessonBlock['type']>(lesson: Lesson, type: T): BlockOf<T>[] =>
  lesson.blocks.filter((b): b is BlockOf<T> => b.type === type)

/** 各區塊的字詞（未解析；單字表、貨幣、人稱代名詞、用法），依出現順序，不去重；常用語另外處理 */
export const lessonRawWords = (lesson: Lesson): LessonWord[] =>
  lesson.blocks.flatMap((b) => {
    if (b.type === 'vocab' || b.type === 'currency' || b.type === 'pronouns') return b.words
    if (b.type === 'usage') return b.items.flatMap((item) => [item.word, ...item.examples])
    return []
  })

/** 各區塊的字詞（已解析），依出現順序，不去重 */
export const lessonWords = (lesson: Lesson): ResolvedWord[] => lessonRawWords(lesson).map(resolveWord)

/** 數字單位（有 placeValue 的字詞） */
export const lessonUnits = (lesson: Lesson): ResolvedWord[] =>
  lessonWords(lesson).filter((w) => w.placeValue !== undefined)

export const lessonPhrases = (lesson: Lesson): LessonPhrase[] => blocksOf(lesson, 'phrases').flatMap((b) => b.phrases)

export const lessonVowels = (lesson: Lesson): LessonVowel[] => blocksOf(lesson, 'vowels').flatMap((b) => b.vowels)

/** 人稱代名詞表的格子，帶上解析後的字 */
export const lessonPronounCells = (lesson: Lesson): (PronounCell & { word: ResolvedWord })[] =>
  blocksOf(lesson, 'pronouns').flatMap((b) => {
    const words = b.words.map(resolveWord)
    return b.cells.map((cell) => {
      const word = words.find((w) => w.id === cell.wordId)
      if (!word) throw new Error(`人稱代名詞表找不到字：${cell.wordId}`)
      return { ...cell, word }
    })
  })

/** 「第N課」分類：字詞＋常用語原形＋語尾版本，以 id 去重 */
export const lessonVocab = (lesson: Lesson): VocabWord[] => {
  const result: VocabWord[] = []
  const add = (w: VocabWord) => {
    if (!result.some((r) => r.id === w.id)) result.push(w)
  }
  lessonWords(lesson).forEach((w) => {
    if (w.inCategory) add({ id: w.id, th: w.th, zh: w.zh })
  })
  lessonPhrases(lesson).forEach((p) => {
    const base = resolveWord(p.base)
    if (base.inCategory) add({ id: base.id, th: base.th, zh: base.zh })
    p.variants?.forEach((v) => add({ id: v.id, th: base.th + v.particle, zh: v.zh }))
  })
  return result
}

export const LESSON_VOCAB_CATEGORIES: VocabCategories = Object.fromEntries(
  LESSONS.map((l) => [l.category, lessonVocab(l)]),
)
