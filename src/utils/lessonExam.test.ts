import { describe, expect, it } from 'vitest'
import { LESSONS } from '@/data/lessons'
import {
  buildExam,
  digitDistractors,
  examPlan,
  listenDistractors,
  normalizeNumberInput,
  OPTION_COUNT,
  reshuffleQuestions,
} from '@/utils/lessonExam'
import { toThaiDigits } from '@/utils/thaiNumber'

const lesson1Plan = () => examPlan(LESSONS, 1, 'lesson')

describe('digitDistractors', () => {
  it('優先使用易混淆的字', () => {
    expect(digitDistractors(2)).toContain('๓')
    expect(digitDistractors(4)).toContain('๕')
    expect(digitDistractors(8)).toContain('๙')
    expect(digitDistractors(23)).toEqual(expect.arrayContaining(['๓๓', '๒๒']))
  })
  it.each([0, 1, 7, 10, 11, 23, 35, 100, 101, 1000])('%i：3 個、不重複、不含答案、沒有前導 ๐', (n) => {
    const d = digitDistractors(n)
    expect(d).toHaveLength(3)
    expect(new Set(d).size).toBe(3)
    expect(d).not.toContain(toThaiDigits(n))
    d.forEach((x) => expect(x.length === 1 || !x.startsWith('๐')).toBe(true))
  })
})

describe('listenDistractors', () => {
  it('唸法相近的數字', () => {
    expect(listenDistractors(12)).toEqual([21, 22, 2])
    expect(listenDistractors(0)).toHaveLength(3)
    expect(listenDistractors(0)).not.toContain(0)
  })
})

describe('examPlan', () => {
  it('第 1 課：數字範圍、單位、常用語', () => {
    const plan = lesson1Plan()
    expect(plan.numbers).toContain(0)
    expect(plan.numbers).toContain(35)
    expect(plan.numbers).toContain(1000)
    expect(plan.units).toHaveLength(10)
    expect(plan.phrases).toHaveLength(5)
  })
  it('累積考包含第 1 課到本課', () => {
    const last = LESSONS[LESSONS.length - 1]!
    const plan = examPlan(LESSONS, last.no, 'cumulative')
    expect(plan.phrases.length).toBeGreaterThanOrEqual(lesson1Plan().phrases.length)
  })
})

describe('buildExam（第 1 課，重複出題 30 次）', () => {
  const plan = lesson1Plan()
  const total = plan.questions.reduce((s, q) => s + q.count, 0)

  it('題數與題型符合設定，同題型題目不重複', () => {
    for (let t = 0; t < 30; t++) {
      const exam = buildExam(plan)
      expect(exam).toHaveLength(total)
      plan.questions.forEach(({ type, count }) => {
        const qs = exam.filter((q) => q.type === type)
        expect(qs).toHaveLength(count)
        const keys = qs.map((q) => q.num ?? q.answerKey + q.reading?.th)
        expect(new Set(keys).size).toBe(count)
      })
    }
  })

  it('選擇題：4 個選項、不重複、恰好 1 個正確', () => {
    for (let t = 0; t < 30; t++) {
      buildExam(plan).forEach((q) => {
        if (!q.options) return
        expect(q.options, q.id).toHaveLength(OPTION_COUNT)
        expect(new Set(q.options.map((o) => o.key)).size).toBe(OPTION_COUNT)
        expect(q.options.filter((o) => o.key === q.answerKey)).toHaveLength(1)
      })
    }
  })

  it('常用語：題目是「不用客氣／沒關係」其中一句時，另一句不會出現在選項（避免兩個正確答案）', () => {
    const meaningOf = (id: string) => plan.phrases.find((p) => p.id === id)!.meaning
    const pair = [meaningOf('l01-p3'), meaningOf('l01-p5')]
    for (let t = 0; t < 30; t++) {
      buildExam(plan)
        .filter((q) => q.type === 'phraseMeaning')
        .forEach((q) => {
          const keys = q.options!.map((o) => o.key)
          if (pair.includes(q.answerKey)) {
            const other = pair.find((m) => m !== q.answerKey)!
            expect(keys, keys.join(' / ')).not.toContain(other)
          }
          // 題目帶 ครับ 或 ค่ะ
          expect(q.reading!.th).toMatch(/(ครับ|ค่ะ)$/)
        })
    }
  })

  it('題目與答案的顯示文字不含泰文字母（只有泰文數字與拼音）', () => {
    const thaiLetters = /[ก-๏]/
    buildExam(plan).forEach((q) => {
      expect(q.promptLabel, q.id).not.toMatch(thaiLetters)
      expect(q.answerLabel, q.id).not.toMatch(thaiLetters)
    })
  })
})

describe('reshuffleQuestions', () => {
  it('同樣的題目與選項，只是順序不同', () => {
    const exam = buildExam(lesson1Plan()).slice(0, 5)
    const again = reshuffleQuestions(exam)
    expect(again.map((q) => q.id).sort()).toEqual(exam.map((q) => q.id).sort())
    again.forEach((q) => {
      const orig = exam.find((x) => x.id === q.id)!
      expect(q.answerKey).toBe(orig.answerKey)
      expect(q.options?.map((o) => o.key).sort()).toEqual(orig.options?.map((o) => o.key).sort())
    })
  })
})

describe('normalizeNumberInput', () => {
  it('接受泰文數字、逗號、空白', () => {
    expect(normalizeNumberInput('23')).toBe('23')
    expect(normalizeNumberInput('๒๓')).toBe('23')
    expect(normalizeNumberInput('1,000')).toBe('1000')
    expect(normalizeNumberInput(' 07 ')).toBe('7')
    expect(normalizeNumberInput('abc')).toBeNull()
    expect(normalizeNumberInput('')).toBeNull()
  })
})
