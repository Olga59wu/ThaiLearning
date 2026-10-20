import { describe, expect, it } from 'vitest'
import { LESSONS } from '@/data/lessons'
import {
  buildExam,
  digitDistractors,
  examPlan,
  listenDistractors,
  normalizeNumberInput,
  OPTION_COUNT,
  pronounDistractors,
  reshuffleQuestions,
  vowelDistractors,
  vowelSoundKey,
} from '@/utils/lessonExam'
import type { Lesson } from '@/types/lesson'
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

// ---- 第 2 課：母音、人稱代名詞 ----
const lesson2Plan = () => examPlan(LESSONS, 2, 'lesson')
const vowelNo = (no: number) => lesson2Plan().vowels.find((v) => v.no === no)!

describe('examPlan（第 2 課）', () => {
  it('母音 32 個、人稱代名詞 16 格、常用語 4 句；沒有數字題', () => {
    const plan = lesson2Plan()
    expect(plan.vowels).toHaveLength(32)
    expect(plan.pronounCells).toHaveLength(16)
    expect(plan.phrases).toHaveLength(4)
    expect(plan.numbers).toHaveLength(0)
  })
  it('還沒有母音筆順時不出手寫母音題；其他題型照設定', () => {
    const types = Object.fromEntries(lesson2Plan().questions.map((q) => [q.type, q.count]))
    expect(types).toEqual({ vowelSound: 5, vowelListen: 4, vowelLength: 3, pronounChoice: 4, phraseMeaning: 4 })
  })
  it('累積考包含第 1、2 課的題型與題庫', () => {
    const plan = examPlan(LESSONS, 2, 'cumulative')
    const types = plan.questions.map((q) => q.type)
    expect(types).toEqual(expect.arrayContaining(['digitChoice', 'unitMeaning', 'vowelSound', 'pronounChoice', 'phraseMeaning']))
    expect(plan.numbers).toContain(35)
    expect(plan.vowels).toHaveLength(32)
    expect(plan.phrases).toHaveLength(9)
  })
  it('題數不超過題庫：有筆順的母音才出手寫題', () => {
    // 假的課程：只有 2 個母音，其中 1 個有筆順（課程限定母音的 strokes）
    const fake = (strokes?: string[]): Lesson => ({
      no: 99, date: '2026-01-01', title: '測試', category: '第99課',
      blocks: [
        { type: 'vowels', title: '母音', vowels: [
          { id: 't-v1', no: 1, form: '-ะ', withO: 'อะ', roman: 'a', tone: 'low', length: 'short', group: 'short', strokes },
          { id: 't-v2', no: 2, form: '-า', withO: 'อา', roman: 'a', tone: 'mid', length: 'long', group: 'long' },
        ] },
        { type: 'exam', config: { questions: [{ type: 'vowelHandwrite', count: 2 }, { type: 'vowelSound', count: 5 }] } },
      ],
    })
    expect(examPlan([fake()], 99, 'lesson').questions).toEqual([{ type: 'vowelSound', count: 2 }])
    const plan = examPlan([fake(['M 1 1 L 2 2'])], 99, 'lesson')
    expect(plan.questions).toEqual([{ type: 'vowelHandwrite', count: 1 }, { type: 'vowelSound', count: 2 }])
    const hw = buildExam(plan).find((q) => q.type === 'vowelHandwrite')!
    expect(hw.strokes).toEqual(['M 1 1 L 2 2'])
    expect(hw.guideText).toBe('อะ')
  })
})

describe('vowelDistractors', () => {
  const pool = () => lesson2Plan().vowels
  it('先放長短音的另一半（อิ／อี）', () => {
    for (let t = 0; t < 20; t++) {
      expect(vowelDistractors(vowelNo(3), pool()).map((v) => v.no)).toContain(4)
      expect(vowelDistractors(vowelNo(30), pool()).map((v) => v.no)).toContain(29)
    }
  })
  it('再放發音相近的（โอะ／เอาะ、เอะ／แอะ）', () => {
    for (let t = 0; t < 20; t++) {
      expect(vowelDistractors(vowelNo(13), pool()).map((v) => v.no)).toEqual(expect.arrayContaining([14, 15]))
      expect(vowelDistractors(vowelNo(9), pool()).map((v) => v.no)).toEqual(expect.arrayContaining([10, 11]))
    }
  })
  it('3 個、不重複、不和答案或彼此同音（ใ-／ไ- 不同時出現）', () => {
    for (let t = 0; t < 30; t++) {
      pool().forEach((v) => {
        const d = vowelDistractors(v, pool())
        expect(d).toHaveLength(3)
        const sounds = [v, ...d].map(vowelSoundKey)
        expect(new Set(sounds).size, v.form).toBe(4)
      })
    }
  })
})

describe('pronounDistractors', () => {
  it('3 個不同的字、不含答案；優先同一人稱', () => {
    const cells = lesson2Plan().pronounCells
    for (let t = 0; t < 30; t++) {
      cells.forEach((c) => {
        const d = pronounDistractors(c, cells)
        expect(d).toHaveLength(3)
        expect(new Set(d.map((w) => w.id)).size).toBe(3)
        expect(d.map((w) => w.id)).not.toContain(c.word.id)
      })
    }
    // 「我」有 5 種說法：錯誤選項全部來自「我」
    const meCell = cells.find((c) => c.person === '我' && c.level === '謙卑' && c.gender === 'female')!
    const meWords = new Set(cells.filter((c) => c.person === '我').map((c) => c.word.id))
    for (let t = 0; t < 20; t++) pronounDistractors(meCell, cells).forEach((w) => expect(meWords.has(w.id)).toBe(true))
  })
})

describe('buildExam（第 2 課，重複出題 30 次）', () => {
  const plan = lesson2Plan()
  const total = plan.questions.reduce((s, q) => s + q.count, 0)

  it('題數符合設定（20 題），同題型題目不重複', () => {
    expect(total).toBe(20)
    for (let t = 0; t < 30; t++) {
      const exam = buildExam(plan)
      expect(exam).toHaveLength(total)
      plan.questions.forEach(({ type, count }) => {
        const qs = exam.filter((q) => q.type === type)
        expect(qs).toHaveLength(count)
        const keys = qs.map((q) => q.vowel?.form ?? q.context ?? q.answerKey)
        // 人稱代名詞的「你/您」男女說法相同，情境字串不同即可
        expect(new Set(keys).size, type).toBe(count)
      })
    }
  })

  it('選項不重複、恰好 1 個正確；看長短只有 2 個選項，其他 4 個', () => {
    for (let t = 0; t < 30; t++) {
      buildExam(plan).forEach((q) => {
        expect(q.options, q.id).toBeDefined()
        expect(q.options).toHaveLength(q.type === 'vowelLength' ? 2 : OPTION_COUNT)
        expect(new Set(q.options!.map((o) => o.key)).size).toBe(q.options!.length)
        expect(q.options!.filter((o) => o.key === q.answerKey)).toHaveLength(1)
      })
    }
  })

  it('看母音選發音：選項不顯示泰文（泰文就是題目的字形）', () => {
    buildExam(plan)
      .filter((q) => q.type === 'vowelSound')
      .forEach((q) => q.options!.forEach((o) => expect(o.hideThai).toBe(true)))
  })

  it('看長短不出特殊母音（沒有長短之分）', () => {
    for (let t = 0; t < 30; t++) {
      buildExam(plan)
        .filter((q) => q.type === 'vowelLength')
        .forEach((q) => expect(q.vowel!.length).toBeDefined())
    }
  })

  it('人稱代名詞：答案是情境對應的字', () => {
    for (let t = 0; t < 10; t++) {
      buildExam(plan)
        .filter((q) => q.type === 'pronounChoice')
        .forEach((q) => {
          const cell = plan.pronounCells.find((c) => `${c.person}・${c.gender === 'male' ? '男生' : '女生'}・${c.level}` === q.context)!
          expect(q.answerKey).toBe(cell.word.id)
        })
    }
  })

  it('常用語：再會（第 2 課）與你好／再見（第 1 課）在累積考不同時出現', () => {
    const cum = examPlan(LESSONS, 2, 'cumulative')
    const meaningOf = (id: string) => cum.phrases.find((p) => p.id === id)!.meaning
    const pair = [meaningOf('l02-p3'), meaningOf('l01-p1')]
    for (let t = 0; t < 30; t++) {
      buildExam(cum)
        .filter((q) => q.type === 'phraseMeaning' && pair.includes(q.answerKey))
        .forEach((q) => {
          const other = pair.find((m) => m !== q.answerKey)!
          expect(q.options!.map((o) => o.key)).not.toContain(other)
        })
    }
  })
})
