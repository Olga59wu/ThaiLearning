// 第 1 課 泰文數字（泰語基礎 1 p22–p36、泰語會話練習 p258–p259）
// 重複的字詞用 ref 連結現有資料（thaiVocab 的 id、thaiData 的 char、sentenceData 的 thai），不複製
// 音節用課本寫法 sy('泰文 拼音 聲調')：— 中、ˇ 低、ˋ 降、~ 高、/ 升
import type { Lesson, LessonWord } from '@/types/lesson'
import { sy } from './helpers'

// ---- 數字 0～25（p22–p26）----
const numbers: LessonWord[] = [
  { kind: 'ref', ref: { vocabId: 'th-0206', thaiChar: '๐' }, num: 0, syllables: sy('ศูนย์ sun /') },
  { kind: 'ref', ref: { vocabId: 'th-0207', thaiChar: '๑' }, num: 1, syllables: sy('หนึ่ง neung ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0208', thaiChar: '๒' }, num: 2, syllables: sy('สอง song /') },
  { kind: 'ref', ref: { vocabId: 'th-0209', thaiChar: '๓' }, num: 3, syllables: sy('สาม sam /') },
  { kind: 'ref', ref: { vocabId: 'th-0210', thaiChar: '๔' }, num: 4, syllables: sy('สี่ si ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0211', thaiChar: '๕' }, num: 5, syllables: sy('ห้า ha ˋ') },
  { kind: 'ref', ref: { vocabId: 'th-0212', thaiChar: '๖' }, num: 6, syllables: sy('หก hok ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0213', thaiChar: '๗' }, num: 7, syllables: sy('เจ็ด jed ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0214', thaiChar: '๘' }, num: 8, syllables: sy('แปด paed ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0215', thaiChar: '๙' }, num: 9, syllables: sy('เก้า kao ˋ') },
  { kind: 'ref', ref: { vocabId: 'th-0216', thaiChar: '๑๐' }, num: 10, syllables: sy('สิบ sib ˇ') },
  { kind: 'new', id: 'l01-0011', th: 'สิบเอ็ด', zh: '11', num: 11, syllables: sy('สิบ sib ˇ | เอ็ด ed ˇ') },
  { kind: 'new', id: 'l01-0012', th: 'สิบสอง', zh: '12', num: 12, syllables: sy('สิบ sib ˇ | สอง song /') },
  { kind: 'new', id: 'l01-0013', th: 'สิบสาม', zh: '13', num: 13, syllables: sy('สิบ sib ˇ | สาม sam /') },
  { kind: 'new', id: 'l01-0014', th: 'สิบสี่', zh: '14', num: 14, syllables: sy('สิบ sib ˇ | สี่ si ˇ') },
  { kind: 'new', id: 'l01-0015', th: 'สิบห้า', zh: '15', num: 15, syllables: sy('สิบ sib ˇ | ห้า ha ˋ') },
  { kind: 'new', id: 'l01-0016', th: 'สิบหก', zh: '16', num: 16, syllables: sy('สิบ sib ˇ | หก hok ˇ') },
  { kind: 'new', id: 'l01-0017', th: 'สิบเจ็ด', zh: '17', num: 17, syllables: sy('สิบ sib ˇ | เจ็ด jed ˇ') },
  { kind: 'new', id: 'l01-0018', th: 'สิบแปด', zh: '18', num: 18, syllables: sy('สิบ sib ˇ | แปด paed ˇ') },
  { kind: 'new', id: 'l01-0019', th: 'สิบเก้า', zh: '19', num: 19, syllables: sy('สิบ sib ˇ | เก้า kao ˋ') },
  { kind: 'new', id: 'l01-0020', th: 'ยี่สิบ', zh: '20', num: 20, syllables: sy('ยี่ yi ˋ | สิบ sib ˇ') },
  { kind: 'new', id: 'l01-0021', th: 'ยี่สิบเอ็ด', zh: '21', num: 21, syllables: sy('ยี่ yi ˋ | สิบ sib ˇ | เอ็ด ed ˇ') },
  { kind: 'new', id: 'l01-0022', th: 'ยี่สิบสอง', zh: '22', num: 22, syllables: sy('ยี่ yi ˋ | สิบ sib ˇ | สอง song /') },
  { kind: 'new', id: 'l01-0023', th: 'ยี่สิบสาม', zh: '23', num: 23, syllables: sy('ยี่ yi ˋ | สิบ sib ˇ | สาม sam /') },
  { kind: 'new', id: 'l01-0024', th: 'ยี่สิบสี่', zh: '24', num: 24, syllables: sy('ยี่ yi ˋ | สิบ sib ˇ | สี่ si ˇ') },
  { kind: 'new', id: 'l01-0025', th: 'ยี่สิบห้า', zh: '25', num: 25, syllables: sy('ยี่ yi ˋ | สิบ sib ˇ | ห้า ha ˋ') },
]

// ---- 特殊唸法（p27）：11、20、21 在上表，這裡只放新的 ----
const specialNumbers: LessonWord[] = [
  { kind: 'new', id: 'l01-0101', th: 'หนึ่งร้อยเอ็ด', zh: '101', num: 101, meaning: '一百零一', syllables: sy('หนึ่ง neung ˇ | ร้อย roi ~ | เอ็ด ed ˇ') },
  { kind: 'new', id: 'l01-0111', th: 'หนึ่งร้อยสิบเอ็ด', zh: '111', num: 111, meaning: '一百一十一', syllables: sy('หนึ่ง neung ˇ | ร้อย roi ~ | สิบ sib ˇ | เอ็ด ed ˇ') },
  { kind: 'new', id: 'l01-0121', th: 'หนึ่งร้อยยี่สิบเอ็ด', zh: '121', num: 121, meaning: '一百二十一', syllables: sy('หนึ่ง neung ˇ | ร้อย roi ~ | ยี่ yi ˋ | สิบ sib ˇ | เอ็ด ed ˇ') },
]

// ---- 數字的單位 การนับจำนวนตัวเลข（p28）；note 是課本的位數大寫 ----
const units: LessonWord[] = [
  { kind: 'new', id: 'l01-0201', th: 'หน่วย', zh: '個位', meaning: '個', note: '個', placeValue: 1, syllables: sy('หน่วย nuoi ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0216', thaiChar: '๑๐' }, meaning: '十', note: '拾', placeValue: 10, syllables: sy('สิบ sib ˇ') },
  { kind: 'ref', ref: { vocabId: 'th-0217', thaiChar: '๑๐๐' }, meaning: '百', note: '佰', placeValue: 100, syllables: sy('ร้อย roi ~') },
  { kind: 'ref', ref: { vocabId: 'th-0218', thaiChar: '๑๐๐๐' }, meaning: '千', note: '仟', placeValue: 1000, syllables: sy('พัน phan —') },
  { kind: 'new', id: 'l01-0202', th: 'หมื่น', zh: '萬', ref: { thaiChar: '๑ หมื่น' }, meaning: '萬', note: '萬', placeValue: 10000, syllables: sy('หมื่น meun ˇ') },
  { kind: 'new', id: 'l01-0203', th: 'แสน', zh: '十萬', ref: { thaiChar: '๑ แสน' }, meaning: '十萬', note: '拾萬', placeValue: 100000, syllables: sy('แสน saen /') },
  { kind: 'new', id: 'l01-0204', th: 'ล้าน', zh: '百萬', ref: { thaiChar: '๑ ล้าน' }, meaning: '百萬', note: '佰萬', placeValue: 1000000, syllables: sy('ล้าน lan ~') },
  { kind: 'new', id: 'l01-0205', th: 'สิบล้าน', zh: '千萬', meaning: '千萬', note: '仟萬', placeValue: 10000000, syllables: sy('สิบ sib ˇ | ล้าน lan ~') },
  { kind: 'new', id: 'l01-0206', th: 'ร้อยล้าน', zh: '億', meaning: '億', note: '億', placeValue: 100000000, syllables: sy('ร้อย roi ~ | ล้าน lan ~') },
  { kind: 'new', id: 'l01-0207', th: 'พันล้าน', zh: '十億', meaning: '十億', note: '拾億', placeValue: 1000000000, syllables: sy('พัน phan — | ล้าน lan ~') },
]

// ---- 泰國貨幣 เงินบาทไทย（p29–p35）；เงิน 課本漏印聲調，依規則為中聲 ----
const currency: LessonWord[] = [
  { kind: 'new', id: 'l01-0301', th: 'เงินบาทไทย', zh: '泰國貨幣', syllables: sy('เงิน ngern — | บาท baht ˇ | ไทย thai —') },
  { kind: 'new', id: 'l01-0302', th: 'บาท', zh: '泰銖', syllables: sy('บาท baht ˇ') },
  { kind: 'new', id: 'l01-0303', th: 'สตางค์', zh: '分錢', syllables: sy('สะ sa ˇ | ตาง tang —') },
]

const lesson: Lesson = {
  no: 1,
  date: '2026-10-12',
  title: '泰文數字',
  category: '第1課',
  blocks: [
    { type: 'vocab', title: '泰文數字', titleTh: 'ตัวเลขไทย', layout: 'numbers', words: numbers },
    { type: 'vocab', title: '泰文數字特殊唸法', layout: 'numbers', words: specialNumbers },
    {
      type: 'rules',
      title: '唸法規則',
      rules: [
        { text: '個位數 1，前面有十位以上時唸 {เอ็ด}', examples: [11, 21, 101, 111, 121] },
        { text: '十位數 2 唸 {ยี่}', examples: [20, 21, 121] },
        { text: '十位數 1 只唸 {สิบ}，不唸 {หนึ่งสิบ}', examples: [10, 11, 111] },
        { text: '百位以上的 1 要唸 {หนึ่ง}', examples: [100, 1000] },
        { text: '中間的 0 不唸；只有單獨的 0 唸 {ศูนย์}', examples: [0, 101] },
        { text: '百萬以上以 {ล้าน} 為單位往上疊', examples: [10000000, 100000000, 1000000000] },
      ],
    },
    { type: 'vocab', title: '數字的單位', titleTh: 'การนับจำนวนตัวเลข', layout: 'units', words: units },
    {
      type: 'currency',
      title: '泰國貨幣',
      titleTh: 'เงินบาทไทย',
      words: currency,
      denominations: [
        { value: 25, unit: 'สตางค์', kind: 'coin' },
        { value: 50, unit: 'สตางค์', kind: 'coin' },
        { value: 1, unit: 'บาท', kind: 'coin' },
        { value: 5, unit: 'บาท', kind: 'coin' },
        { value: 10, unit: 'บาท', kind: 'coin' },
        { value: 20, unit: 'บาท', kind: 'note' },
        { value: 50, unit: 'บาท', kind: 'note' },
        { value: 100, unit: 'บาท', kind: 'note' },
        { value: 500, unit: 'บาท', kind: 'note' },
        { value: 1000, unit: 'บาท', kind: 'note' },
      ],
    },
    {
      type: 'notes',
      title: '鈔票上的人像',
      items: [
        '20 泰銖：正面拉瑪10世；反面拉瑪1世和2世',
        '50 泰銖：正面拉瑪10世；反面拉瑪3世和4世',
        '100 泰銖：正面拉瑪10世；反面拉瑪5世和6世',
        '500 泰銖：正面拉瑪10世；反面拉瑪7世和8世',
        '1000 泰銖：正面拉瑪10世；反面拉瑪9世和10世',
      ],
    },
    {
      type: 'phrases',
      title: '你好！／再見！（常用語）',
      phrases: [
        {
          id: 'l01-p1',
          base: { kind: 'ref', ref: { vocabId: 'th-0001', sentence: 'สวัสดี' }, syllables: sy('สะ sa ˇ | หวัด wad ˇ | ดี di —') },
          meaning: '你好！／再見！（意思是祝你平安快樂）',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l01-0401', zh: '你好/再見 (女用)' }],
        },
        {
          id: 'l01-p2',
          base: { kind: 'ref', ref: { vocabId: 'th-0002', sentence: 'ขอบคุณ' }, syllables: sy('ขอบ khorb ˇ | คุน khun —') },
          meaning: '感謝',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l01-0402', zh: '謝謝 (女用)' }],
        },
        {
          id: 'l01-p3',
          // 只放 ค่ะ 版進分類，原形不放
          base: { kind: 'new', id: 'l01-0400', th: 'ไม่ต้องเกรงใจ', zh: '不用客氣', inCategory: false, syllables: sy('ไม่ mai ˋ | ต้อง torng ˋ | เกรง kreng — | ใจ jai —') },
          meaning: '不用客氣',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l01-0403', zh: '不用客氣 (女用)' }],
          confusableWith: ['l01-p5'],
        },
        {
          id: 'l01-p4',
          base: { kind: 'ref', ref: { vocabId: 'th-0003', sentence: 'ขอโทษ' }, syllables: sy('ขอ khor / | โทด thod ˋ') },
          meaning: '對不起／不好意思',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l01-0404', zh: '對不起/不好意思 (女用)' }],
        },
        {
          id: 'l01-p5',
          base: { kind: 'ref', ref: { vocabId: 'th-0004', sentence: 'ไม่เป็นไร' }, syllables: sy('ไม่ mai ˋ | เป็น pen — | ไร rai —') },
          meaning: '沒關係（也可以當不用客氣來使用）',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l01-0405', zh: '沒關係 (女用)' }],
          confusableWith: ['l01-p3'],
        },
      ],
    },
    {
      type: 'homework',
      title: '作業與測驗',
      task: '看泰文數字唸出來，並練習書寫',
      numbers: { min: 1, max: 35 },
    },
    {
      type: 'practice',
      numberReading: { min: 0, max: 35, extra: [100, 101, 111, 121, 500, 1000] },
    },
    {
      type: 'exam',
      config: {
        numbers: { min: 0, max: 35, extra: [100, 101, 111, 121, 500, 1000] },
        questions: [
          { type: 'digitChoice', count: 4 },
          { type: 'digitInput', count: 3 },
          { type: 'digitHandwrite', count: 3 },
          { type: 'readingChoice', count: 4 },
          { type: 'listenNumber', count: 3 },
          { type: 'unitMeaning', count: 3 },
          { type: 'phraseMeaning', count: 4 },
        ],
      },
    },
  ],
}

export default lesson
