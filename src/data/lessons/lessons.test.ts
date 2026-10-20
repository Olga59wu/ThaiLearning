import { describe, expect, it } from 'vitest'
import { sentenceData, thaiData } from '@/data/thai'
import { FULL_VOCAB, VOCAB_CATEGORIES } from '@/data/thaiVocab'
import { ALL_VOCAB_CATEGORIES, lessonNoOfCategory } from '@/data/vocabCategories'
import {
  blocksOf, LESSON_VOCAB_CATEGORIES, LESSONS, lessonPhrases, lessonPronounCells, lessonRawWords, lessonUnits, lessonVowels, lessonWords, resolveWord,
} from '@/data/lessons'
import { vowelPosition, vowelThaiItem, vowelWriteBase } from '@/data/lessons/vowels'
import { sy } from '@/data/lessons/helpers'
import { numberToSyllables, numberToThai, numberWordSyllables } from '@/utils/thaiNumber'
import type { ExamQuestionType, LessonWord, Tone, VowelGroup } from '@/types/lesson'

const allRawWords = (): LessonWord[] =>
  LESSONS.flatMap((l) => [
    ...lessonRawWords(l),
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
  it('常用語 id 不重複（跨課），confusableWith 互相指向存在的常用語（可跨課）', () => {
    const phrases = LESSONS.flatMap(lessonPhrases)
    const ids = phrases.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    phrases.forEach((p) =>
      p.confusableWith?.forEach((c) => {
        const other = phrases.find((x) => x.id === c)
        expect(other, c).toBeDefined()
        expect(other!.confusableWith, `${c} 也要指向 ${p.id}`).toContain(p.id)
      }),
    )
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

describe('第 2 課', () => {
  const l2 = LESSONS.find((l) => l.no === 2)!
  const vowels = lessonVowels(l2)

  it('母音 32 個：課本編號 1～32 連續、id 固定格式且不重複', () => {
    expect(vowels.map((v) => v.no)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1))
    vowels.forEach((v) => expect(v.id).toBe(`l02-v${String(v.no).padStart(2, '0')}`))
  })

  it('分組：短音 12、長音 12、特殊 4、獨立 4', () => {
    const count = (g: VowelGroup) => vowels.filter((v) => v.group === g).length
    expect([count('short'), count('long'), count('special'), count('independent')]).toEqual([12, 12, 4, 4])
  })

  it('聲調與長短依課本分組：短音第 2 聲、長音第 1 聲、特殊第 1 聲、獨立短第 4 聲、獨立長第 1 聲', () => {
    vowels.forEach((v) => {
      const expected: Tone =
        v.group === 'short' ? 'low' : v.group === 'independent' && v.length === 'short' ? 'high' : 'mid'
      expect(v.tone, `${v.no} ${v.form}`).toBe(expected)
      if (v.group === 'short') expect(v.length).toBe('short')
      if (v.group === 'long') expect(v.length).toBe('long')
      if (v.group === 'special') expect(v.length).toBeUndefined()
      if (v.group === 'independent') expect(v.length).toBeDefined()
    })
  })

  it('連結 thaiData 的母音：30 個都找得到，只有 ฦ、ฦๅ 沒有（已停用）', () => {
    vowels.forEach((v) => {
      if (v.thaiChar) expect(vowelThaiItem(v), v.thaiChar).toBeDefined()
    })
    expect(vowels.filter((v) => v.thaiChar).length).toBe(30)
    expect(vowels.filter((v) => !v.thaiChar).map((v) => v.form)).toEqual(['ฦ', 'ฦๅ'])
    expect(vowels.filter((v) => v.deprecated).map((v) => v.form)).toEqual(['ฦ', 'ฦๅ'])
    // 每個 thaiData 母音只連結一次
    const chars = vowels.flatMap((v) => (v.thaiChar ? [v.thaiChar] : []))
    expect(new Set(chars).size).toBe(chars.length)
    expect(thaiData.filter((t) => t.type === 'vowel').every((t) => chars.includes(t.char))).toBe(true)
  })

  it('寫法（writeBase）單一來源：thaiData 母音都有，有連結的課程母音不自己寫；ฦ、ฦๅ 寫在課程檔', () => {
    thaiData.filter((t) => t.type === 'vowel').forEach((t) => {
      expect(t.writeBase, t.char).toBeTruthy()
      // ◌ 換成 อ 表示子音位置；獨立母音（ฤ、ฤๅ）寫字本身
      if (t.char.includes('◌')) expect(t.writeBase, t.char).toMatch(/อ/)
      else expect(t.writeBase).toBe(t.char)
    })
    vowels.forEach((v) => {
      if (v.thaiChar) {
        expect(v.writeBase, `${v.no} 用 thaiData 的 writeBase`).toBeUndefined()
        expect(v.strokes, `${v.no} 用 thaiData 的 strokes`).toBeUndefined()
      } else expect(v.writeBase).toBe(v.form)
    })
    expect(vowelWriteBase(vowels.find((v) => v.no === 6)!)).toBe('อื')
    expect(vowelWriteBase(vowels.find((v) => v.no === 1)!)).toBe('อะ')
    expect(vowelWriteBase(vowels.find((v) => v.no === 31)!)).toBe('ฦ')
  })

  it('有連結的母音都有位置說明', () => {
    vowels.forEach((v) => {
      if (v.thaiChar) expect(vowelPosition(v), v.thaiChar).toBeTruthy()
    })
  })

  it('人稱代名詞表：16 格都指向區塊裡的字', () => {
    expect(lessonPronounCells(l2)).toHaveLength(16)
  })

  it('分類內容：母音、人名、新常用語原形不放；ค่ะ 版放', () => {
    const th = lessonVocab(l2).map((v) => v.th)
    expect(th).toEqual(expect.arrayContaining(['ฉัน', 'ดิฉัน', 'ท่าน', 'พวกผม', 'ของฉัน', 'คุณพ่อ', 'โชคดี', 'อรุณสวัสดิ์ค่ะ', 'ลาก่อนค่ะ']))
    ;['อะ', 'คุณศักดา', 'คุณยุพิน', 'อรุณสวัสดิ์', 'ราตรีสวัสดิ์', 'ลาก่อน', 'อรุณสวัสดิ์ครับ'].forEach((t) => expect(th).not.toContain(t))
  })

  it('鉛筆筆記不含泰文字', () => {
    const notes = [
      ...vowels.flatMap((v) => v.pencil ?? []),
      ...blocksOf(l2, 'vowels').flatMap((b) => Object.values(b.groupPencil ?? {}).flat()),
      ...lessonPronounCells(l2).flatMap((c) => c.pencil ?? []),
      ...blocksOf(l2, 'usage').flatMap((b) => b.items.flatMap((i) => i.pencil ?? [])),
      ...lessonPhrases(l2).flatMap((p) => p.pencil ?? []),
    ]
    expect(notes.length).toBeGreaterThan(0)
    notes.forEach((n) => expect(n.text).not.toMatch(/[฀-๿]/))
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
      if (numbers) expect(numbers.min).toBeLessThanOrEqual(numbers.max)
      const poolSize = numbers
        ? new Set([
            ...Array.from({ length: numbers.max - numbers.min + 1 }, (_, i) => numbers.min + i),
            ...(numbers.extra ?? []),
          ]).size
        : 0
      questions.forEach((q) => {
        expect(q.count).toBeGreaterThan(0)
        if (NUMERIC.includes(q.type)) expect(q.count).toBeLessThanOrEqual(poolSize)
        if (q.type === 'phraseMeaning') expect(q.count).toBeLessThanOrEqual(lessonPhrases(l).length)
        if (q.type === 'unitMeaning') expect(q.count).toBeLessThanOrEqual(lessonUnits(l).length)
      })
    })
  })
})
