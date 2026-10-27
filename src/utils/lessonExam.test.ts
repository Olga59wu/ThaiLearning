import { describe, expect, it } from 'vitest'
import { LESSONS, lessonVowels } from '@/data/lessons'
import { vowelStrokes } from '@/data/lessons/vowels'
import { thaiData } from '@/data/thai'
import {
  buildExam,
  cumulativeCount,
  digitDistractors,
  examPlan,
  listenDistractors,
  normalizeNumberInput,
  OPTION_COUNT,
  practiceVowelQuestion,
  practiceVowels,
  pronounDistractors,
  reshuffleQuestions,
  vowelDistractors,
  vowelLengthPairs,
  vowelSoundKey,
} from '@/utils/lessonExam'
import { vowelDeprecated, vowelPositionKey } from '@/data/lessons/vowels'
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
// 手寫母音只出有筆順的：題數＝min(設定, 有筆順的母音數)，在 /path 畫好新的母音筆順時測試不用跟著改
const strokedVowelCount = lessonVowels(LESSONS.find((l) => l.no === 2)!).filter((v) => vowelStrokes(v) !== undefined).length
const HANDWRITE_LESSON = Math.min(2, strokedVowelCount)
const HANDWRITE_CUMULATIVE = Math.min(cumulativeCount(2), strokedVowelCount)
/** 題數為 0 的題型不會出現在 plan 裡 */
const withHandwrite = (types: Record<string, number>, count: number) => (count > 0 ? { ...types, vowelHandwrite: count } : types)
const vowelNo = (no: number) => lesson2Plan().vowels.find((v) => v.no === no)!

describe('examPlan（第 2 課）', () => {
  it('母音 32 個、人稱代名詞 16 格、常用語 4 句；沒有數字題', () => {
    const plan = lesson2Plan()
    expect(plan.vowels).toHaveLength(32)
    expect(plan.pronounCells).toHaveLength(16)
    expect(plan.phrases).toHaveLength(4)
    expect(plan.numbers).toHaveLength(0)
  })
  it('手寫母音題數不超過有筆順的母音數（沒有筆順就不出）；其他題型照設定', () => {
    const types = Object.fromEntries(lesson2Plan().questions.map((q) => [q.type, q.count]))
    expect(types).toEqual(withHandwrite({ vowelSound: 5, vowelListen: 4, vowelLength: 3, vowelPosition: 3, pronounChoice: 4, phraseMeaning: 4 }, HANDWRITE_LESSON))
  })
  it('累積考：每課每種題型的題數減半（無條件進位、至少 1 題），各課從自己的題庫出題', () => {
    expect([1, 2, 3, 4, 5].map(cumulativeCount)).toEqual([1, 1, 2, 2, 3])
    const plan = examPlan(LESSONS, 2, 'cumulative')
    const sectionOf = (no: number) => Object.fromEntries(plan.sections.find((s) => s.lessonNo === no)!.questions.map((q) => [q.type, q.count]))
    // 第 1 課：4、3、3、4、3、3、4 → 各 2 題
    expect(sectionOf(1)).toEqual({ digitChoice: 2, digitInput: 2, digitHandwrite: 2, readingChoice: 2, listenNumber: 2, unitMeaning: 2, phraseMeaning: 2 })
    // 第 2 課：5、4、3、2（手寫：不超過有筆順的母音數）、3、4、4
    expect(sectionOf(2)).toEqual(withHandwrite({ vowelSound: 3, vowelListen: 2, vowelLength: 2, vowelPosition: 2, pronounChoice: 2, phraseMeaning: 2 }, HANDWRITE_CUMULATIVE))
    const total = plan.questions.reduce((s, q) => s + q.count, 0)
    expect(total).toBe(27 + HANDWRITE_CUMULATIVE)
    // 設定畫面：同題型加總
    expect(plan.questions.find((q) => q.type === 'phraseMeaning')!.count).toBe(4)
    for (let t = 0; t < 30; t++) {
      const exam = buildExam(plan)
      expect(exam).toHaveLength(27 + HANDWRITE_CUMULATIVE)
      // 常用語：第 1 課、第 2 課各 2 題
      const phrases = exam.filter((q) => q.type === 'phraseMeaning')
      const l1Meanings = new Set(lesson1Plan().phrases.map((p) => p.meaning))
      expect(phrases.filter((q) => l1Meanings.has(q.answerKey))).toHaveLength(2)
    }
  })
  it('本課考試維持原題數', () => {
    expect(examPlan(LESSONS, 1, 'lesson').questions.reduce((s, q) => s + q.count, 0)).toBe(24)
    expect(examPlan(LESSONS, 2, 'lesson').questions.reduce((s, q) => s + q.count, 0)).toBe(23 + HANDWRITE_LESSON)
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
    // 假的課程：只有 2 個母音；筆順來自 thaiData，連結不到（thaiChar 不存在）就沒有筆順
    const NONE = '（thaiData 沒有）'
    const fake = (hasStrokes: boolean): Lesson => ({
      no: 99, date: '2026-01-01', title: '測試', category: '第99課',
      blocks: [
        { type: 'vowels', title: '母音', vowels: [
          { id: 't-v1', no: 1, form: '-ะ', withO: 'อะ', roman: 'a', tone: 'low', length: 'short', group: 'short', thaiChar: hasStrokes ? '◌ะ' : NONE },
          { id: 't-v2', no: 2, form: '-า', withO: 'อา', roman: 'a', tone: 'mid', length: 'long', group: 'long', thaiChar: NONE },
        ] },
        { type: 'exam', config: { questions: [{ type: 'vowelHandwrite', count: 2 }, { type: 'vowelSound', count: 5 }] } },
      ],
    })
    expect(examPlan([fake(false)], 99, 'lesson').questions).toEqual([{ type: 'vowelSound', count: 2 }])
    const plan = examPlan([fake(true)], 99, 'lesson')
    expect(plan.questions).toEqual([{ type: 'vowelHandwrite', count: 1 }, { type: 'vowelSound', count: 2 }])
    const hw = buildExam(plan).find((q) => q.type === 'vowelHandwrite')!
    expect(hw.strokes).toEqual(thaiData.find((t) => t.char === '◌ะ')!.strokes)
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

  it('題數符合設定（23 題＋手寫母音），同題型題目不重複', () => {
    expect(total).toBe(23 + HANDWRITE_LESSON)
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

  it('選項不重複、恰好 1 個正確；看長短 2 個、位置 5 個選項，其他 4 個（手寫題沒有選項）', () => {
    for (let t = 0; t < 30; t++) {
      buildExam(plan).forEach((q) => {
        if (q.type === 'vowelHandwrite') {
          expect(q.options, q.id).toBeUndefined()
          expect(q.strokes, q.id).toBeDefined()
          return
        }
        expect(q.options, q.id).toBeDefined()
        expect(q.options).toHaveLength(q.type === 'vowelLength' ? 2 : q.type === 'vowelPosition' ? 5 : OPTION_COUNT)
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

describe('位置題', () => {
  it('32 個母音都有位置；ใ、ไ（前/心卷、前/木卷）算「前」', () => {
    const vowels = lesson2Plan().vowels
    vowels.forEach((v) => expect(vowelPositionKey(v), v.form).toBeDefined())
    expect(vowelPositionKey(vowelNo(26))).toBe('前')
    expect(vowelPositionKey(vowelNo(27))).toBe('前')
    expect(vowelPositionKey(vowelNo(1))).toBe('後')
    expect(vowelPositionKey(vowelNo(9))).toBe('夾')
  })
  it('獨立母音（ฤ、ฤๅ、ฦ、ฦๅ）不出', () => {
    for (let t = 0; t < 30; t++) {
      buildExam(lesson2Plan()).filter((q) => q.type === 'vowelPosition').forEach((q) => {
        expect(['ฤ', 'ฤๅ', 'ฦ', 'ฦๅ']).not.toContain(q.vowel!.form)
      })
      const q = practiceVowelQuestion('vowelPosition', lesson2Plan().vowels, lesson2Plan().vowels, 'x')!
      expect(['ฤ', 'ฤๅ', 'ฦ', 'ฦๅ']).not.toContain(q.vowel!.form)
    }
    expect(practiceVowelQuestion('vowelPosition', practiceVowels(lesson2Plan().vowels, 'independent', false), lesson2Plan().vowels, 'x')).toBeUndefined()
  })
  it('選項固定 前、後、上、下、夾，答案顯示完整位置說明', () => {
    const q = buildExam(lesson2Plan()).find((x) => x.type === 'vowelPosition')!
    expect(q.options!.map((o) => o.key)).toEqual(['前', '後', '上', '下', '夾'])
    expect(q.vowel!.position).toBeDefined()
  })
})

describe('母音練習', () => {
  const vowels = () => lesson2Plan().vowels
  it('範圍篩選；預設排除已停用（ฦ、ฦๅ）', () => {
    expect(practiceVowels(vowels(), 'all', false)).toHaveLength(32)
    expect(practiceVowels(vowels(), 'all', true)).toHaveLength(30)
    expect(practiceVowels(vowels(), 'all', true).some(vowelDeprecated)).toBe(false)
    expect(practiceVowels(vowels(), 'short', true)).toHaveLength(12)
    expect(practiceVowels(vowels(), 'independent', true).map((v) => v.no)).toEqual([29, 30])
  })
  it('出題沿用考試：短音範圍的錯誤選項仍有長音的另一半；不和上一題重複', () => {
    const shorts = practiceVowels(vowels(), 'short', true)
    const all = practiceVowels(vowels(), 'all', true)
    let prev: string | undefined
    for (let t = 0; t < 50; t++) {
      const q = practiceVowelQuestion('vowelSound', shorts, all, `p${t}`, prev)!
      const v = shorts.find((x) => x.id === q.vowel!.id)!
      expect(v).toBeDefined()
      expect(q.vowel!.id).not.toBe(prev)
      const partner = all.find((x) => x.no === v.no + 1)!
      expect(q.options!.map((o) => o.key)).toContain(vowelSoundKey(partner))
      prev = q.vowel!.id
    }
  })
  it('題庫是空的回傳 undefined（特殊母音沒有長短音）', () => {
    const specials = practiceVowels(vowels(), 'special', true)
    expect(practiceVowelQuestion('vowelLength', specials, vowels(), 'x')).toBeUndefined()
  })
  it('長短對照：12 組＋獨立母音；排除已停用就沒有 ฦ／ฦๅ；特殊母音沒有', () => {
    const nos = (pairs: ReturnType<typeof vowelLengthPairs>) => pairs.map(([s, l]) => [s.no, l.no])
    expect(vowelLengthPairs(vowels(), 'all', false)).toHaveLength(14)
    expect(nos(vowelLengthPairs(vowels(), 'all', true))).toContainEqual([1, 2])
    expect(nos(vowelLengthPairs(vowels(), 'all', true))).not.toContainEqual([31, 32])
    expect(nos(vowelLengthPairs(vowels(), 'independent', true))).toEqual([[29, 30]])
    expect(vowelLengthPairs(vowels(), 'long', true)).toHaveLength(12)
    expect(vowelLengthPairs(vowels(), 'special', true)).toHaveLength(0)
  })
})

describe('第 2 課考試的文字不含「-」加附加符號（iPhone 會補 ◌）', () => {
  // 掛在「-」或空白上的上下母音、聲調符號（ั ิ ี ึ ื ุ ู ฺ ็ ่ ้ ๊ ๋ ์ ํ）
  const DASH_MARK = /[-\s ][ัิ-ฺ็-๎]/
  it('題目、答案、選項文字', () => {
    for (let t = 0; t < 20; t++) {
      buildExam(examPlan(LESSONS, 2, 'lesson')).forEach((q) => {
        expect(q.promptLabel, q.id).not.toMatch(DASH_MARK)
        expect(q.answerLabel, q.id).not.toMatch(DASH_MARK)
        q.options?.forEach((o) => expect(o.text ?? '', q.id).not.toMatch(DASH_MARK))
      })
    }
  })
})
