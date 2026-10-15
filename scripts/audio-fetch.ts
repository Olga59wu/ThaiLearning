// pnpm audio:fetch [--dry-run]
// 找出 ALL_VOCAB_CATEGORIES（原單字庫＋每週課程）缺少的 th_／zh_ 音檔，直接從 Google TTS 抓取並寫進 public/audio/TH/
// - 發音來源、語速同 /downloader（translate_tts，client=tw-ob，泰文 th、中文 zh-TW，預設語速）；Node 直接請求，不經代理、不產生 zip
// - 每個檔案間隔 1.2 秒、每 20 個多休息 1 秒、失敗重試 2 次（同 /downloader）
// - 自訂單字存在瀏覽器 localStorage，腳本讀不到，不在範圍內
// - 中文念的文字會清理（檔名不變）：括號與括號內容不念、「/」改成「，」。例如「你好/再見 (女用)」念「你好，再見」
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { audioManifestPlugin } from '../build-plugins/audioManifest.ts'

type Lang = 'th' | 'zh'
interface VocabWord { id: string; th: string; zh: string }
interface MissingFile { file: string; text: string; lang: Lang; words: string[] }

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const AUDIO_DIR = resolve(ROOT, 'public/audio/TH')
const DRY_RUN = process.argv.includes('--dry-run')

const FILE_INTERVAL_MS = 1200 // 每個檔案間隔（同 /downloader）
const BATCH_SIZE = 20 // 每 20 個檔案
const BATCH_PAUSE_MS = 1000 // 多休息 1 秒
const RETRY = 2 // 失敗重試次數
const MIN_BYTES = 500 // 小於這個大小視為錯誤頁面（同 /downloader）

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// 用 Vite 載入網站的 TS 模組（課程資料用了 import.meta.glob 與 @/ 別名），資料與檔名規則和網站共用
const loadSiteModules = async () => {
  const server = await createServer({
    configFile: false,
    root: ROOT,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    resolve: { alias: { '@': resolve(ROOT, 'src') } },
    plugins: [audioManifestPlugin(ROOT)],
    optimizeDeps: { noDiscovery: true },
  })
  try {
    const categories = (await server.ssrLoadModule('/src/data/vocabCategories.ts')) as {
      ALL_VOCAB_CATEGORIES: Record<string, VocabWord[]>
    }
    const audio = (await server.ssrLoadModule('/src/services/offlineAudio.ts')) as {
      audioFileName: (text: string, type: Lang) => string
    }
    return { categories: categories.ALL_VOCAB_CATEGORIES, audioFileName: audio.audioFileName }
  } finally {
    await server.close()
  }
}

/** 所有應該存在的音檔中，實際缺少的（以檔名去重） */
const findMissing = (categories: Record<string, VocabWord[]>, audioFileName: (t: string, l: Lang) => string): MissingFile[] => {
  const existing = new Set(existsSync(AUDIO_DIR) ? readdirSync(AUDIO_DIR).map((f) => f.normalize('NFC')) : [])
  const missing = new Map<string, MissingFile>()
  Object.values(categories).flat().forEach((w) => {
    ;(['th', 'zh'] as const).forEach((lang) => {
      const text = lang === 'th' ? w.th : w.zh
      if (!text) return
      const file = audioFileName(text, lang).normalize('NFC')
      if (existing.has(file)) return
      const entry = missing.get(file) ?? { file, text, lang, words: [] }
      if (!entry.words.includes(w.id)) entry.words.push(w.id)
      missing.set(file, entry)
    })
  })
  return [...missing.values()]
}

/** 中文念的文字：去掉括號與括號內容（半形、全形），「/」改成「，」；泰文不處理 */
export const spokenText = (text: string, lang: Lang): string =>
  lang === 'zh'
    ? text
        .replace(/\([^)]*\)|（[^）]*）/g, '')
        .replace(/\s*\/\s*/g, '，')
        .trim()
    : text

const ttsUrl = (text: string, lang: Lang) =>
  `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang === 'th' ? 'th' : 'zh-TW'}&client=tw-ob`

const fetchMp3 = async (text: string, lang: Lang): Promise<{ data?: Buffer; error?: string }> => {
  let error = ''
  for (let attempt = 0; attempt <= RETRY; attempt++) {
    try {
      const res = await fetch(ttsUrl(text, lang))
      const type = res.headers.get('content-type') ?? ''
      if (!res.ok) error = `HTTP ${res.status}`
      else if (!type.includes('audio')) error = `不是音檔（${type}）`
      else {
        const data = Buffer.from(await res.arrayBuffer())
        if (data.length > MIN_BYTES) return { data }
        error = `檔案太小（${data.length} bytes）`
      }
    } catch (e) {
      error = (e as Error).message
    }
  }
  return { error }
}

const main = async () => {
  const { categories, audioFileName } = await loadSiteModules()
  const missing = findMissing(categories, audioFileName)
  const wordCount = new Set(Object.values(categories).flat().map((w) => w.id)).size

  console.log(`單字 ${wordCount} 個；public/audio/TH/ 缺 ${missing.length} 個檔案（泰文 ${missing.filter((m) => m.lang === 'th').length}、中文 ${missing.filter((m) => m.lang === 'zh').length}）\n`)
  missing.forEach((m, i) => {
    const spoken = spokenText(m.text, m.lang)
    console.log(`${String(i + 1).padStart(3)}. ${m.file}  ← ${m.words.join(', ')}${spoken !== m.text ? `  （念：${spoken}）` : ''}`)
  })
  if (missing.length === 0 || DRY_RUN) {
    if (DRY_RUN) console.log('\n（--dry-run：只列出，不下載）')
    return
  }

  console.log(`\n開始下載（每個間隔 ${FILE_INTERVAL_MS / 1000} 秒，約需 ${Math.ceil((missing.length * FILE_INTERVAL_MS) / 60000)} 分鐘）…\n`)
  const ok: string[] = []
  const failed: { file: string; error: string }[] = []
  for (let i = 0; i < missing.length; i++) {
    const m = missing[i]!
    const { data, error } = await fetchMp3(spokenText(m.text, m.lang), m.lang)
    if (data) {
      writeFileSync(resolve(AUDIO_DIR, m.file), data)
      ok.push(m.file)
      console.log(`✅ [${i + 1}/${missing.length}] ${m.file}（${data.length} bytes）`)
    } else {
      failed.push({ file: m.file, error: error ?? '未知錯誤' })
      console.log(`❌ [${i + 1}/${missing.length}] ${m.file}：${error}`)
    }
    if (i < missing.length - 1) {
      await sleep(FILE_INTERVAL_MS)
      if ((i + 1) % BATCH_SIZE === 0) await sleep(BATCH_PAUSE_MS)
    }
  }

  console.log(`\n完成：成功 ${ok.length}、失敗 ${failed.length}`)
  if (ok.length) console.log(`\n成功：\n${ok.map((f) => `  ${f}`).join('\n')}`)
  if (failed.length) {
    console.log(`\n失敗（可再執行一次 pnpm audio:fetch 重抓）：\n${failed.map((f) => `  ${f.file}：${f.error}`).join('\n')}`)
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
