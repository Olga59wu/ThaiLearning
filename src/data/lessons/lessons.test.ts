import { describe, expect, it } from 'vitest'
import { sentenceData, thaiData } from '@/data/thai'
import { FULL_VOCAB, VOCAB_CATEGORIES } from '@/data/thaiVocab'
import { ALL_VOCAB_CATEGORIES, lessonNoOfCategory } from '@/data/vocabCategories'
import { blocksOf, LESSON_VOCAB_CATEGORIES, LESSONS, lessonPhrases, lessonUnits, lessonWords, resolveWord } from '@/data/lessons'
import { sy } from '@/data/lessons/helpers'
import { numberToSyllables, numberToThai, numberWordSyllables } from '@/utils/thaiNumber'
import type { ExamQuestionType, LessonWord } from '@/types/lesson'

const allRawWords = (): LessonWord[] =>
  LESSONS.flatMap((l) => [
    ...l.blocks.flatMap((b) => (b.type === 'vocab' || b.type === 'currency' ? b.words : [])),
    ...lessonPhrases(l).map((p) => p.base),
  ])

describe('sy()', () => {
  it('解析課本寫法', () => {
    expect(sy('ยี่ yi ˋ | สิบ sib ˇ')).toEqual([
      { th: 'ยี่', roman: 'yi', tone: 'falling' },
      { th: 'สิบ', roman: 'sib', tone: 'low' },
    ])
  })
  it('格式錯誤會丟錯', () => {
    expect(() => sy('ยี่ yi')).toThrow()
    expect(() => sy('ยี่ yi v')).toThrow()
  })
})

describe('課程清單', () => {
  it('課次、分類名稱不重複，日期格式正確', () => {
    expect(new Set(LESSONS.map((l) => l.no)).size).toBe(LESSONS.length)
    expect(new Set(LESSONS.map((l) => l.category)).size).toBe(LESSONS.length)
    LESSONS.forEach((l) => expect(l.date).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  })
  it('分類名稱是「第N課」：不含空白與 emoji（隨身聽用它組 class 與 substring 顯示）', () => {
    LESSONS.forEach((l) => expect(l.category).toBe(`第${l.no}課`))
  })
  it('合併進完整分類，且不蓋掉原本的分類', () => {
    LESSONS.forEach((l) => expect(ALL_VOCAB_CATEGORIES[l.category]).toBe(LESSON_VOCAB_CATEGORIES[l.category]))
    Object.keys(VOCAB_CATEGORIES).forEach((cat) => expect(ALL_VOCAB_CATEGORIES[cat]).toBe(VOCAB_CATEGORIES[cat]))
    expect(lessonNoOfCategory('第1課')).toBe(1)
    expect(lessonNoOfCategory('數字與時間')).toBeNull()
  })
})

describe('連結現有資料', () => {
  it('所有 ref 都找得到', () => {
    allRawWords().forEach((w) => {
      const r = resolveWord(w)
      if (r.ref?.thaiChar) expect(thaiData.some((t) => t.char === r.ref!.thaiChar), r.ref.thaiChar).toBe(true)
      if (r.ref?.sentence) {
        expect(sentenceData.some((s) => s.thai === r.ref!.sentence), r.ref.sentence).toBe(true)
        expect(r.ref.sentence).toBe(r.th)
      }
    })
  })
  it('新字的 th 不可和現有單字重複（重複的要用 ref 連結）', () => {
    allRawWords().forEach((w) => {
      if (w.kind === 'new') expect(FULL_VOCAB.find((v) => v.th === w.th), w.th).toBeUndefined()
    })
  })
})

describe('id', () => {
  it('新 id 不和現有單字衝突，同一個 id 只對應一個泰文', () => {
    const map = new Map<string, string>()
    LESSONS.forEach((l) => {
      lessonVocab(l).forEach((v) => {
        if (map.has(v.id)) expect(map.get(v.id), v.id).toBe(v.th)
        map.set(v.id, v.th)
      })
    })
    allRawWords().forEach((w) => {
      if (w.kind === 'new') expect(FULL_VOCAB.some((v) => v.id === w.id), w.id).toBe(false)
    })
  })
  it('常用語 id 不重複，confusableWith 互相指向存在的常用語', () => {
    LESSONS.forEach((l) => {
      const phrases = lessonPhrases(l)
      const ids = phrases.map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
      phrases.forEach((p) =>
        p.confusableWith?.forEach((c) => {
          const other = phrases.find((x) => x.id === c)
          expect(other, c).toBeDefined()
          expect(other!.confusableWith).toContain(p.id)
        }),
      )
    })
  })
})

const lessonVocab = (l: (typeof LESSONS)[number]) => LESSON_VOCAB_CATEGORIES[l.category]!

describe('數字字詞與數字函式一致', () => {
  it('泰文、拼音、聲調都和 numberToThai 相同', () => {
    LESSONS.forEach((l) =>
      lessonWords(l).forEach((w) => {
        if (w.num === undefined) return
        expect(w.th, `${w.num}`).toBe(numberToThai(w.num))
        expect(w.syllables, `${w.num}`).toEqual(numberToSyllables(w.num))
      }),
    )
  })
})

describe('第 1 課', () => {
  const l1 = LESSONS.find((l) => l.no === 1)!
  it('分類內容', () => {
    const vocab = lessonVocab(l1)
    // 0～25（26）＋ 101/111/121（3）＋ 單位（10，สิบ 與 10 重複 → 9）＋ 貨幣（3）＋ 常用語原形（4）＋ ค่ะ 版（5）
    expect(vocab).toHaveLength(26 + 3 + 9 + 3 + 4 + 5)
    expect(vocab.map((v) => v.th)).toEqual(
      expect.arrayContaining(['สวัสดี', 'สวัสดีค่ะ', 'ไม่ต้องเกรงใจค่ะ', 'หมื่น', 'สตางค์']),
    )
    expect(vocab.map((v) => v.th)).not.toContain('ไม่ต้องเกรงใจ')
  })
  it('單位有 10 個，意思不重複', () => {
    const units = lessonUnits(l1)
    expect(units).toHaveLength(10)
    expect(new Set(units.map((u) => u.meaning)).size).toBe(10)
  })
})

describe('規則說明', () => {
  it('{泰文} 標記都能解析成音節；標記外不含泰文字', () => {
    LESSONS.forEach((l) =>
      blocksOf(l, 'rules').forEach((b) =>
        b.rules.forEach((r) => {
          const tokens = [...r.text.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]!)
          tokens.forEach((t) => expect(numberWordSyllables(t), t).not.toBeNull())
          expect(r.text.replace(/\{[^}]+\}/g, ''), r.text).not.toMatch(/[\u0E00-\u0E7F]/)
        }),
      ),
    )
  })
  it('筆記不含泰文字', () => {
    LESSONS.forEach((l) => blocksOf(l, 'notes').forEach((b) => b.items.forEach((t) => expect(t).not.toMatch(/[\u0E00-\u0E7F]/))))
  })
})

describe('考試設定', () => {
  const NUMERIC: ExamQuestionType[] = ['digitChoice', 'digitInput', 'digitHandwrite', 'readingChoice', 'listenNumber']
  LESSONS.forEach((l) => {
    it(`第 ${l.no} 課：題數合理`, () => {
      const exams = blocksOf(l, 'exam')
      expect(exams).toHaveLength(1)
      const { numbers, questions } = exams[0]!.config
      expect(numbers.min).toBeLessThanOrEqual(numbers.max)
      const poolSize = new Set([
        ...Array.from({ length: numbers.max - numbers.min + 1 }, (_, i) => numbers.min + i),
        ...(numbers.extra ?? []),
      ]).size
      questions.forEach((q) => {
        expect(q.count).toBeGreaterThan(0)
        if (NUMERIC.includes(q.type)) expect(q.count).toBeLessThanOrEqual(poolSize)
        if (q.type === 'phraseMeaning') expect(q.count).toBeLessThanOrEqual(lessonPhrases(l).length)
        if (q.type === 'unitMeaning') expect(q.count).toBeLessThanOrEqual(lessonUnits(l).length)
      })
    })
  })
})
