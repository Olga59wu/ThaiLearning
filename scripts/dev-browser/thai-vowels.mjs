// /thai 所有顯示母音的畫面：學習、聽音辨字、看字選音（收藏、舊格式錯題、基礎）、翻牌記憶
// node scripts/dev-browser/run.mjs scripts/dev-browser/thai-vowels.mjs <輸出資料夾>（dev server 要用 VITE_DEV_SKIP_AUTH=1 開在 5199）
import { click, quizRounds, setStorage, scrollTo, ringTexts, canvasCount, memoryReveal } from './helpers.mjs'
const OLD_MISTAKES = [
  { type: 'vowel', char: 'เ◌อะ', thaiLabel: 'สระเออะ', soundText: 'เออะ', name: 'Sara Oe', meaning: '短音 OE (夾)', reading: 'oe', duration: 'Short' },
  { type: 'vowel', char: 'เ◌ียะ', thaiLabel: 'สระเอียะ', soundText: 'เอียะ', name: 'Sara Ia', meaning: '短音 IA (夾)', reading: 'ia', duration: 'Short' },
  { type: 'vowel', char: 'เ◌ือะ', thaiLabel: 'สระเอือะ', soundText: 'เอือะ', name: 'Sara Uea', meaning: '短音 UEA (夾)', reading: 'uea', duration: 'Short' },
]
// 只收藏元音，測驗一定出元音
const FAVS = ['อะ', 'เอือะ', 'ไอ', 'อุ']
const answerFirst = { eval: `document.querySelector('.grid.grid-cols-2.gap-4 > div').click(); return 'answered'` }
export default [
  { viewport: [1280, 1700] },
  { goto: 'http://localhost:5199/thai', waitAfter: 3000 },
  setStorage('thai_mistakes', OLD_MISTAKES),
  setStorage('thai_favorites', FAVS),
  { goto: 'http://localhost:5199/thai', waitAfter: 4000 },
  // 學習模式・元音
  click('元音'), ringTexts, canvasCount, { shot: '1-learn-vowels.png' },
  // 聽音辨字・收藏（作答前、作答後）
  click('聽音辨字'), click('收藏'), ringTexts, canvasCount, { shot: '2-hear-fav-before.png' },
  answerFirst, ringTexts, { shot: '3-hear-fav-after.png' },
  // 聽音辨字・錯題（舊格式物件）
  click('複習錯題'), ringTexts, canvasCount, { shot: '4-hear-mistakes-before.png' },
  answerFirst, ringTexts, { shot: '5-hear-mistakes-after.png' },
  // 聽音辨字・基礎：連續作答
  click('基礎'), quizRounds(30, '聽音辨字・基礎 30 題'),
  // 看字選音・收藏、錯題
  setStorage('thai_mistakes', OLD_MISTAKES),
  { goto: 'http://localhost:5199/thai', waitAfter: 4000 },
  click('看字選音'), click('收藏'), ringTexts, canvasCount, { shot: '6-read-fav.png' },
  click('複習錯題'), ringTexts, canvasCount, { shot: '7-read-mistakes.png' },
  click('基礎'), quizRounds(30, '看字選音・基礎 30 題'),
  // 翻牌記憶：翻到出現元音為止（最多 15 局）
  click('翻牌記憶'),
  {
    label: '翻牌記憶（找元音）',
    log: `(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      for (let round = 1; round <= 15; round++) {
        const cards = () => [...document.querySelectorAll('.grid.grid-cols-3 > div')]
        for (let i = 0; i < cards().length; i += 2) {
          cards()[i].click(); await sleep(80); cards()[i + 1]?.click(); await sleep(250)
          // 兩張不同的卡 1 秒後會蓋回去：翻開的當下檢查
          const canvas = document.querySelectorAll('.grid.grid-cols-3 canvas').length
          const ring = [...document.querySelectorAll('.grid.grid-cols-3 > div')].filter((c) => c.innerText.includes('◌')).length
          if (canvas > 0 || ring > 0) return '第 ' + round + ' 局：元音字卡 canvas=' + canvas + '、◌ 卡=' + ring
          await sleep(900)
        }
        const restart = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('新的一局') || b.textContent.includes('再玩'))
        if (restart) { restart.click(); await sleep(300) } else return '找不到重新開始按鈕'
      }
      return '15 局都沒有元音'
    })()`,
  },
  { shot: '8-memory.png' },
]
