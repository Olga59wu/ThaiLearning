import { describe, expect, it } from 'vitest'
import {
  fromThaiDigits,
  numberToSyllables,
  numberToThai,
  readingDistractors,
  toThaiDigits,
} from '@/utils/thaiNumber'
import { TONE_MARK } from '@/utils/tone'

// 課本格式：拼音後面接聲調符號，例如 21 → 'yiˋ sibˇ edˇ'
const book = (n: number) => numberToSyllables(n).map((s) => s.roman + TONE_MARK[s.tone]).join(' ')

describe('numberToThai：課本 p22–p26 的 0～25', () => {
  const table: [number, string, string][] = [
    [0, 'ศูนย์', 'sun/'],
    [1, 'หนึ่ง', 'neungˇ'],
    [2, 'สอง', 'song/'],
    [3, 'สาม', 'sam/'],
    [4, 'สี่', 'siˇ'],
    [5, 'ห้า', 'haˋ'],
    [6, 'หก', 'hokˇ'],
    [7, 'เจ็ด', 'jedˇ'],
    [8, 'แปด', 'paedˇ'],
    [9, 'เก้า', 'kaoˋ'],
    [10, 'สิบ', 'sibˇ'],
    [11, 'สิบเอ็ด', 'sibˇ edˇ'],
    [12, 'สิบสอง', 'sibˇ song/'],
    [13, 'สิบสาม', 'sibˇ sam/'],
    [14, 'สิบสี่', 'sibˇ siˇ'],
    [15, 'สิบห้า', 'sibˇ haˋ'],
    [16, 'สิบหก', 'sibˇ hokˇ'],
    [17, 'สิบเจ็ด', 'sibˇ jedˇ'],
    [18, 'สิบแปด', 'sibˇ paedˇ'],
    [19, 'สิบเก้า', 'sibˇ kaoˋ'],
    [20, 'ยี่สิบ', 'yiˋ sibˇ'],
    [21, 'ยี่สิบเอ็ด', 'yiˋ sibˇ edˇ'],
    [22, 'ยี่สิบสอง', 'yiˋ sibˇ song/'],
    [23, 'ยี่สิบสาม', 'yiˋ sibˇ sam/'],
    [24, 'ยี่สิบสี่', 'yiˋ sibˇ siˇ'],
    [25, 'ยี่สิบห้า', 'yiˋ sibˇ haˋ'],
  ]
  it.each(table)('%i → %s', (n, th, roman) => {
    expect(numberToThai(n)).toBe(th)
    expect(book(n)).toBe(roman)
  })
})

describe('numberToThai：課本 p27 特殊唸法', () => {
  it.each([
    [101, 'หนึ่งร้อยเอ็ด', 'neungˇ roi~ edˇ'],
    [111, 'หนึ่งร้อยสิบเอ็ด', 'neungˇ roi~ sibˇ edˇ'],
    [121, 'หนึ่งร้อยยี่สิบเอ็ด', 'neungˇ roi~ yiˋ sibˇ edˇ'],
  ])('%i → %s', (n, th, roman) => {
    expect(numberToThai(n)).toBe(th)
    expect(book(n)).toBe(roman)
  })
})

describe('numberToThai：課本 p28 數字單位', () => {
  it.each([
    [10, 'สิบ'],
    [100, 'หนึ่งร้อย'],
    [1000, 'หนึ่งพัน'],
    [10000, 'หนึ่งหมื่น'],
    [100000, 'หนึ่งแสน'],
    [1000000, 'หนึ่งล้าน'],
    [10000000, 'สิบล้าน'],
    [100000000, 'หนึ่งร้อยล้าน'],
    [1000000000, 'หนึ่งพันล้าน'],
  ])('%i → %s', (n, th) => {
    expect(numberToThai(n)).toBe(th)
  })
  it('單位的聲調', () => {
    expect(book(10000)).toBe('neungˇ meunˇ')
    expect(book(100000)).toBe('neungˇ saen/')
    expect(book(1000000)).toBe('neungˇ lan~')
    expect(book(1000000000)).toBe('neungˇ phan— lan~')
  })
})

describe('numberToThai：課本 p29–p35 面額', () => {
  it.each([
    [25, 'yiˋ sibˇ haˋ'],
    [50, 'haˋ sibˇ'],
    [1, 'neungˇ'],
    [5, 'haˋ'],
    [10, 'sibˇ'],
    [20, 'yiˋ sibˇ'],
    [100, 'neungˇ roi~'],
    [500, 'haˋ roi~'],
    [1000, 'neungˇ phan—'],
  ])('%i → %s', (n, roman) => {
    expect(book(n)).toBe(roman)
  })
  it('紙鈔上印的泰文', () => {
    expect(numberToThai(20)).toBe('ยี่สิบ')
    expect(numberToThai(50)).toBe('ห้าสิบ')
    expect(numberToThai(100)).toBe('หนึ่งร้อย')
    expect(numberToThai(500)).toBe('ห้าร้อย')
    expect(numberToThai(1000)).toBe('หนึ่งพัน')
  })
})

describe('numberToThai：邊界', () => {
  it.each([
    [30, 'สามสิบ'],
    [31, 'สามสิบเอ็ด'],
    [35, 'สามสิบห้า'],
    [201, 'สองร้อยเอ็ด'],
    [210, 'สองร้อยสิบ'],
    [1001, 'หนึ่งพันเอ็ด'],
    [1011, 'หนึ่งพันสิบเอ็ด'],
    [1021, 'หนึ่งพันยี่สิบเอ็ด'],
    [12345, 'หนึ่งหมื่นสองพันสามร้อยสี่สิบห้า'],
    [1000001, 'หนึ่งล้านเอ็ด'],
    [11000000, 'สิบเอ็ดล้าน'],
    [21000000, 'ยี่สิบเอ็ดล้าน'],
    [1000000000000, 'หนึ่งล้านล้าน'],
  ])('%i → %s', (n, th) => {
    expect(numberToThai(n)).toBe(th)
  })
  it.each([-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])('%s 會丟出錯誤', (n) => {
    expect(() => numberToThai(n)).toThrow(RangeError)
  })
})

describe('toThaiDigits／fromThaiDigits', () => {
  it('互轉', () => {
    expect(toThaiDigits(0)).toBe('๐')
    expect(toThaiDigits(35)).toBe('๓๕')
    expect(toThaiDigits(1234567890)).toBe('๑๒๓๔๕๖๗๘๙๐')
    expect(fromThaiDigits('๑๒๑')).toBe('121')
    expect(fromThaiDigits('๒3')).toBe('23')
  })
})

describe('readingDistractors', () => {
  it('包含常見錯誤', () => {
    expect(readingDistractors(11)).toContain('สิบหนึ่ง')
    expect(readingDistractors(11)).toContain('หนึ่งสิบเอ็ด')
    expect(readingDistractors(20)).toContain('สองสิบ')
    expect(readingDistractors(21)).toEqual(expect.arrayContaining(['ยี่สิบหนึ่ง', 'สองสิบเอ็ด']))
    expect(readingDistractors(1)).toContain('เอ็ด')
  })
  it.each([0, 1, 2, 9, 10, 11, 20, 21, 35, 101, 111, 121, 500, 1000])('%i：3 個、不重複、不含正確答案', (n) => {
    const d = readingDistractors(n)
    expect(d).toHaveLength(3)
    expect(new Set(d).size).toBe(3)
    expect(d).not.toContain(numberToThai(n))
  })
})
