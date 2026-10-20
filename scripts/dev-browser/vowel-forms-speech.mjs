// 第 2 課與 /thai：課本字形不含「-」加附加符號（iPhone 會補 ◌）、母音念法（攔截 audio.play／speechSynthesis.speak 記錄念了什麼）
// node scripts/dev-browser/run.mjs scripts/dev-browser/vowel-forms-speech.mjs <輸出資料夾>（dev server 要用 VITE_DEV_SKIP_AUTH=1 開在 5199）
import { click } from './helpers.mjs'

// 可見文字中「-」或空白後面直接接上下母音／聲調符號
const dashMarks = {
  label: '「-」加附加符號的文字',
  log: `(() => { const re = /[-\s\u00a0][\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const r = []; while (w.nextNode()) { const t = w.currentNode; if (re.test(t.textContent) && t.parentElement.offsetParent !== null) r.push(t.textContent.trim()) } return r })()`,
}
// 記錄播放：audio 的檔名、TTS 的文字
const spy = {
  eval: `
    window.__played = []
    const origPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () { window.__played.push('mp3:' + decodeURIComponent(this.src.split('/').pop())); return origPlay.call(this) }
    const origSpeak = speechSynthesis.speak.bind(speechSynthesis)
    speechSynthesis.speak = (u) => { window.__played.push('tts:' + u.text); return origSpeak(u) }
    return 'spy on'`,
}
const played = { label: '播放紀錄', log: `window.__played` }
const iphone = { viewport: [390, 844, 3] }

export default [
  iphone,
  { goto: 'http://localhost:5199/lessons/2', waitAfter: 2000 },
  { eval: `for (let i = 0; i < 60; i++) { if (document.querySelectorAll('canvas').length > 10) return 'ready'; await new Promise((r) => setTimeout(r, 250)) } return 'timeout'` },
  dashMarks,
  { label: '課本字形 canvas 數', log: `document.querySelectorAll('canvas[role], [role=img] canvas, span[role=img]').length` },
  { shot: 'lesson2-iphone-top.png' },
  { eval: `document.querySelector('h3').scrollIntoView(); return 'scrolled'` },
  { shot: 'lesson2-iphone-vowels.png' },
  spy,
  // 母音卡片的 🔊：第 1 個（-ะ）、第 3 個（-ิ）、獨立母音 ฤ
  { eval: `const btns = [...document.querySelectorAll('button[title="播放發音"]')]; btns[0].click(); await new Promise((r) => setTimeout(r, 400)); btns[2].click(); await new Promise((r) => setTimeout(r, 400)); btns[28].click(); return btns.length` },
  played,
  // 考試：聽發音選母音
  { goto: 'http://localhost:5199/lessons/2?tab=exam', waitAfter: 2500 },
  spy,
  click('開始考試'),
  {
    label: '考試逐題（找母音題）',
    log: `(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const re = /[-\s\u00a0][\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/
      const out = []
      for (let i = 0; i < 20; i++) {
        const card = document.querySelector('.rounded-3xl.shadow-md .p-5')
        const head = card.querySelector('.justify-between span').innerText
        const bad = []; const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (re.test(w.currentNode.textContent)) bad.push(w.currentNode.textContent.trim())
        const opt = card.querySelector('.grid > button')
        if (opt) opt.click(); else [...card.querySelectorAll('button')].find((b) => b.textContent.includes('看答案'))?.click()
        await sleep(300)
        if (head.includes('母音')) out.push(head + ' canvas=' + card.querySelectorAll('canvas').length + (bad.length ? ' ◌風險=' + bad.join(',') : ''))
        const next = [...document.querySelectorAll('button')].find((b) => /下一題|看結果/.test(b.textContent))
        if (next) { next.click(); await sleep(250) }
      }
      return out
    })()`,
  },
  played,
  { shot: 'exam-result-iphone.png' },
  dashMarks,
  // /thai 元音卡片、看字選音選項的試聽
  { viewport: [1280, 900, 1] },
  { goto: 'http://localhost:5199/thai', waitAfter: 2500 },
  spy,
  click('元音'),
  { eval: `const cards = [...document.querySelectorAll('.card-hover')]; cards[0].click(); await new Promise((r) => setTimeout(r, 400)); cards[28].click(); return cards.length` },
  played,
]
