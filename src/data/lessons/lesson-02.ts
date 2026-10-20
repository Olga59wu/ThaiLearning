// 第 2 課 母音 & 子音（泰語基礎 1 p37–p49、泰語會話練習 p256–p257、p260–p261）；子音還沒教，這次只有母音
// 重複的字詞用 ref 連結現有資料（thaiVocab 的 id、thaiData 的 char），不複製
// 音節用課本寫法 sy('泰文 拼音 聲調')：— 中、ˇ 低、ˋ 降、~ 高、/ 升
// 課本的「第 N 聲」：第 1 聲＝中、第 2 聲＝低、第 3 聲＝降、第 4 聲＝高、第 5 聲＝升
// pencil 是使用者自己在課本上的鉛筆筆記
import type { Lesson, LessonVowel, LessonWord, PronounCell } from '@/types/lesson'
import { sy } from './helpers'

// ---- 母音 32 個（p38、p40、p42、p44、p46、p48）----
// 短音母音第 2 聲（低）、長音母音第 1 聲（中）、特殊母音第 1 聲、獨立短母音第 4 聲（高）、獨立長母音第 1 聲
const vowels: LessonVowel[] = [
  // 短音母音 12 個／長音母音 12 個（p40、p42、p44）
  { id: 'l02-v01', no: 1, form: '-ะ', withO: 'อะ', roman: 'a', zhuyin: 'ㄚ', tone: 'low', length: 'short', group: 'short', thaiChar: '◌ะ' },
  { id: 'l02-v02', no: 2, form: '-า', withO: 'อา', roman: 'a', zhuyin: 'ㄚ', tone: 'mid', length: 'long', group: 'long', thaiChar: '◌า' },
  { id: 'l02-v03', no: 3, form: '-ิ', withO: 'อิ', roman: 'i', zhuyin: 'ㄧ', tone: 'low', length: 'short', group: 'short', thaiChar: '◌ิ' },
  { id: 'l02-v04', no: 4, form: '-ี', withO: 'อี', roman: 'i', zhuyin: 'ㄧ', tone: 'mid', length: 'long', group: 'long', thaiChar: '◌ี' },
  { id: 'l02-v05', no: 5, form: '-ึ', withO: 'อึ', roman: 'eu', tone: 'low', length: 'short', group: 'short', thaiChar: '◌ึ' },
  // 課本字形欄只印 -ื；練習頁（p41）寫 อื
  {
    id: 'l02-v06', no: 6, form: '-ื', withO: 'อือ', writeBase: 'อื', roman: 'eu', tone: 'mid', length: 'long', group: 'long', thaiChar: '◌ือ',
    pencil: [{ page: 41, text: '印刷 ↔ 手寫，前後都可' }],
  },
  { id: 'l02-v07', no: 7, form: '-ุ', withO: 'อุ', roman: 'u', zhuyin: 'ㄨ', tone: 'low', length: 'short', group: 'short', thaiChar: '◌ุ' },
  { id: 'l02-v08', no: 8, form: '-ู', withO: 'อู', roman: 'u', zhuyin: 'ㄨ', tone: 'mid', length: 'long', group: 'long', thaiChar: '◌ู' },
  { id: 'l02-v09', no: 9, form: 'เ-ะ', withO: 'เอะ', roman: 'e', zhuyin: 'ㄟ', tone: 'low', length: 'short', group: 'short', thaiChar: 'เ◌ะ' },
  { id: 'l02-v10', no: 10, form: 'เ-', withO: 'เอ', roman: 'e', zhuyin: 'ㄟ', tone: 'mid', length: 'long', group: 'long', thaiChar: 'เ◌' },
  {
    id: 'l02-v11', no: 11, form: 'แ-ะ', withO: 'แอะ', roman: 'ae', tone: 'low', length: 'short', group: 'short', thaiChar: 'แ◌ะ',
    pencil: [
      { page: 42, text: '嘴比較扁' },
      { page: 43, text: '寫的順序：1 2 3 4 5' },
    ],
  },
  { id: 'l02-v12', no: 12, form: 'แ-', withO: 'แอ', roman: 'ae', tone: 'mid', length: 'long', group: 'long', thaiChar: 'แ◌' },
  {
    id: 'l02-v13', no: 13, form: 'โ-ะ', withO: 'โอะ', roman: 'o', zhuyin: 'ㄡ', tone: 'low', length: 'short', group: 'short', thaiChar: 'โ◌ะ',
    pencil: [{ page: 42, text: '嘴小圓' }],
  },
  { id: 'l02-v14', no: 14, form: 'โ-', withO: 'โอ', roman: 'o', zhuyin: 'ㄡ', tone: 'mid', length: 'long', group: 'long', thaiChar: 'โ◌' },
  {
    id: 'l02-v15', no: 15, form: 'เ-าะ', withO: 'เอาะ', roman: 'or', zhuyin: 'ㄛ', tone: 'low', length: 'short', group: 'short', thaiChar: 'เ◌าะ',
    pencil: [{ page: 42, text: '嘴大圓' }],
  },
  {
    id: 'l02-v16', no: 16, form: '-อ', withO: 'ออ', roman: 'or', zhuyin: 'ㄛ', tone: 'mid', length: 'long', group: 'long', thaiChar: '◌อ',
    pencil: [{ page: 43, text: '子 母（第一個是子音、第二個是母音）' }],
  },
  {
    id: 'l02-v17', no: 17, form: 'เ-อะ', withO: 'เออะ', roman: 'er', zhuyin: 'ㄜ', tone: 'low', length: 'short', group: 'short', thaiChar: 'เ◌อะ',
    pencil: [{ page: 44, text: '餓、不捲舌' }],
  },
  { id: 'l02-v18', no: 18, form: 'เ-อ', withO: 'เออ', roman: 'er', zhuyin: 'ㄜ', tone: 'mid', length: 'long', group: 'long', thaiChar: 'เ◌อ' },
  { id: 'l02-v19', no: 19, form: 'เ-ียะ', withO: 'เอียะ', roman: 'ia', tone: 'low', length: 'short', group: 'short', thaiChar: 'เ◌ียะ' },
  { id: 'l02-v20', no: 20, form: 'เ-ีย', withO: 'เอีย', roman: 'ia', tone: 'mid', length: 'long', group: 'long', thaiChar: 'เ◌ีย' },
  { id: 'l02-v21', no: 21, form: 'เ-ือะ', withO: 'เอือะ', roman: 'eua', tone: 'low', length: 'short', group: 'short', thaiChar: 'เ◌ือะ' },
  { id: 'l02-v22', no: 22, form: 'เ-ือ', withO: 'เอือ', roman: 'eua', tone: 'mid', length: 'long', group: 'long', thaiChar: 'เ◌ือ' },
  { id: 'l02-v23', no: 23, form: '-ัวะ', withO: 'อัวะ', roman: 'ua', tone: 'low', length: 'short', group: 'short', thaiChar: '◌ัวะ' },
  { id: 'l02-v24', no: 24, form: '-ัว', withO: 'อัว', roman: 'ua', tone: 'mid', length: 'long', group: 'long', thaiChar: '◌ัว' },

  // 特殊母音 4 個（p46），第 1 聲
  {
    id: 'l02-v25', no: 25, form: '-ำ', withO: 'อำ', roman: 'am', tone: 'mid', group: 'special', thaiChar: '◌ำ',
    pencil: [{ page: 46, text: '閉嘴' }],
  },
  {
    id: 'l02-v26', no: 26, form: 'ใ-', withO: 'ใอ', roman: 'ai', zhuyin: 'ㄞ', tone: 'mid', group: 'special', thaiChar: 'ใ◌',
    name: sy('ไม้ mai ~ | ม้วน muon ~'), note: '只有 20 個單字',
  },
  {
    id: 'l02-v27', no: 27, form: 'ไ-', withO: 'ไอ', roman: 'ai', zhuyin: 'ㄞ', tone: 'mid', group: 'special', thaiChar: 'ไ◌',
    name: sy('ไม้ mai ~ | มะ ma ~ | ลาย lai —'),
  },
  { id: 'l02-v28', no: 28, form: 'เ-า', withO: 'เอา', roman: 'ao', zhuyin: 'ㄠ', tone: 'mid', group: 'special', thaiChar: 'เ◌า' },

  // 獨立母音 4 個（p48）：借用子音 ร、ล 搭配 -ึ、-ื 來發音；短音第 4 聲、長音第 1 聲；練習頁（p49）不搭配 อ
  { id: 'l02-v29', no: 29, form: 'ฤ', withO: 'รึ', writeBase: 'ฤ', roman: 'reu', tone: 'high', length: 'short', group: 'independent', thaiChar: 'ฤ' },
  { id: 'l02-v30', no: 30, form: 'ฤๅ', withO: 'รือ', writeBase: 'ฤๅ', roman: 'reu', tone: 'mid', length: 'long', group: 'independent', thaiChar: 'ฤๅ' },
  { id: 'l02-v31', no: 31, form: 'ฦ', withO: 'ลึ', writeBase: 'ฦ', roman: 'leu', tone: 'high', length: 'short', group: 'independent', deprecated: true },
  { id: 'l02-v32', no: 32, form: 'ฦๅ', withO: 'ลือ', writeBase: 'ฦๅ', roman: 'leu', tone: 'mid', length: 'long', group: 'independent', deprecated: true },
]

// ---- 人稱代名詞（p256）：不重複的字只建一次，表格格子用 id 指向 ----
const pronounWords: LessonWord[] = [
  { kind: 'ref', ref: { vocabId: 'th-0011' }, meaning: '我（一般，男女都可用）', syllables: sy('ฉัน chan /') },
  { kind: 'ref', ref: { vocabId: 'th-0010' }, meaning: '我（男生，禮貌）', syllables: sy('ผม phom /') },
  { kind: 'new', id: 'l02-0001', th: 'กระผม', zh: '我 (男用，謙卑)', meaning: '我（男生，謙卑）', syllables: sy('กระ kra ˇ | ผม phom /') },
  { kind: 'new', id: 'l02-0002', th: 'ดิฉัน', zh: '我 (女用，禮貌)', meaning: '我（女生，禮貌）', syllables: sy('ดิ di ˇ | ฉัน chan /') },
  { kind: 'new', id: 'l02-0003', th: 'หนู', zh: '我 (女用，謙卑)', meaning: '我（女生，謙卑）', syllables: sy('หนู nu /') },
  { kind: 'new', id: 'l02-0004', th: 'เธอ', zh: '你/她 (一般)', meaning: '你（一般）／她（一般）', syllables: sy('เธอ ther —') },
  { kind: 'ref', ref: { vocabId: 'th-0012' }, meaning: '你／您（禮貌）', syllables: sy('คุณ khun —') },
  { kind: 'new', id: 'l02-0005', th: 'ท่าน', zh: '您/他/她 (尊稱)', meaning: '您（尊稱）／他、她（禮貌）', syllables: sy('ท่าน than ˋ') },
  { kind: 'ref', ref: { vocabId: 'th-0014' }, meaning: '他（一般）', syllables: sy('เขา khao /') },
]

// 課本表格：我＝一般／禮貌／謙卑，你＝一般／禮貌／尊稱，他她＝一般／禮貌
const pronounCells: PronounCell[] = [
  { person: '我', gender: 'male', level: '一般', wordId: 'th-0011' },
  { person: '我', gender: 'male', level: '禮貌', wordId: 'th-0010' },
  { person: '我', gender: 'male', level: '謙卑', wordId: 'l02-0001' },
  { person: '我', gender: 'female', level: '一般', wordId: 'th-0011' },
  { person: '我', gender: 'female', level: '禮貌', wordId: 'l02-0002' },
  { person: '我', gender: 'female', level: '謙卑', wordId: 'l02-0003' },
  { person: '你/您', gender: 'male', level: '一般', wordId: 'l02-0004' },
  { person: '你/您', gender: 'male', level: '禮貌', wordId: 'th-0012' },
  { person: '你/您', gender: 'male', level: '尊稱', wordId: 'l02-0005' },
  { person: '你/您', gender: 'female', level: '一般', wordId: 'l02-0004', pencil: [{ page: 256, text: '在場' }] },
  { person: '你/您', gender: 'female', level: '禮貌', wordId: 'th-0012' },
  { person: '你/您', gender: 'female', level: '尊稱', wordId: 'l02-0005' },
  { person: '他/她', gender: 'male', level: '一般', wordId: 'th-0014' },
  { person: '他/她', gender: 'male', level: '禮貌', wordId: 'l02-0005' },
  // 課本這格 ther 沒印聲調符號，使用者確認同上一格用「—」
  { person: '他/她', gender: 'female', level: '一般', wordId: 'l02-0004', pencil: [{ page: 256, text: '↑不在場' }] },
  { person: '他/她', gender: 'female', level: '禮貌', wordId: 'l02-0005' },
]

const lesson: Lesson = {
  no: 2,
  date: '2026-10-19',
  title: '母音 & 子音',
  category: '第2課',
  blocks: [
    {
      type: 'vowels',
      title: '母音',
      titleTh: 'สระ',
      intro: sy('สระ sa ˇ | ระ ra ˇ'),
      summary: '32 個母音／27 個發音',
      vowels,
      groupPencil: {
        special: [{ page: 38, text: '特殊母音' }],
        independent: [{ page: 38, text: '獨立母音' }],
      },
    },
    { type: 'pronouns', title: '泰文特有的人稱代名詞', words: pronounWords, cells: pronounCells },
    {
      type: 'usage',
      title: '人稱代名詞的用法',
      items: [
        {
          label: '複數',
          word: { kind: 'new', id: 'l02-0101', th: 'พวก', zh: '們 (複數)', syllables: sy('พวก puak ˋ') },
          pattern: '＋人稱代名詞',
          examples: [
            { kind: 'new', id: 'l02-0102', th: 'พวกผม', zh: '我們 (男用)', meaning: '我們（男生）', syllables: sy('พวก puak ˋ | ผม phom /') },
            { kind: 'new', id: 'l02-0103', th: 'พวกฉัน', zh: '我們 (女用)', meaning: '我們（女生）', syllables: sy('พวก puak ˋ | ฉัน chan /') },
          ],
        },
        {
          label: '所有格',
          word: { kind: 'new', id: 'l02-0111', th: 'ของ', zh: '的 (所有格)', syllables: sy('ของ khong /') },
          pattern: '＋人稱代名詞',
          examples: [
            { kind: 'new', id: 'l02-0112', th: 'ของผม', zh: '我的 (男用)', meaning: '我的（男生）', syllables: sy('ของ khong / | ผม phom /') },
            { kind: 'new', id: 'l02-0113', th: 'ของฉัน', zh: '我的 (女用)', meaning: '我的（女生）', syllables: sy('ของ khong / | ฉัน chan /') },
          ],
        },
        {
          pattern: '的用法',
          word: { kind: 'ref', ref: { vocabId: 'th-0012' }, meaning: '您', syllables: sy('คุณ khun —') },
          pencil: [{ page: 257, text: '名詞 → 恩惠' }],
          examples: [
            { kind: 'ref', ref: { vocabId: 'th-0012' }, meaning: '您', syllables: sy('คุณ khun —') },
            { kind: 'new', id: 'l02-0121', th: 'คุณพ่อ', zh: '父親', meaning: '父親、爸爸', syllables: sy('คุณ khun — | พ่อ phor ˋ') },
            { kind: 'new', id: 'l02-0122', th: 'คุณแม่', zh: '母親', meaning: '母親、媽媽', syllables: sy('คุณ khun — | แม่ mae ˋ') },
            { kind: 'new', id: 'l02-0123', th: 'คุณครู', zh: '老師', meaning: '老師（大學以下）', syllables: sy('คุณ khun — | ครู khru —') },
            // 人名例子不放進分類
            { kind: 'new', id: 'l02-0124', th: 'คุณศักดา', zh: '善達先生', inCategory: false, syllables: sy('คุณ khun — | ศัก Sak ˇ | ดา da —') },
            { kind: 'new', id: 'l02-0125', th: 'คุณยุพิน', zh: '玉琴小姐', inCategory: false, syllables: sy('คุณ khun — | ยุ Yu ~ | พิน phin —') },
          ],
        },
      ],
    },
    {
      type: 'phrases',
      title: '早安！／晚安！（常用語）',
      phrases: [
        {
          id: 'l02-p1',
          // 只放 ค่ะ 版進分類，原形不放
          base: { kind: 'new', id: 'l02-0400', th: 'อรุณสวัสดิ์', zh: '早安', inCategory: false, syllables: sy('อะ a ˇ | รุน run — | สะ sa ˇ | หวัด wad ˇ') },
          meaning: '早安！',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l02-0401', zh: '早安 (女用)' }],
        },
        {
          id: 'l02-p2',
          base: { kind: 'new', id: 'l02-0410', th: 'ราตรีสวัสดิ์', zh: '晚安', inCategory: false, syllables: sy('รา ra — | ตรี tri — | สะ sa ˇ | หวัด wad ˇ') },
          meaning: '晚安！',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l02-0411', zh: '晚安 (女用)' }],
        },
        {
          id: 'l02-p3',
          base: { kind: 'new', id: 'l02-0420', th: 'ลาก่อน', zh: '再會', inCategory: false, syllables: sy('ลา la — | ก่อน korn ˇ') },
          meaning: '再會囉！（使用在要離別或出遠門）',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l02-0421', zh: '再會 (女用)' }],
          confusableWith: ['l01-p1'],
        },
        {
          id: 'l02-p4',
          base: { kind: 'ref', ref: { vocabId: 'th-0170' }, syllables: sy('โชก chok ˋ | ดี di —') },
          meaning: '祝你好運！',
          particles: ['ครับ', 'ค่ะ'],
          variants: [{ particle: 'ค่ะ', id: 'l02-0431', zh: '祝你好運 (女用)' }],
          pencil: [{ page: 260, text: '運氣' }],
        },
      ],
    },
    {
      // 母音、人稱代名詞的新題型在下一步加入
      type: 'exam',
      config: {
        questions: [{ type: 'phraseMeaning', count: 4 }],
      },
    },
  ],
}

export default lesson
