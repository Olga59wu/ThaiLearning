import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

// 虛擬模組 virtual:audio-manifest：public/audio/TH/ 裡實際存在的音檔檔名（build 與 dev 啟動時掃描）
// 讓 Downloader 依實際檔案判斷是否就緒，播放時沒有檔案就直接用 TTS，不用先發一次會失敗的請求
const VIRTUAL_ID = 'virtual:audio-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

export const audioManifestPlugin = (root: string): Plugin => {
  const dir = resolve(root, 'public/audio/TH')
  const scan = (): string[] => {
    try {
      return readdirSync(dir)
        .filter((f) => f.endsWith('.mp3'))
        .map((f) => f.normalize('NFC'))
        .sort()
    } catch {
      return []
    }
  }

  return {
    name: 'audio-manifest',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load: (id) => (id === RESOLVED_ID ? `export default ${JSON.stringify(scan())}` : undefined),
    // dev：新增／刪除音檔時更新清單並重新整理頁面
    configureServer: (server) => {
      const onChange = (file: string) => {
        if (!resolve(file).startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(dir)
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}
