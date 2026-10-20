// 步驟檔常用的頁面操作（scripts/dev-browser/run.mjs 用）
// 常用的頁面運算式
export const click = (text) => ({ eval: `const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().includes(${JSON.stringify(text)})); if(!b) return 'NOT FOUND: ' + ${JSON.stringify(text)}; b.click(); return 'clicked'` })
// 頁面上所有含 ◌ 的可見文字節點
export const ringTexts = { label: '◌ 文字', log: `(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const r = []; while (w.nextNode()) { const n = w.currentNode; if (n.textContent.includes('◌') && n.parentElement.offsetParent !== null) r.push(n.textContent.trim()) } return r })()` }
export const canvasCount = { label: 'canvas 字形數', log: `document.querySelectorAll('canvas[class*=pointer-events-none]').length` }
// 在測驗畫面連續作答 n 題，每題記錄：題目的 ◌ 文字、選項的 ◌ 文字、選項 canvas 數
export const quizRounds = (n, label) => ({
  label,
  log: `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const visibleRing = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const r = []; while (w.nextNode()) { const t = w.currentNode; if (t.textContent.includes('◌') && t.parentElement.offsetParent !== null) r.push(t.textContent.trim()) } return r }
    const out = []
    for (let i = 0; i < ${n}; i++) {
      const opts = [...document.querySelectorAll('.grid.grid-cols-2.gap-4 > div')]
      if (opts.length === 0) { out.push('沒有選項'); break }
      const before = visibleRing(document.body)
      opts[0].click(); await sleep(400)
      const after = visibleRing(document.body)
      // 題目（看字選音的大字）與選項（聽音辨字）的字形
      const canvases = document.querySelectorAll('section canvas').length
      if (before.length || after.length || canvases) out.push('Q' + (i + 1) + ' 作答前◌=' + before.join(',') + ' 作答後◌=' + after.join(',') + ' canvas=' + canvases)
      const next = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('下一題'))
      if (next) { next.click(); await sleep(300) }
    }
    return out.length ? out : ['（這幾題沒有元音）']
  })()`,
})
export const setStorage = (key, value) => ({ eval: `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))}); return 'set ' + ${JSON.stringify(key)}` })
export const scrollTo = (selector) => ({ eval: `const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return 'NOT FOUND'; el.scrollIntoView({ block: 'start' }); return 'scrolled'` })
// 翻牌記憶：翻開所有卡片（每次翻兩張，等動畫），回報元音字卡的 canvas 數與 ◌ 文字
export const memoryReveal = {
  label: '翻牌記憶',
  log: `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const cards = () => [...document.querySelectorAll('.grid.grid-cols-3 > div')]
    for (let i = 0; i < cards().length; i++) { cards()[i].click(); await sleep(150) }
    await sleep(500)
    const ring = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (w.currentNode.textContent.includes('◌')) ring.push(w.currentNode.textContent.trim())
    return { 卡片: cards().length, canvas: document.querySelectorAll('.grid.grid-cols-3 canvas').length, '◌': ring }
  })()`,
}
