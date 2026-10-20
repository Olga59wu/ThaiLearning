// 每週課程考試：開始考試，逐題記錄題型與畫面（作答前、作答後），作答一律選第一個選項（手寫題：看答案 → ✓）
// node scripts/dev-browser/run.mjs scripts/dev-browser/lesson-exam.mjs <輸出資料夾>（dev server 要用 VITE_DEV_SKIP_AUTH=1 開在 5199）
// 環境變數 LESSON（課次，預設 2）、SCOPE（lesson／cumulative）
import { click } from './helpers.mjs'

const no = process.env.LESSON ?? '2'
const scope = process.env.SCOPE ?? 'lesson'
const COUNT = Number(process.env.COUNT ?? 20)

const info = {
  label: '題目',
  log: `(() => {
    const card = document.querySelector('.rounded-3xl.shadow-md .p-5')
    if (!card) return '沒有題目'
    const head = card.querySelector('.justify-between')?.innerText.replace(/\s+/g, ' ')
    const opts = [...card.querySelectorAll('.grid > button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim())
    return { head, prompt: card.children[1]?.innerText.replace(/\s+/g, ' ').trim(), opts }
  })()`,
}
const answer = {
  eval: `
    const card = document.querySelector('.rounded-3xl.shadow-md .p-5')
    const opt = card.querySelector('.grid > button')
    if (opt) { opt.click(); return 'chose: ' + opt.innerText.replace(/\s+/g, ' ').trim() }
    const reveal = [...card.querySelectorAll('button')].find((b) => b.textContent.includes('看答案'))
    if (reveal) { reveal.click(); return 'revealed' }
    return 'no action'`,
}
const result = { label: '結果', log: `document.querySelector('.rounded-3xl.shadow-md .p-5 .mt-6')?.innerText.replace(/\s+/g, ' ').trim() ?? '（沒有結果區）'` }
const next = { eval: `const b = [...document.querySelectorAll('button')].find((x) => /下一題|看結果|✓/.test(x.textContent.trim())); if (!b) return 'no next'; b.click(); return 'next'` }

const steps = [
  { viewport: [900, 1100] },
  { goto: `http://localhost:5199/lessons/${no}?tab=exam`, waitAfter: 2000 },
  // 等「開始考試」按鈕出現（第一次載入 Vite 要編譯）
  { eval: `for (let i = 0; i < 60; i++) { if ([...document.querySelectorAll('button')].some((b) => b.textContent.includes('開始考試'))) return 'ready'; await new Promise((r) => setTimeout(r, 250)) } return 'timeout'` },
  ...(scope === 'cumulative' ? [click('累積考')] : []),
  { label: '題型清單', log: `[...document.querySelectorAll('ul li')].map((li) => li.innerText.replace(/\s+/g, ' ')).join(' | ')` },
  click('開始考試'),
]
for (let i = 1; i <= COUNT; i++) {
  steps.push(info, { shot: `q${String(i).padStart(2, '0')}-a.png` }, answer, { wait: 400 }, result, { shot: `q${String(i).padStart(2, '0')}-b.png` }, next)
}
steps.push({ wait: 800 }, { label: '結果頁', log: `document.body.innerText.slice(0, 200).replace(/\s+/g, ' ')` }, { shot: 'result.png' })
export default steps
