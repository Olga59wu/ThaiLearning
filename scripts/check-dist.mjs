// pnpm build 最後執行：確認 production build（dist/）不含開發用的程式
// - 開發用跳過登入（src/dev/：假使用者、提示條、VITE_DEV_SKIP_AUTH）
// - 開發用頁面 /dev/vowel-guides
// 找到任何一個就讓 build 失敗
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const FORBIDDEN = [
  'VITE_DEV_SKIP_AUTH',
  'dev@local',
  'dev-local',
  '已跳過登入',
  '跳過雲端',
  'DevAuthBanner',
  'devSession',
  'DevVowelGuides',
  '/dev/vowel-guides',
  '母音底圖原型',
]
const TEXT_EXT = /\.(js|mjs|css|html|json|webmanifest|txt|map)$/

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

const hits = []
for (const file of walk(DIST).filter((f) => TEXT_EXT.test(f))) {
  const text = readFileSync(file, 'utf8')
  for (const word of FORBIDDEN) if (text.includes(word)) hits.push(`${file}：${word}`)
}

if (hits.length > 0) {
  console.error('❌ dist 含有開發用程式：\n' + hits.join('\n'))
  process.exit(1)
}
console.log(`✅ dist 檢查通過：不含開發用程式（${FORBIDDEN.length} 個關鍵字）`)
