// 檢查 legacy 頁面中「同一元素、同變體、同屬性」的兩個顏色 class，在 v3 與 v4 誰勝出是否相同。
// 準備（在專案外的暫存資料夾）：npm init -y && npm i tailwindcss@3.4.17
// 執行：pnpm build 之後
//   TW3_DIR=<暫存資料夾> node docs/tools/scan-color-order.cjs legacy/thaiTyping.html dist/assets/index-*.css
// 輸出 same／DIFF；只掃 template 的 class / :class 字串，script 內組出來的 class 要另外人工確認。
const fs = require('fs')
const path = require('path')
const postcss = require(path.join(process.env.TW3_DIR, 'node_modules/postcss'))
const tailwind = require(path.join(process.env.TW3_DIR, 'node_modules/tailwindcss'))

const [file, v4CssFile] = process.argv.slice(2)
const html = fs.readFileSync(file, 'utf8')
const v4css = fs.readFileSync(v4CssFile, 'utf8')

const COLORS = 'inherit|current|transparent|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const PROPS = 'bg|text|border|border-[trblxyse]|from|via|to|ring|ring-offset|shadow|divide|outline|accent|fill|stroke|decoration|placeholder|caret'
const re = new RegExp(`^((?:[a-z0-9-]+:)*)(${PROPS})-(${COLORS})(?:-(\\d+))?(?:/\\d+)?$`)

const tags = html.match(/<[a-zA-Z][^>]*>/gs) || []
const results = []
tags.forEach((tag) => {
  const tokens = new Set()
  for (const m of tag.matchAll(/(?:^|\s)(:?class)\s*=\s*"([^"]*)"/gs)) {
    if (m[1] === 'class') m[2].split(/\s+/).forEach((t) => t && tokens.add(t))
    else for (const s of m[2].matchAll(/'([^']*)'|`([^`]*)`/g)) (s[1] ?? s[2]).split(/\s+/).forEach((t) => t && !t.includes('${') && tokens.add(t))
  }
  const groups = {}
  tokens.forEach((t) => {
    const m = t.match(re)
    if (!m) return
    const key = m[1] + m[2]
    ;(groups[key] ||= new Set()).add(t)
  })
  Object.entries(groups).forEach(([key, set]) => {
    if (set.size > 1) results.push({ key, classes: [...set], tag: tag.replace(/\s+/g, ' ').slice(0, 220) })
  })
})

const esc = (c) => '.' + c.replace(/[:/.[\]]/g, (ch) => '\\' + ch)
const v4pos = (c) => {
  const e = esc(c)
  const r = new RegExp(e.replace(/[\\.[\]()*+?^$|{}]/g, '\\$&') + '(?=[{:,\\s])', 'g')
  // 取最後一筆（Tailwind 區段在頁面自訂 CSS 之後）
  let m, last = -1
  while ((m = r.exec(v4css))) last = m.index
  return last
}

;(async () => {
  const all = [...new Set(results.flatMap((r) => r.classes))]
  const out = await postcss([tailwind({ content: [{ raw: all.join(' ') }], darkMode: 'class', corePlugins: { preflight: false } })]).process('@tailwind utilities;', { from: undefined })
  const v3css = out.css
  const v3pos = (c) => {
    const e = esc(c).replace(/[\\.[\]()*+?^$|{}]/g, '\\$&')
    const m = new RegExp(e + '(?=[{:,\\s])').exec(v3css)
    return m ? m.index : -1
  }
  results.forEach((r) => {
    const v3 = [...r.classes].sort((a, b) => v3pos(a) - v3pos(b))
    const v4 = [...r.classes].sort((a, b) => v4pos(a) - v4pos(b))
    const v3w = v3.at(-1), v4w = v4.at(-1)
    const missing = r.classes.filter((c) => v4pos(c) < 0 || v3pos(c) < 0)
    console.log(`${v3w === v4w ? 'same' : 'DIFF'} [${r.key}] v3 勝: ${v3w} / v4 勝: ${v4w}${missing.length ? ' (找不到: ' + missing.join(',') + ')' : ''}`)
    console.log('   ' + r.tag)
  })
})()
